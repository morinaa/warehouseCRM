import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
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
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../api/mockApi';
import PipelineBoard from '../components/PipelineBoard';
import type { OrderStatusId } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { FiBox } from 'react-icons/fi';

const OrdersPage = () => {
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.listOrders });
  const { data: statuses = [] } = useQuery({
    queryKey: ['orderStatuses'],
    queryFn: api.listOrderStatuses,
  });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.listUsers });
  const { data: buyers = [] } = useQuery({ queryKey: ['buyers'], queryFn: api.listBuyers });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: api.listSuppliers });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: api.listProducts });

  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const isSupplier =
    user?.role === 'supplier' || user?.role === 'supplier_admin' || user?.role === 'supplier_manager';
  const isBuyerRegular = user?.role === 'buyer';
  const isBuyerApprover = user?.role === 'buyer_admin' || user?.role === 'buyer_manager';
  const isBuyerAny = isBuyerRegular || isBuyerApprover;

  const confirmModal = useDisclosure();
  const viewModal = useDisclosure();
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);

  const approveOrder = useMutation({
    mutationFn: ({ id, approverId, status }: { id: string; approverId: string; status?: OrderStatusId }) =>
      api.updateOrder(id, { approvalStatus: 'accepted', approvedBy: approverId, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const rejectOrder = useMutation({
    mutationFn: ({ id, approverId }: { id: string; approverId: string }) =>
      api.updateOrder(id, { approvalStatus: 'rejected', approvedBy: approverId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const deleteOrder = useMutation({
    mutationFn: (id: string) => api.deleteOrder(user?.id ?? '', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const moveOrder = useMutation({
    mutationFn: ({ id, statusId }: { id: string; statusId: OrderStatusId }) =>
      api.moveOrder(id, statusId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const handleMove = (orderId: string, statusId: OrderStatusId) => {
    const isBuyerApprover = user?.role === 'buyer_admin' || user?.role === 'buyer_manager';
    const isBuyerRegular = user?.role === 'buyer';
    
    // Allow buyer admins/managers to mark orders as completed
    if (statusId === 'completed' && isBuyerApprover) {
      moveOrder.mutate({ id: orderId, statusId: statusId as OrderStatusId });
      return;
    }
    
    // Block all buyers from other status changes
    if (isBuyerRegular || isBuyerApprover) {
      toast({
        title: 'Status is managed by suppliers',
        description: 'Buyers can track but not change fulfillment steps (except marking as completed).',
        status: 'info',
      });
      return;
    }
    
    moveOrder.mutate({ id: orderId, statusId: statusId as OrderStatusId });
  };

  const handleApprove = async (orderId: string) => {
    if (!user?.id) return;
    const isBuyerApprover = user.role === 'buyer_admin' || user.role === 'buyer_manager';
    const isSupplierApprover =
      user.role === 'supplier_admin' || user.role === 'supplier_manager' || user.role === 'supplier';
    const isSuper = user.role === 'superadmin';
    if (!isBuyerApprover && !isSupplierApprover && !isSuper) {
      toast({ title: 'Only managers or supplier teams can accept orders', status: 'warning' });
      return;
    }
    try {
      if (isBuyerApprover || isSuper) {
        await approveOrder.mutateAsync({ id: orderId, approverId: user.id, status: undefined });
        toast({ title: 'Order approved', description: 'Sent to supplier for confirmation.', status: 'success' });
      } else if (isSupplierApprover) {
        await moveOrder.mutateAsync({ id: orderId, statusId: 'confirmed' });
        toast({ title: 'Order accepted', description: 'Order creator has been notified.', status: 'success' });
      }
    } catch (error) {
      toast({ title: 'Approval failed', description: (error as Error).message, status: 'error' });
    }
  };

  const handleReject = async (orderId: string) => {
    if (!user?.id) return;
    const isBuyerApprover = user.role === 'buyer_admin' || user.role === 'buyer_manager';
    const isSupplierApprover =
      user.role === 'supplier_admin' || user.role === 'supplier_manager' || user.role === 'supplier';
    const isSuper = user.role === 'superadmin';
    if (!isBuyerApprover && !isSupplierApprover && !isSuper) {
      toast({ title: 'Only managers or supplier teams can reject orders', status: 'warning' });
      return;
    }
    try {
      if (isSupplierApprover) {
        await moveOrder.mutateAsync({ id: orderId, statusId: 'rejected_by_supplier' });
        toast({
          title: 'Order rejected',
          description: 'The buyer has been notified of the supplier rejection.',
          status: 'info',
        });
      } else {
        await rejectOrder.mutateAsync({ id: orderId, approverId: user.id });
        toast({
          title: 'Order rejected',
          description: 'Draft sent back to buyer.',
          status: 'info',
        });
      }
    } catch (error) {
      toast({ title: 'Rejection failed', description: (error as Error).message, status: 'error' });
    }
  };

  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);
  const visibleStatuses = isSupplier
    ? sortedStatuses
        .filter((s) => ['sent_to_supplier', 'accepted_by_supplier', 'shipped', 'completed'].includes(s.id))
        .map((s) => (s.id === 'sent_to_supplier' ? { ...s, name: 'Pending' } : s))
    : sortedStatuses;
  const totalValue = orders.reduce((sum, order) => sum + (order.orderValue ?? 0), 0);
  const userLookup = users.reduce<Record<string, string>>((acc, u) => {
    acc[u.id] = u.name;
    return acc;
  }, {});
  const productLookup = useMemo(
    () =>
      products.reduce<Record<string, string>>((acc, p) => {
        acc[p.id] = p.name;
        return acc;
      }, {}),
    [products],
  );
  const canCreate = false; // creation removed from status board per request
  const canApprove = isSupplier || isBuyerApprover || user?.role === 'superadmin';

  const openConfirm = (id: string, action: 'accept' | 'reject') => {
    setConfirmOrderId(id);
    setConfirmAction(action);
    confirmModal.onOpen();
  };

  const openView = (id: string) => {
    setViewOrderId(id);
    viewModal.onOpen();
  };

  const selectedOrder = useMemo(() => orders.find((o) => o.id === viewOrderId), [orders, viewOrderId]);
  const confirmOrder = useMemo(() => orders.find((o) => o.id === confirmOrderId), [orders, confirmOrderId]);

  const handleConfirmAction = async () => {
    if (!confirmOrderId || !confirmAction) return;
    if (!user?.id) return;
    try {
      if (confirmAction === 'accept') {
        await handleApprove(confirmOrderId);
      } else {
        await handleReject(confirmOrderId);
      }
    } finally {
      confirmModal.onClose();
      setConfirmAction(null);
      setConfirmOrderId(null);
    }
  };

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">Orders</Heading>
          <Text color="gray.600">
            {isSupplier
              ? 'Accept or reject orders submitted by buyers.'
              : 'Create drafts, approve internally, and send to suppliers.'}
          </Text>
          {(isSupplier || isBuyerRegular) && (
            <Text color="gray.500" fontSize="sm">
              Orders are created by your admin/manager.
            </Text>
          )}
        </Box>
        <HStack spacing={3}>
          <Badge colorScheme="brand" variant="subtle">
            Total ${totalValue.toLocaleString()}
          </Badge>
          {isBuyerAny && (
            <Button
              as={RouterLink}
              to="/suppliers"
              colorScheme="brand"
              size="sm"
              leftIcon={<Icon as={FiBox} />}
            >
              Create order
            </Button>
          )}
        </HStack>
      </Flex>

      <PipelineBoard
        statuses={visibleStatuses}
        orders={orders}
        onMove={handleMove}
        onNewOrder={canCreate ? () => undefined : undefined}
        userLookup={userLookup}
        currentUserRole={user?.role}
        onApproveOrder={canApprove ? (id) => openConfirm(id, 'accept') : undefined}
        onRejectOrder={canApprove ? (id) => openConfirm(id, 'reject') : undefined}
        onSelectOrder={openView}
      />

      <Modal isOpen={confirmModal.isOpen} onClose={confirmModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{confirmAction === 'accept' ? 'Accept order' : 'Reject order'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>
              {confirmAction === 'accept'
                ? 'Confirm you want to accept this order. It will move to Confirmed.'
                : 'Rejecting will remove the order from the queue.'}
            </Text>
            {confirmOrder && (
              <Box borderWidth="1px" rounded="md" p={3}>
                <Text fontWeight="semibold">{confirmOrder.orderNumber}</Text>
                <Text color="gray.600">
                  {confirmOrder.items?.length ?? 0} lines · ${confirmOrder.orderValue?.toLocaleString()}
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={confirmModal.onClose}>
                Cancel
              </Button>
              <Button
                colorScheme={confirmAction === 'accept' ? 'green' : 'red'}
                onClick={handleConfirmAction}
                isLoading={approveOrder.isPending || rejectOrder.isPending || deleteOrder.isPending}
              >
                {confirmAction === 'accept' ? 'Accept' : 'Reject'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={viewModal.isOpen} onClose={viewModal.onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Order details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedOrder ? (
              <Stack spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">{selectedOrder.orderNumber}</Text>
                  <HStack>
                    <Badge colorScheme="brand">{selectedOrder.status}</Badge>
                    <Badge
                      colorScheme={
                        selectedOrder.approvalStatus === 'accepted'
                          ? 'green'
                          : selectedOrder.approvalStatus === 'rejected'
                            ? 'red'
                            : 'orange'
                      }
                    >
                      {selectedOrder.approvalStatus}
                    </Badge>
                  </HStack>
                </HStack>
                <Text color="gray.600">
                  Buyer:{' '}
                  {buyers.find((b) => b.id === selectedOrder.buyerId)?.name ??
                    selectedOrder.buyerId ??
                    '—'}
                </Text>
                <Text color="gray.600">
                  Supplier:{' '}
                  {suppliers.find((s) => s.id === selectedOrder.supplierId)?.name ??
                    selectedOrder.supplierId ??
                    '—'}
                </Text>
                <Text color="gray.600">
                  Created by {userLookup[selectedOrder.createdBy] ?? 'User'} on{' '}
                  {new Date(selectedOrder.createdAt ?? '').toLocaleDateString()}
                </Text>

                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Product</Th>
                      <Th isNumeric>Qty</Th>
                      <Th isNumeric>Price</Th>
                      <Th isNumeric>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(selectedOrder.items ?? []).map((item) => (
                      <Tr key={item.productId}>
                        <Td>{productLookup[item.productId] ?? item.productId}</Td>
                        <Td isNumeric>{item.quantity}</Td>
                        <Td isNumeric>${(item.unitPrice ?? 0).toLocaleString()}</Td>
                        <Td isNumeric>${(item.lineTotal ?? 0).toLocaleString()}</Td>
                      </Tr>
                    ))}
                    {(selectedOrder.items ?? []).length === 0 && (
                      <Tr>
                        <Td colSpan={4}>
                          <Text color="gray.600">No items captured for this order.</Text>
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
                <Flex justify="flex-end">
                  <Text fontWeight="semibold">
                    Total ${selectedOrder.orderValue?.toLocaleString() ?? '0'}
                  </Text>
                </Flex>
              </Stack>
            ) : (
              <Text color="gray.600">No order selected.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  );
};

export default OrdersPage;
