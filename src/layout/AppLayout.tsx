import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AppLayout = () => {
  return (
    <Flex minH="100vh" bg="gray.50">
      <Sidebar />
      <Flex direction="column" flex="1" minW={0}>
        <Topbar />
        <Box
          as="main"
          px={{ base: 4, md: 6 }}
          py={6}
          maxW="1440px"
          w="100%"
          mx="auto"
          minH="0"
        >
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default AppLayout;
