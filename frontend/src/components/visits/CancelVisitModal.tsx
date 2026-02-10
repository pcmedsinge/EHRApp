/**
 * Cancel Visit Modal Component
 * ============================
 * 
 * Purpose:
 *   Confirmation modal with reason input for visit cancellation.
 * 
 * Module: src/components/visits/CancelVisitModal.tsx
 * Phase: 2E (Frontend - Visit Detail Pages)
 * 
 * References:
 *   - Phase 2E Spec: docs/phases/phase2/Phase2E_Frontend_VisitDetail.md
 */

import { useState, useEffect } from 'react';
import { Modal, Input, Typography, Space, Alert } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { Visit } from '@/types';
import { colors } from '@/theme';

const { TextArea } = Input;
const { Text } = Typography;

interface CancelVisitModalProps {
  open: boolean;
  visit: Visit | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CancelVisitModal: React.FC<CancelVisitModalProps> = ({
  open,
  visit,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setReason('');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      setError('Please provide a reason (minimum 10 characters)');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  if (!visit) return null;

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: colors.error.main }} />
          <span>Cancel Visit</span>
        </Space>
      }
      open={open}
      onOk={handleConfirm}
      onCancel={onCancel}
      okText="Cancel Visit"
      cancelText="Keep Visit"
      okButtonProps={{
        danger: true,
        loading,
        disabled: reason.trim().length < 10,
      }}
      maskClosable={!loading}
      closable={!loading}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Alert
          type="warning"
          showIcon
          message="This action cannot be undone"
          description={
            <Text>
              You are about to cancel visit <strong>{visit.visit_number}</strong>
              {visit.patient?.full_name && (
                <> for patient <strong>{visit.patient.full_name}</strong></>
              )}.
            </Text>
          }
        />

        <div>
          <Text strong>Cancellation Reason</Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            Please provide a reason for cancelling this visit (minimum 10 characters)
          </Text>
          <TextArea
            placeholder="e.g., Patient requested cancellation, Patient did not show up..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim().length >= 10) {
                setError('');
              }
            }}
            rows={3}
            maxLength={500}
            showCount
            status={error ? 'error' : undefined}
          />
          {error && (
            <Text type="danger" style={{ fontSize: 12 }}>
              {error}
            </Text>
          )}
        </div>
      </Space>
    </Modal>
  );
};

export default CancelVisitModal;
