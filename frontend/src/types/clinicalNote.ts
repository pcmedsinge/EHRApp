/**
 * Clinical Notes Types
 * Phase: 3F (Clinical Notes Frontend)
 */

export interface ClinicalNote {
  id: string;
  visit_id: string;
  patient_id: string;
  created_by: string;
  note_type: string;
  title?: string;
  is_primary: boolean;
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
  is_deleted: boolean;
  author?: {
    id: string;
    username: string;
    full_name: string;
    role: string;
  };
  signer?: {
    id: string;
    username: string;
    full_name: string;
    role: string;
  };
}

export interface ClinicalNoteCreate {
  visit_id: string;
  patient_id: string;
  note_type?: string;
  title?: string;
  is_primary?: boolean;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  template_id?: string;
}

export interface ClinicalNoteUpdate {
  note_type?: string;
  title?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  note_type: string;
  specialty?: string;
  subjective_template?: string;
  objective_template?: string;
  assessment_template?: string;
  plan_template?: string;
  is_active: boolean;
  is_default: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    username: string;
    full_name: string;
    role: string;
  };
}

export interface NoteTemplateCreate {
  name: string;
  note_type?: string;
  specialty?: string;
  subjective_template?: string;
  objective_template?: string;
  assessment_template?: string;
  plan_template?: string;
  is_active?: boolean;
  is_default?: boolean;
}
