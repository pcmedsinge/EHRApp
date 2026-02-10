import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  Space, 
  Card, 
  Row, 
  Col, 
  Tag,
  Typography,
  Divider,
  Select
} from 'antd';
import { HeartOutlined, DashboardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { VitalCreateData } from '@/types/vital';
import { VITAL_RANGES, getBMICategory, getBMIColor } from '@/types/vital';

const { TextArea } = Input;
const { Text } = Typography;

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
  loading = false
}) => {
  const [form] = Form.useForm();
  const [bmi, setBmi] = useState<number | null>(null);

  // Calculate BMI when height or weight changes
  const handleValuesChange = (_changedValues: any, allValues: any) => {
    const { height_cm, weight_kg } = allValues;
    if (height_cm && weight_kg && height_cm > 0) {
      const heightM = height_cm / 100;
      const calculatedBmi = weight_kg / (heightM * heightM);
      setBmi(Math.round(calculatedBmi * 100) / 100);
    } else {
      setBmi(null);
    }
  };

  const handleSubmit = (values: any) => {
    const vitalData: VitalCreateData = {
      visit_id: visitId,
      patient_id: patientId,
      ...values,
      recorded_at: dayjs().toISOString(),
    };
    onSubmit(vitalData);
  };

  const isInNormalRange = (value: number | undefined, key: keyof typeof VITAL_RANGES) => {
    if (!value) return null;
    const range = VITAL_RANGES[key];
    if ('normal' in range) {
      return value >= range.normal[0] && value <= range.normal[1];
    }
    return null;
  };

  const getStatusTag = (value: number | undefined, key: keyof typeof VITAL_RANGES) => {
    const inRange = isInNormalRange(value, key);
    if (inRange === null) return null;
    return inRange ? (
      <Tag color="green">Normal</Tag>
    ) : (
      <Tag color="red">Abnormal</Tag>
    );
  };

  const bmiCategory = getBMICategory(bmi || undefined);
  const bmiColor = getBMIColor(bmiCategory);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={handleValuesChange}
      initialValues={{}}
    >
      {/* Blood Pressure & Pulse */}
      <Card title={<Space><HeartOutlined />Vital Signs</Space>} size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="BP Systolic (mmHg)"
              name="bp_systolic"
              rules={[
                { type: 'number', min: VITAL_RANGES.bp_systolic.min, max: VITAL_RANGES.bp_systolic.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="120"
                min={VITAL_RANGES.bp_systolic.min}
                max={VITAL_RANGES.bp_systolic.max}
              />
            </Form.Item>
            {form.getFieldValue('bp_systolic') && getStatusTag(form.getFieldValue('bp_systolic'), 'bp_systolic')}
          </Col>
          <Col span={8}>
            <Form.Item
              label="BP Diastolic (mmHg)"
              name="bp_diastolic"
              rules={[
                { type: 'number', min: VITAL_RANGES.bp_diastolic.min, max: VITAL_RANGES.bp_diastolic.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="80"
                min={VITAL_RANGES.bp_diastolic.min}
                max={VITAL_RANGES.bp_diastolic.max}
              />
            </Form.Item>
            {form.getFieldValue('bp_diastolic') && getStatusTag(form.getFieldValue('bp_diastolic'), 'bp_diastolic')}
          </Col>
          <Col span={8}>
            <Form.Item
              label="Pulse (bpm)"
              name="pulse"
              rules={[
                { type: 'number', min: VITAL_RANGES.pulse.min, max: VITAL_RANGES.pulse.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="75"
                min={VITAL_RANGES.pulse.min}
                max={VITAL_RANGES.pulse.max}
              />
            </Form.Item>
            {form.getFieldValue('pulse') && getStatusTag(form.getFieldValue('pulse'), 'pulse')}
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Temperature (°C)"
              name="temperature"
              rules={[
                { type: 'number', min: VITAL_RANGES.temperature.min, max: VITAL_RANGES.temperature.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="37.0"
                step={0.1}
                min={VITAL_RANGES.temperature.min}
                max={VITAL_RANGES.temperature.max}
              />
            </Form.Item>
            {form.getFieldValue('temperature') && getStatusTag(form.getFieldValue('temperature'), 'temperature')}
          </Col>
          <Col span={8}>
            <Form.Item
              label="SpO2 (%)"
              name="spo2"
              rules={[
                { type: 'number', min: VITAL_RANGES.spo2.min, max: VITAL_RANGES.spo2.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="98"
                min={VITAL_RANGES.spo2.min}
                max={VITAL_RANGES.spo2.max}
              />
            </Form.Item>
            {form.getFieldValue('spo2') && getStatusTag(form.getFieldValue('spo2'), 'spo2')}
          </Col>
          <Col span={8}>
            <Form.Item
              label="Respiratory Rate"
              name="respiratory_rate"
              rules={[
                { type: 'number', min: VITAL_RANGES.respiratory_rate.min, max: VITAL_RANGES.respiratory_rate.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="16"
                min={VITAL_RANGES.respiratory_rate.min}
                max={VITAL_RANGES.respiratory_rate.max}
              />
            </Form.Item>
            {form.getFieldValue('respiratory_rate') && getStatusTag(form.getFieldValue('respiratory_rate'), 'respiratory_rate')}
          </Col>
        </Row>
      </Card>

      {/* Body Measurements */}
      <Card title={<Space><DashboardOutlined />Body Measurements</Space>} size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Height (cm)"
              name="height_cm"
              rules={[
                { type: 'number', min: VITAL_RANGES.height_cm.min, max: VITAL_RANGES.height_cm.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="170"
                step={0.1}
                min={VITAL_RANGES.height_cm.min}
                max={VITAL_RANGES.height_cm.max}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Weight (kg)"
              name="weight_kg"
              rules={[
                { type: 'number', min: VITAL_RANGES.weight_kg.min, max: VITAL_RANGES.weight_kg.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="70"
                step={0.1}
                min={VITAL_RANGES.weight_kg.min}
                max={VITAL_RANGES.weight_kg.max}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <div style={{ padding: '8px 0' }}>
              <Text type="secondary">BMI (Auto-calculated)</Text>
              <div style={{ marginTop: 8 }}>
                {bmi !== null ? (
                  <>
                    <Text strong style={{ fontSize: 24, color: bmiColor }}>
                      {bmi}
                    </Text>
                    {bmiCategory && (
                      <Tag color={bmiColor} style={{ marginLeft: 8 }}>
                        {bmiCategory.toUpperCase()}
                      </Tag>
                    )}
                  </>
                ) : (
                  <Text type="secondary">Enter height & weight</Text>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Blood Sugar */}
      <Card title="Blood Sugar" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Blood Sugar (mg/dL)"
              name="blood_sugar"
              rules={[
                { type: 'number', min: VITAL_RANGES.blood_sugar.min, max: VITAL_RANGES.blood_sugar.max }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="100"
                min={VITAL_RANGES.blood_sugar.min}
                max={VITAL_RANGES.blood_sugar.max}
              />
            </Form.Item>
            {form.getFieldValue('blood_sugar') && getStatusTag(form.getFieldValue('blood_sugar'), 'blood_sugar')}
          </Col>
          <Col span={12}>
            <Form.Item
              label="Type"
              name="blood_sugar_type"
              rules={[
                {
                  validator: (_, value) => {
                    const bloodSugar = form.getFieldValue('blood_sugar');
                    if (bloodSugar && !value) {
                      return Promise.reject('Please select blood sugar type');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Select placeholder="Select type" allowClear>
                <Select.Option value="fasting">Fasting</Select.Option>
                <Select.Option value="random">Random</Select.Option>
                <Select.Option value="pp">Post Prandial (PP)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Notes */}
      <Form.Item label="Notes" name="notes">
        <TextArea rows={3} placeholder="Any additional observations..." />
      </Form.Item>

      <Divider />

      {/* Actions */}
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Record Vitals
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default VitalsForm;
