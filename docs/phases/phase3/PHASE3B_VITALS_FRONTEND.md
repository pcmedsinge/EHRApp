# Phase 3B: Vitals Frontend (3-4 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 3A Complete  
**Estimated Time:** 3-4 days

---

## Objectives

Create intuitive UI components for nurses to record vitals quickly and for medical staff to view vitals history with trending visualizations.

---

## Deliverables

### 1. TypeScript Types
**File:** `frontend/src/types/vital.ts`

```typescript
export interface Vital {
  id: string;
  visit_id: string;
  patient_id: string;
  recorded_by: string;
  
  // Blood Pressure
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  
  // Pulse & Respiration
  pulse_rate?: number;
  respiratory_rate?: number;
  
  // Temperature
  temperature?: number;
  temperature_unit?: 'C' | 'F';
  
  // Oxygen Saturation
  spo2?: number;
  
  // Body Measurements
  height?: number;  // cm
  weight?: number;  // kg
  bmi?: number;     // Auto-calculated
  
  // Blood Sugar
  blood_sugar?: number;
  blood_sugar_type?: 'random' | 'fasting' | 'pp';
  
  // Metadata
  notes?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface VitalCreateData {
  visit_id: string;
  patient_id: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  pulse_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  temperature_unit?: 'C' | 'F';
  spo2?: number;
  height?: number;
  weight?: number;
  blood_sugar?: number;
  blood_sugar_type?: 'random' | 'fasting' | 'pp';
  notes?: string;
}

export interface VitalUpdateData extends Partial<VitalCreateData> {}

// Helper types for vitals display
export interface VitalRange {
  min: number;
  max: number;
  unit: string;
  label: string;
}

export const VITAL_RANGES: Record<string, VitalRange> = {
  systolic: { min: 90, max: 140, unit: 'mmHg', label: 'BP Systolic' },
  diastolic: { min: 60, max: 90, unit: 'mmHg', label: 'BP Diastolic' },
  pulse: { min: 60, max: 100, unit: 'bpm', label: 'Pulse Rate' },
  temperature: { min: 36.1, max: 37.2, unit: '°C', label: 'Temperature' },
  respiratory: { min: 12, max: 20, unit: '/min', label: 'Resp. Rate' },
  spo2: { min: 95, max: 100, unit: '%', label: 'SpO2' },
  bmi: { min: 18.5, max: 24.9, unit: '', label: 'BMI' }
};
```

---

### 2. API Service
**File:** `frontend/src/services/vitalService.ts`

```typescript
import { api } from './api';
import { Vital, VitalCreateData, VitalUpdateData } from '@/types/vital';

class VitalService {
  /**
   * Create a new vital record
   */
  async createVital(data: VitalCreateData): Promise<Vital> {
    const response = await api.post<Vital>('/vitals/', data);
    return response.data;
  }

  /**
   * Get all vitals for a visit
   */
  async getVisitVitals(visitId: string): Promise<Vital[]> {
    const response = await api.get<Vital[]>(`/vitals/visit/${visitId}`);
    return response.data;
  }

  /**
   * Get patient vitals history
   */
  async getPatientVitalsHistory(patientId: string, limit: number = 10): Promise<Vital[]> {
    const response = await api.get<Vital[]>(`/vitals/patient/${patientId}`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Get latest vitals for a patient
   */
  async getLatestVitals(patientId: string): Promise<Vital | null> {
    try {
      const response = await api.get<Vital>(`/vitals/patient/${patientId}/latest`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update vital record
   */
  async updateVital(id: string, data: VitalUpdateData): Promise<Vital> {
    const response = await api.put<Vital>(`/vitals/${id}`, data);
    return response.data;
  }

  /**
   * Delete vital record
   */
  async deleteVital(id: string): Promise<void> {
    await api.delete(`/vitals/${id}`);
  }
}

export const vitalService = new VitalService();
```

---

