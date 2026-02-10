/**
 * Visit Edit Page
 * ================
 * 
 * Purpose:
 *   Edit existing visit details.
 * 
 * Module: src/pages/visits/VisitEdit.tsx
 * Phase: 2E (Frontend - Visit Detail Pages)
 * 
 * References:
 *   - Phase 2E Spec: docs/phases/phase2/Phase2E_Frontend_VisitDetail.md
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Select,
  Space,
  Divider,
  Spin,
  Result,
  Alert,
  Typography,
  Tag,
} from 'antd';
import {
  CalendarOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  UserOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useVisit, useUpdateVisit } from '@/hooks/useVisits';
import { VisitStatusBadge } from '@/components/visits';
import type { VisitUpdateData, VisitType, VisitPriority } from '@/types';
import {
  VISIT_TYPE_OPTIONS,
  VISIT_PRIORITY_OPTIONS,
  DEPARTMENT_OPTIONS,
  DATE_FORMAT,
} from '@/config/constants';
import { colors } from '@/theme';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

const VisitEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: visit, isLoading, error } = useVisit(id!);
  const updateVisit = useUpdateVisit();

  // Populate form when visit data loads
  useEffect(() => {
    if (visit) {
      form.setFieldsValue({
        visit_type: visit.visit_type,
        priority: visit.priority,
        department: visit.department,
        chief_complaint: visit.chief_complaint,
        notes: visit.notes,
      });
    }
  }, [visit, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!visit) return;

    const updateData: VisitUpdateData = {
      visit_type: values.visit_type as VisitType,
      priority: values.priority as VisitPriority,
      department: values.department as string || undefined,
      chief_complaint: values.chief_complaint as string || undefined,
      notes: values.notes as string || undefined,
    };

    try {
      await updateVisit.mutateAsync({
        id: visit.id,
        data: updateData,
      });
      navigate(`/visits/${visit.id}`);
    } catch (err) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="Loading visit..." />
      </div>
    );
  }

  if (error || !visit) {
    return (
      <Result
        status="error"
        title="Visit Not Found"
        subTitle="The visit you're trying to edit doesn't exist."
        extra={
          <Button type="primary" onClick={() => navigate('/visits')}>
            Back to Visits
          </Button>
        }
      />
    );
  }

  // Check if visit can be edited
  if (['completed', 'cancelled'].includes(visit.status)) {
    return (
      <Result
        status="warning"
        title="Cannot Edit Visit"
        subTitle={`This visit has been ${visit.status} and cannot be edited.`}
        extra={
          <Space>
            <Button onClick={() => navigate(`/visits/${visit.id}`)}>
              View Visit
            </Button>
            <Button type="primary" onClick={() => navigate('/visits')}>
              Back to Visits
            </Button>
          </Space>
        }
      />
    );
  }

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined style={{ color: colors.primary.main }} />
          <span>Edit Visit: {visit.visit_number}</span>
          <VisitStatusBadge status={visit.status} size="small" />
        </Space>
      }
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/visits/${visit.id}`)}
        >
          Back to Details
        </Button>
      }
    >
      {/* Warning for in-progress visits */}
      {visit.status === 'in_progress' && (
        <Alert
          type="warning"
          showIcon
          message="Consultation in Progress"
          description="This visit is currently in progress. Changes will be saved immediately."
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Non-editable Information */}
      <Card
        size="small"
        style={{
          backgroundColor: colors.neutral.background,
          marginBottom: 24,
        }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Visit Number</Text>
              <Tag color="blue" style={{ fontFamily: 'monospace' }}>
                {visit.visit_number}
              </Tag>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Patient</Text>
              <Space>
                <UserOutlined />
                <Text strong>{visit.patient?.full_name || 'Unknown'}</Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Visit Date</Text>
              <Text>{dayjs(visit.visit_date).format(DATE_FORMAT)}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Status</Text>
              <VisitStatusBadge status={visit.status} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        scrollToFirstError
      >
        {/* Editable Visit Details */}
        <Divider>
          <Space>
            <MedicineBoxOutlined />
            Visit Details
          </Space>
        </Divider>

        <Row gutter={16}>
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
            Clinical Information
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
            <Button onClick={() => navigate(`/visits/${visit.id}`)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={updateVisit.isPending}
            >
              Save Changes
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};

export default VisitEdit;
