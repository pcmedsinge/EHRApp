# Phase 4B: Orders Frontend (5-6 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 4A Complete ✅  
**Estimated Time:** 5-6 days

---

## Objectives

Build comprehensive frontend for orders management with:
- TypeScript types for orders system
- Reusable order form components
- Order list/detail views
- Integration with Visit and Patient pages
- Real-time status tracking
- Search and filter capabilities
- Role-based access controls

---

## Deliverables

### 1. TypeScript Types

#### File: `frontend/src/types/orders.ts` (200-250 lines)

```typescript
/**
 * Orders System TypeScript Types
 */

// Enums
export enum OrderType {
  IMAGING = 'IMAGING',
  LAB = 'LAB',
  PROCEDURE = 'PROCEDURE',
}

export enum OrderStatus {
  ORDERED = 'ordered',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REPORTED = 'reported',
  CANCELLED = 'cancelled',
}

export enum OrderPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat',
}

// Base Types
export interface PatientSummary {
  id: string;
  mrn: string;
  full_name: string;
  gender: string;
  date_of_birth?: string;
}

export interface UserSummary {
  id: string;
  full_name: string;
  role: string;
}

export interface VisitSummary {
  id: string;
  visit_number: string;
  status: string;
  visit_date: string;
}

// Order Details (Type Specific)
export interface ImagingOrderDetails {
  modality: string;
  modality_name: string;
  body_part: string;
  body_part_name: string;
  laterality?: string;
  procedure_code?: string;
  procedure_name?: string;
  contrast?: boolean;
  clinical_history?: string;
}

export interface LabOrderDetails {
  test_code: string;
  test_name: string;
  specimen_type: string;
  specimen_source?: string;
  fasting_required: boolean;
  collection_date?: string;
  panel?: string[];
}

export interface ProcedureOrderDetails {
  procedure_code: string;
  procedure_name: string;
  procedure_type?: string;
  anesthesia_required: boolean;
  estimated_duration?: number;
  pre_procedure_instructions?: string;
}

export type OrderDetails = ImagingOrderDetails | LabOrderDetails | ProcedureOrderDetails;

// Main Order Interface
export interface Order {
  id: string;
  order_number: string;
  accession_number?: string;
  order_type: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  patient: PatientSummary;
  visit: VisitSummary;
  ordered_by: UserSummary;
  order_details: OrderDetails;
  clinical_indication: string;
  special_instructions?: string;
  notes?: string;
  ordered_date: string;
  scheduled_date?: string;
  performed_date?: string;
  reported_date?: string;
  cancelled_date?: string;
  cancellation_reason?: string;
  performing_user?: UserSummary;
  reporting_user?: UserSummary;
  report_text?: string;
  findings?: string;
  impression?: string;
  result_status?: string;
  created_at: string;
  updated_at: string;
}

// Create Types
export interface ImagingOrderCreate {
  order_type: OrderType.IMAGING;
  priority: OrderPriority;
  clinical_indication: string;
  special_instructions?: string;
  modality: string;
  body_part: string;
  laterality?: string;
  procedure_code?: string;
  contrast?: boolean;
  clinical_history?: string;
}

export interface LabOrderCreate {
  order_type: OrderType.LAB;
  priority: OrderPriority;
  clinical_indication: string;
  special_instructions?: string;
  test_code: string;
  specimen_type: string;
  fasting_required: boolean;
  collection_date?: string;
}

export interface ProcedureOrderCreate {
  order_type: OrderType.PROCEDURE;
  priority: OrderPriority;
  clinical_indication: string;
  special_instructions?: string;
  procedure_code: string;
  anesthesia_required: boolean;
  estimated_duration?: number;
  pre_procedure_instructions?: string;
}

export type OrderCreate = ImagingOrderCreate | LabOrderCreate | ProcedureOrderCreate;

// Update Types
export interface OrderUpdate {
  scheduled_date?: string;
  special_instructions?: string;
  notes?: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  notes?: string;
}

export interface OrderReportAdd {
  report_text: string;
  findings: string;
  impression: string;
  result_status?: string;
}

// Reference Data
export interface ImagingModality {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface BodyPart {
  id: string;
  code: string;
  name: string;
  applicable_modalities: string[];
}

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: string;
  specimen_type: string;
  fasting_required: boolean;
  tat_hours?: number;
}

export interface ProcedureType {
  id: string;
  code: string;
  name: string;
  category: string;
  requires_consent: boolean;
  estimated_duration?: number;
}

// Filter Types
export interface OrderFilters {
  order_type?: OrderType;
  status?: OrderStatus;
  patient_id?: string;
  visit_id?: string;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}
```

