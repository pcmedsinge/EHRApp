# Phase 3F: Clinical Notes Frontend (3-4 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 3E Complete  
**Estimated Time:** 3-4 days

**Note:** Module visibility controlled by feature flag from backend (see FEATURE_FLAGS.md)

---

## Objectives

Build rich clinical note editor with:
- SOAP format sections (Subjective, Objective, Assessment, Plan)
- Auto-save functionality (every 30 seconds)
- Template selection for quick documentation
- Lock/sign note feature
- Rich text formatting
- Conditional rendering based on feature flags

---

## Deliverables

### 1. TypeScript Types
**File:** `frontend/src/types/clinical_note.ts`

```typescript
export interface ClinicalNote {
  id: string;
  visit_id: string;
  patient_id: string;
  created_by: string;
  note_type: 'soap' | 'progress' | 'discharge' | 'consultation' | 'procedure';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  template_id?: string;
  is_locked: boolean;
  locked_at?: string;
  locked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicalNoteCreateData {
  visit_id: string;
  patient_id: string;
  note_type?: 'soap' | 'progress' | 'discharge' | 'consultation' | 'procedure';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  template_id?: string;
}

export interface ClinicalNoteUpdateData {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  description?: string;
  note_type: string;
  subjective_template?: string;
  objective_template?: string;
  assessment_template?: string;
  plan_template?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}
```

---

### 2. API Service
**File:** `frontend/src/services/clinicalNoteService.ts`

```typescript
import { api } from './api';
import { 
  ClinicalNote, 
  ClinicalNoteCreateData, 
  ClinicalNoteUpdateData,
  NoteTemplate 
} from '@/types/clinical_note';

class ClinicalNoteService {
  /**
   * Clinical Note CRUD Operations
   */
  async createNote(data: ClinicalNoteCreateData): Promise<ClinicalNote> {
    const response = await api.post<ClinicalNote>('/clinical-notes/', data);
    return response.data;
  }

  async getVisitNotes(visitId: string): Promise<ClinicalNote[]> {
    const response = await api.get<ClinicalNote[]>(`/clinical-notes/visit/${visitId}`);
    return response.data;
  }

  async getPatientNotes(patientId: string, limit: number = 10): Promise<ClinicalNote[]> {
    const response = await api.get<ClinicalNote[]>(`/clinical-notes/patient/${patientId}`, {
      params: { limit }
    });
    return response.data;
  }

  async updateNote(id: string, data: ClinicalNoteUpdateData): Promise<ClinicalNote> {
    const response = await api.put<ClinicalNote>(`/clinical-notes/${id}`, data);
    return response.data;
  }

  async lockNote(id: string): Promise<ClinicalNote> {
    const response = await api.post<ClinicalNote>(`/clinical-notes/${id}/lock`);
    return response.data;
  }

  async deleteNote(id: string): Promise<void> {
    await api.delete(`/clinical-notes/${id}`);
  }

  /**
   * Template Operations
   */
  async getTemplates(noteType?: string): Promise<NoteTemplate[]> {
    const response = await api.get<NoteTemplate[]>('/clinical-notes/templates/', {
      params: noteType ? { note_type: noteType } : {}
    });
    return response.data;
  }

  async createTemplate(data: any): Promise<NoteTemplate> {
    const response = await api.post<NoteTemplate>('/clinical-notes/templates/', data);
    return response.data;
  }
}

export const clinicalNoteService = new ClinicalNoteService();
```

---