### 3. React Query Hooks
**File:** `frontend/src/hooks/useVitals.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { vitalService } from '@/services/vitalService';
import { VitalCreateData, VitalUpdateData } from '@/types/vital';

// Query keys
export const vitalKeys = {
  all: ['vitals'] as const,
  visit: (visitId: string) => ['vitals', 'visit', visitId] as const,
  patient: (patientId: string) => ['vitals', 'patient', patientId] as const,
  latest: (patientId: string) => ['vitals', 'latest', patientId] as const,
};

/**
 * Get vitals for a visit
 */
export const useVisitVitals = (visitId: string) => {
  return useQuery({
    queryKey: vitalKeys.visit(visitId),
    queryFn: () => vitalService.getVisitVitals(visitId),
    enabled: !!visitId,
  });
};

/**
 * Get patient vitals history
 */
export const usePatientVitalsHistory = (patientId: string, limit: number = 10) => {
  return useQuery({
    queryKey: vitalKeys.patient(patientId),
    queryFn: () => vitalService.getPatientVitalsHistory(patientId, limit),
    enabled: !!patientId,
  });
};

/**
 * Get latest vitals for a patient
 */
export const useLatestVitals = (patientId: string) => {
  return useQuery({
    queryKey: vitalKeys.latest(patientId),
    queryFn: () => vitalService.getLatestVitals(patientId),
    enabled: !!patientId,
  });
};

/**
 * Create vital record
 */
export const useCreateVital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VitalCreateData) => vitalService.createVital(data),
    onSuccess: (vital) => {
      message.success('Vitals recorded successfully');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: vitalKeys.visit(vital.visit_id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.patient(vital.patient_id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.latest(vital.patient_id) });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to record vitals');
    },
  });
};

/**
 * Update vital record
 */
export const useUpdateVital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VitalUpdateData }) =>
      vitalService.updateVital(id, data),
    onSuccess: (vital) => {
      message.success('Vitals updated successfully');
      queryClient.invalidateQueries({ queryKey: vitalKeys.visit(vital.visit_id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.patient(vital.patient_id) });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to update vitals');
    },
  });
};

/**
 * Delete vital record
 */
export const useDeleteVital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vitalService.deleteVital(id),
    onSuccess: () => {
      message.success('Vitals deleted successfully');
      queryClient.invalidateQueries({ queryKey: vitalKeys.all });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to delete vitals');
    },
  });
};
```

---

### 4. Vitals Form Component
**File:** `frontend/src/components/vitals/VitalsForm.tsx`

