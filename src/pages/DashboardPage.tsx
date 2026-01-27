import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/mockApi';
import StatCard from '../components/StatCard';
import type { Order, Activity } from '../types';
import { FiPackage, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi';

const daysSince = (dateStr?: string) => {
  if (!dateStr) return Infinity;
  const created = new Date(dateStr).getTime();
  return Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
};

const DashboardPage = () => {
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.listOrders });
  const { data: orderStatuses = [] } = useQuery({
    queryKey: ['orderStatuses'],
    queryFn: api.listOrderStatuses,
  });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: api.listAccounts });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: api.listProducts });

  const openOrderValue = orders
    .filter((order) => order.status !== 'completed')
    .reduce((sum, order) => sum + order.orderValue, 0);
  const activeFulfillment = orders.filter((o) => ['confirmed', 'shipped'].includes(o.status)).length;

  const statusSummary = orderStatuses.map((status) => ({
    status: status.name,
    value: orders.filter((o) => o.status === status.id).reduce((sum, order) => sum + order.orderValue, 0),
    count: orders.filter((o) => o.status === status.id).length,
  }));

  const reorderAlerts = accounts
    .filter((account) => daysSince(account.lastOrderDate) > 30)
    .sort((a, b) => daysSince(b.lastOrderDate) - daysSince(a.lastOrderDate))
    .slice(0, 4);

  const lowStock = products
    .filter((product) => product.stock.stockLevel < product.stock.minThreshold)
    .sort((a, b) => a.stock.stockLevel - b.stock.stockLevel)
    .slice(0, 5);

  const cycleTimeDays = (list: Order[]) => {
    const days = list
      .map((order) => {
        const created = new Date(order.createdAt).getTime();
        const ship = order.expectedShipDate ? new Date(order.expectedShipDate).getTime() : Date.now();
        return Math.max(1, (ship - created) / (1000 * 60 * 60 * 24));
      })
      .filter(Boolean);
    if (!days.length) return 0;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  };

  const upcomingActivities: any[] = [];

  return (
    <Stack spacing={6}>
      <Heading size="lg">Wholesale control tower</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
        <StatCard
          label="Accounts"
          value={accounts.length}
          helper="Buyer companies"
          icon={FiUsers}
        />
        <StatCard
          label="Open order value"
          value={`$${openOrderValue.toLocaleString()}`}
          helper="Pending, confirmed, shipped"
          icon={FiTrendingUp}
        />
        <StatCard
          label="Orders in motion"
          value={activeFulfillment}
          helper="Confirmed or shipping"
          icon={FiPackage}
        />
        <StatCard
          label="Avg cycle time"
          value={`${cycleTimeDays(orders)} days`}
          helper="Order to ship"
          icon={FiZap}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
        <Card gridColumn={{ base: 'span 1', lg: 'span 2' }} borderWidth="1px" borderColor="gray.100">
          <CardBody>
            <Flex align="center" justify="space-between" mb={4}>
              <Heading size="md">Orders by status</Heading>
              <Badge colorScheme="brand" variant="subtle">
                {orders.length} orders
              </Badge>
            </Flex>
            <Box w="100%" h="260px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1f86ff" name="Orders" radius={4} />
                  <Bar dataKey="value" fill="#93c5fd" name="Value" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>
        <Card borderWidth="1px" borderColor="gray.100">
          <CardBody>
            <Flex align="center" justify="space-between" mb={4}>
              <Heading size="md">Re-order alerts</Heading>
              <Badge colorScheme="orange" variant="subtle">
                {reorderAlerts.length} flagged
              </Badge>
            </Flex>
            <Stack spacing={3}>
              {reorderAlerts.map((account) => (
                <Box
                  key={account.id}
                  p={3}
                  borderWidth="1px"
                  borderColor="gray.100"
                  rounded="lg"
                  bg="gray.50"
                >
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="semibold">{account.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        Last order {account.lastOrderDate ?? 'unknown'}
                      </Text>
                    </Box>
                    <Badge colorScheme="orange" variant="subtle">
                      {daysSince(account.lastOrderDate)} days idle
                    </Badge>
                  </Flex>
                  <HStack spacing={2} mt={2}>
                    <Badge colorScheme="brand" variant="subtle">
                      {account.paymentTerms}
                    </Badge>
                    <Badge colorScheme="gray" variant="subtle">
                      {account.channel ?? 'Channel'}
                    </Badge>
                  </HStack>
                </Box>
              ))}
              {reorderAlerts.length === 0 && (
                <Text color="gray.600" fontSize="sm">
                  All accounts have recent orders.
                </Text>
              )}
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
        <Card>
          <CardBody>
            <Flex align="center" justify="space-between" mb={4}>
              <Heading size="md">Low stock watchlist</Heading>
              <Badge colorScheme="red" variant="subtle">
                {lowStock.length} items
              </Badge>
            </Flex>
            <Stack spacing={3}>
              {lowStock.map((product) => {
                const pct =
                  product.stock.minThreshold > 0
                    ? Math.min(100, Math.round((product.stock.stockLevel / product.stock.minThreshold) * 100))
                    : 0;
                return (
                  <Box key={product.id} p={3} borderWidth="1px" borderColor="gray.100" rounded="lg" bg="gray.50">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="semibold">{product.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          SKU {product.sku} · Min {product.stock.minThreshold}
                        </Text>
                      </Box>
                      <Badge colorScheme="red" variant="subtle">
                        {product.stock.stockLevel} on hand
                      </Badge>
                    </Flex>
                    <Progress value={pct} mt={2} colorScheme="red" rounded="md" />
                  </Box>
                );
              })}
              {lowStock.length === 0 && (
                <Text color="gray.600" fontSize="sm">
                  No items below threshold.
                </Text>
              )}
            </Stack>
          </CardBody>
        </Card>
        <Card borderWidth="1px" borderColor="gray.100" gridColumn={{ base: 'span 1', lg: 'span 2' }}>
          <CardBody>
            <Flex align="center" justify="space-between" mb={4}>
              <Heading size="md">Upcoming activities</Heading>
              <Badge colorScheme="gray" variant="subtle">
                0 logged
              </Badge>
            </Flex>
            <Stack spacing={3}>
              {upcomingActivities.map((activity: Activity) => (
                <Box
                  key={activity.id}
                  p={3}
                  borderWidth="1px"
                  borderColor="gray.100"
                  rounded="lg"
                  bg="gray.50"
                >
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="semibold">{activity.subject}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {activity.type} · {activity.content}
                      </Text>
                    </Box>
                    <Badge colorScheme="brand" variant="subtle">
                      {activity.dueDate ?? 'n/a'}
                    </Badge>
                  </Flex>
                </Box>
              ))}
              {upcomingActivities.length === 0 && (
                <Text color="gray.600" fontSize="sm">
                  No dated activities yet.
                </Text>
              )}
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card borderWidth="1px" borderColor="gray.100">
        <CardBody>
          <Flex align="center" justify="space-between" mb={3}>
            <Heading size="md">Order velocity</Heading>
            <Badge colorScheme="brand" variant="subtle" display="flex" alignItems="center" gap={2}>
              <FiZap />
              {cycleTimeDays(orders)} days avg
            </Badge>
          </Flex>
          <Text color="gray.600">
            Cycle time is calculated from order creation to expected ship date. Use the Order Entry Grid to
            compress reorders and keep shelves full.
          </Text>
        </CardBody>
      </Card>
    </Stack>
  );
};

export default DashboardPage;
