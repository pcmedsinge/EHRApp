# Phase 3D: Diagnosis Frontend (4-5 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 3C Complete  
**Estimated Time:** 4-5 days

---

## Objectives

Build intuitive diagnosis UI with **FULLY FUNCTIONAL ICD-10 search/autocomplete** and flexible workflow supporting both coded and non-coded diagnoses.

**Key Features:**
- Smart ICD-10 autocomplete with debounced search
- Dual entry modes (ICD-10 coded vs Free text)
- One-click toggle between modes
- Diagnosis history with filtering
- Primary/secondary diagnosis management

---

## Deliverables

### 1. TypeScript Types
**File:** `frontend/src/types/diagnosis.ts`

```typescript
export interface ICD10Code {
  code: string;
  description: string;
  category: string;
  subcategory?: string;
  usage_count: number;
  common_in_india: boolean;
}

export interface Diagnosis {
  id: string;
  visit_id: string;
  patient_id: string;
  diagnosed_by: string;
  
  // ICD-10 (optional)
  icd10_code?: string;
  
  // Description (required)
  diagnosis_description: string;
  
  // Metadata
  diagnosis_type: 'primary' | 'secondary';
  status: 'provisional' | 'confirmed';
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  diagnosed_date: string;
  onset_date?: string;
  clinical_notes?: string;
  
  created_at: string;
  updated_at: string;
}

export interface DiagnosisCreateData {
  visit_id: string;
  patient_id: string;
  icd10_code?: string;
  diagnosis_description: string;
  diagnosis_type: 'primary' | 'secondary';
  status: 'provisional' | 'confirmed';
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  diagnosed_date?: string;
  onset_date?: string;
  clinical_notes?: string;
}

export interface DiagnosisUpdateData extends Partial<DiagnosisCreateData> {}

// Helper for ICD-10 search
export interface ICD10SearchParams {
  q: string;
  limit?: number;
}

export interface ICD10PopularParams {
  limit?: number;
  category?: string;
}
```

---

### 2. API Service
**File:** `frontend/src/services/diagnosisService.ts`

```typescript
import { api } from './api';
import { 
  Diagnosis, 
  DiagnosisCreateData, 
  DiagnosisUpdateData,
  ICD10Code,
  ICD10SearchParams,
  ICD10PopularParams
} from '@/types/diagnosis';

class DiagnosisService {
  /**
   * ICD-10 Search Operations
   */
  async searchICD10(params: ICD10SearchParams): Promise<ICD10Code[]> {
    const response = await api.get<ICD10Code[]>('/diagnoses/icd10/search', {
      params: { q: params.q, limit: params.limit || 20 }
    });
    return response.data;
  }

  async getICD10Details(code: string): Promise<ICD10Code> {
    const response = await api.get<ICD10Code>(`/diagnoses/icd10/${code}`);
    return response.data;
  }

  async getPopularICD10(params?: ICD10PopularParams): Promise<ICD10Code[]> {
    const response = await api.get<ICD10Code[]>('/diagnoses/icd10/popular', {
      params: { limit: params?.limit || 50, category: params?.category }
    });
    return response.data;
  }

  /**
   * Diagnosis CRUD Operations
   */
  async createDiagnosis(data: DiagnosisCreateData): Promise<Diagnosis> {
    const response = await api.post<Diagnosis>('/diagnoses/', data);
    return response.data;
  }

  async getVisitDiagnoses(visitId: string): Promise<Diagnosis[]> {
    const response = await api.get<Diagnosis[]>(`/diagnoses/visit/${visitId}`);
    return response.data;
  }

  async getPatientDiagnoses(patientId: string): Promise<Diagnosis[]> {
    const response = await api.get<Diagnosis[]>(`/diagnoses/patient/${patientId}`);
    return response.data;
  }

  async updateDiagnosis(id: string, data: DiagnosisUpdateData): Promise<Diagnosis> {
    const response = await api.put<Diagnosis>(`/diagnoses/${id}`, data);
    return response.data;
  }

  async deleteDiagnosis(id: string): Promise<void> {
    await api.delete(`/diagnoses/${id}`);
  }
}

export const diagnosisService = new DiagnosisService();
```

---