```typescript
import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Row, Col, Button, Divider, Typography } from 'antd';
import { VitalCreateData, VITAL_RANGES } from '@/types/vital';

const { Text } = Typography;
const { TextArea } = Input;

interface VitalsFormProps {
  visitId: string;
  patientId: string;
  onSubmit: (data: VitalCreateData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const VitalsForm: React.FC<VitalsFormProps> = ({
  visitId,
  patientId,
  onSubmit,
  onCancel,
  loading
}) => {
  const [form] = Form.useForm();
  const [bmi, setBmi] = React.useState<number | null>(null);

  // Auto-calculate BMI when height or weight changes
  const calculateBMI = () => {
    const height = form.getFieldValue('height');
    const weight = form.getFieldValue('weight');
    
    if (height && weight && height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const calculatedBMI = weight / (heightInMeters * heightInMeters);
      setBmi(Math.round(calculatedBMI * 100) / 100);
    } else {
      setBmi(null);
    }
  };

  const handleSubmit = (values: any) => {
    const vitalData: VitalCreateData = {
      visit_id: visitId,
      patient_id: patientId,
      ...values
    };
    onSubmit(vitalData);
  };

  const getStatusColor = (value: number, type: keyof typeof VITAL_RANGES): string => {
    const range = VITAL_RANGES[type];
    if (!range) return 'default';
    if (value < range.min || value > range.max) return 'red';
    return 'green';
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      {/* Blood Pressure */}
      <Divider orientation="left">Blood Pressure</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Systolic (mmHg)"
            name="blood_pressure_systolic"
            rules={[
              { type: 'number', min: 60, max: 300, message: 'Must be between 60-300' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="120"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Diastolic (mmHg)"
            name="blood_pressure_diastolic"
            rules={[
              { type: 'number', min: 40, max: 200, message: 'Must be between 40-200' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="80"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Pulse & Respiration */}
      <Divider orientation="left">Pulse & Respiration</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Pulse Rate (bpm)"
            name="pulse_rate"
            rules={[
              { type: 'number', min: 40, max: 200, message: 'Must be between 40-200' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="72"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Respiratory Rate (/min)"
            name="respiratory_rate"
            rules={[
              { type: 'number', min: 8, max: 40, message: 'Must be between 8-40' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="16"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Temperature & SpO2 */}
      <Divider orientation="left">Temperature & Oxygen</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Temperature">
            <Input.Group compact>
              <Form.Item
                name="temperature"
                noStyle
                rules={[
                  { type: 'number', min: 35, max: 42, message: 'Must be between 35-42°C' }
                ]}
              >
                <InputNumber 
                  style={{ width: '70%' }} 
                  placeholder="37.0"
                  step={0.1}
                />
              </Form.Item>
              <Form.Item name="temperature_unit" noStyle initialValue="C">
                <Select style={{ width: '30%' }}>
                  <Select.Option value="C">°C</Select.Option>
                  <Select.Option value="F">°F</Select.Option>
                </Select>
              </Form.Item>
            </Input.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="SpO2 (%)"
            name="spo2"
            rules={[
              { type: 'number', min: 70, max: 100, message: 'Must be between 70-100' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="98"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Body Measurements */}
      <Divider orientation="left">Body Measurements</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Height (cm)"
            name="height"
            rules={[
              { type: 'number', min: 50, max: 250, message: 'Must be between 50-250' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="170"
              onChange={calculateBMI}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Weight (kg)"
            name="weight"
            rules={[
              { type: 'number', min: 2, max: 300, message: 'Must be between 2-300' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="70"
              onChange={calculateBMI}
            />
          </Form.Item>
        </Col>
      </Row>

      {bmi && (
        <Row>
          <Col span={24}>
            <Text strong>BMI: </Text>
            <Text style={{ color: getStatusColor(bmi, 'bmi') }}>
              {bmi} ({getBMICategory(bmi)})
            </Text>
          </Col>
        </Row>
      )}

      {/* Blood Sugar */}
      <Divider orientation="left">Blood Sugar</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Blood Sugar (mg/dL)"
            name="blood_sugar"
            rules={[
              { type: 'number', min: 20, max: 600, message: 'Must be between 20-600' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="100"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Type" name="blood_sugar_type">
            <Select placeholder="Select type">
              <Select.Option value="random">Random</Select.Option>
              <Select.Option value="fasting">Fasting</Select.Option>
              <Select.Option value="pp">Post-Prandial</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Notes */}
      <Divider orientation="left">Additional Notes</Divider>
      <Form.Item label="Notes" name="notes">
        <TextArea rows={3} placeholder="Any additional observations..." />
      </Form.Item>

      {/* Actions */}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
          Save Vitals
        </Button>
        <Button onClick={onCancel}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

// Helper function
function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
```

---

## Testing Checklist

- [ ] Form validates all input ranges correctly
- [ ] BMI calculates automatically on height/weight change
- [ ] Abnormal values show color indicators
- [ ] Form submission works
- [ ] Cancel button clears form
- [ ] Required field validation
- [ ] Temperature unit toggle works (C/F)
- [ ] Blood sugar type selection works
- [ ] Notes field accepts long text
- [ ] Tab navigation flows logically

---

## Success Criteria

- ✅ Nurses can record vitals in under 2 minutes
- ✅ BMI auto-calculates accurately
- ✅ Input validation prevents invalid data
- ✅ Form is intuitive and easy to use
- ✅ Mobile-responsive design
- ✅ Integrated with Visit Detail page

---

## Next Steps

After Phase 3B completion:
→ **Phase 3C: Diagnosis Backend** - Build diagnosis module with ICD-10 search

---

**Documentation Version:** 1.0  
**Last Updated:** February 3, 2026
