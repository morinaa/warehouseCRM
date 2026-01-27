import { Box, Button, Flex, Icon, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import type { ComponentType } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiBox,
  FiHome,
  FiSettings,
  FiShoppingBag,
  FiTrendingUp,
} from 'react-icons/fi';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

type NavItemProps = {
  label: string;
  to: string;
  icon: ComponentType;
};

const navItems: NavItemProps[] = [
  { label: 'Dashboard', to: '/', icon: FiBarChart2 },
  { label: 'History', to: '/history', icon: FiHome },
  { label: 'Logs', to: '/logs', icon: FiActivity },
  { label: 'Suppliers', to: '/suppliers', icon: FiBox },
  { label: 'Orders', to: '/orders', icon: FiTrendingUp },
  { label: 'Products', to: '/products', icon: FiShoppingBag },
  { label: 'Analytics', to: '/analytics', icon: FiBarChart2 },
  { label: 'Settings', to: '/settings', icon: FiSettings },
  { label: 'Super Admin', to: '/superadmin', icon: FiBarChart2 },
];

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const activeBg = useColorModeValue('white', 'gray.800');
  const inactiveBg = useColorModeValue('transparent', 'transparent');
  const role = user?.role ?? 'buyer';
  let filteredNav = navItems;
  if (role === 'superadmin') {
    // Super admin: dashboard, logs, console
    filteredNav = navItems.filter((item) => ['/', '/logs', '/superadmin'].includes(item.to));
  } else if (role === 'supplier' || role === 'supplier_manager' || role === 'supplier_admin') {
    filteredNav = navItems.filter((item) =>
      ['/', '/orders', '/products', '/history', '/analytics', '/logs'].includes(item.to),
    );
  } else if (role === 'buyer' || role === 'buyer_manager' || role === 'buyer_admin') {
    // Buyer-facing: history, orders, suppliers catalog, analytics
    filteredNav = navItems.filter((item) =>
      ['/', '/history', '/orders', '/suppliers', '/analytics', '/logs'].includes(item.to),
    );
  }

  return (
    <Box
      w={{ base: 'full', md: 72 }}
      display={{ base: 'none', md: 'block' }}
      bgGradient="linear(to-b, white, blue.50)"
      borderRightWidth="1px"
      borderColor="gray.100"
      px={4}
      py={6}
      position="sticky"
      top={0}
      height="100vh"
    >
      <Flex align="center" gap={2} px={2} mb={8}>
        <Box
          w={10}
          h={10}
          rounded="lg"
          bg="brand.500"
          color="white"
          display="grid"
          placeItems="center"
          fontWeight="bold"
        >
          W&D
        </Box>
        <Box>
          <Text fontWeight="bold" fontSize="lg">
            Signal Wholesale
          </Text>
          <Text fontSize="sm" color="gray.500">
            Orders and inventory
          </Text>
        </Box>
      </Flex>
      <Stack spacing={2}>
        {filteredNav.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Button
              key={item.to}
              as={NavLink}
              to={item.to}
              variant={isActive ? 'solid' : 'ghost'}
              justifyContent="flex-start"
              leftIcon={<Icon as={item.icon} />}
              bg={isActive ? activeBg : inactiveBg}
              color={isActive ? 'brand.700' : 'gray.700'}
              fontWeight={isActive ? 'semibold' : 'medium'}
              _hover={{ bg: activeBg }}
              size="lg"
            >
              {item.label}
            </Button>
          );
        })}
      </Stack>
      {role !== 'superadmin' && (
        <Box mt="auto" pt={8} px={2}>
          <Box
            borderWidth="1px"
            borderColor="gray.100"
            rounded="xl"
            p={4}
            bg="white"
            boxShadow="md"
          >
            <Text fontWeight="bold" mb={1}>
              Move cartons faster
            </Text>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Monitor orders, credit, and low-stock items without leaving the grid.
            </Text>
            <Button as={NavLink} to="/orders" colorScheme="brand" w="full" leftIcon={<Icon as={FiBox} />}>
              View orders
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