### 3. React Query Hooks
**File:** `frontend/src/hooks/useDiagnosis.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { diagnosisService } from '@/services/diagnosisService';
import { 
  DiagnosisCreateData, 
  DiagnosisUpdateData,
  ICD10SearchParams 
} from '@/types/diagnosis';

// Query keys
export const diagnosisKeys = {
  all: ['diagnoses'] as const,
  visit: (visitId: string) => ['diagnoses', 'visit', visitId] as const,
  patient: (patientId: string) => ['diagnoses', 'patient', patientId] as const,
  icd10Search: (query: string) => ['icd10', 'search', query] as const,
  icd10Popular: ['icd10', 'popular'] as const,
};

/**
 * ICD-10 Search Hook
 */
export const useICD10Search = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: diagnosisKeys.icd10Search(query),
    queryFn: () => diagnosisService.searchICD10({ q: query }),
    enabled: enabled && query.length >= 2, // Only search if 2+ characters
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Popular ICD-10 Codes Hook
 */
export const usePopularICD10 = () => {
  return useQuery({
    queryKey: diagnosisKeys.icd10Popular,
    queryFn: () => diagnosisService.getPopularICD10({ limit: 20 }),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });
};

/**
 * Visit Diagnoses Hook
 */
export const useVisitDiagnoses = (visitId: string) => {
  return useQuery({
    queryKey: diagnosisKeys.visit(visitId),
    queryFn: () => diagnosisService.getVisitDiagnoses(visitId),
    enabled: !!visitId,
  });
};

/**
 * Patient Diagnosis History Hook
 */
export const usePatientDiagnosisHistory = (patientId: string) => {
  return useQuery({
    queryKey: diagnosisKeys.patient(patientId),
    queryFn: () => diagnosisService.getPatientDiagnoses(patientId),
    enabled: !!patientId,
  });
};

/**
 * Create Diagnosis Mutation
 */
export const useCreateDiagnosis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DiagnosisCreateData) => diagnosisService.createDiagnosis(data),
    onSuccess: (diagnosis) => {
      message.success('Diagnosis added successfully');
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.visit(diagnosis.visit_id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.patient(diagnosis.patient_id) });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to add diagnosis';
      message.error(errorMsg);
    },
  });
};

/**
 * Update Diagnosis Mutation
 */
export const useUpdateDiagnosis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DiagnosisUpdateData }) =>
      diagnosisService.updateDiagnosis(id, data),
    onSuccess: (diagnosis) => {
      message.success('Diagnosis updated successfully');
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.visit(diagnosis.visit_id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.patient(diagnosis.patient_id) });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to update diagnosis');
    },
  });
};

/**
 * Delete Diagnosis Mutation
 */
export const useDeleteDiagnosis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => diagnosisService.deleteDiagnosis(id),
    onSuccess: () => {
      message.success('Diagnosis deleted successfully');
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.all });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to delete diagnosis');
    },
  });
};
```

---

### 4. ICD-10 Search Component (FULLY FUNCTIONAL)
**File:** `frontend/src/components/diagnosis/ICD10Search.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { AutoComplete, Tag, Spin, Typography, Space, Divider } from 'antd';
import { SearchOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { diagnosisService } from '@/services/diagnosisService';
import { ICD10Code } from '@/types/diagnosis';

const { Text } = Typography;

interface ICD10SearchProps {
  value?: string;
  onSelect: (code: string, description: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ICD10Search: React.FC<ICD10SearchProps> = ({
  value,
  onSelect,
  placeholder = "Search by disease name or code (e.g., 'diabetes' or 'E11')",
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICD10Code[]>([]);
  const [popularCodes, setPopularCodes] = useState<ICD10Code[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  // Load popular codes on mount
  useEffect(() => {
    const loadPopular = async () => {
      try {
        const codes = await diagnosisService.getPopularICD10({ limit: 10 });
        setPopularCodes(codes);
      } catch (error) {
        console.error('Failed to load popular codes:', error);
      }
    };
    loadPopular();
  }, []);

  // Search ICD-10 codes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchICD10(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const searchICD10 = async (q: string) => {
    setLoading(true);
    try {
      const data = await diagnosisService.searchICD10({ q, limit: 20 });
      setResults(data);
    } catch (error) {
      console.error('ICD-10 search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (selectedCode: string, option: any) => {
    onSelect(selectedCode, option.description);
    setQuery('');
  };

  const renderOption = (item: ICD10Code) => ({
    value: item.code,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
        <Tag color="blue" style={{ marginRight: 8 }}>
          {item.code}
        </Tag>
        <Text style={{ flex: 1 }}>
          {highlightMatch(item.description, query)}
        </Text>
        {item.common_in_india && (
          <Tag color="green" style={{ marginLeft: 8 }}>
            Common
          </Tag>
        )}
      </div>
    ),
    description: item.description,
  });

  const options = query.length >= 2 && results.length > 0
    ? results.map(renderOption)
    : popularCodes.length > 0
    ? [
        {
          label: (
            <div style={{ padding: '8px 0' }}>
              <Text type="secondary">Popular Diagnoses</Text>
            </div>
          ),
          options: popularCodes.map(renderOption),
        },
      ]
    : [];

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={setQuery}
      onSelect={handleSelect}
      placeholder={placeholder}
      disabled={disabled}
      style={{ width: '100%' }}
      notFoundContent={
        loading ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin size="small" />
          </div>
        ) : query.length >= 2 ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Text type="secondary">No matching codes found</Text>
          </div>
        ) : null
      }
      suffixIcon={loading ? <Spin size="small" /> : <SearchOutlined />}
    />
  );
};

// Helper to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <Text key={i} strong style={{ backgroundColor: '#fff3cd' }}>
            {part}
          </Text>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
```

