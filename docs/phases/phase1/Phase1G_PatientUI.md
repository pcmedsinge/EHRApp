# Phase 1G: Patient UI

**Sub-Phase:** 1G  
**Estimated Time:** 5-6 hours  
**Prerequisites:** Phase 1F Complete

---

## 1. Objective

Implement complete patient management UI with list view, create form, detail view, edit functionality, search, and pagination.

---

## 2. Deliverables

- [ ] Patient list page with table
- [ ] Patient create form with validation
- [ ] Patient detail view page
- [ ] Patient edit functionality
- [ ] Patient delete with confirmation
- [ ] Search and pagination
- [ ] Patient API service hooks
- [ ] Working end-to-end patient management

---

## 3. Files to Create

```
frontend/src/
├── services/
│   └── patientService.ts
├── hooks/
│   └── usePatients.ts
└── pages/
    ├── patients/
    │   ├── PatientList.tsx
    │   ├── PatientCreate.tsx
    │   ├── PatientDetail.tsx
    │   └── PatientEdit.tsx
    └── Dashboard.tsx (update)
```

---

## 4. Implementation

### Step 1: Patient Service

File: `frontend/src/services/patientService.ts`

```typescript
import api from './api';
import { Patient, PatientFormData, PaginatedResponse } from '@/types';

export interface PatientListParams {
  page?: number;
  size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

class PatientService {
  /**
   * Get paginated list of patients
   */
  async getPatients(params: PatientListParams = {}): Promise<PaginatedResponse<Patient>> {
    const response = await api.get<PaginatedResponse<Patient>>('/patients', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
        search: params.search,
        sort_by: params.sort_by || 'created_at',
        sort_order: params.sort_order || 'desc',
      },
    });
    return response.data;
  }

  /**
   * Get single patient by ID
   */
  async getPatient(id: string): Promise<Patient> {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  }

  /**
   * Get patient by MRN
   */
  async getPatientByMRN(mrn: string): Promise<Patient> {
    const response = await api.get<Patient>(`/patients/search/mrn/${mrn}`);
    return response.data;
  }

  /**
   * Create new patient
   */
  async createPatient(data: PatientFormData): Promise<Patient> {
    const response = await api.post<Patient>('/patients', data);
    return response.data;
  }

  /**
   * Update patient
   */
  async updatePatient(id: string, data: Partial<PatientFormData>): Promise<Patient> {
    const response = await api.put<Patient>(`/patients/${id}`, data);
    return response.data;
  }

  /**
   * Delete patient (soft delete)
   */
  async deletePatient(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  }
}

export default new PatientService();
```

---

### Step 2: Patient Hooks

File: `frontend/src/hooks/usePatients.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from 'react-query';
import patientService, { PatientListParams } from '@/services/patientService';
import { PatientFormData } from '@/types';
import { message } from 'antd';

const PATIENTS_QUERY_KEY = 'patients';

/**
 * Hook for fetching patients list
 */
export const usePatients = (params: PatientListParams = {}) => {
  return useQuery(
    [PATIENTS_QUERY_KEY, params],
    () => patientService.getPatients(params),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );
};

/**
 * Hook for fetching single patient
 */
export const usePatient = (id: string) => {
  return useQuery(
    [PATIENTS_QUERY_KEY, id],
    () => patientService.getPatient(id),
    {
      enabled: !!id,
      staleTime: 60000, // 1 minute
    }
  );
};

/**
 * Hook for creating patient
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: PatientFormData) => patientService.createPatient(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(PATIENTS_QUERY_KEY);
        message.success('Patient created successfully!');
      },
      onError: (error: any) => {
        const errorMsg = error.response?.data?.detail || 'Failed to create patient';
        message.error(errorMsg);
      },
    }
  );
};

/**
 * Hook for updating patient
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, data }: { id: string; data: Partial<PatientFormData> }) =>
      patientService.updatePatient(id, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries([PATIENTS_QUERY_KEY, variables.id]);
        queryClient.invalidateQueries(PATIENTS_QUERY_KEY);
        message.success('Patient updated successfully!');
      },
      onError: (error: any) => {
        const errorMsg = error.response?.data?.detail || 'Failed to update patient';
        message.error(errorMsg);
      },
    }
  );
};

/**
 * Hook for deleting patient
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id: string) => patientService.deletePatient(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(PATIENTS_QUERY_KEY);
        message.success('Patient deleted successfully!');
      },
      onError: (error: any) => {
        const errorMsg = error.response?.data?.detail || 'Failed to delete patient';
        message.error(errorMsg);
      },
    }
  );
};
```

