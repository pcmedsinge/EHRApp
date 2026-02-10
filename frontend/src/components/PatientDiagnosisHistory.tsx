/**
 * Patient Diagnosis History Component
 * 
 * Display patient's diagnosis history across all visits
 * Phase: 3D (Diagnosis Frontend)
 */

import React from 'react';
import { Card, Timeline, Tag, Space, Typography, Empty, Spin, Collapse } from 'antd';
import { MedicineBoxOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { Diagnosis } from '@/types';
import { getPatientDiagnosisHistory } from '@/services/diagnosisApi';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface PatientDiagnosisHistoryProps {
  patientId: string;
  showTitle?: boolean;
  maxItems?: number;
}

export const PatientDiagnosisHistory: React.FC<PatientDiagnosisHistoryProps> = ({
  patientId,
  showTitle = true,
  maxItems,
}) => {
  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ['patient-diagnosis-history', patientId],
    queryFn: () => getPatientDiagnosisHistory(patientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const displayDiagnoses = maxItems && diagnoses ? diagnoses.slice(0, maxItems) : diagnoses;

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'severe':
        return 'orange';
      case 'moderate':
        return 'gold';
      case 'mild':
        return 'green';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading diagnosis history...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (!diagnoses || diagnoses.length === 0) {
    return (
      <Card>
        <Empty
          description="No diagnosis history available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        showTitle && (
          <Space>
            <ClockCircleOutlined />
            <span>Diagnosis History</span>
            <Tag color="blue">{diagnoses.length}</Tag>
          </Space>
        )
      }
    >
      <Timeline mode="left">
        {displayDiagnoses?.map((diagnosis) => (
          <Timeline.Item
            key={diagnosis.id}
            label={dayjs(diagnosis.diagnosed_date).format('DD MMM YYYY')}
            color={diagnosis.diagnosis_type === 'primary' ? 'blue' : 'gray'}
          >
            <Space direction="vertical" size={4}>
              <Space wrap>
                <Tag color={diagnosis.diagnosis_type === 'primary' ? 'blue' : 'default'}>
                  {diagnosis.diagnosis_type}
                </Tag>
                {diagnosis.icd10_code && (
                  <Tag color="green">{diagnosis.icd10_code}</Tag>
                )}
                {diagnosis.severity && (
                  <Tag color={getSeverityColor(diagnosis.severity)}>
                    {diagnosis.severity}
                  </Tag>
                )}
                <Tag color={diagnosis.status === 'confirmed' ? 'success' : 'warning'}>
                  {diagnosis.status}
                </Tag>
              </Space>
              <Text strong>{diagnosis.diagnosis_description}</Text>
              {diagnosis.notes && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {diagnosis.notes}
                </Text>
              )}
              {diagnosis.diagnosed_by_user && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  By: Dr. {diagnosis.diagnosed_by_user.full_name}
                </Text>
              )}
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>

      {maxItems && diagnoses && diagnoses.length > maxItems && (
        <Text type="secondary" style={{ textAlign: 'center', display: 'block', marginTop: 16 }}>
          Showing {maxItems} of {diagnoses.length} diagnoses
        </Text>
      )}
    </Card>
  );
};
