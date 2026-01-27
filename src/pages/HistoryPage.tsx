
import {
  Badge,
  Avatar,
  Box,
  Flex,
  Heading,
  HStack,
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
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/mockApi';
import type { Buyer, Order, Product, User } from '../types';
import { useAuth } from '../providers/AuthProvider';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value ?? 0);

const HistoryPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const { user } = useAuth();
  const { data: buyers = [] } = useQuery({ queryKey: ['buyers', user?.id], queryFn: api.listBuyers });
  const { data: orders = [] } = useQuery({ queryKey: ['orders', user?.id], queryFn: api.listOrders });
  const { data: products = [] } = useQuery({ queryKey: ['products', user?.id], queryFn: api.listProducts });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: api.listSuppliers });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.listUsers });

  const companyBuyers = buyers.filter((b: Buyer) => b.id === user?.buyerId);
  const supplierProducts = products.filter((p: Product) => p.supplierId === user?.supplierId);
  const supplierOrders = orders.filter((o: Order) => o.supplierId === user?.supplierId);
  const buyerOrders = orders.filter((o: Order) =>
    companyBuyers.some((buyer) => buyer.id === o.buyerId),
  );

  const isBuyer =
    user?.role === 'buyer' || user?.role === 'buyer_admin' || user?.role === 'buyer_manager';
  const isSupplier =
    user?.role === 'supplier' ||
    user?.role === 'supplier_admin' ||
    user?.role === 'supplier_manager';

  const scopedUsers = users.filter((u: User) => {
    if (isBuyer) return u.buyerId && u.buyerId === user?.buyerId;
    if (isSupplier) return u.supplierId && u.supplierId === user?.supplierId;
    return false;
  });

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">History</Heading>
          <Text color="gray.600">
            {isBuyer
              ? 'Recent purchases and interactions for your buyer org.'
              : isSupplier
              ? 'Product activity and inbound orders for your supplier.'
              : 'Activity across the workspace.'}
          </Text>
        </Box>
        {(isBuyer || isSupplier) && (
          <Badge colorScheme="brand" variant="subtle">
            {isBuyer ? 'Buyer workspace' : 'Supplier workspace'}
          </Badge>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
          <Heading size="md" mb={3}>
            {isBuyer ? 'Purchase history' : 'Orders to your supplier'}
          </Heading>
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Order #</Th>
                  <Th>{isBuyer ? 'Supplier' : 'Buyer'}</Th>
                  <Th>Status</Th>
                  <Th isNumeric>Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(isBuyer ? buyerOrders : supplierOrders).slice(0, 10).map((o) => (
                  <Tr key={o.id}>
                    <Td>{o.orderNumber}</Td>
                    <Td>
                      {isBuyer
                        ? suppliers.find((s) => s.id === o.supplierId)?.name ?? '—'
                        : buyers.find((b) => b.id === o.buyerId)?.name ?? '—'}
                    </Td>
                    <Td>
                      <Badge>{o.status}</Badge>
                    </Td>
                    <Td isNumeric>{formatCurrency(o.orderValue || 0)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
          <Heading size="md" mb={3}>
            {isBuyer ? 'Credit & limits' : 'Catalog summary'}
          </Heading>
          {isBuyer && companyBuyers.length > 0 ? (
            <Stack spacing={3}>
              {companyBuyers.map((buyer) => (
                <Box key={buyer.id} borderWidth="1px" rounded="md" p={3}>
                  <Text fontWeight="semibold">{buyer.name}</Text>
                  <Text color="gray.600">
                    Limit {formatCurrency(buyer.creditLimit)} · Used {formatCurrency(buyer.creditUsed)}
                  </Text>
                  <Text color="gray.600">Terms {buyer.paymentTerms}</Text>
                </Box>
              ))}
            </Stack>
          ) : (
            <Stack spacing={3}>
              {supplierProducts.slice(0, 8).map((p) => (
                <Flex key={p.id} justify="space-between" align="center" borderWidth="1px" p={3} rounded="md">
                  <Box>
                    <Text fontWeight="semibold">{p.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {p.sku} · {p.category}
                    </Text>
                  </Box>
                  <Badge colorScheme={p.stock.stockLevel === 0 ? 'red' : p.stock.stockLevel < 20 ? 'yellow' : 'green'}>
                    Stock {p.stock.stockLevel}
                  </Badge>
                </Flex>
              ))}
              {supplierProducts.length === 0 && <Text color="gray.600">No products yet.</Text>}
            </Stack>
          )}
        </Box>
      </SimpleGrid>

      {(user?.role === 'buyer_admin' ||
        user?.role === 'buyer_manager' ||
        user?.role === 'supplier_admin' ||
        user?.role === 'supplier_manager') && (
        <Box bg={cardBg} borderWidth="1px" rounded="lg" p={4} boxShadow="sm">
          <Heading size="md" mb={3}>
            Team users
          </Heading>
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Scope</Th>
                </Tr>
              </Thead>
              <Tbody>
                {scopedUsers.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <HStack>
                        <Avatar size="sm" name={u.name} />
                        <Box>
                          <Text fontWeight="semibold">{u.name}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {u.email}
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="brand">{u.role}</Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.600">
                        {u.buyerId ?? u.supplierId ?? '—'}
                      </Text>
                    </Td>
                  </Tr>
                ))}
                {scopedUsers.length === 0 && (
                  <Tr>
                    <Td colSpan={3}>
                      <Text color="gray.600">No team members in this workspace yet.</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Stack>
  );
};

export default HistoryPage;
