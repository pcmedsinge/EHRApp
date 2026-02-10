/**
 * Visit Detail Page
 * =================
 * 
 * Purpose:
 *   Display complete visit information with status management.
 * 
 * Module: src/pages/visits/VisitDetail.tsx
 * Phase: 2E (Frontend - Visit Detail Pages)
 * 
 * References:
 *   - Phase 2E Spec: docs/phases/phase2/Phase2E_Frontend_VisitDetail.md
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Descriptions,
  Tag,
  Spin,
  Result,
  Steps,
  Divider,
  message,
  Tabs,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  HeartOutlined,
  PlusOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useVisit, useUpdateVisitStatus, useCancelVisit } from '@/hooks/useVisits';
import {
  VisitStatusBadge,
  VisitPriorityBadge,
  VisitTypeBadge,
  VisitStatusActions,
  CancelVisitModal,
} from '@/components/visits';
import { VitalsForm, VitalsList } from '@/components/vitals';
import { DiagnosisList } from '@/components/DiagnosisList';
import { ClinicalNotesList } from '@/components/clinical-notes';
import { OrdersList, OrderFormModal, OrderDetailModal } from '@/components/orders';
import { PatientContextHeader } from '@/components/patient';
import { useVisitVitals, useCreateVital } from '@/hooks/useVitals';
import { useVisitOrders } from '@/hooks/useOrders';
import type { Order } from '@/types/orders';
import type { VisitStatus, VitalCreateData } from '@/types';
import { colors } from '@/theme';
import dayjs from 'dayjs';
import { DATE_TIME_FORMAT, DATE_FORMAT, TIME_FORMAT } from '@/config/constants';

const { Title, Text } = Typography;

const VisitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: visit, isLoading, error } = useVisit(id!);
  const updateStatus = useUpdateVisitStatus();
  const cancelVisit = useCancelVisit();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get user role from localStorage
  useEffect(() => {
    const user = localStorage.getItem('ehr_user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        console.log('User data from localStorage:', parsedUser);
        console.log('User role:', parsedUser.role);
        // Convert to lowercase for consistent comparison
        const role = parsedUser.role?.toLowerCase();
        console.log('User role (lowercase):', role);
        setUserRole(role);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      console.log('No user data found in localStorage (key: ehr_user)');
    }
  }, []);

  // Vitals hooks
  const { data: vitals, isLoading: vitalsLoading } = useVisitVitals(id!);
  const createVital = useCreateVital();

  // Orders hooks
  const { data: orders, isLoading: ordersLoading } = useVisitOrders(id!);

  const handleStatusChange = async (newStatus: VisitStatus) => {
    if (!visit) return;

    try {
      await updateStatus.mutateAsync({
        id: visit.id,
        status: newStatus,
      });
      message.success(`Visit status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleCancel = async (reason: string) => {
    if (!visit) return;

    try {
      await cancelVisit.mutateAsync({
        id: visit.id,
        reason,
      });
      message.success('Visit cancelled successfully');
      setShowCancelModal(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleVitalsSubmit = async (data: VitalCreateData) => {
    if (!visit) return;

    try {
      await createVital.mutateAsync({
        ...data,
        visit_id: visit.id,
        patient_id: visit.patient_id,
      });
      message.success('Vitals recorded successfully');
      setShowVitalsModal(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  // Get current step for timeline
  const getCurrentStep = (status: VisitStatus): number => {
    const steps: VisitStatus[] = ['registered', 'waiting', 'in_progress', 'completed'];
    if (status === 'cancelled') return -1;
    return steps.indexOf(status);
  };

  const getStepStatus = (stepStatus: VisitStatus, currentStatus: VisitStatus) => {
    if (currentStatus === 'cancelled') return 'error';
    const currentIdx = getCurrentStep(currentStatus);
    const stepIdx = getCurrentStep(stepStatus);
    if (stepIdx < currentIdx) return 'finish';
    if (stepIdx === currentIdx) return 'process';
    return 'wait';
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !visit) {
    return (
      <Result
        status="error"
        title="Visit Not Found"
        subTitle="The visit you're looking for doesn't exist or has been deleted."
        extra={
          <Button type="primary" onClick={() => navigate('/visits')}>
            Back to Visits
          </Button>
        }
      />
    );
  }

  const canEdit = !['completed', 'cancelled'].includes(visit.status);

  return (
    <>
      <Space vertical size="large" style={{ width: '100%' }}>
        {/* Header Card */}
        <Card>
          <Row justify="space-between" align="top" gutter={[16, 16]}>
            <Col>
              <Space vertical size={0}>
                <Space>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/visits')}
                    type="text"
                  />
                  <Title level={3} style={{ margin: 0 }}>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {visit.visit_number}
                  </Title>
                  <VisitStatusBadge status={visit.status} />
                  <VisitPriorityBadge priority={visit.priority} />
                </Space>
                <Text type="secondary" style={{ marginLeft: 32 }}>
                  Created: {dayjs(visit.created_at).format(DATE_TIME_FORMAT)}
                </Text>
              </Space>
            </Col>
            <Col>
              <Space>
                {canEdit && (
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/visits/${visit.id}/edit`)}
                  >
                    Edit Visit
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Status Actions */}
        {canEdit && (
          <Card size="small">
            <Space>
              <Text strong>Actions:</Text>
              <VisitStatusActions
                visit={visit}
                onStatusChange={handleStatusChange}
                onCancelClick={() => setShowCancelModal(true)}
                loading={updateStatus.isPending}
              />
            </Space>
          </Card>
        )}

        {/* Patient Context Header - Sticky across all tabs */}
        {visit.patient && (
          <PatientContextHeader
            patient={visit.patient}
            visit={visit}
            allergies={[]} // TODO: Add allergies from patient data when available
            showVisitInfo={true}
          />
        )}

        <Row gutter={[16, 16]}>
          {/* Left Column - Main Content */}
          <Col xs={24} lg={16}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'details',
                  label: (
                    <Space>
                      <MedicineBoxOutlined />
                      Visit Details
                    </Space>
                  ),
                  children: (
                    <>

                      {/* Visit Details */}
                      <Card
                        title={
                          <Space>
                            <MedicineBoxOutlined />
                            Visit Details
                          </Space>
                        }
                      >
                        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                          <Descriptions.Item label="Visit Type">
                            <VisitTypeBadge type={visit.visit_type} />
                          </Descriptions.Item>
                          <Descriptions.Item label="Priority">
                            <VisitPriorityBadge priority={visit.priority} showLabel />
                          </Descriptions.Item>
                          <Descriptions.Item label="Visit Date">
                            {dayjs(visit.visit_date).format(DATE_FORMAT)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Department">
                            {visit.department || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Assigned Doctor">
                            {visit.assigned_doctor?.full_name || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Check-in Time">
                            {visit.check_in_time
                              ? dayjs(visit.check_in_time).format(TIME_FORMAT)
                              : '-'}
                          </Descriptions.Item>
                          {visit.consultation_start_time && (
                            <Descriptions.Item label="Consultation Start">
                              {dayjs(visit.consultation_start_time).format(TIME_FORMAT)}
                            </Descriptions.Item>
                          )}
                          {visit.consultation_end_time && (
                            <Descriptions.Item label="Consultation End">
                              {dayjs(visit.consultation_end_time).format(TIME_FORMAT)}
                            </Descriptions.Item>
                          )}
                        </Descriptions>

                        {visit.chief_complaint && (
                          <>
                            <Divider style={{ textAlign: 'left' }}>
                              Chief Complaint
                            </Divider>
                            <Text>{visit.chief_complaint}</Text>
                          </>
                        )}

                        {visit.notes && (
                          <>
                            <Divider style={{ textAlign: 'left' }}>
                              Notes
                            </Divider>
                            <Text>{visit.notes}</Text>
                          </>
                        )}

                        {visit.status === 'cancelled' && visit.cancellation_reason && (
                          <>
                            <Divider orientationMargin={0} style={{ textAlign: 'left' }}>
                              <Text type="danger">Cancellation Reason</Text>
                            </Divider>
                            <Text type="danger">{visit.cancellation_reason}</Text>
                          </>
                        )}
                      </Card>
                    </>
                  ),
                },
                {
                  key: 'vitals',
                  label: (
                    <Space>
                      <HeartOutlined />
                      Vitals
                    </Space>
                  ),
                  children: (
                    <Card
                      title={
                        <Space>
                          <HeartOutlined />
                          Vital Signs
                        </Space>
                      }
                      extra={
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setShowVitalsModal(true)}
                          disabled={['completed', 'cancelled'].includes(visit.status)}
                        >
                          Record Vitals
                        </Button>
                      }
                    >
                      {vitalsLoading ? (
                        <Spin />
                      ) : vitals && vitals.length > 0 ? (
                        <VitalsList 
                          vitals={vitals}
                          patientName={visit.patient?.full_name || visit.patient_name}
                        />
                      ) : (
                        <Result
                          status="info"
                          title="No Vitals Recorded"
                          subTitle="Click the 'Record Vitals' button to add vital signs for this visit."
                        />
                      )}
                    </Card>
                  ),
                },
                {
                  key: 'diagnoses',
                  label: (
                    <Space>
                      <MedicineBoxOutlined />
                      Diagnoses
                    </Space>
                  ),
                  children: (
                    <DiagnosisList
                      visitId={visit.id}
                      patientId={visit.patient_id}
                      patientName={visit.patient?.full_name || visit.patient_name}
                      patientMrn={visit.patient?.mrn}
                      patientDateOfBirth={visit.patient?.date_of_birth}
                      patientGender={visit.patient?.gender}
                      canEdit={!['completed', 'cancelled'].includes(visit.status)}
                      canDelete={(() => {
                        const canDel = userRole === 'doctor' && !['completed', 'cancelled'].includes(visit.status);
                        console.log('VisitDetail - canDelete calculation:', {
                          userRole,
                          visitStatus: visit.status,
                          isDoctor: userRole === 'doctor',
                          isNotCompletedOrCancelled: !['completed', 'cancelled'].includes(visit.status),
                          canDelete: canDel
                        });
                        return canDel;
                      })()}
                    />
                  ),
                },
                {
                  key: 'clinical-notes',
                  label: (
                    <Space>
                      <FileTextOutlined />
                      Clinical Notes
                    </Space>
                  ),
                  children: (
                    <ClinicalNotesList
                      visitId={visit.id}
                      patientId={visit.patient_id}
                      patientName={visit.patient?.full_name || visit.patient_name}
                      patientMrn={visit.patient?.mrn}
                      patientDateOfBirth={visit.patient?.date_of_birth}
                      patientGender={visit.patient?.gender}
                      canEdit={userRole === 'doctor' && !['completed', 'cancelled'].includes(visit.status)}
                    />
                  ),
                },
                {
                  key: 'orders',
                  label: (
                    <Space>
                      <ExperimentOutlined />
                      Orders
                    </Space>
                  ),
                  children: (
                    <Card
                      title={
                        <Space>
                          <ExperimentOutlined />
                          Orders
                        </Space>
                      }
                      extra={
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setShowOrderModal(true)}
                          disabled={['completed', 'cancelled'].includes(visit.status)}
                        >
                          Create Order
                        </Button>
                      }
                    >
                      {ordersLoading ? (
                        <Spin />
                      ) : orders && orders.length > 0 ? (
                        <OrdersList
                          orders={orders}
                          onViewOrder={(order) => setSelectedOrder(order)}
                        />
                      ) : (
                        <Result
                          status="info"
                          title="No Orders"
                          subTitle="Click the 'Create Order' button to place an order for this visit."
                        />
                      )}
                    </Card>
                  ),
                },
              ]}
            />
          </Col>

          {/* Right Column - Timeline */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  Status Timeline
                </Space>
              }
            >
              {visit.status === 'cancelled' ? (
                <Steps
                  direction="vertical"
                  size="small"
                  current={-1}
                  items={[
                    {
                      title: 'Registered',
                      description: dayjs(visit.created_at).format(DATE_TIME_FORMAT),
                      status: 'finish',
                      icon: <CheckCircleOutlined />,
                    },
                    {
                      title: 'Cancelled',
                      description: dayjs(visit.updated_at).format(DATE_TIME_FORMAT),
                      status: 'error',
                      icon: <CloseCircleOutlined />,
                    },
                  ]}
                />
              ) : (
                <Steps
                  direction="vertical"
                  size="small"
                  current={getCurrentStep(visit.status)}
                  items={[
                    {
                      title: 'Registered',
                      content: dayjs(visit.created_at).format(DATE_TIME_FORMAT),
                      status: getStepStatus('registered', visit.status),
                    },
                    {
                      title: 'Waiting',
                      content: visit.check_in_time
                        ? dayjs(visit.check_in_time).format(DATE_TIME_FORMAT)
                        : 'Pending',
                      status: getStepStatus('waiting', visit.status),
                    },
                    {
                      title: 'In Progress',
                      content: visit.consultation_start_time
                        ? dayjs(visit.consultation_start_time).format(DATE_TIME_FORMAT)
                        : 'Pending',
                      status: getStepStatus('in_progress', visit.status),
                      icon:
                        visit.status === 'in_progress' ? (
                          <SyncOutlined spin />
                        ) : undefined,
                    },
                    {
                      title: 'Completed',
                      content: visit.consultation_end_time
                        ? dayjs(visit.consultation_end_time).format(DATE_TIME_FORMAT)
                        : 'Pending',
                      status: getStepStatus('completed', visit.status),
                    },
                  ]}
                />
              )}

              {/* Wait Time Display */}
              {visit.wait_time_minutes !== undefined && visit.wait_time_minutes > 0 && (
                <>
                  <Divider />
                  <Space>
                    <ClockCircleOutlined />
                    <Text>Wait Time: {visit.wait_time_minutes} min</Text>
                  </Space>
                </>
              )}

              {visit.consultation_duration_minutes !== undefined &&
                visit.consultation_duration_minutes > 0 && (
                  <Space style={{ display: 'block', marginTop: 8 }}>
                    <MedicineBoxOutlined />
                    <Text>
                      Consultation: {visit.consultation_duration_minutes} min
                    </Text>
                  </Space>
                )}
            </Card>
          </Col>
        </Row>
      </Space>

      {/* Cancel Modal */}
      <CancelVisitModal
        open={showCancelModal}
        visit={visit}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
        loading={cancelVisit.isPending}
      />

      {/* Vitals Modal */}
      <Modal
        title={(() => {
          const name = visit.patient?.full_name || visit.patient_name;
          const mrn = visit.patient?.mrn || 'N/A';
          const gender = visit.patient?.gender;
          const age = visit.patient?.date_of_birth ? dayjs().diff(dayjs(visit.patient.date_of_birth), 'year') : null;
          const genderDisplay = gender ? `${gender.charAt(0).toUpperCase()}${gender.slice(1)}` : null;
          const patientInfo = `${name}${genderDisplay ? ` (${genderDisplay}` : ''}${age !== null ? `${genderDisplay ? ', ' : ' ('}${age}y` : ''}${genderDisplay || age !== null ? ')' : ''} [MRN: ${mrn}]`;
          return `Record Vital Signs - ${patientInfo}`;
        })()}
        open={showVitalsModal}
        onCancel={() => setShowVitalsModal(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {visit.patient && (
          <PatientContextHeader
            patient={visit.patient}
            visit={visit}
            showVisitInfo={false}
          />
        )}
        <VitalsForm
          visitId={visit?.id || ''}
          patientId={visit?.patient_id || ''}
          onSubmit={handleVitalsSubmit}
          onCancel={() => setShowVitalsModal(false)}
          loading={createVital.isPending}
        />
      </Modal>

      {/* Order Form Modal */}
      {visit && (
        <OrderFormModal
          open={showOrderModal}
          onCancel={() => setShowOrderModal(false)}
          patientId={visit.patient_id}
          visitId={visit.id}
          patientName={visit.patient?.full_name || visit.patient_name || ''}
          patientAge={visit.patient?.date_of_birth ? dayjs().diff(dayjs(visit.patient.date_of_birth), 'year') : undefined}
          patientGender={visit.patient?.gender}
          patientMRN={visit.patient?.mrn}
        />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        order={selectedOrder}
        patientName={visit.patient?.full_name || visit.patient_name}
        patientMRN={visit.patient?.mrn}
      />
    </>
  );
};

export default VisitDetail;
