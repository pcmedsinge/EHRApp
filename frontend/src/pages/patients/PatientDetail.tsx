/**
 * Patient Detail Page
 * ====================
 * 
 * Purpose:
 *   Displays detailed patient information with tabs for different sections,
 *   including Visit History tab with patient's visits.
 * 
 * Module: src/pages/patients/PatientDetail.tsx
 * Phase: 2F (Integration - Dashboard)
 * 
 * References:
 *   - Phase 2F Spec: docs/phases/phase2/Phase2F_Integration_Dashboard.md
 */

import { Descriptions, Card, Row, Col, Tag, Button, Space, Tabs, Spin, Empty, Divider, Table, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  HeartOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  AlertOutlined,
  IdcardOutlined,
  CalendarOutlined,
  PlusOutlined,
  EyeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient } from '@/hooks/usePatients';
import { usePatientVisits } from '@/hooks/useVisits';
import { VisitStatusBadge, VisitTypeBadge, VisitPriorityBadge } from '@/components/visits';
import { PatientDiagnosisHistory } from '@/components/PatientDiagnosisHistory';
import { PatientContextHeader } from '@/components/patient';
import type { Visit } from '@/types';
import dayjs from 'dayjs';
import { DATE_FORMAT } from '@/config/constants';
import { colors } from '@/theme';

// =============================================================================
// VISIT HISTORY TAB COMPONENT
// =============================================================================

interface VisitHistoryTabProps {
  visits: Visit[];
  loading: boolean;
  patientId: string;
  navigate: ReturnType<typeof useNavigate>;
}