---

### 2. API Service

#### File: `frontend/src/services/orderService.ts` (200-250 lines)

```typescript
import api from './api';
import {
  Order,
  OrderCreate,
  OrderUpdate,
  OrderStatusUpdate,
  OrderReportAdd,
  OrderFilters,
  ImagingModality,
  BodyPart,
  LabTest,
  ProcedureType,
} from '../types/orders';

class OrderService {
  // Create Order
  async createOrder(
    data: OrderCreate,
    patientId: string,
    visitId: string
  ): Promise<Order> {
    const response = await api.post<Order>('/orders/', data, {
      params: { patient_id: patientId, visit_id: visitId },
    });
    return response.data;
  }

  // Get Orders
  async listOrders(filters?: OrderFilters): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/', {
      params: filters,
    });
    return response.data;
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  }

  async getPatientOrders(patientId: string, orderType?: string): Promise<Order[]> {
    const response = await api.get<Order[]>(`/orders/patient/${patientId}`, {
      params: { order_type: orderType },
    });
    return response.data;
  }

  async getVisitOrders(visitId: string, orderType?: string): Promise<Order[]> {
    const response = await api.get<Order[]>(`/orders/visit/${visitId}`, {
      params: { order_type: orderType },
    });
    return response.data;
  }

  // Update Order
  async updateOrder(orderId: string, data: OrderUpdate): Promise<Order> {
    const response = await api.put<Order>(`/orders/${orderId}`, data);
    return response.data;
  }

  async updateOrderStatus(
    orderId: string,
    data: OrderStatusUpdate
  ): Promise<Order> {
    const response = await api.patch<Order>(`/orders/${orderId}/status`, data);
    return response.data;
  }

  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const response = await api.post<Order>(`/orders/${orderId}/cancel`, null, {
      params: { reason },
    });
    return response.data;
  }

  async addReport(orderId: string, data: OrderReportAdd): Promise<Order> {
    const response = await api.post<Order>(`/orders/${orderId}/report`, data);
    return response.data;
  }

  // Delete Order
  async deleteOrder(orderId: string): Promise<void> {
    await api.delete(`/orders/${orderId}`);
  }

  // Search
  async searchByAccession(accessionNumber: string): Promise<Order> {
    const response = await api.get<Order>(
      `/orders/search/accession/${accessionNumber}`
    );
    return response.data;
  }

  async searchByOrderNumber(orderNumber: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/search/number/${orderNumber}`);
    return response.data;
  }

  // Reference Data
  async getModalities(): Promise<ImagingModality[]> {
    const response = await api.get<ImagingModality[]>('/orders/modalities/list');
    return response.data;
  }

  async getBodyParts(): Promise<BodyPart[]> {
    const response = await api.get<BodyPart[]>('/orders/body-parts/list');
    return response.data;
  }

  async getLabTests(): Promise<LabTest[]> {
    const response = await api.get<LabTest[]>('/orders/lab-tests/list');
    return response.data;
  }

  async getProcedureTypes(): Promise<ProcedureType[]> {
    const response = await api.get<ProcedureType[]>('/orders/procedures/list');
    return response.data;
  }
}

