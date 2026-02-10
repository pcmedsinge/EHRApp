/**
 * Order Form Modal
 * Phase: 4B (Orders Frontend)
 * Handles creation of IMAGING, LAB, and PROCEDURE orders
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  Switch,
  InputNumber,
  Space,
  Alert,
  Divider,
  Row,
  Col,
  Tag,
  Typography,
} from 'antd';
import {
  FileImageOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
  OrderType,
  ImagingOrderCreate,
  LabOrderCreate,
  ProcedureOrderCreate,
} from '@/types/orders';
import {
  useCreateOrder,
  useImagingModalities,
  useBodyParts,
  useLabTests,
  useProcedureTypes,
} from '@/hooks/useOrders';
import { PatientContextHeader } from '@/components/patient';

const { TextArea } = Input;
const { Option } = Select;

interface OrderFormModalProps {
  open: boolean;
  onCancel: () => void;
  patientId: string;
  visitId?: string;
  patientName: string;
  patientMRN?: string;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  open,
  onCancel,
  patientId,
  visitId,
  patientName,
  patientMRN,
}) => {
  const [form] = Form.useForm();
  const [orderType, setOrderType] = useState<OrderType>('IMAGING' as OrderType);

  const createOrderMutation = useCreateOrder();

  // Fetch reference data
  const { data: modalities, isLoading: loadingModalities } = useImagingModalities();
  const { data: bodyParts, isLoading: loadingBodyParts } = useBodyParts();
  const { data: labTests, isLoading: loadingLabTests } = useLabTests();
  const { data: procedureTypes, isLoading: loadingProcedureTypes } = useProcedureTypes();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.resetFields();
      setOrderType('IMAGING');
      form.setFieldsValue({
        priority: 'routine',
        order_type: 'IMAGING',
      });
    }
  }, [open, form]);

  const handleOrderTypeChange = (value: OrderType) => {
    setOrderType(value);
    // Clear type-specific fields
    form.setFieldsValue({
      modality_id: undefined,
      body_part_id: undefined,
      laterality: undefined,
      contrast: undefined,
      num_views: undefined,
      lab_test_ids: undefined,
      specimen_source: undefined,
      collection_datetime: undefined,
      procedure_type_id: undefined,
      anesthesia_type: undefined,
      consent_obtained: undefined,
      estimated_duration: undefined,
    });
  };

  const handleSubmit = async () => {
    try {
      console.log('🔍 Props - patientId:', patientId, 'visitId:', visitId);
      localStorage.setItem('DEBUG_ORDER', `Props: patientId=${patientId}, visitId=${visitId}`);
      
      const values = await form.validateFields();
      console.log('✅ Form validated:', values);
      
      // Base order data
      const baseData = {
        patient_id: patientId,
        visit_id: visitId,
        priority: values.priority,
        clinical_indication: values.clinical_indication,
        special_instructions: values.special_instructions,
        scheduled_date: values.scheduled_date?.toISOString(),
      };
      console.log('📦 Base data:', baseData);
      localStorage.setItem('DEBUG_ORDER', 'Base data: ' + JSON.stringify(baseData));

      let orderData: ImagingOrderCreate | LabOrderCreate | ProcedureOrderCreate;

      // Type-specific data
      if (orderType === 'IMAGING') {
        orderData = {
          ...baseData,
          modality_id: values.modality_id,
          body_part_id: values.body_part_id,
          laterality: values.laterality,
          contrast: values.contrast || false,
          num_views: values.num_views,
        } as ImagingOrderCreate;
      } else if (orderType === 'LAB') {
        orderData = {
          ...baseData,
          lab_test_ids: values.lab_test_ids,
          specimen_source: values.specimen_source,
          collection_datetime: values.collection_datetime?.toISOString(),
        } as LabOrderCreate;
      } else {
        orderData = {
          ...baseData,
          procedure_type_id: values.procedure_type_id,
          anesthesia_type: values.anesthesia_type,
          consent_obtained: values.consent_obtained || false,
          estimated_duration: values.estimated_duration,
        } as ProcedureOrderCreate;
      }

      localStorage.setItem('DEBUG_ORDER', 'Sending: ' + JSON.stringify(orderData));
      await createOrderMutation.mutateAsync(orderData);
      localStorage.setItem('DEBUG_ORDER', 'SUCCESS!');
      form.resetFields();
      onCancel();
    } catch (error) {
      localStorage.setItem('DEBUG_ORDER', 'ERROR: ' + JSON.stringify(error));
      console.error('❌ Error during submission:', error);
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGING':
        return <FileImageOutlined />;
      case 'LAB':
        return <ExperimentOutlined />;
      case 'PROCEDURE':
        return <MedicineBoxOutlined />;
      default:
        return null;
    }
  };

  // Filter body parts based on selected modality
  const selectedModality = form.getFieldValue('modality_id');
  const filteredBodyParts = bodyParts?.filter(bp => {
    if (!selectedModality || !bp.applicable_modalities) return true;
    const modality = modalities?.find(m => m.id === selectedModality);
    return !modality || bp.applicable_modalities.includes(modality.code);
  });

  // Construct patient object for context header
  const patientForHeader = patientName && patientMRN ? {
    id: patientId,
    full_name: patientName,
    mrn: patientMRN,
  } : null;

  const modalTitle = (
    <Space>
      {getOrderTypeIcon(orderType)}
      <span>
        Create Order - {patientName}
        {patientMRN && (
          <Typography.Text type="secondary">
            {' '}(MRN: {patientMRN})
          </Typography.Text>
        )}
      </span>
    </Space>
  );

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Create Order"
      cancelText="Cancel"
      width={800}
      confirmLoading={createOrderMutation.isPending}
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
        initialValues={{
          priority: 'routine',
          order_type: 'IMAGING',
          contrast: false,
          consent_obtained: false,
        }}
      >
        {/* Order Type Selection */}
        <Form.Item
          label="Order Type"
          name="order_type"
          rules={[{ required: true, message: 'Please select order type' }]}
        >
          <Select
            value={orderType}
            onChange={handleOrderTypeChange}
            size="large"
          >
            <Option value="IMAGING">
              <Space>
                <FileImageOutlined />
                Imaging Order
              </Space>
            </Option>
            <Option value="LAB">
              <Space>
                <ExperimentOutlined />
                Lab Order
              </Space>
            </Option>
            <Option value="PROCEDURE">
              <Space>
                <MedicineBoxOutlined />
                Procedure Order
              </Space>
            </Option>
          </Select>
        </Form.Item>

        {/* Priority */}
        <Form.Item
          label="Priority"
          name="priority"
          rules={[{ required: true, message: 'Please select priority' }]}
        >
          <Select>
            <Option value="routine">
              <Tag color="blue">Routine</Tag>
            </Option>
            <Option value="urgent">
              <Tag color="orange">Urgent</Tag>
            </Option>
            <Option value="stat">
              <Tag color="red">STAT</Tag>
            </Option>
          </Select>
        </Form.Item>

        <Divider>
          {orderType === 'IMAGING' && 'Imaging Details'}
          {orderType === 'LAB' && 'Lab Details'}
          {orderType === 'PROCEDURE' && 'Procedure Details'}
        </Divider>

        {/* IMAGING SPECIFIC FIELDS */}
        {orderType === 'IMAGING' && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Modality"
                  name="modality_id"
                  rules={[{ required: true, message: 'Please select modality' }]}
                >
                  <Select
                    placeholder="Select modality"
                    loading={loadingModalities}
                    showSearch
                    optionFilterProp="children"
                  >
                    {modalities?.map(modality => (
                      <Option key={modality.id} value={modality.id}>
                        {modality.code} - {modality.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Body Part" name="body_part_id">
                  <Select
                    placeholder="Select body part"
                    loading={loadingBodyParts}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                  >
                    {filteredBodyParts?.map(part => (
                      <Option key={part.id} value={part.id}>
                        {part.code} - {part.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Laterality" name="laterality">
                  <Select placeholder="Select laterality" allowClear>
                    <Option value="left">Left</Option>
                    <Option value="right">Right</Option>
                    <Option value="bilateral">Bilateral</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Number of Views" name="num_views">
                  <InputNumber
                    min={1}
                    max={10}
                    placeholder="e.g., 2"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Contrast" name="contrast" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* LAB SPECIFIC FIELDS */}
        {orderType === 'LAB' && (
          <>
            <Form.Item
              label="Lab Tests"
              name="lab_test_ids"
              rules={[{ required: true, message: 'Please select at least one test' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select lab tests"
                loading={loadingLabTests}
                showSearch
                optionFilterProp="children"
              >
                {labTests?.map(test => (
                  <Option key={test.id} value={test.id}>
                    <Space>
                      {test.code} - {test.name}
                      {test.fasting_required && <Tag color="orange">Fasting Required</Tag>}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Specimen Source" name="specimen_source">
                  <Select placeholder="Select specimen source" allowClear>
                    <Option value="blood">Blood</Option>
                    <Option value="urine">Urine</Option>
                    <Option value="stool">Stool</Option>
                    <Option value="sputum">Sputum</Option>
                    <Option value="csf">CSF</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Collection Date/Time" name="collection_datetime">
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    placeholder="Select date and time"
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* PROCEDURE SPECIFIC FIELDS */}
        {orderType === 'PROCEDURE' && (
          <>
            <Form.Item
              label="Procedure Type"
              name="procedure_type_id"
              rules={[{ required: true, message: 'Please select procedure type' }]}
            >
              <Select
                placeholder="Select procedure"
                loading={loadingProcedureTypes}
                showSearch
                optionFilterProp="children"
              >
                {procedureTypes?.map(proc => (
                  <Option key={proc.id} value={proc.id}>
                    <Space>
                      {proc.code} - {proc.name}
                      {proc.requires_consent && <Tag color="red">Consent Required</Tag>}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Anesthesia Type" name="anesthesia_type">
                  <Select placeholder="Select anesthesia" allowClear>
                    <Option value="local">Local</Option>
                    <Option value="sedation">Sedation</Option>
                    <Option value="general">General</Option>
                    <Option value="none">None</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Duration (mins)" name="estimated_duration">
                  <InputNumber
                    min={5}
                    max={480}
                    placeholder="60"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Consent Obtained"
                  name="consent_obtained"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Divider>Clinical Information</Divider>

        {/* Clinical Indication */}
        <Form.Item
          label="Clinical Indication"
          name="clinical_indication"
          rules={[
            { required: true, message: 'Please provide clinical indication' },
            { min: 10, message: 'Clinical indication must be at least 10 characters' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Reason for order, symptoms, suspected diagnosis..."
            maxLength={1000}
            showCount
          />
        </Form.Item>

        {/* Special Instructions */}
        <Form.Item label="Special Instructions" name="special_instructions">
          <TextArea
            rows={2}
            placeholder="Any special instructions or precautions..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Divider>Scheduling (Optional)</Divider>

        <Form.Item label="Scheduled Date/Time" name="scheduled_date">
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
            placeholder="Select date and time"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        {!visitId && (
          <Alert
            message="No Active Visit"
            description="This order will be created without an associated visit. Consider creating it from within an active visit."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Modal>
  );
};