const VisitHistoryTab = ({ visits, loading, patientId, navigate }: VisitHistoryTabProps) => {
  const columns: TableColumnsType<Visit> = [
    {
      title: 'Visit Date',
      dataIndex: 'visit_date',
      key: 'visit_date',
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
      sorter: (a: Visit, b: Visit) => dayjs(a.visit_date).valueOf() - dayjs(b.visit_date).valueOf(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Type',
      dataIndex: 'visit_type',
      key: 'visit_type',
      render: (type: string) => <VisitTypeBadge type={type as any} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <VisitStatusBadge status={status as any} />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => <VisitPriorityBadge priority={priority as any} showLabel={false} />,
    },
    {
      title: 'Doctor',
      dataIndex: 'assigned_doctor',
      key: 'doctor',
      render: (_: unknown, record: Visit) => record.assigned_doctor?.full_name || '-',
    },
    {
      title: 'Chief Complaint',
      dataIndex: 'chief_complaint',
      key: 'chief_complaint',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Visit) => (
        <Tooltip title="View Visit">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/visits/${record.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin tip="Loading visits..." />
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <Empty
        description="No visits recorded"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate(`/visits/create?patientId=${patientId}`)}
        >
          Create First Visit
        </Button>
      </Empty>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <span style={{ color: colors.text.secondary }}>
            Showing {visits.length} visit(s)
          </span>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate(`/visits/create?patientId=${patientId}`)}
          >
            New Visit
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={visits}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 5, showSizeChanger: true }}
      />
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, error } = usePatient(id!);
  const { data: visitsData, isLoading: visitsLoading } = usePatientVisits(id!);

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Loading patient details..." />
        </div>
      </Card>
    );
  }

  if (error || !patient) {
    return (
      <Card>
        <Empty
          description="Patient not found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/patients')}>
            Back to Patients
          </Button>
        </Empty>
      </Card>
    );
  }

  const genderColors: Record<string, string> = {
    male: 'blue',
    female: 'magenta',
    other: 'purple',
  };

  const tabItems = [
    {
      key: 'personal',
      label: (
        <span>
          <UserOutlined />
          Personal Info
        </span>
      ),
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="MRN">
            <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 14 }}>
              {patient.mrn}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Full Name">
            <strong>{patient.full_name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {dayjs(patient.date_of_birth).format(DATE_FORMAT)}
          </Descriptions.Item>
          <Descriptions.Item label="Age">
            <Tag color="green">{patient.age} years</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Gender">
            <Tag color={genderColors[patient.gender] || 'default'}>
              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Blood Group">
            {patient.blood_group ? (
              <Tag color="red">{patient.blood_group}</Tag>
            ) : (
              <span style={{ color: colors.text.secondary }}>Not recorded</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Registration Date">
            {dayjs(patient.created_at).format(DATE_FORMAT)}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {dayjs(patient.updated_at).format(DATE_FORMAT)}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'contact',
      label: (
        <span>
          <PhoneOutlined />
          Contact
        </span>
      ),
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
            <a href={`tel:${patient.phone}`}>{patient.phone}</a>
          </Descriptions.Item>
          <Descriptions.Item label={<><MailOutlined /> Email</>}>
            {patient.email ? (
              <a href={`mailto:${patient.email}`}>{patient.email}</a>
            ) : (
              <span style={{ color: colors.text.secondary }}>Not provided</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={<><HomeOutlined /> Address</>} span={2}>
            {patient.address_line1 || patient.city || patient.state ? (
              <div>
                {patient.address_line1 && <div>{patient.address_line1}</div>}
                {patient.address_line2 && <div>{patient.address_line2}</div>}
                <div>
                  {[patient.city, patient.state, patient.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            ) : (
              <span style={{ color: colors.text.secondary }}>Not provided</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Emergency Contact Name">
            {patient.emergency_contact_name || (
              <span style={{ color: colors.text.secondary }}>Not provided</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Emergency Contact Phone">
            {patient.emergency_contact_phone ? (
              <a href={`tel:${patient.emergency_contact_phone}`}>
                {patient.emergency_contact_phone}
              </a>
            ) : (
              <span style={{ color: colors.text.secondary }}>Not provided</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'medical',
      label: (
        <span>
          <HeartOutlined />
          Medical Info
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              title={
                <Space>
                  <AlertOutlined style={{ color: colors.error.main }} />
                  Known Allergies
                </Space>
              }
              style={{ height: '100%' }}
            >
              {patient.allergies ? (
                <div>
                  {patient.allergies.split(',').map((allergy: string, idx: number) => (
                    <Tag key={idx} color="orange" style={{ marginBottom: 4 }}>
                      {allergy.trim()}
                    </Tag>
                  ))}
                </div>
              ) : (
                <span style={{ color: colors.text.secondary }}>
                  No known allergies
                </span>
              )}
            </Card>
          </Col>
          <Col xs={24}>
            <Card
              size="small"
              title={
                <Space>
                  <IdcardOutlined />
                  Medical Notes
                </Space>
              }
            >
              {patient.medical_notes || (
                <span style={{ color: colors.text.secondary }}>
                  No additional notes
                </span>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'visits',
      label: (
        <span>
          <HistoryOutlined />
          Visit History ({visitsData?.total || 0})
        </span>
      ),
      children: (
        <VisitHistoryTab 
          visits={visitsData?.items || []} 
          loading={visitsLoading} 
          patientId={id!}
          navigate={navigate}
        />
      ),
    },
    {
      key: 'diagnoses',
      label: (
        <span>
          <HeartOutlined />
          Diagnosis History
        </span>
      ),
      children: (
        <PatientDiagnosisHistory patientId={id!} showTitle={false} />
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <UserOutlined style={{ color: colors.primary.main }} />
          <span>Patient Details</span>
          <Tag color="blue" style={{ fontFamily: 'monospace' }}>
            {patient.mrn}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')}>
            Back to List
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/visits/create?patientId=${patient.id}`)}
          >
            Create Visit
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/patients/${patient.id}/edit`)}
          >
            Edit Patient
          </Button>
        </Space>
      }
    >
      {/* Patient Context Header */}
      <PatientContextHeader
        patient={patient}
        showVisitInfo={false}
      />

      {/* Quick Info Banner */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ textAlign: 'center', background: colors.primary.lightest }}>
            <UserOutlined style={{ fontSize: 24, color: colors.primary.main }} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>{patient.full_name}</div>
            <div style={{ color: colors.text.secondary }}>Patient Name</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
            <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>{patient.age} Years</div>
            <div style={{ color: colors.text.secondary }}>Age</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
            <HeartOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>
              {patient.blood_group || 'N/A'}
            </div>
            <div style={{ color: colors.text.secondary }}>Blood Group</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
            <PhoneOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>{patient.phone}</div>
            <div style={{ color: colors.text.secondary }}>Phone</div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Detailed Information Tabs */}
      <Tabs defaultActiveKey="personal" items={tabItems} />
    </Card>
  );
};

export default PatientDetail;