export default new OrderService();
```

---

### 3. React Query Hooks

#### File: `frontend/src/hooks/useOrders.ts` (200-250 lines)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import orderService from '../services/orderService';
import {
  Order,
  OrderCreate,
  OrderUpdate,
  OrderStatusUpdate,
  OrderReportAdd,
  OrderFilters,
} from '../types/orders';

// Query Keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters?: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  patient: (patientId: string) => [...orderKeys.all, 'patient', patientId] as const,
  visit: (visitId: string) => [...orderKeys.all, 'visit', visitId] as const,
  modalities: ['modalities'] as const,
  bodyParts: ['bodyParts'] as const,
  labTests: ['labTests'] as const,
  procedures: ['procedures'] as const,
};

// List Orders
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => orderService.listOrders(filters),
  });
};

// Get Single Order
export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderService.getOrder(orderId),
    enabled: !!orderId,
  });
};

// Patient Orders
export const usePatientOrders = (patientId: string, orderType?: string) => {
  return useQuery({
    queryKey: orderKeys.patient(patientId),
    queryFn: () => orderService.getPatientOrders(patientId, orderType),
    enabled: !!patientId,
  });
};

// Visit Orders
export const useVisitOrders = (visitId: string, orderType?: string) => {
  return useQuery({
    queryKey: orderKeys.visit(visitId),
    queryFn: () => orderService.getVisitOrders(visitId, orderType),
    enabled: !!visitId,
  });
};

// Create Order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      patientId,
      visitId,
    }: {
      data: OrderCreate;
      patientId: string;
      visitId: string;
    }) => orderService.createOrder(data, patientId, visitId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.visit(data.visit.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.patient(data.patient.id) });
      message.success(`Order ${data.order_number} created successfully`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to create order');
    },
  });
};

// Update Order
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderUpdate }) =>
      orderService.updateOrder(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      message.success('Order updated successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to update order');
    },
  });
};

// Update Order Status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderStatusUpdate }) =>
      orderService.updateOrderStatus(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      message.success('Order status updated');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to update status');
    },
  });
};

// Cancel Order
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderService.cancelOrder(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      message.success('Order cancelled');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to cancel order');
    },
  });
};

// Add Report
export const useAddReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderReportAdd }) =>
      orderService.addReport(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      message.success('Report added successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to add report');
    },
  });
};

// Delete Order
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      message.success('Order deleted');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to delete order');
    },
  });
};

// Reference Data Hooks
export const useModalities = () => {
  return useQuery({
    queryKey: orderKeys.modalities,
    queryFn: () => orderService.getModalities(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useBodyParts = () => {
  return useQuery({
    queryKey: orderKeys.bodyParts,
    queryFn: () => orderService.getBodyParts(),
    staleTime: 1000 * 60 * 60,
  });
};

export const useLabTests = () => {
  return useQuery({
    queryKey: orderKeys.labTests,
    queryFn: () => orderService.getLabTests(),
    staleTime: 1000 * 60 * 60,
  });
};

export const useProcedureTypes = () => {
  return useQuery({
    queryKey: orderKeys.procedures,
    queryFn: () => orderService.getProcedureTypes(),
    staleTime: 1000 * 60 * 60,
  });
};
```

---

### 4. Order Components

#### File: `frontend/src/components/orders/OrderFormModal.tsx` (400-500 lines)

```tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Radio,
  Switch,
  DatePicker,
  Typography,
  Space,
  Divider,
} from 'antd';
import {
  OrderType,
  OrderPriority,
  OrderCreate,
  ImagingOrderCreate,
  LabOrderCreate,
  ProcedureOrderCreate,
} from '../../types/orders';
import {
  useModalities,
  useBodyParts,
  useLabTests,
  useProcedureTypes,
  useCreateOrder,
} from '../../hooks/useOrders';

const { TextArea } = Input;
const { Text } = Typography;

interface OrderFormModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  visitId: string;
  patientName: string;
  patientMRN: string;
  patientGender?: string;
  patientDateOfBirth?: string;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({
  visible,
  onClose,
  patientId,
  visitId,
  patientName,
  patientMRN,
  patientGender,
  patientDateOfBirth,
}) => {
  const [form] = Form.useForm();
  const [orderType, setOrderType] = useState<OrderType>(OrderType.IMAGING);

  const { data: modalities } = useModalities();
  const { data: bodyParts } = useBodyParts();
  const { data: labTests } = useLabTests();
  const { data: procedureTypes } = useProcedureTypes();

  const createOrder = useCreateOrder();

  // Calculate age
  const age = patientDateOfBirth
    ? new Date().getFullYear() - new Date(patientDateOfBirth).getFullYear()
    : null;
  const genderDisplay = patientGender
    ? `${patientGender.charAt(0).toUpperCase()}${patientGender.slice(1)}`
    : null;
  const patientInfo =
    age && genderDisplay
      ? `${patientName} (${genderDisplay}, ${age}y) [MRN: ${patientMRN}]`
      : `${patientName} [MRN: ${patientMRN}]`;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createOrder.mutateAsync({
        data: values as OrderCreate,
        patientId,
        visitId,
      });
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Filter body parts by selected modality
  const [filteredBodyParts, setFilteredBodyParts] = useState(bodyParts);
  const selectedModality = Form.useWatch('modality', form);

  useEffect(() => {
    if (selectedModality && bodyParts) {
      setFilteredBodyParts(
        bodyParts.filter((part) =>
          part.applicable_modalities.includes(selectedModality)
        )
      );
    } else {
      setFilteredBodyParts(bodyParts);
    }
  }, [selectedModality, bodyParts]);

  return (
    <Modal
      title={`Create Order - ${patientInfo}`}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={createOrder.isPending}
      width={700}
      okText="Create Order"
    >
      <Form form={form} layout="vertical" initialValues={{ priority: OrderPriority.ROUTINE }}>
        {/* Order Type */}
        <Form.Item
          name="order_type"
          label="Order Type"
          rules={[{ required: true }]}
          initialValue={OrderType.IMAGING}
        >
          <Radio.Group onChange={(e) => setOrderType(e.target.value)}>
            <Radio.Button value={OrderType.IMAGING}>Imaging</Radio.Button>
            <Radio.Button value={OrderType.LAB}>Lab</Radio.Button>
            <Radio.Button value={OrderType.PROCEDURE}>Procedure</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Priority */}
        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value={OrderPriority.ROUTINE}>Routine</Select.Option>
            <Select.Option value={OrderPriority.URGENT}>Urgent</Select.Option>
            <Select.Option value={OrderPriority.STAT}>STAT</Select.Option>
          </Select>
        </Form.Item>

        <Divider />

        {/* Type-Specific Fields */}
        {orderType === OrderType.IMAGING && (
          <>
            <Form.Item
              name="modality"
              label="Modality"
              rules={[{ required: true, message: 'Please select modality' }]}
            >
              <Select placeholder="Select modality" showSearch>
                {modalities?.map((mod) => (
                  <Select.Option key={mod.code} value={mod.code}>
                    {mod.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="body_part"
              label="Body Part"
              rules={[{ required: true, message: 'Please select body part' }]}
            >
              <Select placeholder="Select body part" showSearch>
                {filteredBodyParts?.map((part) => (
                  <Select.Option key={part.code} value={part.code}>
                    {part.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="laterality" label="Laterality">
              <Select placeholder="Select laterality" allowClear>
                <Select.Option value="left">Left</Select.Option>
                <Select.Option value="right">Right</Select.Option>
                <Select.Option value="bilateral">Bilateral</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="contrast" label="Contrast" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        )}

        {orderType === OrderType.LAB && (
          <>
            <Form.Item
              name="test_code"
              label="Lab Test"
              rules={[{ required: true, message: 'Please select test' }]}
            >
              <Select placeholder="Select test" showSearch>
                {labTests?.map((test) => (
                  <Select.Option key={test.code} value={test.code}>
                    {test.name} ({test.category})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="specimen_type"
              label="Specimen Type"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select specimen type">
                <Select.Option value="Blood">Blood</Select.Option>
                <Select.Option value="Urine">Urine</Select.Option>
                <Select.Option value="Stool">Stool</Select.Option>
                <Select.Option value="Sputum">Sputum</Select.Option>
                <Select.Option value="CSF">CSF</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="fasting_required" label="Fasting Required" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="collection_date" label="Collection Date">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        {orderType === OrderType.PROCEDURE && (
          <>
            <Form.Item
              name="procedure_code"
              label="Procedure"
              rules={[{ required: true, message: 'Please select procedure' }]}
            >
              <Select placeholder="Select procedure" showSearch>
                {procedureTypes?.map((proc) => (
                  <Select.Option key={proc.code} value={proc.code}>
                    {proc.name} ({proc.category})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="anesthesia_required" label="Anesthesia Required" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="estimated_duration" label="Estimated Duration (minutes)">
              <Input type="number" placeholder="30" />
            </Form.Item>

            <Form.Item name="pre_procedure_instructions" label="Pre-Procedure Instructions">
              <TextArea rows={2} placeholder="NPO after midnight..." />
            </Form.Item>
          </>
        )}

        <Divider />

        {/* Common Fields */}
        <Form.Item
          name="clinical_indication"
          label="Clinical Indication"
          rules={[
            { required: true, message: 'Please provide clinical indication' },
            { min: 10, message: 'Minimum 10 characters required' },
          ]}
        >
          <TextArea rows={3} placeholder="Reason for this order..." />
        </Form.Item>

        <Form.Item name="special_instructions" label="Special Instructions">
          <TextArea rows={2} placeholder="Any special instructions..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OrderFormModal;
```

