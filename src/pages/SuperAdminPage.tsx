import {
  Badge,
  Box,
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Flex,
  FormControl,
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
  Select,
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
  useDisclosure,
  useToast,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '../api/mockApi';
import type { Account, Order, OrderStatusId, Product, User } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from '@chakra-ui/icons';

const COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cape Verde',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo (Democratic Republic)',
  'Congo (Republic)',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Macedonia', 'Kosovo', 'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
];

const PRODUCT_CATEGORIES = ['Beverages', 'Snacks', 'Dairy', 'Produce', 'Bakery', 'Household', 'Personal Care'];
const BUYER_CHANNELS = ['Grocery', 'Convenience', 'Distributor', 'E-commerce', 'Pharmacy', 'Specialty'];

const toTitle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

type NewUserForm = {
  name: string;
  email: string;
  role: User['role'];
  password: string;
  supplierId?: string;
  companyId?: string;
};

type NewSupplierForm = {
  name: string;
  region?: string;
  website?: string;
  categories: string;
  tags: string;
};

const emptyUser: NewUserForm = {
  name: '',
  email: '',
  role: 'supplier_admin',
  password: 'demo123',
  supplierId: '',
  companyId: '',
};

const emptySupplier: NewSupplierForm = {
  name: '',
  region: '',
  website: '',
  categories: '',
  tags: '',
};

type ProductForm = {
  id?: string;
  name: string;
  sku: string;
  basePrice: number;
  currency: string;
  supplierId: string;
  category?: string;
  originCountry?: string;
  stockLevel: number;
  minThreshold: number;
  images: string[];
};

type OrderForm = {
  id?: string;
  orderNumber: string;
  accountId: string;
  supplierId: string;
  status: OrderStatusId;
  orderValue: number;
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
};

