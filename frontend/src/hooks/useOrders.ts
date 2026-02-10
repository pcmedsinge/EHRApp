/**
 * Orders React Query Hooks
 * Phase: 4B (Orders Frontend)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as orderService from '@/services/orderService';
import type {
  ImagingOrderCreate,
  LabOrderCreate,
  ProcedureOrderCreate,
  OrderUpdate,
  OrderStatusUpdate,
  OrderReportAdd,
  OrderFilters,
} from '@/types/orders';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters?: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  patient: (patientId: string) => [...orderKeys.all, 'patient', patientId] as const,
  visit: (visitId: string) => [...orderKeys.all, 'visit', visitId] as const,
  
  // Reference data
  modalities: ['orders', 'modalities'] as const,
  bodyParts: ['orders', 'body-parts'] as const,
  labTests: ['orders', 'lab-tests'] as const,
  procedureTypes: ['orders', 'procedure-types'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Get orders list with optional filters
 */
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => orderService.getOrders(filters),
  });
};

/**
 * Get single order details
 */
export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderService.getOrder(orderId),
    enabled: !!orderId,
  });
};

/**
 * Get patient order history
 */
export const usePatientOrders = (patientId: string) => {
  return useQuery({
    queryKey: orderKeys.patient(patientId),
    queryFn: () => orderService.getPatientOrders(patientId),
    enabled: !!patientId,
  });
};

/**
 * Get orders for a specific visit
 */
export const useVisitOrders = (visitId: string) => {
  return useQuery({
    queryKey: orderKeys.visit(visitId),
    queryFn: () => orderService.getVisitOrders(visitId),
    enabled: !!visitId,
  });
};

// ============================================================================
// REFERENCE DATA HOOKS
// ============================================================================

/**
 * Get imaging modalities
 */
export const useImagingModalities = () => {
  return useQuery({
    queryKey: orderKeys.modalities,
    queryFn: orderService.getImagingModalities,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get body parts
 */
export const useBodyParts = () => {
  return useQuery({
    queryKey: orderKeys.bodyParts,
    queryFn: orderService.getBodyParts,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get lab tests
 */
export const useLabTests = () => {
  return useQuery({
    queryKey: orderKeys.labTests,
    queryFn: orderService.getLabTests,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get procedure types
 */
export const useProcedureTypes = () => {
  return useQuery({
    queryKey: orderKeys.procedureTypes,
    queryFn: orderService.getProcedureTypes,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create order mutation
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImagingOrderCreate | LabOrderCreate | ProcedureOrderCreate) =>
      orderService.createOrder(data),
    onSuccess: async (order) => {
      message.success(`Order ${order.order_number} created successfully`);
      
      // Immediately refetch all order-related queries
      await queryClient.refetchQueries({ queryKey: orderKeys.all });
      
      // Also explicitly refetch visit orders if visit data is available
      if (order.visit?.id) {
        await queryClient.refetchQueries({ queryKey: orderKeys.visit(order.visit.id) });
      }
      
      // And refetch patient orders if patient data is available
      if (order.patient?.id) {
        await queryClient.refetchQueries({ queryKey: orderKeys.patient(order.patient.id) });
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to create order';
      message.error(errorMsg);
    },
  });
};

/**
 * Update order mutation
 */
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderUpdate }) =>
      orderService.updateOrder(id, data),
    onSuccess: (order) => {
      message.success('Order updated successfully');
      
      // Invalidate specific order
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      if (order.patient_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.patient(order.patient_id) });
      }
      if (order.visit_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.visit(order.visit_id) });
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to update order';
      message.error(errorMsg);
    },
  });
};

/**
 * Update order status mutation
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderStatusUpdate }) =>
      orderService.updateOrderStatus(id, data),
    onSuccess: (order) => {
      message.success(`Order status updated to ${order.status}`);
      
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      if (order.patient_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.patient(order.patient_id) });
      }
      if (order.visit_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.visit(order.visit_id) });
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to update order status';
      message.error(errorMsg);
    },
  });
};

/**
 * Cancel order mutation
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderService.cancelOrder(id, reason),
    onSuccess: (order) => {
      message.success('Order cancelled successfully');
      
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      if (order.patient_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.patient(order.patient_id) });
      }
      if (order.visit_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.visit(order.visit_id) });
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to cancel order';
      message.error(errorMsg);
    },
  });
};

/**
 * Add order report mutation
 */
export const useAddOrderReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderReportAdd }) =>
      orderService.addOrderReport(id, data),
    onSuccess: (order) => {
      message.success('Report added successfully');
      
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      if (order.patient_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.patient(order.patient_id) });
      }
      if (order.visit_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.visit(order.visit_id) });
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to add report';
      message.error(errorMsg);
    },
  });
};

/**
 * Delete order mutation
 */
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.deleteOrder(id),
    onSuccess: () => {
      message.success('Order deleted successfully');
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to delete order';
      message.error(errorMsg);
    },
  });
};
