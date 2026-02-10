/**
 * Clinical Note Form Component
 * 
 * SOAP format clinical note entry with auto-save and templates
 * Phase: 3F (Clinical Notes Frontend)
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Tabs,
  Space,
  Select,
  Switch,
  Card,
  Typography,
  Alert,
  Tooltip,
  message as antdMessage
} from 'antd';
import {
  SaveOutlined,
  LockOutlined,
  UnlockOutlined,
  FileTextOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useCreateClinicalNote, useUpdateClinicalNote, useLockClinicalNote, useNoteTemplates } from '@/hooks/useClinicalNotes';
import type { ClinicalNote, ClinicalNoteCreate, ClinicalNoteUpdate } from '@/types/clinicalNote';

const { TextArea } = Input;
const { Text } = Typography;

interface ClinicalNoteFormProps {
  visitId: string;
  patientId: string;
  existingNote?: ClinicalNote;
  isPrimary?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ClinicalNoteForm: React.FC<ClinicalNoteFormProps> = ({
  visitId,
  patientId,
  existingNote,
  isPrimary = true,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('subjective');
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  
  const createMutation = useCreateClinicalNote();
  const updateMutation = useUpdateClinicalNote();
  const lockMutation = useLockClinicalNote();
  const { data: templates } = useNoteTemplates('soap');

  const isEditing = !!existingNote;
  const isLocked = existingNote?.is_locked || false;
  const canEdit = !isLocked;

  // Load existing note data
  useEffect(() => {
    if (existingNote) {
      form.setFieldsValue({
        title: existingNote.title,
        note_type: existingNote.note_type,
        subjective: existingNote.subjective,
        objective: existingNote.objective,
        assessment: existingNote.assessment,
        plan: existingNote.plan
      });
    }
  }, [existingNote, form]);

  // Apply template
  const handleTemplateSelect = (templateId: string | undefined) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;

    const template = templates?.find(t => t.id === templateId);
    if (template) {
      form.setFieldsValue({
        subjective: template.subjective_template || form.getFieldValue('subjective'),
        objective: template.objective_template || form.getFieldValue('objective'),
        assessment: template.assessment_template || form.getFieldValue('assessment'),
        plan: template.plan_template || form.getFieldValue('plan')
      });
      antdMessage.success(`Applied template: ${template.name}`);
    }
  };

  // Save note
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (isEditing && existingNote) {
        // Update existing note
        const updateData: ClinicalNoteUpdate = {
          title: values.title,
          note_type: values.note_type,
          subjective: values.subjective,
          objective: values.objective,
          assessment: values.assessment,
          plan: values.plan
        };
        await updateMutation.mutateAsync({ noteId: existingNote.id, data: updateData });
      } else {
        // Create new note
        const createData: ClinicalNoteCreate = {
          visit_id: visitId,
          patient_id: patientId,
          is_primary: isPrimary,
          title: values.title,
          note_type: values.note_type || 'soap',
          subjective: values.subjective,
          objective: values.objective,
          assessment: values.assessment,
          plan: values.plan,
          template_id: selectedTemplate
        };
        await createMutation.mutateAsync(createData);
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to save clinical note:', error);
    }
  };

  // Lock/Sign note
  const handleLock = async (lock: boolean) => {
    if (!existingNote) return;
    
    try {
      await lockMutation.mutateAsync({ noteId: existingNote.id, lock });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to lock/unlock note:', error);
    }
  };

  const tabItems = [
    {
      key: 'subjective',
      label: (
        <Space>
          <FileTextOutlined />
          Subjective
          <Tooltip title="Patient's complaints, symptoms, and history in their own words">
            <InfoCircleOutlined style={{ fontSize: 12, color: '#888' }} />
          </Tooltip>
        </Space>
      ),
      children: (
        <Form.Item
          name="subjective"
          style={{ marginBottom: 0 }}
        >
          <TextArea
            rows={12}
            placeholder="Chief complaint, history of present illness, patient-reported symptoms..."
            disabled={!canEdit}
          />
        </Form.Item>
      )
    },
    {
      key: 'objective',
      label: (
        <Space>
          <FileTextOutlined />
          Objective
          <Tooltip title="Physical examination findings, vital signs, and test results">
            <InfoCircleOutlined style={{ fontSize: 12, color: '#888' }} />
          </Tooltip>
        </Space>
      ),
      children: (
        <Form.Item
          name="objective"
          style={{ marginBottom: 0 }}
        >
          <TextArea
            rows={12}
            placeholder="Physical examination findings, vital signs, lab results, imaging findings..."
            disabled={!canEdit}
          />
        </Form.Item>
      )
    },
    {
      key: 'assessment',
      label: (
        <Space>
          <FileTextOutlined />
          Assessment
          <Tooltip title="Diagnosis and clinical impression">
            <InfoCircleOutlined style={{ fontSize: 12, color: '#888' }} />
          </Tooltip>
        </Space>
      ),
      children: (
        <Form.Item
          name="assessment"
          style={{ marginBottom: 0 }}
        >
          <TextArea
            rows={12}
            placeholder="Diagnosis, clinical impression, differential diagnoses..."
            disabled={!canEdit}
          />
        </Form.Item>
      )
    },
    {
      key: 'plan',
      label: (
        <Space>
          <FileTextOutlined />
          Plan
          <Tooltip title="Treatment plan, medications, and follow-up instructions">
            <InfoCircleOutlined style={{ fontSize: 12, color: '#888' }} />
          </Tooltip>
        </Space>
      ),
      children: (
        <Form.Item
          name="plan"
          style={{ marginBottom: 0 }}
        >
          <TextArea
            rows={12}
            placeholder="Treatment plan, medications prescribed, orders, follow-up instructions..."
            disabled={!canEdit}
          />
        </Form.Item>
      )
    }
  ];

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          note_type: 'soap',
          title: isPrimary ? 'Primary Clinical Note' : 'Addendum Note'
        }}
      >
        {/* Header */}
        <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
          {isLocked && (
            <Alert
              message="This note is locked and cannot be edited"
              description={existingNote?.locked_at ? `Signed on ${new Date(existingNote.locked_at).toLocaleString()} by Dr. ${existingNote.signer?.full_name}` : ''}
              type="warning"
              icon={<LockOutlined />}
              showIcon
            />
          )}

          {isPrimary && !isEditing && (
            <Alert
              message="Creating Primary Clinical Note"
              description="This will be the main SOAP note for this visit. Only one primary note is allowed per visit."
              type="info"
              showIcon
            />
          )}

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Form.Item
                name="title"
                label="Note Title"
                style={{ marginBottom: 0, minWidth: 300 }}
              >
                <Input placeholder="e.g., Follow-up Visit" disabled={!canEdit} />
              </Form.Item>

              {!isEditing && templates && templates.length > 0 && (
                <Form.Item
                  label="Use Template"
                  style={{ marginBottom: 0, minWidth: 200 }}
                >
                  <Select
                    placeholder="Select template..."
                    allowClear
                    value={selectedTemplate}
                    onChange={handleTemplateSelect}
                    disabled={!canEdit}
                  >
                    {templates.map(t => (
                      <Select.Option key={t.id} value={t.id}>
                        {t.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Space>

            <Space>
              {isEditing && existingNote && (
                <Button
                  icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}
                  onClick={() => handleLock(!isLocked)}
                  loading={lockMutation.isPending}
                >
                  {isLocked ? 'Unlock' : 'Sign & Lock'}
                </Button>
              )}

              {canEdit && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  Save
                </Button>
              )}

              {onCancel && (
                <Button onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Space>
          </Space>
        </Space>

        {/* SOAP Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />

        {/* Helper Text */}
        <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Text type="secondary">
            <strong>SOAP Format:</strong> Document patient encounter systematically.
            <strong style={{ marginLeft: 16 }}>S:</strong> What patient reports
            <strong style={{ marginLeft: 16 }}>O:</strong> What you observe
            <strong style={{ marginLeft: 16 }}>A:</strong> Your diagnosis
            <strong style={{ marginLeft: 16 }}>P:</strong> Treatment plan
          </Text>
        </div>
      </Form>
    </Card>
  );
};
