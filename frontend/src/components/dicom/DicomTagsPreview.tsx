/**
 * DicomTagsPreview Component
 * ==========================
 * 
 * Displays DICOM tags in a table with editing capabilities.
 * Allows users to view and modify tags before uploading to Orthanc.
 * 
 * Module: frontend/src/components/dicom/DicomTagsPreview.tsx
 * Phase: 5B (Upload Frontend)
 */

import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Tag, Typography, Alert } from 'antd';
import { EditOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DicomTags } from '@/types/dicom';

const { Text } = Typography;

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface DicomTagsPreviewProps {
  tags: DicomTags;
  onTagsModified?: (modifiedTags: Partial<DicomTags>) => void;
  readOnly?: boolean;
  showValidation?: boolean;
  patientName?: string;
  patientMRN?: string;
}

interface TagRow {
  key: string;
  tagName: string;
  tagValue: string | undefined;
  isRequired: boolean;
  description: string;
  editable: boolean;
}

// ============================================================================
// TAG METADATA
// ============================================================================

const TAG_METADATA: Record<string, { description: string; required: boolean; editable: boolean }> = {
  PatientID: {
    description: 'Unique patient identifier (MRN)',
    required: true,
    editable: true,
  },
  PatientName: {
    description: 'Patient full name',
    required: true,
    editable: true,
  },
  PatientBirthDate: {
    description: 'Patient date of birth (YYYYMMDD)',
    required: true,
    editable: true,
  },
  PatientSex: {
    description: 'Patient gender (M/F/O)',
    required: false,
    editable: true,
  },
  StudyInstanceUID: {
    description: 'Unique study identifier',
    required: true,
    editable: false,
  },
  StudyDate: {
    description: 'Study date (YYYYMMDD)',
    required: true,
    editable: true,
  },
  StudyTime: {
    description: 'Study time (HHMMSS)',
    required: false,
    editable: true,
  },
  StudyDescription: {
    description: 'Description of the study',
    required: false,
    editable: true,
  },
  AccessionNumber: {
    description: 'Accession number for the order',
    required: true,
    editable: true,
  },
  Modality: {
    description: 'Imaging modality (CR, CT, MR, etc.)',
    required: true,
    editable: true,
  },
  SeriesInstanceUID: {
    description: 'Unique series identifier',
    required: true,
    editable: false,
  },
  SeriesNumber: {
    description: 'Series number within study',
    required: false,
    editable: true,
  },
  InstanceNumber: {
    description: 'Instance number within series',
    required: false,
    editable: true,
  },
  SOPInstanceUID: {
    description: 'Unique instance identifier',
    required: true,
    editable: false,
  },
  InstitutionName: {
    description: 'Name of institution',
    required: false,
    editable: true,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

const DicomTagsPreview: React.FC<DicomTagsPreviewProps> = ({
  tags,
  onTagsModified,
  readOnly = false,
  showValidation = true,
  patientName,
  patientMRN,
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Convert tags to table data
  const tableData: TagRow[] = Object.entries(TAG_METADATA).map(([key, metadata]) => ({
    key,
    tagName: key,
    tagValue: tags[key as keyof DicomTags],
    isRequired: metadata.required,
    description: metadata.description,
    editable: metadata.editable,
  }));

  // Validate tags
  const validateTags = (): { isValid: boolean; missingRequired: string[] } => {
    const missingRequired = tableData
      .filter(row => row.isRequired && !row.tagValue)
      .map(row => row.tagName);
    
    return {
      isValid: missingRequired.length === 0,
      missingRequired,
    };
  };

  const validation = showValidation ? validateTags() : { isValid: true, missingRequired: [] };

  // Handle edit click
  const handleEdit = (tagName: string, currentValue: string | undefined) => {
    setEditingTag(tagName);
    form.setFieldsValue({ value: currentValue || '' });
    setEditModalVisible(true);
  };

  // Handle edit submit
  const handleEditSubmit = () => {
    form.validateFields().then((values) => {
      if (editingTag && onTagsModified) {
        onTagsModified({
          [editingTag]: values.value,
        });
      }
      setEditModalVisible(false);
      setEditingTag(null);
      form.resetFields();
    });
  };

  // Table columns
  const columns: ColumnsType<TagRow> = [
    {
      title: 'Tag Name',
      dataIndex: 'tagName',
      key: 'tagName',
      width: 200,
      render: (text: string, record: TagRow) => (
        <Space>
          <Text strong>{text}</Text>
          {record.isRequired && (
            <Tag color="red" style={{ margin: 0 }}>Required</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'tagValue',
      key: 'tagValue',
      render: (value: string | undefined, record: TagRow) => {
        if (!value) {
          return (
            <Text type="secondary" italic>
              {record.isRequired ? 'Missing (Required)' : 'Not set'}
            </Text>
          );
        }
        return <Text>{value}</Text>;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (_: any, record: TagRow) => {
        if (record.isRequired && !record.tagValue) {
          return <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />;
        }
        if (record.tagValue) {
          return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
        }
        return null;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: any, record: TagRow) => {
        if (!record.editable || readOnly) {
          return <Text type="secondary">Read-only</Text>;
        }
        return (
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.tagName, record.tagValue)}
          >
            Edit
          </Button>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Validation Alert */}
      {showValidation && !validation.isValid && (
        <Alert
          message="Missing Required Tags"
          description={
            <div>
              The following required DICOM tags are missing:
              <ul>
                {validation.missingRequired.map(tag => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              Please ensure all required tags have values before uploading.
            </div>
          }
          type="error"
          showIcon
        />
      )}

      {/* Tags Table */}
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        size="small"
        bordered
      />

      {/* Edit Modal */}
      <Modal
        title={
          patientName && patientMRN
            ? `Edit ${editingTag} - ${patientName} (MRN: ${patientMRN})`
            : `Edit ${editingTag}`
        }
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingTag(null);
          form.resetFields();
        }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tag Value"
            name="value"
            rules={[
              {
                required: editingTag ? TAG_METADATA[editingTag]?.required : false,
                message: 'This tag is required',
              },
            ]}
          >
            <Input placeholder="Enter tag value" />
          </Form.Item>
          {editingTag && (
            <Alert
              message={TAG_METADATA[editingTag]?.description}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>
      </Modal>
    </Space>
  );
};

export default DicomTagsPreview;