---

### 5. Diagnosis Form Component (Dual Mode)
**File:** `frontend/src/components/diagnosis/DiagnosisForm.tsx`

```typescript
import React, { useState } from 'react';
import {
  Form,
  Input,
  Radio,
  Select,
  DatePicker,
  Button,
  Alert,
  Divider,
  Space,
  Typography,
  Card
} from 'antd';
import { CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ICD10Search } from './ICD10Search';
import { DiagnosisCreateData } from '@/types/diagnosis';

const { TextArea } = Input;
const { Text } = Typography;

interface DiagnosisFormProps {
  visitId: string;
  patientId: string;
  hasPrimaryDiagnosis?: boolean;
  onSubmit: (data: DiagnosisCreateData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  visitId,
  patientId,
  hasPrimaryDiagnosis = false,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [useICD10, setUseICD10] = useState(true);
  const [selectedICD10, setSelectedICD10] = useState<{ code: string; description: string } | null>(null);

  const handleICD10Select = (code: string, description: string) => {
    setSelectedICD10({ code, description });
    form.setFieldsValue({
      icd10_code: code,
      diagnosis_description: description
    });
  };

  const handleModeChange = (e: any) => {
    const icd10Mode = e.target.value;
    setUseICD10(icd10Mode);
    
    // Clear ICD-10 fields when switching to free text
    if (!icd10Mode) {
      setSelectedICD10(null);
      form.setFieldsValue({
        icd10_code: undefined,
        diagnosis_description: ''
      });
    }
  };

  const handleSubmit = (values: any) => {
    const diagnosisData: DiagnosisCreateData = {
      visit_id: visitId,
      patient_id: patientId,
      icd10_code: useICD10 ? values.icd10_code : undefined,
      diagnosis_description: values.diagnosis_description,
      diagnosis_type: values.diagnosis_type || 'primary',
      status: values.status || 'provisional',
      severity: values.severity,
      diagnosed_date: values.diagnosed_date?.format('YYYY-MM-DD'),
      onset_date: values.onset_date?.format('YYYY-MM-DD'),
      clinical_notes: values.clinical_notes
    };
    onSubmit(diagnosisData);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        diagnosis_type: hasPrimaryDiagnosis ? 'secondary' : 'primary',
        status: 'provisional',
        diagnosed_date: dayjs()
      }}
    >
      {/* Entry Mode Toggle */}
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
        <Form.Item label="Entry Mode" style={{ marginBottom: 0 }}>
          <Radio.Group value={useICD10} onChange={handleModeChange}>
            <Radio.Button value={true}>
              <Space>
                <MedicineBoxOutlined />
                Use ICD-10 Code
              </Space>
            </Radio.Button>
            <Radio.Button value={false}>
              <Space>
                <EditOutlined />
                Free Text Entry
              </Space>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {useICD10 
            ? 'Search and select from ICD-10 database (14,000+ codes)'
            : 'Enter diagnosis in your own words without coding'}
        </Text>
      </Card>

      {/* ICD-10 Search Mode */}
      {useICD10 && (
        <>
          <Form.Item
            label="Search ICD-10 Code"
            name="icd10_code"
            rules={[{ required: true, message: 'Please select an ICD-10 code or switch to free text mode' }]}
            tooltip="Start typing to search by disease name or code"
          >
            <ICD10Search onSelect={handleICD10Select} />
          </Form.Item>

          {selectedICD10 && (
            <Alert
              message={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text strong>Selected: [{selectedICD10.code}]</Text>
                  <Text>{selectedICD10.description}</Text>
                </Space>
              }
              type="success"
              closable
              onClose={() => {
                setSelectedICD10(null);
                form.setFieldsValue({ icd10_code: undefined, diagnosis_description: '' });
              }}
              style={{ marginBottom: 16 }}
            />
          )}
        </>
      )}

      {/* Diagnosis Description */}
      <Form.Item
        label="Diagnosis Description"
        name="diagnosis_description"
        rules={[
          { required: true, message: 'Diagnosis description is required' },
          { min: 3, message: 'Description must be at least 3 characters' }
        ]}
        tooltip={useICD10 ? "Auto-filled from ICD-10, but you can edit" : "Describe the diagnosis in your own words"}
      >
        <TextArea
          rows={3}
          placeholder={
            useICD10
              ? "Will be auto-filled when you select an ICD-10 code"
              : "Enter diagnosis description (e.g., 'Viral fever with body ache and headache')"
          }
        />
      </Form.Item>

      <Divider />

      {/* Diagnosis Type */}
      <Form.Item
        label="Diagnosis Type"
        name="diagnosis_type"
        rules={[{ required: true }]}
      >
        <Radio.Group>
          <Radio value="primary" disabled={hasPrimaryDiagnosis}>
            Primary Diagnosis
          </Radio>
          <Radio value="secondary">Secondary Diagnosis</Radio>
        </Radio.Group>
      </Form.Item>

      {hasPrimaryDiagnosis && (
        <Alert
          message="This visit already has a primary diagnosis. New diagnosis will be marked as secondary."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Status */}
      <Form.Item
        label="Status"
        name="status"
        rules={[{ required: true }]}
      >
        <Select>
          <Select.Option value="provisional">Provisional</Select.Option>
          <Select.Option value="confirmed">Confirmed</Select.Option>
        </Select>
      </Form.Item>

      {/* Severity */}
      <Form.Item label="Severity" name="severity">
        <Select placeholder="Select severity" allowClear>
          <Select.Option value="mild">Mild</Select.Option>
          <Select.Option value="moderate">Moderate</Select.Option>
          <Select.Option value="severe">Severe</Select.Option>
          <Select.Option value="critical">Critical</Select.Option>
        </Select>
      </Form.Item>

      {/* Dates */}
      <Space style={{ width: '100%' }} size="large">
        <Form.Item
          label="Diagnosed Date"
          name="diagnosed_date"
          rules={[{ required: true }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item label="Onset Date" name="onset_date">
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
      </Space>

      {/* Clinical Notes */}
      <Form.Item label="Clinical Notes" name="clinical_notes">
        <TextArea
          rows={3}
          placeholder="Additional clinical observations, investigation findings, etc."
        />
      </Form.Item>

      {/* Actions */}
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Add Diagnosis
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
```

