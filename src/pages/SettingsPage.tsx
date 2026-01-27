import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
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
  useToast,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { api } from '../api/mockApi';
import { useAuth } from '../providers/AuthProvider';

const SettingsPage = () => {
  const { data: statuses = [] } = useQuery({
    queryKey: ['orderStatuses'],
    queryFn: api.listOrderStatuses,
  });
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [stageName, setStageName] = useState('');
  const [customFields, setCustomFields] = useState<string[]>(['Buyer tier', 'Region']);

  const addStage = useMutation({
    mutationFn: (name: string) => api.addOrderStatus(user?.id ?? '', name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orderStatuses'] }),
  });

  const handleAddStage = async () => {
    if (!stageName.trim()) return;
    try {
      await addStage.mutateAsync(stageName);
      setStageName('');
      toast({ title: 'Stage added', status: 'success' });
    } catch (error) {
      toast({ title: 'Save failed', description: (error as Error).message, status: 'error' });
    }
  };

  return (
    <Stack spacing={6}>
      <Heading size="lg">Settings</Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <Box bg="white" p={4} rounded="xl" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="md">Order statuses</Heading>
            <Badge colorScheme="gray" variant="subtle">
              {statuses.length} stages
            </Badge>
          </Flex>
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Name</Th>
                  <Th>Order</Th>
                </Tr>
              </Thead>
              <Tbody>
                {statuses
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((status) => (
                    <Tr key={status.id}>
                      <Td>{status.name}</Td>
                      <Td>{status.order}</Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </TableContainer>
          <HStack mt={4}>
            <Input
              placeholder="Add status"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
            <Button colorScheme="brand" leftIcon={<FiPlus />} onClick={handleAddStage} isLoading={addStage.isPending}>
              Add
            </Button>
          </HStack>
        </Box>

        <Box bg="white" p={4} rounded="xl" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
          <Heading size="md" mb={3}>
            Custom fields (UI only)
          </Heading>
          <Stack spacing={3}>
            {customFields.map((field) => (
              <Box key={field} p={3} borderWidth="1px" borderColor="gray.100" rounded="md" bg="gray.50">
                <Text fontWeight="semibold">{field}</Text>
                <Text fontSize="sm" color="gray.600">
                  Required on buyers and orders
                </Text>
              </Box>
            ))}
            <HStack>
              <Input
                placeholder="Add custom field"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      setCustomFields([...customFields, value]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <Text fontSize="sm" color="gray.500">
                Press Enter to add
              </Text>
            </HStack>
          </Stack>
        </Box>
      </SimpleGrid>

      <Box bg="white" p={4} rounded="xl" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
        <Heading size="md" mb={3}>
          Workspace preferences
        </Heading>
        <Stack spacing={3}>
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <FormLabel m={0}>Notifications for tasks</FormLabel>
            <Switch colorScheme="brand" defaultChecked />
          </FormControl>
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <FormLabel m={0}>Auto-assign new buyers</FormLabel>
            <Switch colorScheme="brand" />
          </FormControl>
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <FormLabel m={0}>Two-factor prompts</FormLabel>
            <Switch colorScheme="brand" defaultChecked />
          </FormControl>
        </Stack>
      </Box>
    </Stack>
  );
};

export default SettingsPage;
