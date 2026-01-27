import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Flex,
  Heading,
  HStack,
  Input,
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
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { api } from '../api/mockApi';
import type { Account, Retailer } from '../types';
import { useUiStore } from '../store/uiStore';

type RetailerForm = {
  name: string;
  email: string;
  phone?: string;
  title?: string;
  accountId?: string;
  tags: string;
  status: Retailer['status'];
};

const emptyForm: RetailerForm = {
  name: '',
  email: '',
  phone: '',
  title: '',
  accountId: '',
  tags: '',
  status: 'Active',
};

const RetailersPage = () => {
  const { data: retailers = [] } = useQuery({
    queryKey: ['retailers'],
    queryFn: api.listRetailers,
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: api.listAccounts,
  });
  const queryClient = useQueryClient();
  const toast = useToast();
  const modal = useDisclosure();

  const search = useUiStore((s) => s.retailerSearch);
  const setSearch = useUiStore((s) => s.setRetailerSearch);
  const [editing, setEditing] = useState<Retailer | null>(null);
  const [form, setForm] = useState<RetailerForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createRetailer = useMutation({
    mutationFn: api.createRetailer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['retailers'] }),
  });

  const updateRetailer = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Retailer> }) =>
      api.updateRetailer(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['retailers'] }),
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return retailers.filter(
      (retailer) =>
        retailer.name.toLowerCase().includes(term) ||
        retailer.email.toLowerCase().includes(term) ||
        (retailer.tags ?? []).some((tag) => tag.toLowerCase().includes(term)),
    );
  }, [retailers, search]);

  const openDrawer = (retailer?: Retailer) => {
    if (retailer) {
      setEditing(retailer);
      setForm({
        name: retailer.name,
        email: retailer.email,
        phone: retailer.phone,
        title: retailer.title,
        accountId: retailer.accountId,
        tags: retailer.tags.join(', '),
        status: retailer.status,
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    modal.onOpen();
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!form.email.includes('@')) next.email = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      if (editing) {
        await updateRetailer.mutateAsync({ id: editing.id, updates: { ...form, tags } });
        toast({ title: 'Retailer updated', status: 'success' });
      } else {
        await createRetailer.mutateAsync({
          ...form,
          tags,
          ownerId: 'u-admin',
        });
        toast({ title: 'Retailer created', status: 'success' });
      }
      modal.onClose();
      setForm(emptyForm);
    } catch (error) {
      toast({ title: 'Save failed', description: (error as Error).message, status: 'error' });
    }
  };

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">Retailers</Heading>
          <Text color="gray.600">Store and buyer contacts tied to each account.</Text>
        </Box>
        <Button colorScheme="brand" leftIcon={<FiPlus />} onClick={() => openDrawer()}>
          New retailer
        </Button>
      </Flex>

      <HStack spacing={4} align="center">
        <Input
          placeholder="Search name, email, tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW="400px"
          bg="white"
        />
        <Badge colorScheme="gray" variant="subtle">
          {filtered.length} results
        </Badge>
      </HStack>

      <TableContainer bg="white" borderWidth="1px" borderColor="gray.100" rounded="xl" boxShadow="sm">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Email</Th>
              <Th>Account</Th>
              <Th>Tags</Th>
              <Th>Status</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((retailer) => {
              const account = accounts.find((a: Account) => a.id === retailer.accountId);
              return (
                <Tr key={retailer.id}>
                  <Td fontWeight="semibold">{retailer.name}</Td>
                  <Td>{retailer.title}</Td>
                  <Td>{retailer.email}</Td>
                  <Td>{account?.name ?? '--'}</Td>
                  <Td>
                    <HStack spacing={1} wrap="wrap">
                      {retailer.tags.map((tag) => (
                        <Badge key={tag} colorScheme="brand" variant="subtle">
                          {tag}
                        </Badge>
                      ))}
                    </HStack>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        retailer.status === 'Active'
                          ? 'green'
                          : retailer.status === 'Dormant'
                            ? 'orange'
                            : 'blue'
                      }
                    >
                      {retailer.status}
                    </Badge>
                  </Td>
                  <Td textAlign="right">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<FiEdit2 />}
                      onClick={() => openDrawer(retailer)}
                    >
                      Edit
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>

      <Drawer isOpen={modal.isOpen} placement="right" size="md" onClose={modal.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            {editing ? 'Edit retailer' : 'New retailer'}
          </DrawerHeader>
          <DrawerBody>
            <Stack spacing={4}>
              <FormControl isInvalid={Boolean(errors.name)}>
                <FormLabel>Full name</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Store contact"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.email)}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ops@retailer.com"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 415 555-0100"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Category manager"
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Account</FormLabel>
                <Select
                  placeholder="Select account"
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Tags (comma separated)</FormLabel>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="gold tier, seasonal"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Retailer['status'] })}
                >
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Dormant">Dormant</option>
                </Select>
              </FormControl>
            </Stack>
          </DrawerBody>
          <DrawerFooter gap={3}>
            <Button variant="ghost" onClick={modal.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSave}
              isLoading={createRetailer.isPending || updateRetailer.isPending}
            >
              Save
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Stack>
  );
};

export default RetailersPage;
