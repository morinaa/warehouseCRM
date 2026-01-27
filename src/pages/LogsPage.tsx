import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Spacer,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { api } from '../api/mockApi';
import type { AuditLog } from '../types';
import { useAuth } from '../providers/AuthProvider';

const PAGE_SIZE = 20;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const roleColor = (role?: string) => {
  switch (role) {
    case 'superadmin':
      return 'purple';
    case 'supplier_admin':
    case 'supplier_manager':
    case 'supplier':
      return 'orange';
    case 'buyer_admin':
    case 'buyer_manager':
    case 'buyer':
      return 'blue';
    default:
      return 'gray';
  }
};

const actionColor = (action: AuditLog['action']) => {
  if (action.startsWith('order')) return 'green';
  if (action.startsWith('product')) return 'teal';
  if (action.startsWith('invoice') || action.startsWith('quote')) return 'cyan';
  if (action.startsWith('user')) return 'purple';
  return 'gray';
};

const LogsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const scopeBuyerId = useMemo(
    () => (user && (user.role === 'buyer' || user.role === 'buyer_admin' || user.role === 'buyer_manager') ? user.buyerId : undefined),
    [user],
  );
  const scopeSupplierId = useMemo(
    () =>
      user &&
      (user.role === 'supplier' || user.role === 'supplier_admin' || user.role === 'supplier_manager' || user.role === 'admin')
        ? user.supplierId
        : undefined,
    [user],
  );

  const { data, isLoading, isFetching, isError } = useQuery<{
    items: AuditLog[];
    nextCursor: { index: number } | null;
  }>({
    queryKey: ['auditLogs', page, user?.id, scopeBuyerId, scopeSupplierId],
    queryFn: () =>
      api.listAuditLogs({
        cursor: { index: page * PAGE_SIZE },
        buyerId: scopeBuyerId,
        supplierId: scopeSupplierId,
        role: user?.role,
      }),
    enabled: !!user, // Only run query when user is loaded
    initialData: { items: [], nextCursor: null },
    placeholderData: (prev) => prev,
    staleTime: 5000, // Cache for 5 seconds to reduce unnecessary refetches
    retry: 2, // Retry failed requests up to 2 times
  });

  const logs = data.items;
  const hasNext = !!data.nextCursor;
  const hasPrev = page > 0;
  const cardBg = useColorModeValue('white', 'gray.800');

  const handleExport = async (format: 'json' | 'csv') => {
    if (!from || !to) {
      toast({ status: 'warning', title: 'Select From and To dates' });
      return;
    }
    const diffMs = new Date(to).getTime() - new Date(from).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 365) {
      toast({ status: 'error', title: 'Export range cannot exceed 1 year' });
      return;
    }
    try {
      const exportData = await api.exportAuditLogs(user?.id ?? '', {
        from,
        to,
        buyerId: scopeBuyerId,
        supplierId: scopeSupplierId,
      });

      let blob: Blob;
      let filename: string;
      
      if (format === 'csv') {
        // Convert to CSV
        const headers = ['Timestamp', 'Action', 'Summary', 'Actor', 'Actor Role', 'Buyer ID', 'Supplier ID', 'Entity Type', 'Entity Name', 'Status'];
        const csvRows = [
          headers.join(','),
          ...exportData.map(log => [
            `"${log.timestamp}"`,
            `"${log.action}"`,
            `"${log.summary.replace(/"/g, '""')}"`,
            `"${log.actorName || log.actorId || 'System'}"`,
            `"${log.actorRole || ''}"`,
            `"${log.buyerId || ''}"`,
            `"${log.supplierId || ''}"`,
            `"${log.entityType || ''}"`,
            `"${log.entityName || ''}"`,
            `"${log.status || 'success'}"`,
          ].join(','))
        ];
        blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        filename = `audit-${from}-to-${to}.csv`;
      } else {
        // JSON format
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `audit-${from}-to-${to}.json`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast({ status: 'success', title: `Exported ${exportData.length} logs as ${format.toUpperCase()}` });
    } catch (err: any) {
      toast({ status: 'error', title: err?.message ?? 'Export failed' });
    }
  };

  return (
    <Stack spacing={6}>
      <Flex align="center" gap={3} wrap="wrap">
        <Heading size="lg">Audit Logs</Heading>
        <Badge colorScheme="blue">20 per page</Badge>
        <Spacer />
        <HStack spacing={2} flexWrap="wrap">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to} size="sm" w="140px" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from} size="sm" w="140px" />
          <Button onClick={() => handleExport('json')} colorScheme="brand" size="sm" minW="fit-content" px={4}>
            Export JSON
          </Button>
          <Button onClick={() => handleExport('csv')} colorScheme="green" size="sm" minW="fit-content" px={4}>
            Export CSV
          </Button>
        </HStack>
      </Flex>

      <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
        <TableContainer>
          <Table size="sm">
            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
              <Tr>
                <Th w="220px">Timestamp</Th>
                <Th>Summary</Th>
                <Th>Action</Th>
                <Th>Actor</Th>
                <Th>Entity</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {logs.map((log: AuditLog) => (
                <Tr key={log.id}>
                  <Td fontSize="sm" color="gray.600">
                    {formatDateTime(log.timestamp)}
                  </Td>
                  <Td>
                    <Text fontWeight="semibold">{log.summary}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {log.buyerId && `Buyer: ${log.buyerId}`} {log.supplierId && `Supplier: ${log.supplierId}`}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={actionColor(log.action)} textTransform="none">
                      {log.action}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Badge colorScheme={roleColor(log.actorRole)}>{log.actorRole ?? '—'}</Badge>
                      <Text fontSize="sm" color="gray.700">
                        {log.actorName ?? log.actorId ?? 'System'}
                      </Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{log.entityName ?? log.entityType ?? '—'}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {log.entityId}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={log.status === 'success' ? 'green' : 'red'}>{log.status ?? 'success'}</Badge>
                  </Td>
                </Tr>
              ))}
              {logs.length === 0 && !isLoading && !isFetching && (
                <Tr>
                  <Td colSpan={6}>
                    <Flex align="center" justify="center" py={6} color="gray.500">
                      {isError ? 'Failed to load logs. Please try again.' : 'No logs yet. Perform actions to see audit entries.'}
                    </Flex>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {(isLoading || isFetching) && (
          <Flex justify="center" py={3}>
            <Spinner size="sm" />
          </Flex>
        )}

        <Flex justify="space-between" align="center" mt={3} flexWrap="wrap" gap={3}>
          <Text fontSize="sm" color="gray.600">
            Showing {logs.length} events (page {page + 1})
          </Text>
          <HStack spacing={2}>
            <Button 
              onClick={() => setPage((p) => Math.max(0, p - 1))} 
              isDisabled={!hasPrev}
              size="sm"
              minW="fit-content"
              px={4}
            >
              Previous 20
            </Button>
            <Button 
              onClick={() => hasNext && setPage((p) => p + 1)} 
              isDisabled={!hasNext}
              size="sm"
              minW="fit-content"
              px={4}
            >
              Next 20
            </Button>
          </HStack>
        </Flex>
      </Box>
    </Stack>
  );
};

export default LogsPage;
