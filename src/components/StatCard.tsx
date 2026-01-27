import { Box, Flex, Heading, Icon, Text } from '@chakra-ui/react';
import type { IconType } from 'react-icons';

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: IconType;
  accent?: string;
};

const StatCard = ({ label, value, helper, icon, accent = 'brand.500' }: StatCardProps) => {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.100" rounded="xl" p={4} boxShadow="sm">
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
        {icon && (
          <Box
            bg={`${accent.split('.')[0] ?? 'brand'}.50`}
            color={accent}
            rounded="md"
            p={2}
            display="grid"
            placeItems="center"
          >
            <Icon as={icon} />
          </Box>
        )}
      </Flex>
      <Heading size="lg">{value}</Heading>
      {helper && (
        <Text fontSize="sm" color="gray.600" mt={1}>
          {helper}
        </Text>
      )}
    </Box>
  );
};

export default StatCard;
