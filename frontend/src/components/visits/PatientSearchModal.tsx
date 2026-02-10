/**
 * Patient Search Modal Component
 * ==============================
 * 
 * Purpose:
 *   Modal for searching and selecting a patient when creating a visit.
 * 
 * Module: src/components/visits/PatientSearchModal.tsx
 * Phase: 2D (Frontend - Visit Pages)
 * 
 * References:
 *   - Phase 2D Spec: docs/phases/phase2/Phase2D_Frontend_VisitPages.md
 */

import { useState, useEffect } from 'react';
import { Modal, Input, List, Button, Space, Typography, Empty, Spin, Avatar } from 'antd';
import { SearchOutlined, UserOutlined, CheckOutlined } from '@ant-design/icons';
import { usePatients } from '@/hooks/usePatients';
import type { Patient } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

const { Text } = Typography;

interface PatientSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
}

const PatientSearchModal: React.FC<PatientSearchModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, isLoading } = usePatients({
    search: debouncedSearch,
    size: 20,
  });

  // Clear search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  const handleSelect = (patient: Patient) => {
    onSelect(patient);
    onClose();
  };

  return (
    <Modal
      title="Select Patient"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Input
          placeholder="Search by name, MRN, or phone..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
          autoFocus
          allowClear
        />

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip="Searching..." />
          </div>
        ) : data?.items?.length === 0 ? (
          <Empty
            description={
              searchTerm
                ? 'No patients found matching your search'
                : 'Start typing to search for patients'
            }
          />
        ) : (
          <List
            dataSource={data?.items || []}
            style={{ maxHeight: 400, overflow: 'auto' }}
            renderItem={(patient) => (
              <List.Item
                key={patient.id}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderRadius: 8,
                  marginBottom: 8,
                  border: '1px solid #f0f0f0',
                }}
                onClick={() => handleSelect(patient)}
                actions={[
                  <Button
                    key="select"
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(patient);
                    }}
                  >
                    Select
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                  }
                  title={
                    <Space>
                      <span style={{ fontWeight: 600 }}>{patient.full_name}</span>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        MRN: {patient.mrn}
                      </Text>
                    </Space>
                  }
                  description={
                    <Space split="•">
                      <Text type="secondary">{patient.age}Y / {patient.gender?.charAt(0).toUpperCase()}</Text>
                      <Text type="secondary">{patient.phone}</Text>
                      {patient.city && <Text type="secondary">{patient.city}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>
    </Modal>
  );
};

export default PatientSearchModal;
