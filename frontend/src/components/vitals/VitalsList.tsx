import React from 'react';
import { List, Tag, Space, Typography, Card, Row, Col, Divider } from 'antd';
import { 
  HeartOutlined, 
  DashboardOutlined,
  ExperimentOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Vital } from '@/types/vital';
import { getBMICategory, getBMIColor, VITAL_RANGES } from '@/types/vital';

const { Text } = Typography;

interface VitalsListProps {
  vitals: Vital[];
  loading?: boolean;
  patientName?: string;
}

export const VitalsList: React.FC<VitalsListProps> = ({
  vitals,
  loading = false,
  patientName
}) => {
  const isInNormalRange = (value: number | undefined, key: keyof typeof VITAL_RANGES) => {
    if (!value) return null;
    const range = VITAL_RANGES[key];
    if ('normal' in range) {
      return value >= range.normal[0] && value <= range.normal[1];
    }
    return null;
  };

  const VitalValue: React.FC<{ value?: number; unit: string; label: string; rangeKey: keyof typeof VITAL_RANGES }> = 
    ({ value, unit, label, rangeKey }) => {
      if (!value) return null;
      const inRange = isInNormalRange(value, rangeKey);
      return (
        <Col span={8}>
          <Text type="secondary">{label}: </Text>
          <Text strong style={{ color: inRange === false ? '#ff4d4f' : undefined }}>
            {value} {unit}
          </Text>
          {inRange !== null && (
            <Tag color={inRange ? 'green' : 'red'} style={{ marginLeft: 4 }}>
              {inRange ? 'Normal' : 'Abnormal'}
            </Tag>
          )}
        </Col>
      );
    };

  return (
    <div>
      {patientName && (
        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fafafa', borderRadius: '4px' }}>
          <Text strong>Patient: </Text>
          <Text>{patientName}</Text>
        </div>
      )}
      <List
        loading={loading}
        dataSource={vitals}
        locale={{ emptyText: 'No vital signs recorded for this visit' }}
        renderItem={(vital) => {
        const bmiCategory = getBMICategory(vital.bmi);
        const bmiColor = getBMIColor(bmiCategory);

        return (
          <List.Item style={{ display: 'block' }}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">
                    Recorded: {dayjs(vital.recorded_at).format('MMM DD, YYYY HH:mm')}
                  </Text>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                {/* Vital Signs */}
                {(vital.bp_systolic || vital.bp_diastolic || vital.pulse || vital.temperature || vital.spo2 || vital.respiratory_rate) && (
                  <>
                    <Space>
                      <HeartOutlined />
                      <Text strong>Vital Signs</Text>
                    </Space>
                    <Row gutter={[16, 8]}>
                      {vital.bp_systolic && vital.bp_diastolic && (
                        <Col span={8}>
                          <Text type="secondary">BP: </Text>
                          <Text strong>
                            {vital.bp_systolic}/{vital.bp_diastolic} mmHg
                          </Text>
                          {(isInNormalRange(vital.bp_systolic, 'bp_systolic') === false || 
                            isInNormalRange(vital.bp_diastolic, 'bp_diastolic') === false) && (
                            <Tag color="red" style={{ marginLeft: 4 }}>Abnormal</Tag>
                          )}
                        </Col>
                      )}
                      <VitalValue value={vital.pulse} unit="bpm" label="Pulse" rangeKey="pulse" />
                      <VitalValue value={vital.temperature} unit="°C" label="Temp" rangeKey="temperature" />
                      <VitalValue value={vital.spo2} unit="%" label="SpO2" rangeKey="spo2" />
                      <VitalValue value={vital.respiratory_rate} unit="/min" label="RR" rangeKey="respiratory_rate" />
                    </Row>
                  </>
                )}

                {/* Body Measurements */}
                {(vital.height_cm || vital.weight_kg || vital.bmi) && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <Space>
                      <DashboardOutlined />
                      <Text strong>Body Measurements</Text>
                    </Space>
                    <Row gutter={[16, 8]}>
                      {vital.height_cm && (
                        <Col span={8}>
                          <Text type="secondary">Height: </Text>
                          <Text strong>{vital.height_cm} cm</Text>
                        </Col>
                      )}
                      {vital.weight_kg && (
                        <Col span={8}>
                          <Text type="secondary">Weight: </Text>
                          <Text strong>{vital.weight_kg} kg</Text>
                        </Col>
                      )}
                      {vital.bmi && (
                        <Col span={8}>
                          <Text type="secondary">BMI: </Text>
                          <Text strong style={{ color: bmiColor }}>{vital.bmi}</Text>
                          {bmiCategory && (
                            <Tag color={bmiColor} style={{ marginLeft: 4 }}>
                              {bmiCategory.toUpperCase()}
                            </Tag>
                          )}
                        </Col>
                      )}
                    </Row>
                  </>
                )}

                {/* Blood Sugar */}
                {vital.blood_sugar && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <Space>
                      <ExperimentOutlined />
                      <Text strong>Blood Sugar</Text>
                    </Space>
                    <Row gutter={[16, 8]}>
                      <VitalValue 
                        value={vital.blood_sugar} 
                        unit="mg/dL" 
                        label={vital.blood_sugar_type ? vital.blood_sugar_type.toUpperCase() : 'Blood Sugar'} 
                        rangeKey="blood_sugar" 
                      />
                    </Row>
                  </>
                )}

                {/* Notes */}
                {vital.notes && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text type="secondary">Notes: </Text>
                    <Text>{vital.notes}</Text>
                  </>
                )}
              </Space>
            </Card>
          </List.Item>
        );
      }}
      />
    </div>
  );
};

export default VitalsList;
