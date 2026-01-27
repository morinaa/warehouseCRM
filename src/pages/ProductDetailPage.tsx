import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/mockApi';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: api.listProducts });
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <Stack spacing={4}>
        <Text>Product not found.</Text>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </Stack>
    );
  }

  const gallery = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <Stack spacing={6}>
      <Button variant="ghost" onClick={() => navigate(-1)} w="fit-content">
        ← Back
      </Button>
      <Flex gap={6} wrap="wrap">
        <Box flex="1 1 320px">
          <Image
            src={gallery?.[0] ?? ''}
            alt={product.name}
            rounded="xl"
            borderWidth="1px"
            borderColor="gray.100"
            objectFit="cover"
            w="100%"
            maxH="360px"
          />
          {gallery && gallery.length > 1 && (
            <SimpleGrid columns={{ base: 3, md: 4 }} spacing={2} mt={3}>
              {gallery.map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  alt={`${product.name}-${idx}`}
                  rounded="md"
                  borderWidth="1px"
                  borderColor="gray.100"
                  objectFit="cover"
                  h="80px"
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
        <Stack spacing={3} flex="1 1 300px">
          <Heading size="lg">{product.name}</Heading>
          <Text color="gray.600">{product.description ?? 'No description provided.'}</Text>
          <Flex gap={2} align="center">
            <Badge colorScheme="brand" variant="subtle">
              {product.category ?? 'Uncategorized'}
            </Badge>
            <Badge colorScheme="gray" variant="subtle">
              {product.sku}
            </Badge>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold">
            {product.currency} {(product.basePrice ?? 0).toLocaleString()}
          </Text>
          <Box>
            <Text fontWeight="semibold">Stock</Text>
            <Text color="gray.700">
              {product.stock.stockLevel} on hand · Min {product.stock.minThreshold}
            </Text>
          </Box>
          <Box>
            <Text fontWeight="semibold">Tier prices</Text>
            <Stack spacing={1}>
              {(product.tierPrices ?? []).map((tier) => (
                <Flex key={tier.tierId} justify="space-between">
                  <Text>{tier.tierId}</Text>
                  <Text>${(tier.price ?? 0).toLocaleString()}</Text>
                </Flex>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Flex>
    </Stack>
  );
};

export default ProductDetailPage;