const CountrySelect = ({
  label,
  value,
  onChange,
  placeholder = 'Type to search country',
}: {
  label: string;
  value?: string;
  onChange: (country: string) => void;
  placeholder?: string;
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const display = query || value || '';
  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(display.toLowerCase()));

  return (
    <FormControl position="relative">
      <FormLabel>{label}</FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
      </InputGroup>
      {open && filtered.length > 0 && (
        <Box
          mt={1}
          borderWidth="1px"
          borderColor="gray.200"
          rounded="md"
          bg="white"
          maxH="180px"
          overflowY="auto"
          shadow="sm"
          zIndex={10}
          position="absolute"
          width="full"
        >
          <List spacing={0}>
            {filtered.map((c) => (
              <ListItem
                key={c}
                px={3}
                py={2}
                _hover={{ bg: 'gray.50' }}
                cursor="pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c);
                  setQuery('');
                  setOpen(false);
                }}
              >
                {c}
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </FormControl>
  );
};

const SuperAdminPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userModal = useDisclosure();
  const supplierModal = useDisclosure();
  const productModal = useDisclosure();
  const orderModal = useDisclosure();

  useEffect(() => {
    if (user?.role !== 'superadmin') {
      navigate('/');
    }
  }, [user, navigate]);

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.listUsers });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: api.listSuppliers });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: api.listProducts });
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.listOrders });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: api.listAccounts });

  const [newUser, setNewUser] = useState<NewUserForm>(emptyUser);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newSupplier, setNewSupplier] = useState<NewSupplierForm>(emptySupplier);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [buyerForm, setBuyerForm] = useState<(Partial<Account> & { id?: string }) | null>(null);
  const [productForm, setProductForm] = useState<ProductForm | null>(null);
  const [orderForm, setOrderForm] = useState<OrderForm | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<
    | null
    | { type: 'user' | 'supplier' | 'buyer'; action: 'delete' | 'save'; id?: string }
  >(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const confirmAndRun = async () => {
    if (!pendingConfirm) return;
    try {
      if (pendingConfirm.type === 'user') {
        if (pendingConfirm.action === 'delete' && pendingConfirm.id) {
          await deleteUser.mutateAsync(pendingConfirm.id);
        } else if (pendingConfirm.action === 'save') {
          if (editingUserId) {
            await updateUser.mutateAsync({
              id: editingUserId,
              input: {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                supplierId: newUser.supplierId || undefined,
                companyId: newUser.companyId || undefined,
                password: newUser.password,
              },
            });
          } else {
            await createUser.mutateAsync(newUser);
          }
          setNewUser(emptyUser);
          setEditingUserId(null);
          userModal.onClose();
        }
      } else if (pendingConfirm.type === 'supplier') {
        if (pendingConfirm.action === 'delete' && pendingConfirm.id) {
          await deleteSupplier.mutateAsync(pendingConfirm.id);
        } else if (pendingConfirm.action === 'save') {
          if (editingSupplierId) {
            await updateSupplier.mutateAsync(editingSupplierId);
          } else {
            await createSupplier.mutateAsync();
          }
          setNewSupplier(emptySupplier);
          setEditingSupplierId(null);
          supplierModal.onClose();
        }
      } else if (pendingConfirm.type === 'buyer') {
        if (pendingConfirm.action === 'delete' && pendingConfirm.id) {
          await deleteBuyer.mutateAsync(pendingConfirm.id);
        } else if (pendingConfirm.action === 'save' && buyerForm) {
          if (buyerForm.id) {
            await updateBuyer.mutateAsync({
              id: buyerForm.id,
              updates: {
                ...buyerForm,
                channel: toTitle(buyerForm.channel ?? ''),
                region: toTitle(buyerForm.region ?? ''),
              },
            });
          } else {
            await createBuyer.mutateAsync({
              name: buyerForm.name,
              channel: toTitle(buyerForm.channel ?? ''),
              region: toTitle(buyerForm.region ?? ''),
              website: buyerForm.website,
              tags: buyerForm.tags ?? [],
              creditLimit: buyerForm.creditLimit ?? 0,
              creditUsed: buyerForm.creditUsed ?? 0,
              priceTierId: buyerForm.priceTierId ?? 'tier-standard',
              paymentTerms: buyerForm.paymentTerms ?? 'Net 30',
            });
          }
          setBuyerForm(null);
        }
      }
    } catch (err) {
      toast({ title: 'Action failed', description: (err as Error).message, status: 'error' });
    } finally {
      setPendingConfirm(null);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      sku: '',
      basePrice: 0,
      currency: 'USD',
      supplierId: suppliers[0]?.id ?? '',
      category: '',
      originCountry: '',
      stockLevel: 0,
      minThreshold: 0,
      images: [],
    });
  };

  const resetOrderForm = () => {
    setOrderForm({
      orderNumber: `ORD-${orders.length + 101}`,
      accountId: accounts[0]?.id ?? '',
      supplierId: suppliers[0]?.id ?? '',
      status: 'pending',
      orderValue: 0,
      productId: products[0]?.id,
      quantity: 1,
      unitPrice: products[0]?.basePrice ?? 0,
      notes: '',
    });
  };

  const createUser = useMutation({
    mutationFn: (input: NewUserForm) =>
      api.adminCreateUser(user?.id ?? '', {
        name: input.name,
        email: input.email,
        role: input.role,
        password: input.password,
        supplierId: input.role.includes('supplier') ? input.supplierId : undefined,
        companyId: input.role.includes('buyer') ? input.companyId : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User created', status: 'success' });
    },
  });
  const updateUser = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<User> }) => api.updateUser(user?.id ?? '', id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User updated', status: 'success' });
    },
  });
  const deleteUser = useMutation({
    mutationFn: (id: string) => api.deleteUser(user?.id ?? '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User deleted', status: 'success' });
    },
  });

  const createSupplier = useMutation({
    mutationFn: () =>
      api.createSupplier(user?.id ?? '', {
        name: newSupplier.name,
        region: toTitle(newSupplier.region ?? ''),
        website: newSupplier.website,
        categories: newSupplier.categories
          .split(',')
          .map((c) => toTitle(c))
          .filter(Boolean),
        tags: newSupplier.tags
          .split(',')
          .map((t) => toTitle(t))
          .filter(Boolean),
        rating: 4.0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Supplier added', status: 'success' });
    },
  });
  const updateSupplier = useMutation({
    mutationFn: (id: string) =>
      api.updateSupplier(user?.id ?? '', id, {
        name: newSupplier.name,
        region: toTitle(newSupplier.region ?? ''),
        website: newSupplier.website,
        categories: newSupplier.categories
          .split(',')
          .map((c) => toTitle(c))
          .filter(Boolean),
        tags: newSupplier.tags
          .split(',')
          .map((t) => toTitle(t))
          .filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Supplier updated', status: 'success' });
    },
  });
  const deleteSupplier = useMutation({
    mutationFn: (id: string) => api.deleteSupplier(user?.id ?? '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Supplier deleted', status: 'success' });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted', status: 'success' });
    },
  });

  const createProduct = useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product created', status: 'success' });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) => api.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product updated', status: 'success' });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: api.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Order deleted', status: 'success' });
    },
  });

  const createOrder = useMutation({
    mutationFn: api.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Order created', status: 'success' });
    },
  });

  const updateOrder = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Order> }) => api.updateOrder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Order updated', status: 'success' });
    },
  });

  const createBuyer = useMutation({
    mutationFn: (input: Omit<Account, 'id' | 'createdAt'>) => api.createAccount(input, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Buyer created', status: 'success' });
      setBuyerForm(null);
    },
  });
  const updateBuyer = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Account> }) => api.updateAccount(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Buyer updated', status: 'success' });
      setBuyerForm(null);
    },
  });
  const deleteBuyer = useMutation({
    mutationFn: (id: string) => api.deleteAccount(user?.id ?? '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Buyer deleted', status: 'success' });
    },
  });

  const userCounts = useMemo(() => {
    return users.reduce<Record<User['role'], number>>(
      (acc, u) => {
        acc[u.role] = (acc[u.role] ?? 0) + 1;
        return acc;
      },
      {
        superadmin: 0,
        admin: 0,
        supplier_admin: 0,
        supplier_manager: 0,
        buyer_admin: 0,
        buyer_manager: 0,
        supplier: 0,
        buyer: 0,
      },
    );
  }, [users]);

  return (
    <Stack spacing={6}>
      <Heading size="lg">Super Admin Console</Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm">
          <Text color="gray.500">Users</Text>
          <Heading size="md">{users.length}</Heading>
          <Text fontSize="sm" color="gray.600">
            Admins: {userCounts.admin + userCounts.superadmin}, Supplier Admins:{' '}
            {userCounts.supplier_admin}, Buyer Admins: {userCounts.buyer_admin}
          </Text>
        </Box>
        <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm">
          <Text color="gray.500">Suppliers</Text>
          <Heading size="md">{suppliers.length}</Heading>
          <Text fontSize="sm" color="gray.600">
            Products: {products.length}
          </Text>
        </Box>
        <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm">
          <Text color="gray.500">Orders</Text>
          <Heading size="md">{orders.length}</Heading>
          <Text fontSize="sm" color="gray.600">
            Pending: {orders.filter((o) => o.status === 'pending').length}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Users row (full width) */}
      <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm">
        <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm" height="full">
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="md">Users</Heading>
            <Button
              size="sm"
              colorScheme="brand"
              onClick={() => {
                setEditingUserId(null);
                setNewUser(emptyUser);
                userModal.onOpen();
              }}
            >
              Add user
            </Button>
          </Flex>
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Company</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <Text fontWeight="semibold">{u.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {u.email}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="brand">{u.role}</Badge>
                    </Td>
                    <Td>
                      <Badge variant="subtle">
                        {accounts.find((a) => a.id === u.companyId)?.name ??
                          suppliers.find((s) => s.id === u.supplierId)?.name ??
                          '—'}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <HStack justify="flex-end" spacing={2}>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setEditingUserId(u.id);
                            setNewUser({
                              name: u.name,
                              email: u.email,
                              role: u.role,
                              password: u.password ?? 'demo123',
                              supplierId: u.supplierId ?? '',
                              companyId: u.companyId ?? '',
                            });
                            userModal.onOpen();
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => setPendingConfirm({ type: 'user', action: 'delete', id: u.id })}
                          isLoading={deleteUser.isPending}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Suppliers and Buyers row */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="stretch">
        <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm" height="full">
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="md">Suppliers</Heading>
            <Button
              size="sm"
              colorScheme="brand"
              onClick={() => {
                setEditingSupplierId(null);
                setNewSupplier(emptySupplier);
                supplierModal.onOpen();
              }}
            >
              Add supplier
            </Button>
          </Flex>
          <Stack spacing={3}>
            {suppliers.map((s) => (
              <Box key={s.id} borderWidth="1px" rounded="md" p={3}>
                <Flex justify="space-between" align="start" gap={3}>
                  <Box>
                    <Text fontWeight="semibold">{s.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {s.region ?? 'Region'} · {s.categories.join(', ')}
                    </Text>
                  </Box>
                  <HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setEditingSupplierId(s.id);
                        setNewSupplier({
                          name: s.name,
                          region: s.region ?? '',
                          website: s.website ?? '',
                          categories: s.categories.join(', '),
                          tags: (s.tags ?? []).join(', '),
                        });
                        supplierModal.onOpen();
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => setPendingConfirm({ type: 'supplier', action: 'delete', id: s.id })}
                      isLoading={deleteSupplier.isPending}
                    >
                      Delete
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm" height="full">
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="md">Buyers</Heading>
            <Button
              size="sm"
              colorScheme="brand"
              onClick={() =>
                setBuyerForm({
                  name: '',
                  channel: '',
                  region: '',
                  website: '',
                  tags: [],
                  creditLimit: 0,
                  creditUsed: 0,
                  priceTierId: 'tier-standard',
                  paymentTerms: 'Net 30',
                  ownerId: undefined,
                })
              }
            >
              Add buyer
            </Button>
          </Flex>
          <Stack spacing={3}>
            {accounts.map((a) => (
              <Box key={a.id} borderWidth="1px" rounded="md" p={3}>
                <Flex justify="space-between" align="start" gap={3}>
                  <Box>
                    <Text fontWeight="semibold">{a.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {a.region ?? 'Region'} · {a.channel ?? 'Channel'}
                    </Text>
                  </Box>
                  <HStack>
                    <Button size="xs" variant="ghost" onClick={() => setBuyerForm({ ...a })}>
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => setPendingConfirm({ type: 'buyer', action: 'delete', id: a.id })}
                      isLoading={deleteBuyer.isPending}
                    >
                      Delete
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </Stack>
        </Box>
      </SimpleGrid>

      {/* Products and Orders row */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6} alignItems="stretch">
        <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm" height="full">
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="md">Products</Heading>
            <HStack>
              <Button
                size="sm"
                colorScheme="brand"
                onClick={() => {
                  resetProductForm();
                  productModal.onOpen();
                }}
              >
                Add product
              </Button>
            </HStack>
          </Flex>
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Name</Th>
                  <Th>Supplier</Th>
                  <Th>Price</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {products.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <Text fontWeight="semibold">{p.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {p.sku}
                      </Text>
                    </Td>
                    <Td>
                      <Badge variant="subtle">
                        {suppliers.find((s) => s.id === p.supplierId)?.name ?? '—'}
                      </Badge>
                    </Td>
                    <Td>${(p.basePrice ?? 0).toLocaleString()}</Td>
                    <Td textAlign="right">
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => deleteProduct.mutate(p.id)}
                        isLoading={deleteProduct.isPending}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setProductForm({
                            id: p.id,
                            name: p.name,
                            sku: p.sku,
                            basePrice: p.basePrice,
                            currency: p.currency,
                            supplierId: p.supplierId ?? suppliers[0]?.id ?? '',
                          category: p.category,
                          originCountry: p.originCountry,
                          stockLevel: p.stock?.stockLevel ?? 0,
                          minThreshold: p.stock?.minThreshold ?? 0,
                          images: p.images ?? [],
                        });
                        productModal.onOpen();
                        }}
                      >
                        Edit
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Box borderWidth="1px" rounded="lg" p={4} bg="white" boxShadow="sm" height="full">
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="md">Orders</Heading>
            <HStack>
              <Button
                size="sm"
                colorScheme="brand"
                onClick={() => {
                  resetOrderForm();
                  orderModal.onOpen();
                }}
              >
                Add order
              </Button>
            </HStack>
          </Flex>
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Order #</Th>
                  <Th>Status</Th>
                  <Th>Value</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders.map((o) => (
                  <Tr key={o.id}>
                    <Td>
                      <Text fontWeight="semibold">{o.orderNumber}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {o.accountId}
                      </Text>
                    </Td>
                    <Td>
                      <Badge>{o.status}</Badge>
                    </Td>
                    <Td>${(o.orderValue ?? 0).toLocaleString()}</Td>
                    <Td textAlign="right">
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => deleteOrder.mutate(o.id)}
                        isLoading={deleteOrder.isPending}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOrderForm({
                            id: o.id,
                            orderNumber: o.orderNumber,
                            accountId: o.accountId,
                            supplierId: o.supplierId ?? suppliers[0]?.id ?? '',
                            status: o.status,
                            orderValue: o.orderValue,
                            productId: o.items?.[0]?.productId ?? products[0]?.id,
                            quantity: o.items?.[0]?.quantity ?? 1,
                            unitPrice: o.items?.[0]?.unitPrice ?? o.orderValue,
                            notes: o.notes ?? '',
                          });
                          orderModal.onOpen();
                        }}
                      >
                        Edit
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </SimpleGrid>

      <Modal
        isOpen={userModal.isOpen}
        onClose={() => {
          userModal.onClose();
          setEditingUserId(null);
          setNewUser(emptyUser);
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingUserId ? 'Edit user' : 'Add user'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  type="password"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as User['role'],
                    })
                  }
                >
                  <option value="supplier_admin">Supplier Admin</option>
                  <option value="supplier_manager">Supplier Manager</option>
                  <option value="buyer_admin">Buyer Admin</option>
                  <option value="buyer_manager">Buyer Manager</option>
                  <option value="supplier">Supplier User</option>
                  <option value="buyer">Buyer User</option>
                </Select>
              </FormControl>
              {(newUser.role === 'supplier_admin' ||
                newUser.role === 'supplier_manager' ||
                newUser.role === 'supplier') && (
                <FormControl>
                  <FormLabel>Supplier</FormLabel>
                  <Select
                    placeholder="Select supplier"
                    value={newUser.supplierId}
                    onChange={(e) => setNewUser({ ...newUser, supplierId: e.target.value })}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              {(newUser.role === 'buyer_admin' ||
                newUser.role === 'buyer_manager' ||
                newUser.role === 'buyer') && (
                <FormControl>
                  <FormLabel>Buyer account</FormLabel>
                  <Select
                    placeholder="Select buyer company"
                    value={newUser.companyId}
                    onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setEditingUserId(null);
                setNewUser(emptyUser);
                userModal.onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={() => {
                if (
                  (newUser.role === 'supplier_admin' ||
                    newUser.role === 'supplier_manager' ||
                    newUser.role === 'supplier') &&
                  !newUser.supplierId
                ) {
                  toast({ title: 'Select supplier', description: 'Choose a supplier for this user', status: 'warning' });
                  return;
                }
                if (
                  (newUser.role === 'buyer_admin' ||
                    newUser.role === 'buyer_manager' ||
                    newUser.role === 'buyer') &&
                  !newUser.companyId
                ) {
                  toast({ title: 'Select buyer company', description: 'Choose a buyer company for this user', status: 'warning' });
                  return;
                }
                setPendingConfirm({ type: 'user', action: 'save' });
              }}
              isLoading={createUser.isPending || updateUser.isPending}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={!!pendingConfirm}
        leastDestructiveRef={cancelRef}
        onClose={() => setPendingConfirm(null)}
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Confirm {pendingConfirm?.action === 'delete' ? 'delete' : 'save'}
          </AlertDialogHeader>
          <AlertDialogBody>
            {pendingConfirm?.action === 'delete'
              ? 'This action cannot be undone. Proceed?'
              : 'Apply these changes?'}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setPendingConfirm(null)}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={confirmAndRun} ml={3}>
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal
        isOpen={supplierModal.isOpen}
        onClose={() => {
          setEditingSupplierId(null);
          setNewSupplier(emptySupplier);
          supplierModal.onClose();
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingSupplierId ? 'Edit supplier' : 'Add supplier'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
              </FormControl>
              <CountrySelect label="Country" value={newSupplier.region} onChange={(c) => setNewSupplier({ ...newSupplier, region: c })} />
              <FormControl>
                <FormLabel>Website</FormLabel>
                <Input value={newSupplier.website} onChange={(e) => setNewSupplier({ ...newSupplier, website: e.target.value })} />
              </FormControl>
                <FormControl>
                  <FormLabel>Categories (comma separated)</FormLabel>
                  <Input
                    value={newSupplier.categories}
                    list="category-list"
                    placeholder="Choose or type categories"
                    onChange={(e) => setNewSupplier({ ...newSupplier, categories: e.target.value })}
                  />
                </FormControl>
              <FormControl>
                <FormLabel>Tags (comma separated)</FormLabel>
                <Input value={newSupplier.tags} onChange={(e) => setNewSupplier({ ...newSupplier, tags: e.target.value })} />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setEditingSupplierId(null);
                setNewSupplier(emptySupplier);
                supplierModal.onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={() => setPendingConfirm({ type: 'supplier', action: 'save' })}
              isLoading={createSupplier.isPending || updateSupplier.isPending}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!buyerForm} onClose={() => setBuyerForm(null)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{buyerForm?.id ? 'Edit buyer' : 'Add buyer'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {buyerForm && (
            <Stack spacing={3}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input value={buyerForm.name ?? ''} onChange={(e) => setBuyerForm({ ...buyerForm, name: e.target.value })} />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Channel</FormLabel>
                  <Input
                    value={buyerForm.channel ?? ''}
                    list="channel-list"
                    placeholder="Select or type channel"
                    onChange={(e) => setBuyerForm({ ...buyerForm, channel: e.target.value })}
                  />
                </FormControl>
                <CountrySelect
                  label="Country"
                  value={buyerForm.region ?? ''}
                  onChange={(c) => setBuyerForm({ ...buyerForm, region: c })}
                />
              </HStack>
              <FormControl>
                <FormLabel>Website</FormLabel>
                <Input value={buyerForm.website ?? ''} onChange={(e) => setBuyerForm({ ...buyerForm, website: e.target.value })} />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Credit limit</FormLabel>
                  <Input
                    type="number"
                    value={buyerForm.creditLimit ?? 0}
                    onChange={(e) => setBuyerForm({ ...buyerForm, creditLimit: Number(e.target.value) })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Credit used</FormLabel>
                  <Input
                    type="number"
                    value={buyerForm.creditUsed ?? 0}
                    onChange={(e) => setBuyerForm({ ...buyerForm, creditUsed: Number(e.target.value) })}
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Payment terms</FormLabel>
                <Input
                  value={buyerForm.paymentTerms ?? 'Net 30'}
                  onChange={(e) => setBuyerForm({ ...buyerForm, paymentTerms: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Tags (comma separated)</FormLabel>
                <Input
                  value={(buyerForm.tags ?? []).join(', ')}
                  onChange={(e) =>
                    setBuyerForm({
                      ...buyerForm,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </FormControl>
            </Stack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={() => setBuyerForm(null)}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            isLoading={createBuyer.isPending || updateBuyer.isPending}
            onClick={() => {
              if (!buyerForm?.name?.trim()) {
                toast({ title: 'Name required', status: 'warning' });
                return;
              }
              setPendingConfirm({ type: 'buyer', action: 'save' });
            }}
          >
            Save
          </Button>
        </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={productModal.isOpen} onClose={productModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{productForm?.id ? 'Edit product' : 'Add product'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {productForm && (
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Name</FormLabel>
                  <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>SKU</FormLabel>
                  <Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
                </FormControl>
                <HStack>
                  <FormControl>
                    <FormLabel>Base price</FormLabel>
                    <Input
                      type="number"
                      value={productForm.basePrice}
                      onChange={(e) => setProductForm({ ...productForm, basePrice: Number(e.target.value) })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Currency</FormLabel>
                    <Input value={productForm.currency} onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })} />
                  </FormControl>
                </HStack>
                <FormControl>
                  <FormLabel>Supplier</FormLabel>
                  <Select
                    value={productForm.supplierId}
                    onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <HStack>
                  <FormControl>
                    <FormLabel>Stock level</FormLabel>
                    <Input
                      type="number"
                      value={productForm.stockLevel}
                      onChange={(e) => setProductForm({ ...productForm, stockLevel: Number(e.target.value) })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Min threshold</FormLabel>
                    <Input
                      type="number"
                      value={productForm.minThreshold}
                      onChange={(e) => setProductForm({ ...productForm, minThreshold: Number(e.target.value) })}
                    />
                  </FormControl>
                </HStack>
                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Input
                    value={productForm.category ?? ''}
                    list="category-list"
                    placeholder="Select or type category"
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  />
                </FormControl>
                <CountrySelect
                  label="Origin country"
                  value={productForm.originCountry ?? ''}
                  onChange={(c) => setProductForm({ ...productForm, originCountry: c })}
                  placeholder="Where is this product sourced?"
                />
                <FormControl>
                  <FormLabel>Images (up to 3)</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []).slice(0, 3);
                      const dataUrls = await Promise.all(
                        files.map(
                          (file) =>
                            new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onload = () => resolve(reader.result as string);
                              reader.readAsDataURL(file);
                            }),
                        ),
                      );
                      setProductForm({ ...productForm, images: dataUrls });
                    }}
                  />
                  {productForm.images?.length ? (
                    <HStack mt={2} spacing={2}>
                      {productForm.images.map((img, idx) => (
                        <Box key={idx} boxSize="60px" bg="gray.50" rounded="md" overflow="hidden">
                          <img src={img} alt={`product-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      ))}
                    </HStack>
                  ) : null}
                </FormControl>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={productModal.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              isLoading={createProduct.isPending || updateProduct.isPending}
              onClick={async () => {
                if (!productForm) return;
                const payload: Omit<Product, 'id'> = {
                  name: productForm.name,
                  sku: productForm.sku,
                  basePrice: productForm.basePrice,
                  currency: productForm.currency,
                  supplierId: productForm.supplierId,
                  category: productForm.category,
                  originCountry: productForm.originCountry,
                  description: '',
                  active: true,
                  image: productForm.images[0],
                  images: productForm.images,
                  stock: { stockLevel: productForm.stockLevel, minThreshold: productForm.minThreshold },
                  tierPrices: [],
                };
                try {
                  if (productForm.id) {
                    await updateProduct.mutateAsync({ id: productForm.id, updates: payload });
                  } else {
                    await createProduct.mutateAsync(payload);
                  }
                  productModal.onClose();
                } catch (err) {
                  toast({ title: 'Save failed', description: (err as Error).message, status: 'error' });
                }
              }}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={orderModal.isOpen} onClose={orderModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{orderForm?.id ? 'Edit order' : 'Add order'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {orderForm && (
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Order number</FormLabel>
                  <Input value={orderForm.orderNumber} onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })} />
                </FormControl>
                <HStack>
                  <FormControl>
                    <FormLabel>Buyer account</FormLabel>
                    <Select
                      value={orderForm.accountId}
                      onChange={(e) => setOrderForm({ ...orderForm, accountId: e.target.value })}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      value={orderForm.supplierId}
                      onChange={(e) => setOrderForm({ ...orderForm, supplierId: e.target.value })}
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value as OrderStatusId })}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                  </Select>
                </FormControl>
                <HStack>
                  <FormControl>
                    <FormLabel>Product</FormLabel>
                    <Select
                      value={orderForm.productId}
                      onChange={(e) => {
                        const selected = products.find((p) => p.id === e.target.value);
                        setOrderForm({
                          ...orderForm,
                          productId: e.target.value,
                          supplierId: selected?.supplierId ?? orderForm.supplierId,
                          unitPrice: selected?.basePrice ?? orderForm.unitPrice,
                        });
                      }}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Quantity</FormLabel>
                    <Input
                      type="number"
                      value={orderForm.quantity ?? 1}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
                    />
                  </FormControl>
                </HStack>
                <HStack>
                  <FormControl>
                    <FormLabel>Unit price</FormLabel>
                    <Input
                      type="number"
                      value={orderForm.unitPrice ?? 0}
                      onChange={(e) => setOrderForm({ ...orderForm, unitPrice: Number(e.target.value) })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Order value</FormLabel>
                    <Input
                      type="number"
                      value={orderForm.orderValue}
                      onChange={(e) => setOrderForm({ ...orderForm, orderValue: Number(e.target.value) })}
                    />
                  </FormControl>
                </HStack>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Input value={orderForm.notes ?? ''} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} />
                </FormControl>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={orderModal.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              isLoading={createOrder.isPending || updateOrder.isPending}
              onClick={async () => {
                if (!orderForm) return;
                const lineTotal = (orderForm.quantity ?? 0) * (orderForm.unitPrice ?? 0);
                const payload = {
                  orderNumber: orderForm.orderNumber,
                  accountId: orderForm.accountId,
                  supplierId: orderForm.supplierId,
                  status: orderForm.status,
                  orderValue: orderForm.orderValue || lineTotal,
                  items: [
                    {
                      productId: orderForm.productId ?? products[0]?.id ?? '',
                      quantity: orderForm.quantity ?? 1,
                      unitPrice: orderForm.unitPrice ?? 0,
                      lineTotal: lineTotal || orderForm.orderValue,
                    },
                  ],
                  notes: orderForm.notes,
                  approvalStatus: 'pending' as const,
                  createdBy: user?.id ?? '',
                };
                try {
                  if (orderForm.id) {
                    await updateOrder.mutateAsync({ id: orderForm.id, updates: payload });
                  } else {
                    await createOrder.mutateAsync(payload);
                  }
                  orderModal.onClose();
                } catch (err) {
                  toast({ title: 'Save failed', description: (err as Error).message, status: 'error' });
                }
              }}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <datalist id="country-list">
        {COUNTRIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="category-list">
        {PRODUCT_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="channel-list">
        {BUYER_CHANNELS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </Stack>
  );
};

export default SuperAdminPage;

