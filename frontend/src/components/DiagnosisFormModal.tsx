/**
 * Diagnosis Form Modal
 * 
 * Modal for creating and editing patient diagnoses
 * Supports both ICD-10 coded and free-text diagnoses
 * Phase: 3D (Diagnosis Frontend)
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  Switch,
  Space,
  Alert,
  message,
  Typography,
  Tag,
  Button,
} from 'antd';
import { MedicineBoxOutlined, FileTextOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { Diagnosis, DiagnosisCreateData, DiagnosisUpdateData } from '@/types';
import { createDiagnosis, updateDiagnosis } from '@/services/diagnosisApi';
import { ICD10Search } from './ICD10Search';
import { PatientContextHeader } from '@/components/patient';

const { TextArea } = Input;
const { Text } = Typography;

interface DiagnosisFormModalProps {
  visible: boolean;
  onClose: () => void;
  visitId: string;
  patientId: string;
  patientName?: string;
  patientMrn?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  diagnosis?: Diagnosis; // For editing
  hasPrimaryDiagnosis?: boolean;
}

export const DiagnosisFormModal: React.FC<DiagnosisFormModalProps> = ({
  visible,
  onClose,
  visitId,
  patientId,
  patientName,
  patientMrn,
  patientDateOfBirth,
  patientGender,
  diagnosis,
  hasPrimaryDiagnosis = false,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [useICD10, setUseICD10] = useState(!!diagnosis?.icd10_code);
  const [selectedICD10, setSelectedICD10] = useState<{code: string; description: string} | null>(
    diagnosis?.icd10_code ? {
      code: diagnosis.icd10_code,
      description: diagnosis.icd10?.description || diagnosis.diagnosis_description
    } : null
  );

  const isEdit = !!diagnosis;
  
  // Calculate age and format patient info for display
  const age = patientDateOfBirth ? dayjs().diff(dayjs(patientDateOfBirth), 'year') : null;
  const genderDisplay = patientGender ? `${patientGender.charAt(0).toUpperCase()}${patientGender.slice(1)}` : null;
  const patientInfo = patientName && patientMrn 
    ? `${patientName}${genderDisplay ? ` (${genderDisplay}` : ''}${age !== null ? `${genderDisplay ? ', ' : ' ('}${age}y` : ''}${genderDisplay || age !== null ? ')' : ''} [MRN: ${patientMrn}]`
    : null;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createDiagnosis,
    onSuccess: () => {
      message.success('Diagnosis added successfully');
      queryClient.invalidateQueries({ queryKey: ['visit-diagnoses', visitId] });
      queryClient.invalidateQueries({ queryKey: ['patient-diagnosis-history', patientId] });
      handleClose();
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to add diagnosis';
      message.error(errorMsg);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DiagnosisUpdateData }) =>
      updateDiagnosis(id, data),
    onSuccess: () => {
      message.success('Diagnosis updated successfully');
      queryClient.invalidateQueries({ queryKey: ['visit-diagnoses', visitId] });
      queryClient.invalidateQueries({ queryKey: ['patient-diagnosis-history', patientId] });
      handleClose();
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to update diagnosis';
      message.error(errorMsg);
    },
  });

  // Initialize form when diagnosis changes
  useEffect(() => {
    if (visible && diagnosis) {
      form.setFieldsValue({
        diagnosis_type: diagnosis.diagnosis_type,
        status: diagnosis.status,
        severity: diagnosis.severity,
        diagnosis_description: diagnosis.diagnosis_description,
        icd10_code: diagnosis.icd10_code,
        onset_date: diagnosis.onset_date ? dayjs(diagnosis.onset_date) : undefined,
        diagnosed_date: dayjs(diagnosis.diagnosed_date),
        notes: diagnosis.notes,
      });
      setUseICD10(!!diagnosis.icd10_code);
    } else if (visible) {
      form.setFieldsValue({
        diagnosis_type: hasPrimaryDiagnosis ? 'secondary' : 'primary',
        status: 'provisional',
        diagnosed_date: dayjs(),
      });
      // Clear description when opening new form
      setSelectedICD10(null);
    }
  }, [visible, diagnosis, form, hasPrimaryDiagnosis]);

  const handleClose = () => {
    form.resetFields();
    setUseICD10(false);
    setSelectedICD10(null);
    onClose();
  };

  const handleICD10Select = (code: string, description: string) => {
    setSelectedICD10({ code, description });
    form.setFieldsValue({
      icd10_code: code,
      diagnosis_description: description,
    });
  };

  const handleSubmit = async (values: any) => {
    // Validate based on mode
    if (useICD10 && !selectedICD10?.code) {
      message.error('Please select an ICD-10 code from the dropdown');
      return;
    }
    if (!useICD10 && (!values.diagnosis_description || values.diagnosis_description.trim().length < 3)) {
      message.error('Please enter a diagnosis description (minimum 3 characters)');
      return;
    }

    const data: DiagnosisCreateData = {
      visit_id: visitId,
      patient_id: patientId,
      diagnosis_type: values.diagnosis_type,
      status: values.status,
      severity: values.severity,
      diagnosis_description: useICD10 && selectedICD10 ? selectedICD10.description : values.diagnosis_description.trim(),
      icd10_code: useICD10 && selectedICD10 ? selectedICD10.code : undefined,
      onset_date: values.onset_date ? values.onset_date.format('YYYY-MM-DD') : undefined,
      diagnosed_date: values.diagnosed_date.format('YYYY-MM-DD'),
      notes: values.notes,
    };

    if (isEdit && diagnosis) {
      const updateData: DiagnosisUpdateData = { ...data };
      delete (updateData as any).visit_id;
      delete (updateData as any).patient_id;
      
      updateMutation.mutate({ id: diagnosis.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Construct patient object for context header
  const patientForHeader = patientName && patientMrn ? {
    id: patientId,
    full_name: patientName,
    mrn: patientMrn,
    gender: patientGender,
    date_of_birth: patientDateOfBirth,
  } : null;

  return (
    <Modal
      title={
        <Space>
          <MedicineBoxOutlined />
          {isEdit ? 'Edit Diagnosis' : 'Add Diagnosis'}
          {patientInfo && (
            <Text type="secondary">- {patientInfo}</Text>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={() => form.submit()}
      confirmLoading={isLoading}
      width={700}
      destroyOnClose
    >
      {patientForHeader && (
        <PatientContextHeader
          patient={patientForHeader}
          showVisitInfo={false}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={isLoading}
      >
        {/* ICD-10 Code Toggle */}
        <Form.Item label="Use ICD-10 Code">
          <Space>
            <Switch
              checked={useICD10}
              onChange={setUseICD10}
              checkedChildren="ICD-10"
              unCheckedChildren="Free Text"
            />
            <Text type="secondary">
              {useICD10
                ? 'Search and select standardized ICD-10 code'
                : 'Enter free-text diagnosis'}
            </Text>
          </Space>
        </Form.Item>

        {/* ICD-10 Code Search */}
        {useICD10 && !selectedICD10 && (
          <Form.Item
            label="ICD-10 Code"
            help="Start typing to search, or select from popular codes below"
          >
            <ICD10Search
              onSelect={(code, option) => handleICD10Select(code, option.description)}
              placeholder="Search diagnosis codes (e.g., diabetes, hypertension)"
            />
          </Form.Item>
        )}

        {/* Hidden field to store ICD-10 code for validation */}
        {useICD10 && (
          <Form.Item
            name="icd10_code"
            hidden
            rules={[{ required: useICD10, message: 'Please select an ICD-10 code' }]}
          >
            <Input />
          </Form.Item>
        )}

        {/* Selected ICD-10 Code Display */}
        {useICD10 && selectedICD10 && (
          <Alert
            message={
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Space>
                  <Tag color="blue" style={{ fontSize: '14px' }}>{selectedICD10.code}</Tag>
                  <Text strong>Diagnosis:</Text>
                </Space>
                <Text>{selectedICD10.description}</Text>
              </Space>
            }
            type="success"
            style={{ marginBottom: 16 }}
            closable
            action={
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setSelectedICD10(null);
                  form.setFieldsValue({ icd10_code: undefined, diagnosis_description: '' });
                }}
              >
                Change
              </Button>
            }
            onClose={() => {
              setSelectedICD10(null);
              form.setFieldsValue({ icd10_code: undefined, diagnosis_description: '' });
            }}
          />
        )}

        {/* Diagnosis Description - Small for ICD-10, Large for Free-text */}
        {!useICD10 && (
          <Form.Item
            name="diagnosis_description"
            label="Diagnosis Description"
            rules={[
              { required: true, message: 'Please enter diagnosis description' },
              { 
                min: 3, 
                message: 'Description must be at least 3 characters',
                validateTrigger: 'onSubmit'
              },
              { max: 500, message: 'Description must not exceed 500 characters' },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Enter diagnosis description (minimum 3 characters)"
              showCount
              maxLength={500}
            />
          </Form.Item>
        )}

        {/* Hidden field for ICD-10 description */}
        {useICD10 && (
          <Form.Item name="diagnosis_description" hidden>
            <Input />
          </Form.Item>
        )}

        {/* Diagnosis Type */}
        <Form.Item
          name="diagnosis_type"
          label="Diagnosis Type"
          rules={[{ required: true, message: 'Please select diagnosis type' }]}
        >
          <Radio.Group>
            <Radio.Button value="primary" disabled={hasPrimaryDiagnosis && !isEdit}>
              Primary
            </Radio.Button>
            <Radio.Button value="secondary">Secondary</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Status and Severity */}
        <Space size="large" style={{ width: '100%' }}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select>
              <Select.Option value="provisional">Provisional</Select.Option>
              <Select.Option value="confirmed">Confirmed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="severity" label="Severity" style={{ flex: 1 }}>
            <Select placeholder="Select severity" allowClear>
              <Select.Option value="mild">Mild</Select.Option>
              <Select.Option value="moderate">Moderate</Select.Option>
              <Select.Option value="severe">Severe</Select.Option>
              <Select.Option value="critical">Critical</Select.Option>
            </Select>
          </Form.Item>
        </Space>

        {/* Dates */}
        <Space size="large" style={{ width: '100%' }}>
          <Form.Item name="onset_date" label="Onset Date" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>

          <Form.Item
            name="diagnosed_date"
            label="Diagnosed Date"
            rules={[{ required: true, message: 'Required' }]}
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>
        </Space>

        {/* Notes */}
        <Form.Item name="notes" label="Additional Notes">
          <TextArea
            rows={3}
            placeholder="Clinical notes, treatment plan, etc."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