### 3. React Query Hooks
**File:** `frontend/src/hooks/useClinicalNotes.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { clinicalNoteService } from '@/services/clinicalNoteService';
import { ClinicalNoteCreateData, ClinicalNoteUpdateData } from '@/types/clinical_note';

// Query keys
export const clinicalNoteKeys = {
  all: ['clinical-notes'] as const,
  visit: (visitId: string) => ['clinical-notes', 'visit', visitId] as const,
  patient: (patientId: string) => ['clinical-notes', 'patient', patientId] as const,
  templates: (noteType?: string) => ['clinical-notes', 'templates', noteType] as const,
};

/**
 * Visit Notes Hook
 */
export const useVisitNotes = (visitId: string) => {
  return useQuery({
    queryKey: clinicalNoteKeys.visit(visitId),
    queryFn: () => clinicalNoteService.getVisitNotes(visitId),
    enabled: !!visitId,
  });
};

/**
 * Patient Notes History Hook
 */
export const usePatientNotes = (patientId: string, limit: number = 10) => {
  return useQuery({
    queryKey: clinicalNoteKeys.patient(patientId),
    queryFn: () => clinicalNoteService.getPatientNotes(patientId, limit),
    enabled: !!patientId,
  });
};

/**
 * Note Templates Hook
 */
export const useNoteTemplates = (noteType?: string) => {
  return useQuery({
    queryKey: clinicalNoteKeys.templates(noteType),
    queryFn: () => clinicalNoteService.getTemplates(noteType),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
};

/**
 * Create Note Mutation
 */
export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClinicalNoteCreateData) => clinicalNoteService.createNote(data),
    onSuccess: (note) => {
      message.success('Clinical note created successfully');
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.visit(note.visit_id) });
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.patient(note.patient_id) });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to create note');
    },
  });
};

/**
 * Update Note Mutation (with auto-save support)
 */
export const useUpdateNote = (options?: { silent?: boolean }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClinicalNoteUpdateData }) =>
      clinicalNoteService.updateNote(id, data),
    onSuccess: (note) => {
      if (!options?.silent) {
        message.success('Clinical note updated successfully');
      }
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.visit(note.visit_id) });
    },
    onError: (error: any) => {
      if (!options?.silent) {
        message.error(error.response?.data?.detail || 'Failed to update note');
      }
    },
  });
};

/**
 * Lock Note Mutation
 */
export const useLockNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clinicalNoteService.lockNote(id),
    onSuccess: (note) => {
      message.success('Clinical note locked/signed successfully');
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.visit(note.visit_id) });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to lock note');
    },
  });
};

/**
 * Delete Note Mutation
 */
export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clinicalNoteService.deleteNote(id),
    onSuccess: () => {
      message.success('Clinical note deleted successfully');
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.all });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to delete note');
    },
  });
};
```

---