#### File: `frontend/src/components/orders/OrdersList.tsx` (300-350 lines)

```tsx
import React, { useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Dropdown,
  Typography,
  Card,
  Select,
  Input,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EllipsisOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Order, OrderType, OrderStatus, OrderPriority } from '../../types/orders';
import { useVisitOrders } from '../../hooks/useOrders';
import OrderFormModal from './OrderFormModal';
import OrderDetailModal from './OrderDetailModal';

const { Text } = Typography;

interface OrdersListProps {
  visitId: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  patientGender?: string;
  patientDateOfBirth?: string;
}

const OrdersList: React.FC<OrdersListProps> = ({
  visitId,
  patientId,
  patientName,
  patientMRN,
  patientGender,
  patientDateOfBirth,
}) => {
  const [formVisible, setFormVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [typeFilter, setTypeFilter] = useState<OrderType | undefined>();

  const { data: orders, isLoading } = useVisitOrders(visitId, typeFilter);

  // Status Colors
  const statusColors: Record<OrderStatus, string> = {
    [OrderStatus.ORDERED]: 'blue',
    [OrderStatus.SCHEDULED]: 'cyan',
    [OrderStatus.IN_PROGRESS]: 'orange',
    [OrderStatus.COMPLETED]: 'green',
    [OrderStatus.REPORTED]: 'purple',
    [OrderStatus.CANCELLED]: 'red',
  };

  // Priority Colors
  const priorityColors: Record<OrderPriority, string> = {
    [OrderPriority.ROUTINE]: 'default',
    [OrderPriority.URGENT]: 'orange',
    [OrderPriority.STAT]: 'red',
  };

  // Table Columns
  const columns: ColumnsType<Order> = [
    {
      title: 'Order #',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 150,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Accession #',
      dataIndex: 'accession_number',
      key: 'accession_number',
      width: 150,
      render: (text: string) => <Text copyable>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 100,
      render: (type: OrderType) => (
        <Tag color={type === OrderType.IMAGING ? 'blue' : type === OrderType.LAB ? 'green' : 'purple'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'order_details',
      key: 'order_details',
      render: (_: any, record: Order) => {
        if (record.order_type === OrderType.IMAGING) {
          const details = record.order_details as any;
          return `${details.modality_name} - ${details.body_part_name}`;
        } else if (record.order_type === OrderType.LAB) {
          const details = record.order_details as any;
          return details.test_name;
        } else {
          const details = record.order_details as any;
          return details.procedure_name;
        }
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: OrderPriority) => (
        <Tag color={priorityColors[priority]}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => (
        <Tag color={statusColors[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Ordered Date',
      dataIndex: 'ordered_date',
      key: 'ordered_date',
      width: 150,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Ordered By',
      dataIndex: 'ordered_by',
      key: 'ordered_by',
      width: 150,
      render: (user: any) => user.full_name,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_: any, record: Order) => (
        <Button
          type="text"
          icon={<EllipsisOutlined />}
          onClick={() => {
            setSelectedOrder(record);
            setDetailVisible(true);
          }}
        />
      ),
    },
  ];

  return (
    <Card>
      {/* Header */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFormVisible(true)}
            >
              Create Order
            </Button>
          </Space>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Space>
            <Select
              placeholder="Filter by type"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setTypeFilter(value)}
            >
              <Select.Option value={OrderType.IMAGING}>Imaging</Select.Option>
              <Select.Option value={OrderType.LAB}>Lab</Select.Option>
              <Select.Option value={OrderType.PROCEDURE}>Procedure</Select.Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={orders}
        loading={isLoading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} orders`,
        }}
        scroll={{ x: 1400 }}
      />

      {/* Modals */}
      <OrderFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        patientId={patientId}
        visitId={visitId}
        patientName={patientName}
        patientMRN={patientMRN}
        patientGender={patientGender}
        patientDateOfBirth={patientDateOfBirth}
      />

      {selectedOrder && (
        <OrderDetailModal
          visible={detailVisible}
          onClose={() => {
            setDetailVisible(false);
            setSelectedOrder(null);
          }}
          orderId={selectedOrder.id}
        />
      )}
    </Card>
  );
};