---

### Step 3: Patient List Page

File: `frontend/src/pages/patients/PatientList.tsx`

```typescript
import { useState } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Card } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePatients, useDeletePatient } from '@/hooks/usePatients';
import { Patient } from '@/types';
import dayjs from 'dayjs';
import { DATE_FORMAT } from '@/config/constants';

const { Search } = Input;

const PatientList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = usePatients({ page, size: pageSize, search });
  const deletePatient = useDeletePatient();

  const handleDelete = (patient: Patient) => {
    Modal.confirm({
      title: 'Delete Patient',
      content: `Are you sure you want to delete ${patient.full_name} (${patient.mrn})?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deletePatient.mutate(patient.id),
    });
  };

  const columns = [
    {
      title: 'MRN',
      dataIndex: 'mrn',
      key: 'mrn',
      width: 150,
      render: (mrn: string) => <Tag color="blue">{mrn}</Tag>,
    },
    {
      title: 'Name',
      key: 'name',
      render: (record: Patient) => (
        <Space>
          <UserOutlined />
          {record.full_name}
        </Space>
      ),
    },
    {
      title: 'Age/Gender',
      key: 'age_gender',
      width: 120,
      render: (record: Patient) => `${record.age}Y / ${record.gender}`,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: 'Blood Group',
      dataIndex: 'blood_group',
      key: 'blood_group',
      width: 100,
      render: (blood_group: string) =>
        blood_group ? <Tag color="red">{blood_group}</Tag> : '-',
    },
    {
      title: 'Registered On',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (record: Patient) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/patients/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/patients/${record.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          Patient Management
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/patients/create')}
        >
          Add Patient
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Search
          placeholder="Search by name, MRN, or phone"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={setSearch}
          style={{ maxWidth: 400 }}
        />

        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} patients`,
            onChange: (page, size) => {
              setPage(page);
              setPageSize(size);
            },
          }}
        />
      </Space>
    </Card>
  );
};

export default PatientList;
```

---

### Step 4: Patient Create Page

File: `frontend/src/pages/patients/PatientCreate.tsx`

```typescript
import { Form, Input, DatePicker, Select, Button, Card, Row, Col, Space } from 'antd';
import { SaveOutlined, CloseOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCreatePatient } from '@/hooks/usePatients';
import { PatientFormData } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

const PatientCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const createPatient = useCreatePatient();

  const onFinish = async (values: any) => {
    // Format date
    const formData: PatientFormData = {
      ...values,
      date_of_birth: dayjs(values.date_of_birth).format('YYYY-MM-DD'),
    };

    try {
      await createPatient.mutateAsync(formData);
      navigate('/patients');
    } catch (error) {
      console.error('Create patient error:', error);
    }
  };

  return (
    <Card
      title={
        <Space>
          <UserAddOutlined />
          Register New Patient
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <h3>Personal Information</h3>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[
                { required: true, message: 'First name is required' },
                { min: 2, message: 'Minimum 2 characters' },
              ]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[
                { required: true, message: 'Last name is required' },
                { min: 2, message: 'Minimum 2 characters' },
              ]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="date_of_birth"
              label="Date of Birth"
              rules={[{ required: true, message: 'Date of birth is required' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Select date"
                disabledDate={(current) => current && current > dayjs()}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Gender is required' }]}
            >
              <Select placeholder="Select gender">
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="blood_group"
              label="Blood Group"
            >
              <Select placeholder="Select blood group" allowClear>
                <Option value="A+">A+</Option>
                <Option value="A-">A-</Option>
                <Option value="B+">B+</Option>
                <Option value="B-">B-</Option>
                <Option value="AB+">AB+</Option>
                <Option value="AB-">AB-</Option>
                <Option value="O+">O+</Option>
                <Option value="O-">O-</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <h3>Contact Information</h3>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Phone number is required' },
                { pattern: /^\d{10}$/, message: 'Enter valid 10-digit phone number' },
              ]}
            >
              <Input placeholder="10-digit phone number" maxLength={10} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: 'Enter valid email' }]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <h3>Address</h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="address_line1" label="Address Line 1">
              <Input placeholder="Street address" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="address_line2" label="Address Line 2">
              <Input placeholder="Apartment, suite, etc." />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="city" label="City">
              <Input placeholder="City" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="state" label="State">
              <Input placeholder="State" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="pincode"
              label="Pincode"
              rules={[{ pattern: /^\d{6}$/, message: 'Enter valid 6-digit pincode' }]}
            >
              <Input placeholder="6-digit pincode" maxLength={6} />
            </Form.Item>
          </Col>
        </Row>

        <h3>National IDs (Optional)</h3>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="aadhaar_number"
              label="Aadhaar Number"
              rules={[{ pattern: /^\d{12}$/, message: 'Enter valid 12-digit Aadhaar' }]}
            >
              <Input placeholder="12-digit Aadhaar" maxLength={12} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="abha_id" label="ABHA ID">
              <Input placeholder="Ayushman Bharat Health Account ID" />
            </Form.Item>
          </Col>
        </Row>

        <h3>Emergency Contact</h3>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="emergency_contact_name" label="Contact Name">
              <Input placeholder="Emergency contact person" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="emergency_contact_phone"
              label="Contact Phone"
              rules={[{ pattern: /^\d{10}$/, message: 'Enter valid 10-digit phone' }]}
            >
              <Input placeholder="10-digit phone number" maxLength={10} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createPatient.isLoading}
            >
              Save Patient
            </Button>
            <Button icon={<CloseOutlined />} onClick={() => navigate('/patients')}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PatientCreate;
```

---

### Step 5: Patient Detail Page

File: `frontend/src/pages/patients/PatientDetail.tsx`

```typescript
import { Card, Descriptions, Tag, Button, Space, Spin } from 'antd';
import { EditOutlined, LeftOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient } from '@/hooks/usePatients';
import dayjs from 'dayjs';
import { DATE_FORMAT } from '@/config/constants';

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, error } = usePatient(id!);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading patient details..." />
      </div>
    );
  }

  if (error || !patient) {
    return <Card>Patient not found</Card>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <UserOutlined />
            Patient Details
          </Space>
        }
        extra={
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => navigate('/patients')}>
              Back
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/patients/${id}/edit`)}
            >
              Edit
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="MRN">
            <Tag color="blue" style={{ fontSize: 14 }}>
              {patient.mrn}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Full Name">{patient.full_name}</Descriptions.Item>
          <Descriptions.Item label="Age / Gender">
            {patient.age} Years / {patient.gender}
          </Descriptions.Item>

          <Descriptions.Item label="Date of Birth">
            {dayjs(patient.date_of_birth).format(DATE_FORMAT)}
          </Descriptions.Item>
          <Descriptions.Item label="Blood Group">
            {patient.blood_group ? (
              <Tag color="red">{patient.blood_group}</Tag>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">{patient.phone}</Descriptions.Item>

          <Descriptions.Item label="Email" span={2}>
            {patient.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Registered On">
            {dayjs(patient.created_at).format(DATE_FORMAT)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Address Information">
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Address Line 1">
            {patient.address_line1 || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Address Line 2">
            {patient.address_line2 || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="City">{patient.city || '-'}</Descriptions.Item>
          <Descriptions.Item label="State">{patient.state || '-'}</Descriptions.Item>
          <Descriptions.Item label="Pincode">{patient.pincode || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="National IDs">
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Aadhaar Number">
            {patient.aadhaar_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="ABHA ID">
            {patient.abha_id || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Emergency Contact">
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Contact Name">
            {patient.emergency_contact_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Contact Phone">
            {patient.emergency_contact_phone || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
};

export default PatientDetail;
```

---

### Step 6: Patient Edit Page

File: `frontend/src/pages/patients/PatientEdit.tsx`

```typescript
import { useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Card, Row, Col, Space, Spin } from 'antd';
import { SaveOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient, useUpdatePatient } from '@/hooks/usePatients';
import { PatientFormData } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

const PatientEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { data: patient, isLoading } = usePatient(id!);
  const updatePatient = useUpdatePatient();

  useEffect(() => {
    if (patient) {
      form.setFieldsValue({
        ...patient,
        date_of_birth: dayjs(patient.date_of_birth),
      });
    }
  }, [patient, form]);

  const onFinish = async (values: any) => {
    const formData: Partial<PatientFormData> = {
      ...values,
      date_of_birth: dayjs(values.date_of_birth).format('YYYY-MM-DD'),
    };

    try {
      await updatePatient.mutateAsync({ id: id!, data: formData });
      navigate(`/patients/${id}`);
    } catch (error) {
      console.error('Update patient error:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading patient..." />
      </div>
    );
  }

  if (!patient) {
    return <Card>Patient not found</Card>;
  }

  return (
    <Card
      title={
        <Space>
          <EditOutlined />
          Edit Patient: {patient.full_name} ({patient.mrn})
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <h3>Personal Information</h3>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="date_of_birth"
              label="Date of Birth"
              rules={[{ required: true, message: 'Date of birth is required' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current > dayjs()}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Gender is required' }]}
            >
              <Select>
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="blood_group" label="Blood Group">
              <Select allowClear>
                <Option value="A+">A+</Option>
                <Option value="A-">A-</Option>
                <Option value="B+">B+</Option>
                <Option value="B-">B-</Option>
                <Option value="AB+">AB+</Option>
                <Option value="AB-">AB-</Option>
                <Option value="O+">O+</Option>
                <Option value="O-">O-</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <h3>Contact Information</h3>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[{ required: true, message: 'Phone number is required' }]}
            >
              <Input maxLength={10} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <h3>Address</h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="address_line1" label="Address Line 1">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="address_line2" label="Address Line 2">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="city" label="City">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="state" label="State">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="pincode" label="Pincode">
              <Input maxLength={6} />
            </Form.Item>
          </Col>
        </Row>

        <h3>Emergency Contact</h3>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="emergency_contact_name" label="Contact Name">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="emergency_contact_phone" label="Contact Phone">
              <Input maxLength={10} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={updatePatient.isLoading}
            >
              Update Patient
            </Button>
            <Button icon={<CloseOutlined />} onClick={() => navigate(`/patients/${id}`)}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PatientEdit;
```

---

### Step 7: Update App.tsx with Patient Routes

File: `frontend/src/App.tsx`

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PrivateRoute from '@/components/auth/PrivateRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import PatientList from '@/pages/patients/PatientList';
import PatientCreate from '@/pages/patients/PatientCreate';
import PatientDetail from '@/pages/patients/PatientDetail';
import PatientEdit from '@/pages/patients/PatientEdit';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loading tip="Loading application..." />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Patient routes */}
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/create" element={<PatientCreate />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/edit" element={<PatientEdit />} />
        
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
```

---

### Step 8: Update Dashboard with Patient Count

File: `frontend/src/pages/Dashboard.tsx`

```typescript
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { UserOutlined, MedicineBoxOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/usePatients';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: patientsData } = usePatients({ page: 1, size: 1 });

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Welcome, {user?.full_name}!</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Patients"
              value={patientsData?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Today's Visits"
              value={0}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              Coming in Phase 2
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Reports"
              value={0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              Coming in Phase 4
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }} title="Quick Actions">
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/patients/create')}
          >
            Register New Patient
          </Button>
          <Button icon={<UserOutlined />} onClick={() => navigate('/patients')}>
            View All Patients
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default Dashboard;
```

---

## 5. Verification Steps

```bash
# 1. Ensure backend is running with data
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Ensure frontend is running
cd frontend
npm run dev

# 3. Open browser: http://localhost:3000

# 4. Login with credentials

# 5. Test Dashboard
# - Should show patient count
# - Click "Register New Patient" button
# - Click "View All Patients" button

# 6. Test Patient List
# - Click Patients in sidebar
# - See empty table (if no patients)
# - Click "Add Patient" button

# 7. Test Create Patient
# - Fill all required fields:
#   - First Name: Amit
#   - Last Name: Patel
#   - DOB: 15/05/1990
#   - Gender: Male
#   - Phone: 9123456789
#   - City: Mumbai
#   - State: Maharashtra
# - Click "Save Patient"
# - Should redirect to patient list
# - Should see success message
# - Patient should appear in list with auto-generated MRN

# 8. Test Patient List Features
# - Search by name: Type "Amit"
# - Search by phone: Type "9123"
# - Change page size
# - Navigate between pages (if multiple patients)

# 9. Test Patient Detail
# - Click "View" button on a patient
# - Should see all patient details
# - All fields displayed correctly
# - Click "Edit" button

# 10. Test Patient Edit
# - Update phone: 9123456790
# - Update city: Delhi
# - Click "Update Patient"
# - Should redirect to detail view
# - Should see updated information

# 11. Test Patient Delete
# - Go to patient list
# - Click "Delete" button
# - Confirm deletion
# - Patient should disappear from list

# 12. Test Validation
# - Try creating patient without required fields
# - Try invalid phone (9 digits)
# - Try invalid email
# - Try invalid pincode
# - Should see validation errors

# 13. Create Multiple Patients
# - Create 5-10 patients
# - Check MRN sequence (CLI-2026-00001, CLI-2026-00002, etc.)
# - Test pagination
# - Test search

# 14. Test Navigation
# - Navigate from Dashboard → Patients → Create
# - Navigate from List → Detail → Edit → Detail → List
# - Use browser back button
# - Use sidebar navigation
```

---

## 6. Complete End-to-End Test

```bash
# Create Patient via API
TOKEN=$(curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin123!" \
  | jq -r '.access_token')

# Create patient
curl -X POST "http://localhost:8000/api/v1/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Rajesh",
    "last_name": "Kumar",
    "date_of_birth": "1985-03-20",
    "gender": "male",
    "phone": "9876543210",
    "city": "Bangalore",
    "state": "Karnataka",
    "blood_group": "B+"
  }'

# Verify in UI
# - Go to patient list
# - Should see Rajesh Kumar
# - MRN should be CLI-2026-XXXXX
```

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| Patients not loading | Check backend is running, check browser console |
| Create fails | Check validation, check backend logs |
| Search not working | Check query params in network tab |
| Pagination not working | Check page/size params |
| MRN not showing | Check backend patient model |
| Date picker not working | Check dayjs import and format |
| Form validation errors | Check field rules in form items |

---

## 8. Browser Console Checks

```javascript
// After creating patient
localStorage.getItem('ehr_token') // Should have token

// Check React Query cache
// React Query DevTools should show:
// - patients query with data
// - patient detail queries
```

---

## 9. Performance Checks

- Patient list should load < 1 second
- Search should be instant (client-side if < 1000 records)
- Create/Update should complete < 2 seconds
- No console errors
- No memory leaks
- Smooth navigation

---

## 10. Phase 1 Complete!

Congratulations! Phase 1 MVP is complete with:

- ✅ Infrastructure setup
- ✅ Backend core with FastAPI
- ✅ Authentication system
- ✅ Patient management backend
- ✅ Frontend core with React
- ✅ Authentication UI
- ✅ Patient management UI

**Next Phase:** Phase 2 - Visit Management

---

## 11. Checklist

- [ ] Patient service created
- [ ] Patient hooks implemented
- [ ] Patient list page works
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Create patient form works
- [ ] Form validation works
- [ ] Patient detail view works
- [ ] Patient edit works
- [ ] Patient delete works with confirmation
- [ ] Dashboard shows patient count
- [ ] Quick actions work
- [ ] Navigation between pages works
- [ ] All routes configured
- [ ] MRN displays correctly
- [ ] Date formatting correct
- [ ] No console errors
- [ ] API integration working
- [ ] Error handling works
- [ ] Success messages display
- [ ] Loading states work

---

*End of Phase 1G - Phase 1 Complete!*
