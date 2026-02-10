/**
 * Clinical Notes List Component
 * 
 * Display and manage clinical notes for a visit
 * Phase: 3F (Clinical Notes Frontend)
 */

import React, { useState } from 'react';
import {
  Card,
  Space,
  Button,
  Typography,
  Empty,
  Tag,
  Tooltip,
  Modal,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useVisitClinicalNotes, useDeleteClinicalNote } from '@/hooks/useClinicalNotes';
import { ClinicalNoteForm } from './ClinicalNoteForm';
import type { ClinicalNote } from '@/types/clinicalNote';
import { PatientContextHeader } from '@/components/patient';

const { Text, Title } = Typography;

interface ClinicalNotesListProps {
  visitId: string;
  patientId: string;
  patientName?: string;
  patientMrn?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  canEdit?: boolean;
}

export const ClinicalNotesList: React.FC<ClinicalNotesListProps> = ({
  visitId,
  patientId,
  patientName,
  patientMrn,
  patientDateOfBirth,
  patientGender,
  canEdit = true
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | undefined>();
  const [viewMode, setViewMode] = useState(false);

  // Calculate age and format patient info for display
  const age = patientDateOfBirth ? dayjs().diff(dayjs(patientDateOfBirth), 'year') : null;
  const genderDisplay = patientGender ? `${patientGender.charAt(0).toUpperCase()}${patientGender.slice(1)}` : null;
  const patientInfo = patientName && patientMrn 
    ? `${patientName}${genderDisplay ? ` (${genderDisplay}` : ''}${age !== null ? `${genderDisplay ? ', ' : ' ('}${age}y` : ''}${genderDisplay || age !== null ? ')' : ''} [MRN: ${patientMrn}]`
    : 'Patient';

  const { data: notes, isLoading } = useVisitClinicalNotes(visitId);
  const deleteMutation = useDeleteClinicalNote();

  const hasPrimaryNote = notes?.some(n => n.is_primary);

  // Construct patient object for context header
  const patientForHeader = patientName && patientMrn ? {
    id: patientId,
    full_name: patientName,
    mrn: patientMrn,
    gender: patientGender,
    date_of_birth: patientDateOfBirth,
  } : null;

  const handleAddNote = (isPrimary: boolean = false) => {
    setSelectedNote(undefined);
    setViewMode(false);
    setShowModal(true);
  };

  const handleEditNote = (note: ClinicalNote) => {
    setSelectedNote(note);
    setViewMode(false);
    setShowModal(true);
  };

  const handleViewNote = (note: ClinicalNote) => {
    setSelectedNote(note);
    setViewMode(true);
    setShowModal(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteMutation.mutateAsync(noteId);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNote(undefined);
    setViewMode(false);
  };

  const renderNoteCard = (note: ClinicalNote) => {
    const canEditNote = canEdit && !note.is_locked;
    const canDeleteNote = canEdit && !note.is_locked;

    return (
      <Card
        key={note.id}
        size="small"
        style={{ marginBottom: 12 }}
        actions={[
          <Button
            key="view"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewNote(note)}
          >
            View
          </Button>,
          ...(canEditNote
            ? [
                <Button
                  key="edit"
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEditNote(note)}
                >
                  Edit
                </Button>
              ]
            : []),
          ...(canDeleteNote
            ? [
                <Popconfirm
                  key="delete"
                  title="Delete Note"
                  description="Are you sure you want to delete this clinical note?"
                  onConfirm={() => handleDeleteNote(note.id)}
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
                </Popconfirm>
              ]
            : [])
        ]}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* Header */}
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <FileTextOutlined style={{ fontSize: 18, color: note.is_primary ? '#1890ff' : '#8c8c8c' }} />
              <Text strong>{note.title || 'Clinical Note'}</Text>
              {note.is_primary && <Tag color="blue">PRIMARY</Tag>}
              {note.is_locked && (
                <Tooltip title={`Signed on ${dayjs(note.locked_at).format('MMM DD, YYYY HH:mm')}`}>
                  <Tag icon={<LockOutlined />} color="green">
                    SIGNED
                  </Tag>
                </Tooltip>
              )}
              <Tag>{note.note_type.toUpperCase()}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(note.created_at).format('MMM DD, YYYY HH:mm')}
            </Text>
          </Space>

          {/* Author Info */}
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              By Dr. {note.author?.full_name}
            </Text>
            {note.is_locked && note.signer && (
              <>
                <Text type="secondary" style={{ fontSize: 13 }}>•</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Signed by Dr. {note.signer.full_name}
                </Text>
              </>
            )}
          </Space>

          {/* Preview */}
          <div style={{ paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
            {note.subjective && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" strong style={{ fontSize: 12 }}>
                  S:
                </Text>{' '}
                <Text style={{ fontSize: 13 }}>
                  {note.subjective.substring(0, 150)}
                  {note.subjective.length > 150 ? '...' : ''}
                </Text>
              </div>
            )}
            {note.assessment && (
              <div>
                <Text type="secondary" strong style={{ fontSize: 12 }}>
                  A:
                </Text>{' '}
                <Text style={{ fontSize: 13 }}>
                  {note.assessment.substring(0, 150)}
                  {note.assessment.length > 150 ? '...' : ''}
                </Text>
              </div>
            )}
          </div>
        </Space>
      </Card>
    );
  };

  return (
    <>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            Clinical Notes
            {patientName && <Text type="secondary">- {patientName}</Text>}
          </Space>
        }
        extra={
          canEdit && (
            <Space>
              {!hasPrimaryNote && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddNote(true)}
                >
                  Add Primary Note
                </Button>
              )}
              {hasPrimaryNote && (
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => handleAddNote(false)}
                >
                  Add Addendum
                </Button>
              )}
            </Space>
          )
        }
        loading={isLoading}
      >
        {!notes || notes.length === 0 ? (
          <Empty
            description="No clinical notes yet. Add a primary SOAP note to document this visit."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div>{notes.map(renderNoteCard)}</div>
        )}
      </Card>

      {/* Note Form Modal */}
      <Modal
        title={
          viewMode
            ? `View Clinical Note - ${patientInfo}`
            : selectedNote
            ? `Edit Clinical Note - ${patientInfo}`
            : hasPrimaryNote
            ? `Add Addendum Note - ${patientInfo}`
            : `Add Primary Clinical Note - ${patientInfo}`
        }
        open={showModal}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
        destroyOnHidden
      >
        {patientForHeader && (
          <PatientContextHeader
            patient={patientForHeader}
            showVisitInfo={false}
          />
        )}
        <ClinicalNoteForm
          visitId={visitId}
          patientId={patientId}
          existingNote={selectedNote}
          isPrimary={!hasPrimaryNote && !selectedNote}
          onSuccess={handleCloseModal}
          onCancel={handleCloseModal}
        />
      </Modal>
    </>
  );
};
