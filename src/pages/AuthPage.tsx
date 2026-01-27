import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

const AuthPage = ({ mode }: { mode: 'login' | 'signup' }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!form.email.includes('@')) next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: (error as Error).message,
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient="linear(to-br, brand.50, white)"
      px={4}
    >
      <Card maxW="md" w="full" boxShadow="lg" borderWidth="1px" borderColor="gray.100">
        <CardBody p={8}>
          <Stack spacing={6}>
            <Box>
              <Heading size="lg" mb={2}>
                {mode === 'login' ? 'Welcome back' : 'Signups are disabled'}
              </Heading>
              <Text color="gray.600">
                {mode === 'login'
                  ? 'Access your wholesale workspace and order data.'
                  : 'Only admins can create users. Ask a Super Admin to provision your account.'}
              </Text>
            </Box>
            <FormControl isInvalid={Boolean(errors.email)}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={Boolean(errors.password)}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>
            <Button colorScheme="brand" onClick={handleSubmit} isLoading={isSubmitting}>
              Sign in
            </Button>
            <Text fontSize="sm" color="gray.600">
              Signup is disabled. Please contact a Super Admin to create your user.
            </Text>
            <Box fontSize="sm" color="gray.500" lineHeight="1.6">
              Quick logins:
              <Box>
                <strong>Super Admin</strong>: super@signalwholesale.com / demo123
              </Box>
              <Box>
                <strong>Supplier Admin (Sparkle)</strong>: sparkle@supplier.com / demo123
              </Box>
              <Box>
                <strong>Supplier Admin (ProSnack)</strong>: prosnack@supplier.com / demo123
              </Box>
              <Box>
                <strong>Supplier Admin (FreshFarm)</strong>: freshfarm@supplier.com / demo123
              </Box>
              <Box>
                <strong>Buyer</strong>: buyer@signalwholesale.com / demo123
              </Box>
              <Box>
                <strong>Buyer Admin (Metro)</strong>: buyer2@signalwholesale.com / demo123
              </Box>
              <Box>
                <strong>Buyer Manager</strong>: buyermgr@signalwholesale.com / demo123
              </Box>
              <Box>
                <strong>Supplier Manager</strong>: sparkle.manager@supplier.com / demo123
              </Box>
              <Text mt={2} fontSize="xs" color="gray.500">
                Buyer admins/managers create orders; supplier admins/managers approve or reject. Super admin seeds everything else.
              </Text>
            </Box>
          </Stack>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default AuthPage;
