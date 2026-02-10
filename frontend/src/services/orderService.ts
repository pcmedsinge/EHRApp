/**
 * Orders API Service
 * Phase: 4B (Orders Frontend)
 */

import api from './api';
import type {
  Order,
  ImagingOrderCreate,
  LabOrderCreate,
  ProcedureOrderCreate,
  OrderUpdate,
  OrderStatusUpdate,
  OrderReportAdd,
  ImagingModality,
  BodyPart,
  LabTest,
  ProcedureType,
  OrderFilters,
} from '@/types/orders';

const BASE_URL = '/orders';

// ============================================================================
// ORDER CRUD OPERATIONS
// ============================================================================

export const createOrder = async (
  data: ImagingOrderCreate | LabOrderCreate | ProcedureOrderCreate
): Promise<Order> => {
  const response = await api.post<Order>(`${BASE_URL}/`, data);
  return response.data;
};

export const getOrders = async (filters?: OrderFilters): Promise<Order[]> => {
  const response = await api.get<Order[]>(BASE_URL, { params: filters });
  return response.data;
};

export const getOrder = async (orderId: string): Promise<Order> => {
  const response = await api.get<Order>(`${BASE_URL}/${orderId}`);
  return response.data;
};

export const updateOrder = async (orderId: string, data: OrderUpdate): Promise<Order> => {
  const response = await api.put<Order>(`${BASE_URL}/${orderId}`, data);
  return response.data;
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  await api.delete(`${BASE_URL}/${orderId}`);
};

// ============================================================================
// ORDER STATUS MANAGEMENT
// ============================================================================

export const updateOrderStatus = async (
  orderId: string,
  data: OrderStatusUpdate
): Promise<Order> => {
  const response = await api.patch<Order>(`${BASE_URL}/${orderId}/status`, data);
  return response.data;
};

export const cancelOrder = async (orderId: string, reason: string): Promise<Order> => {
  const response = await api.post<Order>(`${BASE_URL}/${orderId}/cancel`, {
    cancellation_reason: reason,
  });
  return response.data;
};

export const addOrderReport = async (
  orderId: string,
  data: OrderReportAdd
): Promise<Order> => {
  const response = await api.post<Order>(`${BASE_URL}/${orderId}/report`, data);
  return response.data;
};

// ============================================================================
// ORDER SEARCH AND QUERIES
// ============================================================================

export const getOrderByAccession = async (accessionNumber: string): Promise<Order> => {
  const response = await api.get<Order>(`${BASE_URL}/search/accession/${accessionNumber}`);
  return response.data;
};

export const getOrderByNumber = async (orderNumber: string): Promise<Order> => {
  const response = await api.get<Order>(`${BASE_URL}/search/number/${orderNumber}`);
  return response.data;
};

export const getPatientOrders = async (patientId: string): Promise<Order[]> => {
  const response = await api.get<Order[]>(`${BASE_URL}/patient/${patientId}`);
  return response.data;
};

export const getVisitOrders = async (visitId: string): Promise<Order[]> => {
  const response = await api.get<Order[]>(`${BASE_URL}/visit/${visitId}`);
  return response.data;
};

// ============================================================================
// REFERENCE DATA
// ============================================================================

export const getImagingModalities = async (): Promise<ImagingModality[]> => {
  const response = await api.get<ImagingModality[]>(`${BASE_URL}/modalities/list`);
  return response.data;
};

export const getBodyParts = async (): Promise<BodyPart[]> => {
  const response = await api.get<BodyPart[]>(`${BASE_URL}/body-parts/list`);
  return response.data;
};

export const getLabTests = async (): Promise<LabTest[]> => {
  const response = await api.get<LabTest[]>(`${BASE_URL}/lab-tests/list`);
  return response.data;
};

export const getProcedureTypes = async (): Promise<ProcedureType[]> => {
  const response = await api.get<ProcedureType[]>(`${BASE_URL}/procedures/list`);
  return response.data;
};
