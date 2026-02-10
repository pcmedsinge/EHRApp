/**
 * Diagnosis List Component
 * 
 * Display and manage diagnoses for a visit
 * Phase: 3D (Diagnosis Frontend)
 */

import React, { useState } from 'react';
import {
  Card,
  Tag,
  Space,
  Button,
  Typography,
  Empty,
  Spin,
  Popconfirm,
  message,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { Diagnosis } from '@/types';
import { getVisitDiagnoses, deleteDiagnosis } from '@/services/diagnosisApi';
import { DiagnosisFormModal } from './DiagnosisFormModal';

const { Text, Title } = Typography;

interface DiagnosisListProps {
  visitId: string;
  patientId: string;
  patientName?: string;
  patientMrn?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const DiagnosisList: React.FC<DiagnosisListProps> = ({
  visitId,
  patientId,
  patientName,
  patientMrn,
  patientDateOfBirth,
  patientGender,
  canEdit = true,
  canDelete = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | undefined>();
  const queryClient = useQueryClient();

  // Debug logging
  console.log('DiagnosisList props:', { canEdit, canDelete });
  console.log('canDelete value:', canDelete, 'type:', typeof canDelete);

  // Fetch diagnoses
  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ['visit-diagnoses', visitId],
    queryFn: () => getVisitDiagnoses(visitId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDiagnosis,
    onSuccess: () => {
      message.success('Diagnosis deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['visit-diagnoses', visitId] });
      queryClient.invalidateQueries({ queryKey: ['patient-diagnosis-history', patientId] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to delete diagnosis';
      message.error(errorMsg);
    },
  });

  const hasPrimaryDiagnosis = diagnoses?.some(d => d.diagnosis_type === 'primary');

  const handleAdd = () => {
    setEditingDiagnosis(undefined);
    setIsModalVisible(true);
  };

  const handleEdit = (diagnosis: Diagnosis) => {
    setEditingDiagnosis(diagnosis);
    setIsModalVisible(true);
  };

  const handleDelete = async (diagnosisId: string) => {
    deleteMutation.mutate(diagnosisId);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingDiagnosis(undefined);
  };

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

  const getStatusIcon = (status: string) => {
    return status === 'confirmed' ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <ClockCircleOutlined style={{ color: '#faad14' }} />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading diagnoses...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <Space direction="vertical" size={0}>
            <Space>
              <MedicineBoxOutlined />
              <span>Diagnoses</span>
              {diagnoses && diagnoses.length > 0 && (
                <Tag color="blue">{diagnoses.length}</Tag>
              )}
            </Space>
            {patientName && (
              <Text type="secondary" style={{ fontSize: '12px' }}>Patient: {patientName}</Text>
            )}
          </Space>
        }
        extra={
          canEdit && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Diagnosis
            </Button>
          )
        }
      >
        {!diagnoses || diagnoses.length === 0 ? (
          <Empty
            description="No diagnoses recorded yet. Click 'Add Diagnosis' above to record the first diagnosis (will be marked as Primary)."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {diagnoses.map((diagnosis) => (
              <Card
                key={diagnosis.id}
                size="small"
                actions={[
                  ...(canEdit
                    ? [
                        <Button
                          key="edit"
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(diagnosis)}
                        >
                          Edit
                        </Button>,
                      ]
                    : []),
                  ...(canDelete
                    ? [
                        <Popconfirm
                          key="delete"
                          title="Delete Diagnosis"
                          description="Are you sure you want to delete this diagnosis?"
                          onConfirm={() => handleDelete(diagnosis.id)}
                          okText="Yes"
                          cancelText="No"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            loading={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                        </Popconfirm>,
                      ]
                    : []),
                ]}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div>
                    {diagnosis.diagnosis_type === 'primary' ? (
                      <ExclamationCircleOutlined
                        style={{ fontSize: 24, color: '#1890ff' }}
                      />
                    ) : (
                      <MedicineBoxOutlined
                        style={{ fontSize: 24, color: '#8c8c8c' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Space vertical size={4} style={{ width: '100%' }}>
                      <Space wrap>
                        <Tag
                          color={diagnosis.diagnosis_type === 'primary' ? 'blue' : 'default'}
                        >
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
                        <Space size={4}>
                          {getStatusIcon(diagnosis.status)}
                          <Text type="secondary">{diagnosis.status}</Text>
                        </Space>
                      </Space>
                      <Text strong>{diagnosis.diagnosis_description}</Text>
                      <Space vertical size={4} style={{ marginTop: 8 }}>
                        <Space separator="•">
                          <Text type="secondary">
                            Diagnosed: {dayjs(diagnosis.diagnosed_date).format('DD MMM YYYY')}
                          </Text>
                          {diagnosis.onset_date && (
                            <Text type="secondary">
                              Onset: {dayjs(diagnosis.onset_date).format('DD MMM YYYY')}
                            </Text>
                          )}
                          {diagnosis.diagnosed_by_user && (
                            <Text type="secondary">
                              by Dr. {diagnosis.diagnosed_by_user.full_name}
                            </Text>
                          )}
                        </Space>
                        {diagnosis.notes && (
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            📝 {diagnosis.notes}
                          </Text>
                        )}
                      </Space>
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Diagnosis Form Modal */}
      <DiagnosisFormModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        visitId={visitId}
        patientId={patientId}
        patientName={patientName}
        patientMrn={patientMrn}
        patientDateOfBirth={patientDateOfBirth}
        patientGender={patientGender}
        diagnosis={editingDiagnosis}
        hasPrimaryDiagnosis={hasPrimaryDiagnosis}
      />
    </>
  );
};
