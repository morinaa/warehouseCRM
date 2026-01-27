import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  Select,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/mockApi';
import type { Product } from '../types';
import { useAuth } from '../providers/AuthProvider';

const stockColor = (level: number) => {
  if (level === 0) return 'red';
  if (level < 20) return 'yellow';
  if (level > 50) return 'green';
  return 'orange';
};

const SupplierDetailPage = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: api.listSuppliers });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: api.listProducts });
  const { data: buyers = [] } = useQuery({ queryKey: ['buyers', user?.id], queryFn: api.listBuyers });

  const supplier = suppliers.find((s) => s.id === id);
  const supplierProducts = useMemo(
    () => products.filter((p) => p.supplierId === id),
    [products, id],
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Ensure buyers always have at least their own buyer company in view
  const scopedBuyers = useMemo(() => {
    if (buyers.length > 0) return buyers;
    if (user?.buyerId) {
      return [
        {
          id: user.buyerId,
          name: 'Your Company',
          channel: '',
          region: '',
          website: '',
          tags: [],
          ownerId: user.id,
          health: 'healthy' as const,
          createdAt: new Date().toISOString(),
          creditLimit: 0,
          creditUsed: 0,
          priceTierId: 'tier-standard',
          paymentTerms: 'Net 30',
          lastOrderDate: '',
        },
      ];
    }
    return [];
  }, [buyers, user?.buyerId, user?.id]);

  const [buyerId, setBuyerId] = useState<string>('');

  useEffect(() => {
    if (buyerId) return;
    const scoped = user?.buyerId
      ? scopedBuyers.find((b) => b.id === user.buyerId)?.id
      : undefined;
    const fallback = scoped ?? scopedBuyers[0]?.id ?? '';
    setBuyerId(fallback);
  }, [scopedBuyers, user?.buyerId, buyerId]);

  const createOrder = useMutation({
    mutationFn: api.createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const cart = useMemo(() => {
    const lines = supplierProducts
      .map((p) => ({
        product: p,
        qty: quantities[p.id] ?? 0,
        unitPrice:
          p.tierPrices.find((t) => t.tierId === (scopedBuyers.find((b) => b.id === buyerId)?.priceTierId ?? 'tier-standard'))
            ?.price ?? p.basePrice,
      }))
      .filter((l) => l.qty > 0);
    const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    const items = lines.reduce((sum, l) => sum + l.qty, 0);
    return { lines, total, items };
  }, [supplierProducts, quantities, buyers, buyerId]);

  const submitOrder = async () => {
    if (!buyerId || scopedBuyers.length === 0) {
      const fallback = user?.buyerId
        ? scopedBuyers.find((b) => b.id === user.buyerId)
        : scopedBuyers[0];
      console.warn('Buyer missing, attempting fallback selection', {
        userId: user?.id,
        buyerId: user?.buyerId,
        fallback: fallback?.id,
        buyersCount: scopedBuyers.length,
      });
      if (fallback) {
        setBuyerId(fallback.id);
      } else {
        toast({ title: 'No billing account found', description: 'Add a buyer company first', status: 'error' });
        return;
      }
    }
    if (cart.lines.length === 0) {
      toast({ title: 'Add at least one product', status: 'warning' });
      return;
    }
    const orderNumber = `ORD-${Math.floor(Math.random() * 9000 + 1000)}`;
    try {
      await createOrder.mutateAsync({
        orderNumber,
        buyerId,
        supplierId: id,
        status: 'pending',
        orderValue: cart.total,
        items: cart.lines.map((l) => ({
          productId: l.product.id,
          quantity: l.qty,
          unitPrice: l.unitPrice,
          lineTotal: l.unitPrice * l.qty,
        })),
        paymentTerms: scopedBuyers.find((b) => b.id === buyerId)?.paymentTerms ?? 'Net 30',
        warehouse: 'WH-BUYER',
        notes: 'Submitted from supplier catalog',
        createdBy: user?.id ?? 'u-admin',
        approvalStatus: 'pending',
      });
      toast({ title: 'Order sent to supplier', description: orderNumber, status: 'success' });
      setQuantities({});
    } catch (error) {
      toast({ title: 'Send failed', description: (error as Error).message, status: 'error' });
    }
  };

  if (!supplier) {
    return (
      <Stack spacing={4}>
        <Text>Supplier not found.</Text>
        <Button onClick={() => navigate('/suppliers')}>Back to suppliers</Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <Box>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={() => navigate('/suppliers')}>
              ← All suppliers
            </Button>
            <Badge colorScheme="brand" variant="subtle">
              {supplier.region ?? 'Region'}
            </Badge>
          </HStack>
          <Heading size="lg" mt={2}>
            {supplier.name}
          </Heading>
          <Text color="gray.600">{supplier.website ?? 'No site listed'}</Text>
          <HStack spacing={2} mt={2} wrap="wrap">
            {supplier.categories.map((c) => (
              <Badge key={c} colorScheme="gray" variant="subtle">
                {c}
              </Badge>
            ))}
            {supplier.tags?.map((t) => (
              <Badge key={t} colorScheme="purple" variant="outline">
                {t}
              </Badge>
            ))}
          </HStack>
        </Box>
        <Stack minW="260px">
          <Text fontWeight="semibold">Bill to (your company)</Text>
          <Select value={buyerId} isDisabled bg="white" maxW="280px">
            {scopedBuyers
              .filter((buyer) => !user?.buyerId || buyer.id === user.buyerId)
              .map((buyer) => (
                <option key={buyer.id} value={buyer.id}>
                  {buyer.name} ({buyer.paymentTerms})
                </option>
              ))}
            {!buyerId && <option value="">No buyer company found</option>}
          </Select>
        </Stack>
      </Flex>

      <TableContainer bg="white" borderWidth="1px" borderColor="gray.100" rounded="xl" boxShadow="sm">
        <Table>
          <Thead bg="gray.50">
            <Tr>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th>Stock</Th>
              <Th isNumeric>Unit price</Th>
              <Th isNumeric>Qty</Th>
              <Th isNumeric>Line total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {supplierProducts.map((product: Product) => {
              const unitPrice =
                product.tierPrices.find(
                  (t) => t.tierId === (scopedBuyers.find((b) => b.id === buyerId)?.priceTierId ?? 'tier-standard'),
                )?.price ?? product.basePrice;
              const qty = quantities[product.id] ?? 0;
              return (
                <Tr key={product.id}>
                  <Td>
                    <Stack spacing={1} onClick={() => navigate(`/products/${product.id}`)} cursor="pointer">
                      <Text fontWeight="semibold" color="brand.600">
                        {product.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {product.category}
                      </Text>
                    </Stack>
                  </Td>
                  <Td>{product.sku}</Td>
                  <Td>
                    <Badge colorScheme={stockColor(product.stock.stockLevel)} variant="subtle">
                      {product.stock.stockLevel} on hand
                    </Badge>
                    <Text fontSize="xs" color="gray.500">
                      Min {product.stock.minThreshold}
                    </Text>
                  </Td>
                  <Td isNumeric>${unitPrice.toLocaleString()}</Td>
                  <Td isNumeric>
                    <NumberInput
                      min={0}
                      value={qty}
                      onChange={(_, val) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [product.id]: Number.isFinite(val) ? val : 0,
                        }))
                      }
                      maxW="100px"
                    >
                      <NumberInputField />
                    </NumberInput>
                  </Td>
                  <Td isNumeric>${(unitPrice * qty).toLocaleString()}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>

      <Flex
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        rounded="xl"
        p={4}
        align="center"
        justify="space-between"
        boxShadow="sm"
      >
        <HStack spacing={4}>
          <Text fontWeight="semibold">Cart items: {cart.items}</Text>
          <Text fontWeight="semibold">Total: ${cart.total.toLocaleString()}</Text>
        </HStack>
        <Button
          colorScheme="brand"
          onClick={submitOrder}
          isDisabled={cart.items === 0}
          isLoading={createOrder.isPending}
        >
          Send order to supplier
        </Button>
      </Flex>
    </Stack>
  );
};

export default SupplierDetailPage;
