/**
 * Order Detail Modal
 * Phase: 4B (Orders Frontend)
 * View and update order details, status, and add reports
 */

import React, { useState } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Space,
  Button,
  Divider,
  Tabs,
  Form,
  Select,
  Input,
  Popconfirm,
  Alert,
  message,
} from 'antd';
import {
  FileImageOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  EditOutlined,
  StopOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CloudUploadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { Order, OrderStatus } from '@/types/orders';
import {
  useUpdateOrderStatus,
  useCancelOrder,
  useAddOrderReport,
  useOrder,
  orderKeys,
} from '@/hooks/useOrders';
import { DicomUploadModal, DicomViewerModal } from '@/components/dicom';
import { PatientContextHeader } from '@/components/patient';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface OrderDetailModalProps {
  open: boolean;
  onCancel: () => void;
  order: Order | null;
  patientName?: string;
  patientMRN?: string;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  open,
  onCancel,
  order,
  patientName,
  patientMRN,
}) => {
  const [statusForm] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [cancelForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('details');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [viewerModalVisible, setViewerModalVisible] = useState(false);

  const queryClient = useQueryClient();
  
  // Fetch fresh order data to always show latest upload status
  const { data: freshOrder } = useOrder(order?.id || '');
  
  // Use fresh data if available, otherwise fall back to prop
  const currentOrder = freshOrder || order;
  
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const addReportMutation = useAddOrderReport();

  if (!currentOrder) return null;

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGING':
        return <FileImageOutlined style={{ color: '#1890ff' }} />;
      case 'LAB':
        return <ExperimentOutlined style={{ color: '#52c41a' }} />;
      case 'PROCEDURE':
        return <MedicineBoxOutlined style={{ color: '#722ed1' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'ordered':
        return 'default';
      case 'scheduled':
        return 'processing';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'reported':
        return 'cyan';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const values = await statusForm.validateFields();
      await updateStatusMutation.mutateAsync({
        id: currentOrder.id,
        data: {
          status: values.status,
          notes: values.notes,
        },
      });
      statusForm.resetFields();
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleCancelOrder = async () => {
    try {
      const values = await cancelForm.validateFields();
      await cancelOrderMutation.mutateAsync({
        id: currentOrder.id,
        reason: values.cancellation_reason,
      });
      cancelForm.resetFields();
      onCancel();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const handleAddReport = async () => {
    try {
      const values = await reportForm.validateFields();
      await addReportMutation.mutateAsync({
        id: currentOrder.id,
        data: {
          report_text: values.report_text,
          findings: values.findings,
          impression: values.impression,
          result_status: values.result_status,
        },
      });
      reportForm.resetFields();
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to add report:', error);
    }
  };

  const canUpdateStatus = currentOrder.status !== 'cancelled' && currentOrder.status !== 'reported';
  const canAddReport = currentOrder.status === 'completed' || currentOrder.status === 'reported';
  const canCancel = currentOrder.status === 'ordered' || currentOrder.status === 'scheduled';
  const isImagingOrder = currentOrder.order_type === 'IMAGING';
  const hasUploadedImages = currentOrder.study_instance_uid !== null && currentOrder.study_instance_uid !== undefined;

  const handleUploadComplete = () => {
    setUploadModalVisible(false);
    message.success('DICOM images uploaded successfully!');
    
    // Invalidate the specific order query to refetch fresh data
    queryClient.invalidateQueries({ queryKey: orderKeys.detail(currentOrder.id) });
    queryClient.invalidateQueries({ queryKey: orderKeys.all });
  };

  const handleViewImages = () => {
    setViewerModalVisible(true);
  };

  const modalTitle = (
    <Space>
      {getOrderTypeIcon(currentOrder.order_type)}
      <span>
        Order Details - {currentOrder.order_number}
        {(currentOrder.patient || (patientName && patientMRN)) && (
          <span style={{ marginLeft: 12, fontSize: '14px', fontWeight: 'normal', color: '#8c8c8c' }}>
            • {currentOrder.patient ? `${currentOrder.patient.first_name} ${currentOrder.patient.last_name}` : patientName}
            {' '}(MRN: {currentOrder.patient ? currentOrder.patient.mrn : patientMRN})
          </span>
        )}
      </span>
    </Space>
  );

  // Construct patient object for context header
  const patientForHeader = currentOrder.patient ? {
    id: currentOrder.patient_id,
    full_name: `${currentOrder.patient.first_name} ${currentOrder.patient.last_name}`,
    mrn: currentOrder.patient.mrn,
    gender: currentOrder.patient.gender,
    date_of_birth: currentOrder.patient.date_of_birth,
  } : (patientName && patientMRN ? {
    id: currentOrder.patient_id,
    full_name: patientName,
    mrn: patientMRN,
  } : null);

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      {patientForHeader && (
        <PatientContextHeader
          patient={patientForHeader}
          visit={currentOrder.visit}
          showVisitInfo={false}
        />
      )}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* DETAILS TAB */}
        <TabPane tab="Details" key="details">
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Order Number" span={1}>
              <strong>{currentOrder.order_number}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Accession Number" span={1}>
              <strong>{currentOrder.accession_number}</strong>
            </Descriptions.Item>

            <Descriptions.Item label="Order Type" span={1}>
              <Tag color={currentOrder.order_type === 'IMAGING' ? 'blue' : currentOrder.order_type === 'LAB' ? 'green' : 'purple'}>
                {currentOrder.order_type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <Tag color={getStatusColor(currentOrder.status)}>
                {currentOrder.status.replace('_', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Priority" span={1}>
              <Tag color={currentOrder.priority === 'stat' ? 'red' : currentOrder.priority === 'urgent' ? 'orange' : 'blue'}>
                {currentOrder.priority.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ordered Date" span={1}>
              <Space>
                <ClockCircleOutlined />
                {dayjs(currentOrder.ordered_date).format('MMM DD, YYYY HH:mm')}
              </Space>
            </Descriptions.Item>

            {currentOrder.ordered_by_user && (
              <Descriptions.Item label="Ordered By" span={2}>
                <Space>
                  <UserOutlined />
                  {currentOrder.ordered_by_user.full_name} ({currentOrder.ordered_by_user.role})
                </Space>
              </Descriptions.Item>
            )}

            {currentOrder.visit && (
              <Descriptions.Item label="Visit" span={2}>
                Visit #{currentOrder.visit.visit_number} - {currentOrder.visit.visit_type}
              </Descriptions.Item>
            )}

            {currentOrder.clinical_indication && (
              <Descriptions.Item label="Clinical Indication" span={2}>
                {currentOrder.clinical_indication}
              </Descriptions.Item>
            )}

            {currentOrder.special_instructions && (
              <Descriptions.Item label="Special Instructions" span={2}>
                {currentOrder.special_instructions}
              </Descriptions.Item>
            )}

            {/* DICOM Integration Fields */}
            {isImagingOrder && hasUploadedImages && (
              <>
                <Descriptions.Item label="Study Instance UID" span={2}>
                  <code>{currentOrder.study_instance_uid}</code>
                </Descriptions.Item>
                {currentOrder.modality && (
                  <Descriptions.Item label="Modality" span={1}>
                    <Tag color="blue">{currentOrder.modality}</Tag>
                  </Descriptions.Item>
                )}
                {currentOrder.study_date && (
                  <Descriptions.Item label="Study Date" span={1}>
                    {dayjs(currentOrder.study_date, 'YYYYMMDD').format('MMM DD, YYYY')}
                  </Descriptions.Item>
                )}
                {currentOrder.number_of_series && (
                  <Descriptions.Item label="Number of Series" span={1}>
                    {currentOrder.number_of_series}
                  </Descriptions.Item>
                )}
                {currentOrder.number_of_instances && (
                  <Descriptions.Item label="Number of Images" span={1}>
                    {currentOrder.number_of_instances}
                  </Descriptions.Item>
                )}
                {currentOrder.dicom_upload_date && (
                  <Descriptions.Item label="Images Uploaded" span={2}>
                    {dayjs(currentOrder.dicom_upload_date).format('MMM DD, YYYY HH:mm')}
                  </Descriptions.Item>
                )}
              </>
            )}

            {currentOrder.scheduled_date && (
              <>
                <Descriptions.Item label="Scheduled Date" span={1}>
                  {dayjs(currentOrder.scheduled_date).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Location" span={1}>
                  {currentOrder.scheduled_location || '-'}
                </Descriptions.Item>
              </>
            )}

            {currentOrder.performed_date && (
              <Descriptions.Item label="Performed Date" span={2}>
                {dayjs(currentOrder.performed_date).format('MMM DD, YYYY HH:mm')}
                {currentOrder.performing_user && (
                  <span style={{ marginLeft: 12 }}>
                    by {currentOrder.performing_user.full_name}
                  </span>
                )}
              </Descriptions.Item>
            )}

            {currentOrder.cancelled_date && (
              <>
                <Descriptions.Item label="Cancelled Date" span={2}>
                  {dayjs(currentOrder.cancelled_date).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                {currentOrder.cancellation_reason && (
                  <Descriptions.Item label="Cancellation Reason" span={2}>
                    <Alert message={currentOrder.cancellation_reason} type="error" showIcon />
                  </Descriptions.Item>
                )}
              </>
            )}
          </Descriptions>

          {currentOrder.report_text && (
            <>
              <Divider>Report</Divider>
              <Descriptions bordered size="small" column={1}>
                {currentOrder.findings && (
                  <Descriptions.Item label="Findings">
                    {currentOrder.findings}
                  </Descriptions.Item>
                )}
                {currentOrder.impression && (
                  <Descriptions.Item label="Impression">
                    {currentOrder.impression}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Report">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{currentOrder.report_text}</div>
                </Descriptions.Item>
                {currentOrder.result_status && (
                  <Descriptions.Item label="Result Status">
                    <Tag>{currentOrder.result_status}</Tag>
                  </Descriptions.Item>
                )}
                {currentOrder.reported_date && (
                  <Descriptions.Item label="Reported Date">
                    {dayjs(currentOrder.reported_date).format('MMM DD, YYYY HH:mm')}
                    {currentOrder.reporting_user && (
                      <span style={{ marginLeft: 12 }}>
                        by {currentOrder.reporting_user.full_name}
                      </span>
                    )}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}

          {/* DICOM Actions for Imaging Orders */}
          {isImagingOrder && (
            <>
              <Divider>Medical Images</Divider>
              <Space>
                {!hasUploadedImages ? (
                  <Button
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    onClick={() => setUploadModalVisible(true)}
                    disabled={currentOrder.status === 'cancelled'}
                  >
                    Upload DICOM Images
                  </Button>
                ) : (
                  <>
                    <Alert
                      message="Images Available"
                      description={`This order has ${currentOrder.number_of_instances || 0} DICOM images in ${currentOrder.number_of_series || 0} series.`}
                      type="success"
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={handleViewImages}
                      size="large"
                    >
                      View Images
                    </Button>
                    <Button
                      icon={<CloudUploadOutlined />}
                      onClick={() => setUploadModalVisible(true)}
                    >
                      Upload More Images
                    </Button>
                  </>
                )}
              </Space>
            </>
          )}
        </TabPane>

        {/* UPDATE STATUS TAB */}
        {canUpdateStatus && (
          <TabPane tab={<span><EditOutlined />Update Status</span>} key="status">
            <Form form={statusForm} layout="vertical">
              <Form.Item
                label="New Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select new status">
                  {currentOrder.status === 'ordered' && (
                    <>
                      <Select.Option value="scheduled">Scheduled</Select.Option>
                      <Select.Option value="in_progress">In Progress</Select.Option>
                    </>
                  )}
                  {currentOrder.status === 'scheduled' && (
                    <Select.Option value="in_progress">In Progress</Select.Option>
                  )}
                  {currentOrder.status === 'in_progress' && (
                    <Select.Option value="completed">Completed</Select.Option>
                  )}
                  {currentOrder.status === 'completed' && (
                    <Select.Option value="reported">Reported</Select.Option>
                  )}
                </Select>
              </Form.Item>

              <Form.Item label="Notes" name="notes">
                <TextArea rows={3} placeholder="Optional notes..." />
              </Form.Item>

              <Button
                type="primary"
                onClick={handleStatusUpdate}
                loading={updateStatusMutation.isPending}
                block
              >
                Update Status
              </Button>
            </Form>
          </TabPane>
        )}

        {/* ADD REPORT TAB */}
        {canAddReport && (
          <TabPane tab={<span><FileTextOutlined />Add Report</span>} key="report">
            <Form form={reportForm} layout="vertical">
              <Form.Item label="Findings" name="findings">
                <TextArea rows={3} placeholder="Clinical findings..." />
              </Form.Item>

              <Form.Item label="Impression" name="impression">
                <TextArea rows={2} placeholder="Clinical impression..." />
              </Form.Item>

              <Form.Item
                label="Report"
                name="report_text"
                rules={[{ required: true, message: 'Please enter report' }]}
              >
                <TextArea rows={6} placeholder="Detailed report..." />
              </Form.Item>

              <Form.Item label="Result Status" name="result_status">
                <Select placeholder="Select result status" allowClear>
                  <Select.Option value="normal">Normal</Select.Option>
                  <Select.Option value="abnormal">Abnormal</Select.Option>
                  <Select.Option value="critical">Critical</Select.Option>
                </Select>
              </Form.Item>

              <Button
                type="primary"
                onClick={handleAddReport}
                loading={addReportMutation.isPending}
                block
              >
                Add Report
              </Button>
            </Form>
          </TabPane>
        )}

        {/* CANCEL TAB */}
        {canCancel && (
          <TabPane tab={<span><StopOutlined />Cancel Order</span>} key="cancel">
            <Alert
              message="Cancel Order"
              description="Are you sure you want to cancel this order? This action cannot be undone."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={cancelForm} layout="vertical">
              <Form.Item
                label="Cancellation Reason"
                name="cancellation_reason"
                rules={[{ required: true, message: 'Please provide a reason' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Enter reason for cancellation..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Popconfirm
                title="Are you sure you want to cancel this order?"
                onConfirm={handleCancelOrder}
                okText="Yes, Cancel Order"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  loading={cancelOrderMutation.isPending}
                  block
                >
                  Cancel Order
                </Button>
              </Popconfirm>
            </Form>
          </TabPane>
        )}
      </Tabs>

      {/* DICOM Upload Modal */}
      <DicomUploadModal
        open={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        orderId={currentOrder.id}
        patientId={currentOrder.patient_id}
        onUploadComplete={handleUploadComplete}
      />

      {/* DICOM Viewer Modal */}
      {hasUploadedImages && (
        <DicomViewerModal
          open={viewerModalVisible}
          onClose={() => setViewerModalVisible(false)}
          studyUid={currentOrder.study_instance_uid}
          patientName={currentOrder.patient ? `${currentOrder.patient.first_name} ${currentOrder.patient.last_name}` : patientName}
          patientMRN={currentOrder.patient ? currentOrder.patient.mrn : patientMRN}
          title={`DICOM Viewer - ${currentOrder.order_number}`}
        />
      )}
    </Modal>
  );
};
