
import {
  Badge,
  Box,
  Flex,
  Heading,
  SimpleGrid,
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
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/mockApi';
// types intentionally inferred; no direct type imports needed
import { useAuth } from '../providers/AuthProvider';

const currency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v ?? 0);

const AnalyticsPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const { user } = useAuth();
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.listOrders });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: api.listProducts });

  const isBuyer =
    user?.role === 'buyer' || user?.role === 'buyer_admin' || user?.role === 'buyer_manager';
  const isSupplier =
    user?.role === 'supplier' ||
    user?.role === 'supplier_admin' ||
    user?.role === 'supplier_manager';
  const isSuper = user?.role === 'superadmin';

  const scopedOrders = useMemo(() => {
    if (isSuper) return orders;
    if (isBuyer) return orders.filter((o) => o.accountId === user?.companyId);
    if (isSupplier) return orders.filter((o) => o.supplierId === user?.supplierId);
    return [];
  }, [orders, isBuyer, isSupplier, isSuper, user?.companyId, user?.supplierId]);

  const orderValueByMonth = useMemo(() => {
    const buckets: Record<string, number> = {};
    scopedOrders.forEach((o) => {
      const month = (o.createdAt ?? '').slice(0, 7) || 'unknown';
      buckets[month] = (buckets[month] ?? 0) + (o.orderValue ?? 0);
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([id, total]) => ({ id, total }));
  }, [scopedOrders]);

  const topSuppliers = useMemo(() => {
    const sums: Record<string, number> = {};
    scopedOrders.forEach((o) => {
      const key = o.supplierId ?? 'unknown';
      sums[key] = (sums[key] ?? 0) + (o.orderValue ?? 0);
    });
    return Object.entries(sums)
      .map(([id, total]) => ({ id, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [scopedOrders]);

  const topProducts = useMemo(() => {
    const sums: Record<string, number> = {};
    scopedOrders.forEach((o) =>
      o.items?.forEach((i) => {
        sums[i.productId] = (sums[i.productId] ?? 0) + i.lineTotal;
      }),
    );
    return Object.entries(sums)
      .map(([id, total]) => ({ id, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [scopedOrders]);

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.supplierId === user?.supplierId)
        .filter((p) => p.stock.stockLevel < p.stock.minThreshold)
        .slice(0, 5),
    [products, user?.supplierId],
  );

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">Analytics</Heading>
          <Text color="gray.600">
            {isBuyer
              ? 'Spend and supplier performance for your buyer org.'
              : isSupplier
              ? 'Order volume, fill risk, and top buyers for your supplier.'
              : 'Workspace analytics.'}
          </Text>
        </Box>
        {(isBuyer || isSupplier) && (
          <Badge colorScheme="brand" variant="subtle">
            {isBuyer ? 'Buyer view' : 'Supplier view'}
          </Badge>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
          <Text color="gray.600">Orders (last 6m)</Text>
          <Heading size="md">{scopedOrders.length}</Heading>
          <Text color="gray.500" fontSize="sm">
            Total value {currency(scopedOrders.reduce((s, o) => s + (o.orderValue ?? 0), 0))}
          </Text>
        </Box>
        <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
          <Text color="gray.600">Avg order value</Text>
          <Heading size="md">
            {currency(
              scopedOrders.length
                ? scopedOrders.reduce((s, o) => s + (o.orderValue ?? 0), 0) / scopedOrders.length
                : 0,
            )}
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Across {scopedOrders.length} orders
          </Text>
        </Box>
        <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
          <Text color="gray.600">{isBuyer ? 'Suppliers' : 'Top buyers'}</Text>
          <Heading size="md">{isBuyer ? topSuppliers.length : scopedOrders.length ? 'Active' : '—'}</Heading>
          <Text color="gray.500" fontSize="sm">
            {isBuyer ? 'Vendors with spend' : 'Orders in the window'}
          </Text>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
          <Heading size="md" mb={3}>
            {isBuyer ? 'Spend by supplier' : 'Orders by month'}
          </Heading>
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>{isBuyer ? 'Supplier' : 'Month'}</Th>
                  <Th isNumeric>{isBuyer ? 'Total spend' : 'Order value'}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(isBuyer ? topSuppliers : orderValueByMonth).map((row) => (
                  <Tr key={'id' in row ? row.id : 'row'}>
                    <Td>{row.id}</Td>
                    <Td isNumeric>{currency(row.total)}</Td>
                  </Tr>
                ))}
                {(isBuyer ? topSuppliers : orderValueByMonth).length === 0 && (
                  <Tr>
                    <Td colSpan={2}>
                      <Text color="gray.600">No data yet.</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
          <Heading size="md" mb={3}>
            {isBuyer ? 'Top products ordered' : 'Low stock risk'}
          </Heading>
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>{isBuyer ? 'Product' : 'SKU'}</Th>
                  <Th isNumeric>{isBuyer ? 'Spend' : 'Stock'}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isBuyer
                  ? topProducts.map((row) => (
                      <Tr key={row.id}>
                        <Td>{products.find((p) => p.id === row.id)?.name ?? row.id}</Td>
                        <Td isNumeric>{currency(row.total)}</Td>
                      </Tr>
                    ))
                  : lowStock.map((row) => (
                      <Tr key={row.id}>
                        <Td>{row.name}</Td>
                        <Td isNumeric>{row.stock.stockLevel}</Td>
                      </Tr>
                    ))}
                {(isBuyer ? topProducts : lowStock).length === 0 && (
                  <Tr>
                    <Td colSpan={2}>
                      <Text color="gray.600">No data yet.</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </SimpleGrid>
    </Stack>
  );
};

export default AnalyticsPage;
