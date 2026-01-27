import { Badge, Box, Flex, Heading, HStack, Input, Select, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/mockApi';

const SuppliersPage = () => {
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: api.listSuppliers });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: api.listProducts });
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filteredSuppliers = useMemo(() => {
    const term = search.toLowerCase();
    return suppliers.filter((sup) => {
      const byName = sup.name.toLowerCase().includes(term);
      const byCategory = category === 'all' || sup.categories.includes(category);
      const byProduct =
        term.length === 0 ||
        products.some(
          (p) =>
            p.supplierId === sup.id &&
            (p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)),
        );
      return byName && byCategory && byProduct;
    });
  }, [suppliers, search, category, products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => s.categories.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [suppliers]);

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <Box>
          <Heading size="lg">Suppliers</Heading>
          <Text color="gray.600">
            Browse suppliers, view their catalog, and send purchase orders in one screen.
          </Text>
        </Box>
        <HStack spacing={3}>
          <Select
            maxW="220px"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            bg="white"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Search suppliers or products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg="white"
            maxW="320px"
          />
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        {filteredSuppliers.map((sup) => (
          <Box
            key={sup.id}
            p={4}
            borderWidth="1px"
            borderColor="gray.100"
            rounded="xl"
            bg="white"
            boxShadow="sm"
            cursor="pointer"
            onClick={() => navigate(`/suppliers/${sup.id}`)}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <Heading size="sm">{sup.name}</Heading>
              <Badge colorScheme="brand" variant="subtle">
                {sup.region ?? 'Region'}
              </Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600">
              {sup.website ?? '—'}
            </Text>
            <HStack spacing={2} mt={2} wrap="wrap">
              {sup.categories.map((c) => (
                <Badge key={c} colorScheme="gray" variant="subtle">
                  {c}
                </Badge>
              ))}
            </HStack>
          </Box>
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export default SuppliersPage;
