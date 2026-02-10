export interface Vital {
  id: string;
  visit_id: string;
  patient_id: string;
  recorded_by: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse?: number;
  temperature?: number;
  respiratory_rate?: number;
  spo2?: number;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  blood_sugar?: number;
  blood_sugar_type?: 'fasting' | 'random' | 'pp';
  notes?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface VitalCreateData {
  visit_id: string;
  patient_id: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse?: number;
  temperature?: number;
  respiratory_rate?: number;
  spo2?: number;
  height_cm?: number;
  weight_kg?: number;
  blood_sugar?: number;
  blood_sugar_type?: 'fasting' | 'random' | 'pp';
  notes?: string;
  recorded_at?: string;
}

export interface VitalUpdateData extends Partial<VitalCreateData> {}

// Validation ranges
export const VITAL_RANGES = {
  bp_systolic: { min: 60, max: 300, normal: [90, 120] },
  bp_diastolic: { min: 40, max: 200, normal: [60, 80] },
  pulse: { min: 30, max: 250, normal: [60, 100] },
  temperature: { min: 35.0, max: 42.0, normal: [36.5, 37.5] },
  respiratory_rate: { min: 8, max: 60, normal: [12, 20] },
  spo2: { min: 70, max: 100, normal: [95, 100] },
  height_cm: { min: 30, max: 250 },
  weight_kg: { min: 0.5, max: 300 },
  blood_sugar: { min: 20, max: 600, normal: [70, 140] },
};

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export const getBMICategory = (bmi?: number): BMICategory | null => {
  if (!bmi) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

export const getBMIColor = (category: BMICategory | null): string => {
  switch (category) {
    case 'underweight': return '#faad14';
    case 'normal': return '#52c41a';
    case 'overweight': return '#faad14';
    case 'obese': return '#ff4d4f';
    default: return '#d9d9d9';
  }
};