### 4. SOAP Note Editor Component
**File:** `frontend/src/components/clinical_notes/SOAPNoteEditor.tsx`

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Space, 
  Card, 
  Divider, 
  Select,
  Typography,
  Alert,
  Tooltip
} from 'antd';
import { 
  SaveOutlined, 
  LockOutlined, 
  FileTextOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { debounce } from 'lodash';
import { ClinicalNoteCreateData, ClinicalNoteUpdateData } from '@/types/clinical_note';
import { useNoteTemplates } from '@/hooks/useClinicalNotes';

const { TextArea } = Input;
const { Text } = Typography;

interface SOAPNoteEditorProps {
  visitId: string;
  patientId: string;
  noteId?: string;
  initialData?: ClinicalNoteUpdateData;
  isLocked?: boolean;
  onSave: (data: ClinicalNoteUpdateData) => void;
  onLock?: () => void;
  onCancel: () => void;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

export const SOAPNoteEditor: React.FC<SOAPNoteEditorProps> = ({
  visitId,
  patientId,
  noteId,
  initialData,
  isLocked = false,
  onSave,
  onLock,
  onCancel,
  autoSave = true,
  autoSaveInterval = 30000 // 30 seconds
}) => {
  const [form] = Form.useForm();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: templates } = useNoteTemplates('soap');

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce((values: ClinicalNoteUpdateData) => {
      if (noteId && !isLocked && hasChanges) {
        onSave(values);
        setLastSaved(new Date());
        setHasChanges(false);
      }
    }, autoSaveInterval),
    [noteId, isLocked, hasChanges, autoSaveInterval]
  );

  useEffect(() => {
    if (autoSave && hasChanges) {
      const values = form.getFieldsValue();
      debouncedSave(values);
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [hasChanges, autoSave, form, debouncedSave]);

  const handleValuesChange = () => {
    setHasChanges(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      form.setFieldsValue({
        subjective: template.subjective_template || '',
        objective: template.objective_template || '',
        assessment: template.assessment_template || '',
        plan: template.plan_template || ''
      });
      setHasChanges(true);
    }
  };

  const handleSubmit = (values: any) => {
    onSave(values);
    setHasChanges(false);
    setLastSaved(new Date());
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={handleValuesChange}
      initialValues={initialData}
      disabled={isLocked}
    >
      {/* Header with Template Selector */}
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <FileTextOutlined />
            <Text strong>SOAP Clinical Note</Text>
          </Space>
          
          {!isLocked && templates && templates.length > 0 && (
            <Select
              placeholder="Load from template"
              style={{ width: 200 }}
              onChange={handleTemplateSelect}
              allowClear
            >
              {templates.map(template => (
                <Select.Option key={template.id} value={template.id}>
                  {template.name}
                </Select.Option>
              ))}
            </Select>
          )}

          {lastSaved && (
            <Tooltip title={`Last saved at ${lastSaved.toLocaleTimeString()}`}>
              <Space size="small">
                <ClockCircleOutlined style={{ color: '#52c41a' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Saved {getTimeSince(lastSaved)}
                </Text>
              </Space>
            </Tooltip>
          )}
        </Space>
      </Card>

      {isLocked && (
        <Alert
          message="This note is locked and cannot be edited"
          description="The note has been signed and locked for modifications."
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Subjective Section */}
      <Card title="Subjective (Chief Complaint & History)" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="subjective"
          help="Patient's complaints, symptoms, and history of present illness"
        >
          <TextArea
            rows={4}
            placeholder="e.g., Patient complains of fever for 3 days, associated with body ache and headache..."
          />
        </Form.Item>
      </Card>

      {/* Objective Section */}
      <Card title="Objective (Examination Findings)" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="objective"
          help="Physical examination findings, vital signs, and test results"
        >
          <TextArea
            rows={4}
            placeholder="e.g., Temp: 101°F, BP: 120/80, Pulse: 88. General examination: Alert and oriented. Throat: mild erythema..."
          />
        </Form.Item>
      </Card>

      {/* Assessment Section */}
      <Card title="Assessment (Clinical Impression)" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="assessment"
          help="Diagnosis, clinical impression, and differential diagnoses"
        >
          <TextArea
            rows={3}
            placeholder="e.g., Viral fever with upper respiratory tract infection. Rule out COVID-19..."
          />
        </Form.Item>
      </Card>

      {/* Plan Section */}
      <Card title="Plan (Treatment & Follow-up)" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="plan"
          help="Treatment plan, medications, investigations, and follow-up instructions"
        >
          <TextArea
            rows={4}
            placeholder="e.g., 1. Tab Paracetamol 500mg TDS for 3 days 2. Plenty of fluids 3. Rest 4. Follow-up after 3 days if not improving..."
          />
        </Form.Item>
      </Card>

      {/* Action Buttons */}
      <Form.Item>
        <Space>
          {!isLocked && (
            <>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Note
              </Button>
              {noteId && onLock && (
                <Button
                  icon={<LockOutlined />}
                  onClick={onLock}
                  tooltip="Lock/sign this note to prevent further edits"
                >
                  Lock & Sign
                </Button>
              )}
            </>
          )}
          <Button onClick={onCancel}>
            {isLocked ? 'Close' : 'Cancel'}
          </Button>
        </Space>
      </Form.Item>

      {hasChanges && autoSave && !isLocked && (
        <Alert
          message="Auto-save enabled"
          description="Your changes will be automatically saved every 30 seconds"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Form>
  );
};

// Helper function
function getTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
```

---

### 5. Update Visit Detail Page (with Feature Flag)
**File:** `frontend/src/pages/visits/VisitDetail.tsx`

```typescript
import { useFeatures } from '@/contexts/FeatureContext';
import { SOAPNoteEditor } from '@/components/clinical_notes/SOAPNoteEditor';
import { useVisitNotes, useCreateNote, useUpdateNote, useLockNote } from '@/hooks/useClinicalNotes';

// In the component:
const features = useFeatures();
const { data: clinicalNotes } = useVisitNotes(visitId);
const createNote = useCreateNote();
const updateNote = useUpdateNote({ silent: true }); // Silent for auto-save
const lockNote = useLockNote();

// Add tab conditionally based on feature flag:
{features.clinicalNotesEnabled && (
  <TabPane tab="Clinical Notes" key="notes">
    <SOAPNoteEditor
      visitId={visitId}
      patientId={visit?.patient_id || ''}
      onSave={(data) => {
        if (currentNote?.id) {
          updateNote.mutate({ id: currentNote.id, data });
        } else {
          createNote.mutate({ visit_id: visitId, patient_id: visit?.patient_id, ...data });
        }
      }}
      onLock={() => currentNote && lockNote.mutate(currentNote.id)}
      onCancel={() => setShowNoteEditor(false)}
      autoSave={true}
    />
  </TabPane>
)}
```

---

## Testing Checklist

- [ ] SOAP editor displays all 4 sections
- [ ] Template selection pre-fills fields
- [ ] Auto-save works every 30 seconds
- [ ] Manual save button works
- [ ] Lock/sign prevents editing
- [ ] Cannot edit locked notes
- [ ] Last saved timestamp updates
- [ ] Feature flag hides module when disabled
- [ ] Mobile responsive design

---

## Success Criteria

- ✅ SOAP editor is intuitive and easy to use
- ✅ Auto-save prevents data loss
- ✅ Templates speed up documentation
- ✅ Locked notes maintain data integrity
- ✅ Feature flag integration working
- ✅ Doctor-only access enforced

---

## Next Steps

After Phase 3F completion:
→ **Phase 3G: Integration & Testing** - Feature flags system and E2E testing

---

**Documentation Version:** 1.0  
**Last Updated:** February 3, 2026