---

### 6. Diagnosis Display Component
**File:** `frontend/src/components/diagnosis/DiagnosisList.tsx`

```typescript
import React from 'react';
import { List, Tag, Space, Typography, Button, Popconfirm, Card } from 'antd';
import { 
  DeleteOutlined, 
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Diagnosis } from '@/types/diagnosis';

const { Text } = Typography;

interface DiagnosisListProps {
  diagnoses: Diagnosis[];
  loading?: boolean;
  onEdit?: (diagnosis: Diagnosis) => void;
  onDelete?: (diagnosisId: string) => void;
  showActions?: boolean;
}

export const DiagnosisList: React.FC<DiagnosisListProps> = ({
  diagnoses,
  loading = false,
  onEdit,
  onDelete,
  showActions = true
}) => {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'mild': return 'green';
      case 'moderate': return 'orange';
      case 'severe': return 'red';
      case 'critical': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'confirmed' ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
    );
  };

  return (
    <List
      loading={loading}
      dataSource={diagnoses}
      renderItem={(diagnosis) => (
        <List.Item
          actions={
            showActions && onEdit && onDelete
              ? [
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(diagnosis)}
                  >
                    Edit
                  </Button>,
                  <Popconfirm
                    title="Delete this diagnosis?"
                    description="This action cannot be undone."
                    onConfirm={() => onDelete(diagnosis.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>,
                ]
              : undefined
          }
        >
          <List.Item.Meta
            avatar={getStatusIcon(diagnosis.status)}
            title={
              <Space>
                {diagnosis.icd10_code && (
                  <Tag color="blue">{diagnosis.icd10_code}</Tag>
                )}
                <Text strong>{diagnosis.diagnosis_description}</Text>
              </Space>
            }
            description={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space wrap>
                  <Tag color={diagnosis.diagnosis_type === 'primary' ? 'purple' : 'default'}>
                    {diagnosis.diagnosis_type.toUpperCase()}
                  </Tag>
                  <Tag>{diagnosis.status.toUpperCase()}</Tag>
                  {diagnosis.severity && (
                    <Tag color={getSeverityColor(diagnosis.severity)}>
                      {diagnosis.severity.toUpperCase()}
                    </Tag>
                  )}
                </Space>
                
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Diagnosed: {dayjs(diagnosis.diagnosed_date).format('MMM DD, YYYY')}
                  {diagnosis.onset_date && ` | Onset: ${dayjs(diagnosis.onset_date).format('MMM DD, YYYY')}`}
                </Text>

                {diagnosis.clinical_notes && (
                  <Text style={{ fontSize: 12 }}>
                    <Text type="secondary">Notes:</Text> {diagnosis.clinical_notes}
                  </Text>
                )}
              </Space>
            }
          />
        </List.Item>
      )}
      locale={{
        emptyText: 'No diagnoses recorded for this visit'
      }}
    />
  );
};
```

