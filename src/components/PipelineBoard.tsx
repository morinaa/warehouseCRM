import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Link,
  Stack,
  Text,
  useColorModeValue,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiPlus } from 'react-icons/fi';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Order, OrderStatus, OrderStatusId } from '../types';
import { useDroppable } from '@dnd-kit/core';

type PipelineBoardProps = {
  statuses: OrderStatus[];
  orders: Order[];
  onMove: (orderId: string, statusId: OrderStatusId) => void;
  onNewOrder?: (statusId: string) => void;
  userLookup?: Record<string, string>;
  currentUserRole?: string;
  onApproveOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onSelectOrder?: (orderId: string) => void;
};

const OrderCard = ({
  order,
  userLookup,
  currentUserRole,
  onApproveOrder,
  onRejectOrder,
  onSelectOrder,
}: {
  order: Order;
  userLookup?: Record<string, string>;
  currentUserRole?: string;
  onApproveOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onSelectOrder?: (orderId: string) => void;
}) => (
  <Box
    bg="white"
    borderWidth="1px"
    borderColor="gray.100"
    rounded="lg"
    p={3}
    boxShadow="sm"
    w="full"
  >
    <Flex align="center" justify="space-between">
      <Text fontWeight="semibold">{order.orderNumber}</Text>
      {onSelectOrder && (
        <Link color="brand.600" fontSize="sm" onClick={() => onSelectOrder(order.id)}>
          View
        </Link>
      )}
    </Flex>
    <Text fontSize="sm" color="gray.600">
      ${order.orderValue.toLocaleString()} | {order.warehouse ?? 'Main DC'}
    </Text>
    <HStack spacing={2} mt={2}>
      <Badge colorScheme="gray" variant="subtle">
        {order.expectedShipDate ? `Ship ${order.expectedShipDate}` : 'Date TBD'}
      </Badge>
      <Badge colorScheme="brand" variant="subtle">
        {order.status}
      </Badge>
    </HStack>
    <HStack spacing={2} mt={2}>
      <Badge colorScheme="purple" variant="subtle">
        {userLookup?.[order.createdBy] ? `By ${userLookup[order.createdBy]}` : 'By team'}
      </Badge>
      <Badge
        colorScheme={
          order.approvalStatus === 'accepted'
            ? 'green'
            : order.approvalStatus === 'rejected'
              ? 'red'
              : 'orange'
        }
        variant="subtle"
      >
        {order.approvalStatus}
      </Badge>
    </HStack>
    {currentUserRole !== 'buyer' && order.approvalStatus === 'pending' && (
      <HStack mt={2}>
        {onApproveOrder && (
          <Button size="sm" colorScheme="green" onClick={() => onApproveOrder(order.id)}>
            Accept
          </Button>
        )}
        {onRejectOrder && (
          <Button size="sm" variant="outline" colorScheme="red" onClick={() => onRejectOrder(order.id)}>
            Reject
          </Button>
        )}
      </HStack>
    )}
  </Box>
);

const SortableOrder = ({
  order,
  userLookup,
  currentUserRole,
  onApproveOrder,
  onRejectOrder,
  onSelectOrder,
}: {
  order: Order;
  userLookup?: Record<string, string>;
  currentUserRole?: string;
  onApproveOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onSelectOrder?: (orderId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCard
        order={order}
        userLookup={userLookup}
        currentUserRole={currentUserRole}
        onApproveOrder={onApproveOrder}
        onRejectOrder={onRejectOrder}
        onSelectOrder={onSelectOrder}
      />
    </Box>
  );
};

const PipelineColumn = ({
  status,
  orders,
  onNewOrder,
  userLookup,
  currentUserRole,
  onApproveOrder,
  onRejectOrder,
  onSelectOrder,
}: {
  status: OrderStatus;
  orders: Order[];
  onNewOrder?: (statusId: string) => void;
  userLookup?: Record<string, string>;
  currentUserRole?: string;
  onApproveOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onSelectOrder?: (orderId: string) => void;
}) => {
  const bg = useColorModeValue('gray.50', 'gray.800');
  const accent = useColorModeValue('brand.100', 'brand.900');
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <Stack
      key={status.id}
      bg={bg}
      borderWidth="1px"
      rounded="xl"
      p={3}
      minW="240px"
      maxW="320px"
      spacing={3}
      boxShadow="sm"
      ref={setNodeRef}
      borderColor={isOver ? 'brand.300' : 'gray.100'}
    >
      <Flex align="center" justify="space-between">
        <Text fontWeight="semibold">{status.name}</Text>
        <Badge colorScheme="brand" variant="subtle">
          {orders.length}
        </Badge>
      </Flex>
      <SortableContext items={orders.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <Stack spacing={3}>
          {orders.map((order) => (
            <SortableOrder
              key={order.id}
              order={order}
              userLookup={userLookup}
              currentUserRole={currentUserRole}
              onApproveOrder={onApproveOrder}
              onRejectOrder={onRejectOrder}
              onSelectOrder={onSelectOrder}
            />
          ))}
          {orders.length === 0 && (
            <Box
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="gray.200"
              rounded="lg"
              p={4}
              textAlign="center"
              color="gray.500"
              bg={accent}
            >
              No orders yet
            </Box>
          )}
        </Stack>
      </SortableContext>
      {onNewOrder && (
        <Button
          size="sm"
          leftIcon={<FiPlus />}
          variant="ghost"
          onClick={() => onNewOrder(status.id)}
        >
          Add order
        </Button>
      )}
    </Stack>
  );
};

const PipelineBoard = ({
  statuses,
  orders,
  onMove,
  onNewOrder,
  userLookup,
  currentUserRole,
  onApproveOrder,
  onRejectOrder,
  onSelectOrder,
}: PipelineBoardProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    let statusId: string | undefined = statuses.find((stage) => stage.id === overId)?.id;
    if (!statusId) {
      const overOrder = orders.find((order) => order.id === overId);
      statusId = overOrder?.status;
    }

    if (statusId) {
      onMove(activeId, statusId as OrderStatusId);
    }
  };

  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Wrap spacing={4} align="flex-start">
        {sortedStatuses.map((status) => (
          <WrapItem key={status.id}>
            <PipelineColumn
              status={status}
              orders={orders.filter((order) => order.status === status.id)}
              onNewOrder={onNewOrder}
              userLookup={userLookup}
              currentUserRole={currentUserRole}
              onApproveOrder={onApproveOrder}
              onRejectOrder={onRejectOrder}
              onSelectOrder={onSelectOrder}
            />
          </WrapItem>
        ))}
      </Wrap>
    </DndContext>
  );
};

export default PipelineBoard;
