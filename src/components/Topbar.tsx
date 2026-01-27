import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { FiBell, FiLogOut, FiPlus, FiSearch, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/mockApi';
import { useAuth } from '../providers/AuthProvider';
import { useUiStore } from '../store/uiStore';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const term = useUiStore((s) => s.globalSearch);
  const setTerm = useUiStore((s) => s.setGlobalSearch);
  const searchDisclosure = useDisclosure();

  const { data: retailers = [] } = useQuery({
    queryKey: ['retailers'],
    queryFn: api.listRetailers,
  });
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.listOrders });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: api.listAccounts });

  const results = useMemo(() => {
    if (!term.trim()) return [];
    const lower = term.toLowerCase();
    const matches = [
      ...retailers.map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: c.email,
        type: 'Retailer',
        href: '/retailers',
      })),
      ...accounts.map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: c.channel ?? '',
        type: 'Account',
        href: '/accounts',
      })),
      ...orders.map((d) => ({
        id: d.id,
        label: d.orderNumber,
        subtitle: `$${d.orderValue.toLocaleString()}`,
        type: 'Order',
        href: '/orders',
      })),
    ];
    return matches.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.subtitle.toLowerCase().includes(lower) ||
        item.type.toLowerCase().includes(lower),
    );
  }, [term, retailers, orders, accounts]);

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      px={{ base: 4, md: 6 }}
      py={3}
      borderBottomWidth="1px"
      borderColor="gray.100"
      bg="white"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <HStack spacing={3} align="center">
        <Popover
          isOpen={searchDisclosure.isOpen && Boolean(term)}
          onOpen={searchDisclosure.onOpen}
          onClose={searchDisclosure.onClose}
          placement="bottom-start"
          closeOnBlur
        >
          <PopoverTrigger>
            <InputGroup w={{ base: 'xs', md: 'md', lg: 'lg' }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Search retailers, orders, accounts..."
                bg="gray.50"
                borderColor="gray.200"
                value={term}
                onFocus={searchDisclosure.onOpen}
                onChange={(e) => setTerm(e.target.value)}
              />
            </InputGroup>
          </PopoverTrigger>
          <PopoverContent w={{ base: 'sm', md: 'lg' }}>
            <PopoverBody>
              <Stack spacing={3}>
                {results.length === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    No matches yet. Try a different keyword.
                  </Text>
                )}
                {results.map((item) => (
                  <Flex
                    key={item.id}
                    align="center"
                    justify="space-between"
                    p={2}
                    rounded="md"
                    borderWidth="1px"
                    borderColor="gray.100"
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => {
                      navigate(item.href);
                      searchDisclosure.onClose();
                    }}
                  >
                    <Box>
                      <Text fontWeight="semibold">{item.label}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {item.subtitle}
                      </Text>
                    </Box>
                    <Badge colorScheme="brand" variant="subtle">
                      {item.type}
                    </Badge>
                  </Flex>
                ))}
              </Stack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>

      <HStack spacing={3}>
        <Menu>
          <MenuButton as={Button} leftIcon={<FiPlus />} colorScheme="brand" variant="solid">
            Quick add
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => navigate('/retailers')}>New retailer</MenuItem>
            <MenuItem onClick={() => navigate('/orders')}>New order</MenuItem>
            <MenuItem onClick={() => navigate('/activities')}>Log activity</MenuItem>
          </MenuList>
        </Menu>
        <IconButton aria-label="Notifications" icon={<FiBell />} variant="ghost" />
        <Menu>
          <MenuButton>
            <HStack spacing={2}>
              <Avatar name={user?.name} size="sm" bg="brand.500" color="white" />
              <Box display={{ base: 'none', md: 'block' }}>
                <Text fontWeight="semibold">{user?.name ?? 'User'}</Text>
                <Text fontSize="sm" color="gray.500">
                  {user?.role ?? 'buyer'}
                </Text>
              </Box>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiUser />}>Profile</MenuItem>
            <MenuItem icon={<FiLogOut />} onClick={logout}>
              Sign out
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

export default Topbar;
