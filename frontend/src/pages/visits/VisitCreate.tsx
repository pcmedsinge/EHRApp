/**
 * Visit Create Page
 * =================
 * 
 * Purpose:
 *   Form for creating a new visit with patient selection.
 * 
 * Module: src/pages/visits/VisitCreate.tsx
 * Phase: 2D (Frontend - Visit Pages)
 * 
 * References:
 *   - Phase 2D Spec: docs/phases/phase2/Phase2D_Frontend_VisitPages.md
 */

import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  Divider,
  Typography,
  Alert,
} from 'antd';
import {
  CalendarOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  UserOutlined,
  SearchOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCreateVisit } from '@/hooks/useVisits';
import { PatientSearchModal } from '@/components/visits';
import type { VisitCreateData, Patient, VisitType, VisitPriority } from '@/types';
import {
  VISIT_TYPE_OPTIONS,
  VISIT_PRIORITY_OPTIONS,
  DEPARTMENT_OPTIONS,
  DATE_FORMAT,
} from '@/config/constants';
import dayjs from 'dayjs';
import { colors } from '@/theme';

const { TextArea } = Input;
const { Text, Title } = Typography;

const VisitCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const createVisit = useCreateVisit();

  // State for patient selection
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    form.setFieldsValue({ patient_id: patient.id });
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    form.setFieldsValue({ patient_id: undefined });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const visitData: VisitCreateData = {
      patient_id: selectedPatient!.id,
      visit_date: values.visit_date
        ? (values.visit_date as dayjs.Dayjs).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
      visit_type: (values.visit_type as VisitType) || 'consultation',
      priority: (values.priority as VisitPriority) || 'normal',
      department: values.department as string || undefined,
      chief_complaint: values.chief_complaint as string || undefined,
      notes: values.notes as string || undefined,
    };

    try {
      const visit = await createVisit.mutateAsync(visitData);
      navigate(`/visits/${visit.id}`);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <>
      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: colors.primary.main }} />
            <span>Create New Visit</span>
          </Space>
        }
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/visits')}>
            Back to List
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
          scrollToFirstError
          initialValues={{
            visit_date: dayjs(),
            visit_type: 'consultation',
            priority: 'normal',
          }}
        >
          {/* Patient Selection Section */}
          <Divider>
            <Space>
              <UserOutlined />
              Patient Information
            </Space>
          </Divider>

          <Form.Item
            name="patient_id"
            rules={[{ required: true, message: 'Please select a patient' }]}
            style={{ marginBottom: 16 }}
          >
            {selectedPatient ? (
              <Card
                size="small"
                style={{
                  backgroundColor: colors.neutral.background,
                  borderColor: colors.primary.main,
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space direction="vertical" size={0}>
                      <Space>
                        <UserOutlined style={{ color: colors.primary.main }} />
                        <Title level={5} style={{ margin: 0 }}>
                          {selectedPatient.full_name}
                        </Title>
                      </Space>
                      <Space split="•">
                        <Text type="secondary">MRN: {selectedPatient.mrn}</Text>
                        <Text type="secondary">
                          {selectedPatient.age}Y / {selectedPatient.gender?.charAt(0).toUpperCase()}
                        </Text>
                        <Text type="secondary">{selectedPatient.phone}</Text>
                      </Space>
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Button
                        icon={<SearchOutlined />}
                        onClick={() => setShowPatientSearch(true)}
                      >
                        Change
                      </Button>
                      <Button
                        icon={<CloseOutlined />}
                        danger
                        onClick={clearPatient}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            ) : (
              <Alert
                type="info"
                showIcon
                icon={<UserOutlined />}
                message="No patient selected"
                description={
                  <Space direction="vertical">
                    <Text>Please select a patient to create a visit.</Text>
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={() => setShowPatientSearch(true)}
                    >
                      Search & Select Patient
                    </Button>
                  </Space>
                }
              />
            )}
          </Form.Item>

          {/* Visit Details Section */}
          <Divider>
            <Space>
              <CalendarOutlined />
              Visit Details
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="visit_date"
                label="Visit Date"
                rules={[{ required: true, message: 'Visit date is required' }]}
              >
                <DatePicker
                  format={DATE_FORMAT}
                  style={{ width: '100%' }}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf('day')
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="visit_type"
                label="Visit Type"
                rules={[{ required: true, message: 'Visit type is required' }]}
              >
                <Select options={[...VISIT_TYPE_OPTIONS]} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="priority" label="Priority">
                <Select options={[...VISIT_PRIORITY_OPTIONS]} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="department" label="Department">
                <Select
                  placeholder="Select department"
                  allowClear
                  options={[...DEPARTMENT_OPTIONS]}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Chief Complaint Section */}
          <Divider>
            <Space>
              <MedicineBoxOutlined />
              Chief Complaint
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="chief_complaint"
                label="Chief Complaint"
                rules={[{ max: 500, message: 'Maximum 500 characters' }]}
              >
                <TextArea
                  placeholder="Enter the patient's main complaint or reason for visit..."
                  rows={3}
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="notes"
                label="Additional Notes"
                rules={[{ max: 1000, message: 'Maximum 1000 characters' }]}
              >
                <TextArea
                  placeholder="Any additional notes for this visit..."
                  rows={2}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Form Actions */}
          <Divider />
          <Row justify="end">
            <Space>
              <Button onClick={() => navigate('/visits')}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createVisit.isPending}
                disabled={!selectedPatient}
              >
                Create Visit
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>

      {/* Patient Search Modal */}
      <PatientSearchModal
        open={showPatientSearch}
        onClose={() => setShowPatientSearch(false)}
        onSelect={handlePatientSelect}
      />
    </>
  );
};

export default VisitCreate;
