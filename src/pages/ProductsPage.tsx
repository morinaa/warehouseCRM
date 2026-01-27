import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { api } from '../api/mockApi';
import type { Product, TierPrice } from '../types';
import { useAuth } from '../providers/AuthProvider';
import CountrySelect from '../components/CountrySelect';
import { PRODUCT_CATEGORIES } from '../constants/lookups';
import { toTitleCase } from '../utils/format';

const ProductsPage = () => {
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: api.listProducts });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: api.listSuppliers });
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const canManageCatalog =
    user?.role === 'superadmin' ||
    user?.role === 'admin' ||
    user?.role === 'supplier_admin' ||
    user?.role === 'supplier_manager';

  const scopedSupplierId = user?.supplierId;
  const supplierOptions = useMemo(() => {
    if (user?.role === 'superadmin') return suppliers;
    if (scopedSupplierId) return suppliers.filter((s) => s.id === scopedSupplierId);
    return suppliers;
  }, [scopedSupplierId, suppliers, user?.role]);
  const visibleProducts = useMemo(() => {
    if (user?.role === 'superadmin') return products;
    if (user?.role === 'admin' && scopedSupplierId) {
      return products.filter((p) => p.supplierId === scopedSupplierId);
    }
    if (scopedSupplierId) return products.filter((p) => p.supplierId === scopedSupplierId);
    return products;
  }, [products, scopedSupplierId, user?.role]);

  const [form, setForm] = useState<Omit<Product, 'id'>>({
    supplierId: '',
    name: '',
    sku: '',
    basePrice: 0,
    currency: 'USD',
    description: '',
    active: true,
    category: '',
    originCountry: '',
    image: '',
    images: ['', '', ''],
    stock: { stockLevel: 0, minThreshold: 10, reserved: 0, leadTimeDays: 0 },
    tierPrices: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const stockModal = useDisclosure();
  const [showForm, setShowForm] = useState(false);
  const deleteDialog = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const [stockForm, setStockForm] = useState<{
    id: string;
    name: string;
    stockLevel: number;
    minThreshold: number;
    reserved: number;
    leadTimeDays: number;
  } | null>(null);

  useEffect(() => {
    if (!form.supplierId) {
      if (scopedSupplierId) {
        setForm((prev) => ({ ...prev, supplierId: scopedSupplierId }));
      } else if (supplierOptions.length > 0) {
        setForm((prev) => ({ ...prev, supplierId: supplierOptions[0].id }));
      }
    }
  }, [form.supplierId, scopedSupplierId, supplierOptions]);

  const createProduct = useMutation({
    mutationFn: (input: Omit<Product, 'id'>) => api.createProduct(user?.id ?? '', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
  const updateProduct = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      api.updateProduct(user?.id ?? '', id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.deleteProduct(user?.id ?? '', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const stockColor = (level: number) => {
    if (level === 0) return 'red';
    if (level < 20) return 'yellow';
    if (level > 50) return 'green';
    return 'orange';
  };

  const resolveTierPrices = (_basePrice: number): TierPrice[] => [];

  const handleCreate = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.sku.trim()) next.sku = 'SKU is required';
    if (form.basePrice < 0) next.basePrice = 'Price must be zero or more';
    if (!form.supplierId) next.supplierId = 'Supplier is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const tierPrices = resolveTierPrices(form.basePrice);
    try {
      const lockedSupplierId = scopedSupplierId ?? form.supplierId;
      await createProduct.mutateAsync({
        ...form,
        supplierId: lockedSupplierId,
        category: toTitleCase(form.category),
        originCountry: form.originCountry,
        tierPrices,
      });
      setForm({
        supplierId: lockedSupplierId || supplierOptions[0]?.id || '',
        name: '',
        sku: '',
        basePrice: 0,
        currency: 'USD',
        description: '',
        active: true,
        category: '',
        originCountry: '',
        image: '',
        images: ['', '', ''],
        stock: { stockLevel: 0, minThreshold: 10, reserved: 0, leadTimeDays: 0 },
        tierPrices: [],
      });
      toast({ title: 'Product added', status: 'success' });
      setShowForm(false);
    } catch (error) {
      toast({ title: 'Save failed', description: (error as Error).message, status: 'error' });
    }
  };

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">Products</Heading>
          <Text color="gray.600">Catalog items with live stock, reorder thresholds, and tiered pricing.</Text>
        </Box>
        <HStack spacing={3}>
          <Badge colorScheme="gray" variant="subtle">
            {products.length} items
          </Badge>
          {canManageCatalog && (
            <Button size="sm" colorScheme="brand" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Hide add form' : 'Add product'}
            </Button>
          )}
        </HStack>
      </Flex>

      {canManageCatalog && showForm ? (
        <Box bg="white" p={4} rounded="xl" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
          <Heading size="md" mb={4}>
            Add product
          </Heading>
          <Stack spacing={4}>
            <HStack spacing={4}>
              <FormControl isInvalid={Boolean(errors.name)}>
                <FormLabel>Name</FormLabel>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.sku)}>
                <FormLabel>SKU</FormLabel>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                <FormErrorMessage>{errors.sku}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.supplierId)}>
                <FormLabel>Supplier</FormLabel>
                <Select
                  value={form.supplierId}
                  onChange={(e) => {
                    // superadmin can pick; suppliers are locked
                    if (user?.role === 'superadmin') {
                      setForm({ ...form, supplierId: e.target.value });
                    } else {
                      setForm({ ...form, supplierId: scopedSupplierId ?? form.supplierId });
                    }
                  }}
                  placeholder="Select supplier"
                  isDisabled={user?.role !== 'superadmin'}
                >
                  {supplierOptions.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.supplierId}</FormErrorMessage>
              </FormControl>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <FormControl isInvalid={Boolean(errors.basePrice)}>
                <FormLabel>Base price</FormLabel>
                <NumberInput
                  value={form.basePrice}
                  min={0}
                  onChange={(_, val) => setForm({ ...form, basePrice: val })}
                >
                  <NumberInputField />
                </NumberInput>
                <FormErrorMessage>{errors.basePrice}</FormErrorMessage>
              </FormControl>
              <FormControl>
                <FormLabel>Currency</FormLabel>
                <Select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  maxW="140px"
                >
                  <option value="USD">USD</option>
                  <option value="CAD">CAD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Select category"
                >
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Produce">Produce</option>
                  <option value="Bakery">Bakery</option>
                </Select>
                <Input
                  mt={2}
                  placeholder="Or type a custom category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </FormControl>
              <CountrySelect
                label="Origin country"
                value={form.originCountry}
                onChange={(c) => setForm({ ...form, originCountry: c })}
                placeholder="Type to search country"
              />
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>On-hand stock</FormLabel>
                <NumberInput
                  value={form.stock.stockLevel}
                  min={0}
                  onChange={(_, val) => setForm({ ...form, stock: { ...form.stock, stockLevel: val } })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Min threshold</FormLabel>
                <NumberInput
                  value={form.stock.minThreshold}
                  min={0}
                  onChange={(_, val) => setForm({ ...form, stock: { ...form.stock, minThreshold: val } })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Reserved</FormLabel>
                <NumberInput
                  value={form.stock.reserved ?? 0}
                  min={0}
                  onChange={(_, val) => setForm({ ...form, stock: { ...form.stock, reserved: val } })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Lead time (days)</FormLabel>
                <NumberInput
                  value={form.stock.leadTimeDays ?? 0}
                  min={0}
                  onChange={(_, val) => setForm({ ...form, stock: { ...form.stock, leadTimeDays: val } })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl display="flex" alignItems="center" gap={3}>
                <Switch
                  isChecked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  colorScheme="brand"
                />
                <FormLabel m={0}>Active</FormLabel>
              </FormControl>
            </SimpleGrid>
            {/* Tiered pricing removed */}
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief copy"
              />
            </FormControl>
            <HStack align="center" color="gray.600">
              <Text fontSize="sm">
                Available now: {Math.max(0, (form.stock.stockLevel ?? 0) - (form.stock.reserved ?? 0))} units - Reorder when on-hand &lt;= min threshold.
              </Text>
            </HStack>
            <FormControl>
              <FormLabel>Images (upload up to 3)</FormLabel>
              {[0, 1, 2].map((idx) => (
                <Input
                  key={idx}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const images = [...(form.images ?? ['', '', ''])];
                      images[idx] = reader.result as string;
                      const primary = idx === 0 ? images[0] : form.image;
                      setForm({ ...form, images, image: primary });
                    };
                    reader.readAsDataURL(file);
                  }}
                  mb={2}
                />
              ))}
            </FormControl>
            <Button colorScheme="brand" leftIcon={<FiPlus />} onClick={handleCreate} isLoading={createProduct.isPending}>
              Add product
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box bg="yellow.50" borderWidth="1px" borderColor="yellow.100" rounded="xl" p={4}>
          <Text fontWeight="semibold">Buyer view</Text>
          <Text color="gray.700">
            Buyers can browse stock. Supplier and admin roles can add or edit products.
          </Text>
        </Box>
      )}

      <TableContainer bg="white" borderWidth="1px" borderColor="gray.100" rounded="xl" boxShadow="sm">
        <Table>
          <Thead bg="gray.50">
            <Tr>
              <Th>Name</Th>
              <Th>SKU</Th>
              <Th>Supplier</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Status</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {visibleProducts.map((product) => (
              <Tr key={product.id}>
                <Td fontWeight="semibold">
                  <HStack spacing={3}>
                    {(product.images?.[0] || product.image) && (
                      <Box
                        bgImage={`url(${product.images?.[0] || product.image})`}
                        bgSize="cover"
                        bgPos="center"
                        w="48px"
                        h="48px"
                        rounded="md"
                      />
                    )}
                    <Box>
                      <Text>{product.name}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {product.category}
                      </Text>
                    </Box>
                  </HStack>
                </Td>
                <Td>{product.sku}</Td>
                <Td>
                  <Badge colorScheme="gray" variant="subtle">
                    {suppliers.find((s) => s.id === product.supplierId)?.name ?? '—'}
                  </Badge>
                </Td>
                <Td>{product.currency} {(product.basePrice ?? 0).toLocaleString()}</Td>
                <Td>
                  <Badge colorScheme={stockColor(product.stock.stockLevel)} variant="subtle">
                    {product.stock.stockLevel} on hand
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    Min {product.stock.minThreshold} · Reserved {product.stock.reserved ?? 0}
                  </Text>
                  {canManageCatalog && (
                    <Button
                      size="xs"
                      variant="link"
                      colorScheme="brand"
                      mt={1}
                      onClick={() => {
                        setStockForm({
                          id: product.id,
                          name: product.name,
                          stockLevel: product.stock.stockLevel ?? 0,
                          minThreshold: product.stock.minThreshold ?? 0,
                          reserved: product.stock.reserved ?? 0,
                          leadTimeDays: product.stock.leadTimeDays ?? 0,
                        });
                        stockModal.onOpen();
                      }}
                    >
                      Edit stock
                    </Button>
                  )}
                </Td>
                <Td>
                  <Badge colorScheme={product.active ? 'green' : 'gray'} variant="subtle">
                    {product.active ? 'Active' : 'Hidden'}
                  </Badge>
                </Td>
                <Td textAlign="right">
                  <Switch
                    isChecked={product.active}
                    colorScheme="brand"
                    isDisabled={!canManageCatalog}
                    onChange={(e) =>
                      updateProduct.mutate({ id: product.id, updates: { active: e.target.checked } })
                    }
                  />
                  {canManageCatalog && (user?.role === 'superadmin' || (scopedSupplierId && product.supplierId === scopedSupplierId)) && (
                    <HStack spacing={2} justify="flex-end" mt={2}>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setForm({
                            supplierId: product.supplierId ?? scopedSupplierId ?? '',
                            name: product.name,
                            sku: product.sku,
                            basePrice: product.basePrice,
                            currency: product.currency,
                            description: product.description ?? '',
                            active: product.active ?? true,
                            category: product.category ?? '',
                            image: product.image ?? '',
                            images: product.images ?? ['', '', ''],
                            stock: {
                              stockLevel: product.stock?.stockLevel ?? 0,
                              minThreshold: product.stock?.minThreshold ?? 0,
                              reserved: product.stock?.reserved ?? 0,
                              leadTimeDays: product.stock?.leadTimeDays ?? 0,
                            },
                            tierPrices: [],
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                          setDeleteTarget(product);
                          deleteDialog.onOpen();
                        }}
                        isLoading={deleteProduct.isPending && deleteTarget?.id === product.id}
                      >
                        Delete
                      </Button>
                    </HStack>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={stockModal.isOpen} onClose={stockModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adjust stock</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {stockForm && (
              <Stack spacing={3}>
                <Text fontWeight="semibold">{stockForm.name}</Text>
                <HStack>
                  <FormControl>
                    <FormLabel>On-hand</FormLabel>
                    <NumberInput
                      value={stockForm.stockLevel}
                      min={0}
                      onChange={(_, val) => setStockForm({ ...stockForm, stockLevel: val })}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Reserved</FormLabel>
                    <NumberInput
                      value={stockForm.reserved}
                      min={0}
                      onChange={(_, val) => setStockForm({ ...stockForm, reserved: val })}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </HStack>
                <HStack>
                  <FormControl>
                    <FormLabel>Min threshold</FormLabel>
                    <NumberInput
                      value={stockForm.minThreshold}
                      min={0}
                      onChange={(_, val) => setStockForm({ ...stockForm, minThreshold: val })}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Lead time (days)</FormLabel>
                    <NumberInput
                      value={stockForm.leadTimeDays}
                      min={0}
                      onChange={(_, val) => setStockForm({ ...stockForm, leadTimeDays: val })}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </HStack>
                <Text color="gray.600" fontSize="sm">
                  Available: {Math.max(0, stockForm.stockLevel - stockForm.reserved)} - Reorder when on-hand &lt;= min threshold.
                </Text>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={stockModal.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              isDisabled={!stockForm}
              onClick={async () => {
                if (!stockForm) return;
                try {
                  await updateProduct.mutateAsync({
                    id: stockForm.id,
                    updates: {
                      stock: {
                        stockLevel: stockForm.stockLevel,
                        minThreshold: stockForm.minThreshold,
                        reserved: stockForm.reserved,
                        leadTimeDays: stockForm.leadTimeDays,
                      },
                    },
                  });
                  stockModal.onClose();
                  toast({ title: 'Stock updated', status: 'success' });
                } catch (err) {
                  toast({ title: 'Update failed', description: (err as Error).message, status: 'error' });
                }
              }}
              isLoading={updateProduct.isPending}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          deleteDialog.onClose();
          setDeleteTarget(null);
        }}
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete product
          </AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to delete <strong>{deleteTarget?.name ?? 'this product'}</strong>? This action cannot be
            undone.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={deleteDialog.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              ml={3}
              isLoading={deleteProduct.isPending}
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteProduct.mutateAsync(deleteTarget.id);
                setDeleteTarget(null);
                deleteDialog.onClose();
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <datalist id="category-list">
        {PRODUCT_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </Stack>
  );
};

export default ProductsPage;