export default OrdersList;
```

#### File: `frontend/src/components/orders/OrderDetailModal.tsx` (400-500 lines)

Include:
- Order details display
- Status timeline
- Status update form
- Cancel order form
- Report add form (for radiologist/doctor)
- Order history/audit trail

---

### 5. Integration with Visit Detail

#### File: `frontend/src/pages/visits/VisitDetail.tsx` (update)

```tsx
// Add Orders tab
import OrdersList from '../../components/orders/OrdersList';

// In TabPane
<TabPane tab="Orders" key="orders">
  <OrdersList
    visitId={visitId}
    patientId={visit.patient.id}
    patientName={visit.patient.full_name}
    patientMRN={visit.patient.mrn}
    patientGender={visit.patient.gender}
    patientDateOfBirth={visit.patient.date_of_birth}
  />
</TabPane>
```

---

### 6. Integration with Patient Detail

#### File: `frontend/src/pages/patients/PatientDetail.tsx` (update)

```tsx
// Add Order History tab
<TabPane tab="Order History" key="orders">
  <PatientOrderHistory patientId={patientId} />
</TabPane>
```

---

## Verification Steps

### 1. Run Frontend
```bash
cd frontend
npm start
```

### 2. Test Scenarios

✅ **Create Imaging Order**
1. Navigate to Visit Detail page
2. Click Orders tab
3. Click "Create Order"
4. Select Imaging
5. Select XRAY → Chest → Bilateral
6. Enter clinical indication
7. Click "Create Order"
8. Verify order appears in list with ORD-2026-XXXXX

✅ **Create Lab Order**
1. Click "Create Order"
2. Select Lab
3. Select CBC test
4. Select Blood specimen
5. Click "Create Order"
6. Verify order created

✅ **Filter Orders**
1. Use type filter dropdown
2. Select "Imaging"
3. Verify only imaging orders shown

✅ **View Order Details**
1. Click ellipsis button on order row
2. Verify modal shows complete order details
3. Verify patient context in modal title

✅ **Update Order Status**
1. Open order detail modal
2. Update status to "scheduled"
3. Add notes
4. Click Update
5. Verify status changed

✅ **Cancel Order**
1. Open order detail modal
2. Click "Cancel Order"
3. Enter cancellation reason
4. Confirm
5. Verify order status = cancelled

---

## Completion Checklist

- [ ] TypeScript types created for all order entities
- [ ] Order service with all API methods
- [ ] React Query hooks for all operations
- [ ] OrderFormModal with type-specific fields
- [ ] OrdersList component with filters
- [ ] OrderDetailModal with status management
- [ ] Integration with VisitDetail page
- [ ] Integration with PatientDetail page
- [ ] Patient context in all modal titles
- [ ] Reference data loading (modalities, tests, etc.)
- [ ] Form validation working
- [ ] Status colors and badges
- [ ] Priority colors and badges
- [ ] Date formatting consistent
- [ ] Search functionality
- [ ] Filter functionality
- [ ] Pagination working
- [ ] Loading states
- [ ] Error handling
- [ ] Success messages

---

## Next Phase

Once Phase 4B is complete:
→ **Phase 4C: Integration & Testing** (2-3 days)

---

**Status:** Ready to implement  
**Estimated Completion:** February 18-19, 2026