---

### 7. Update Visit Detail Page
**File:** `frontend/src/pages/visits/VisitDetail.tsx`

```typescript
// Add Diagnoses tab
import { DiagnosisList } from '@/components/diagnosis/DiagnosisList';
import { DiagnosisForm } from '@/components/diagnosis/DiagnosisForm';
import { useVisitDiagnoses, useCreateDiagnosis, useDeleteDiagnosis } from '@/hooks/useDiagnosis';

// In the component:
const { data: diagnoses, isLoading: diagnosesLoading } = useVisitDiagnoses(visitId);
const createDiagnosis = useCreateDiagnosis();
const deleteDiagnosis = useDeleteDiagnosis();
const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);

// Add tab:
<TabPane tab="Diagnoses" key="diagnoses">
  <Space direction="vertical" style={{ width: '100%' }} size="large">
    <Button 
      type="primary" 
      onClick={() => setShowDiagnosisForm(true)}
      icon={<PlusOutlined />}
    >
      Add Diagnosis
    </Button>

    <DiagnosisList
      diagnoses={diagnoses || []}
      loading={diagnosesLoading}
      onDelete={(id) => deleteDiagnosis.mutate(id)}
    />
  </Space>

  <Modal
    title="Add Diagnosis"
    open={showDiagnosisForm}
    onCancel={() => setShowDiagnosisForm(false)}
    footer={null}
    width={700}
  >
    <DiagnosisForm
      visitId={visitId}
      patientId={visit?.patient_id || ''}
      hasPrimaryDiagnosis={diagnoses?.some(d => d.diagnosis_type === 'primary')}
      onSubmit={(data) => {
        createDiagnosis.mutate(data, {
          onSuccess: () => setShowDiagnosisForm(false)
        });
      }}
      onCancel={() => setShowDiagnosisForm(false)}
      loading={createDiagnosis.isPending}
    />
  </Modal>
</TabPane>
```

---

## Testing Checklist

### ICD-10 Search
- [ ] Search works with 2+ characters
- [ ] Debouncing prevents excessive API calls
- [ ] Results show code, description, category
- [ ] Popular codes display when no query
- [ ] Highlighting works on matching text
- [ ] Selection populates form fields

### Diagnosis Form
- [ ] Toggle between ICD-10 and free text works
- [ ] ICD-10 mode shows search autocomplete
- [ ] Free text mode hides ICD-10 field
- [ ] Description auto-fills from ICD-10
- [ ] Can edit auto-filled description
- [ ] Primary diagnosis validation (only one)
- [ ] All fields validate correctly
- [ ] Submit creates diagnosis

### Diagnosis Display
- [ ] List shows all diagnoses for visit
- [ ] Primary diagnosis highlighted
- [ ] Status icons display correctly
- [ ] Severity colors match severity level
- [ ] Edit and delete actions work
- [ ] Empty state displays properly

---

## Success Criteria

- ✅ ICD-10 search returns results in <100ms
- ✅ Autocomplete works smoothly with debouncing
- ✅ Dual mode (coded/free text) easy to toggle
- ✅ Form validates all inputs correctly
- ✅ Diagnosis list displays clearly
- ✅ Mobile responsive design
- ✅ Integrated with Visit Detail page

---

## Next Steps

After Phase 3D completion:
→ **Phase 3E: Clinical Notes Backend** - Build SOAP notes system

---

**Documentation Version:** 1.0  
**Last Updated:** February 3, 2026
