# Modal Patient Context Implementation

**Date:** Current
**Phase:** 3F Enhancement - Patient Safety Feature
**Option Selected:** Option A - Patient Name + MRN in Modal Titles

## Overview

Implemented patient context (name + MRN) in all modal titles to ensure patient identity is always visible when recording clinical data. This addresses a critical patient safety concern identified during UX testing.

## Problem Statement

When modals open for data entry (diagnoses, vitals, clinical notes), the background dims and the sticky patient context header becomes harder to see. This creates a risk that clinicians might forget which patient they're working with, especially when switching between multiple patient records.

## Solution Implemented

Added patient name and MRN to all modal titles in the format:
```
[Action] - [Patient Name] (MRN: [MRN Number])
```

Examples:
- `Add Diagnosis - John Doe (MRN: MRN12345)`
- `Record Vital Signs - Jane Smith (MRN: MRN67890)`
- `Add Primary Clinical Note - Bob Johnson (MRN: MRN11223)`

## Files Modified

### 1. DiagnosisFormModal.tsx
**Changes:**
- Added `patientName?: string` and `patientMrn?: string` to `DiagnosisFormModalProps` interface
- Updated component to accept and destructure new props
- Modified Modal title to include patient context using conditional rendering

**Code:**
```tsx
title={
  <Space>
    <MedicineBoxOutlined />
    {isEdit ? 'Edit Diagnosis' : 'Add Diagnosis'}
    {patientName && patientMrn && (
      <Text type="secondary">- {patientName} (MRN: {patientMrn})</Text>
    )}
  </Space>
}
```

### 2. DiagnosisList.tsx
**Changes:**
- Added `patientMrn?: string` to `DiagnosisListProps` interface
- Added `patientMrn` to component destructuring
- Passed `patientName` and `patientMrn` to `DiagnosisFormModal` component

**Props passed to modal:**
```tsx
<DiagnosisFormModal
  ...existing props
  patientName={patientName}
  patientMrn={patientMrn}
/>
```

### 3. VisitDetail.tsx (3 updates)
**Changes:**

**A. DiagnosisList usage:**
- Added `patientMrn={visit.patient?.mrn}` prop when rendering DiagnosisList

**B. Vitals Modal:**
- Updated Modal title from static string to template literal:
```tsx
title={`Record Vital Signs - ${visit.patient?.full_name || visit.patient_name} (MRN: ${visit.patient?.mrn || 'N/A'})`}
```

**C. ClinicalNotesList usage:**
- Added `patientName={visit.patient?.full_name || visit.patient_name}` prop
- Added `patientMrn={visit.patient?.mrn}` prop

### 4. ClinicalNotesList.tsx
**Changes:**
- Added `patientMrn?: string` to `ClinicalNotesListProps` interface
- Added `patientMrn` to component destructuring
- Updated Modal title to conditionally include patient context for all 4 modes:
  - View Clinical Note
  - Edit Clinical Note
  - Add Addendum Note
  - Add Primary Clinical Note

**Code:**
```tsx
title={
  viewMode
    ? `View Clinical Note - ${patientName || 'Patient'} (MRN: ${patientMrn || 'N/A'})`
    : selectedNote
    ? `Edit Clinical Note - ${patientName || 'Patient'} (MRN: ${patientMrn || 'N/A'})`
    : hasPrimaryNote
    ? `Add Addendum Note - ${patientName || 'Patient'} (MRN: ${patientMrn || 'N/A'})`
    : `Add Primary Clinical Note - ${patientName || 'Patient'} (MRN: ${patientMrn || 'N/A'})`
}
```

## Data Flow

1. **Visit Data Source:** `VisitDetail` component has access to `visit.patient` object containing:
   - `full_name`: Patient's full name
   - `mrn`: Medical Record Number

2. **Prop Propagation:**
   - VisitDetail → DiagnosisList → DiagnosisFormModal
   - VisitDetail → Vitals Modal (direct)
   - VisitDetail → ClinicalNotesList → Clinical Notes Modal

3. **Fallback Values:**
   - Patient name: Falls back to `visit.patient_name` or `'Patient'`
   - MRN: Falls back to `'N/A'` if not available

## Patient Safety Impact

### Before Implementation
- ❌ Modal opens, background dims, patient context lost
- ❌ Risk of wrong patient data entry
- ❌ User must remember which patient they clicked on
- ❌ No visual confirmation of patient identity during data entry

### After Implementation
- ✅ Patient identity visible in every modal title
- ✅ Name + MRN provides double verification
- ✅ Consistent format across all data entry modals
- ✅ Reduces cognitive load on clinicians
- ✅ Industry standard practice for patient safety

## Testing Checklist

- [ ] Open "Add Diagnosis" modal → Verify title shows patient name + MRN
- [ ] Edit existing diagnosis → Verify title shows "Edit Diagnosis - Name (MRN: XXX)"
- [ ] Open "Record Vital Signs" modal → Verify patient context in title
- [ ] Open "Add Primary Clinical Note" modal → Verify patient context
- [ ] Open "Add Addendum Note" modal → Verify patient context
- [ ] Edit clinical note → Verify patient context
- [ ] View clinical note (read-only) → Verify patient context
- [ ] Test with different patients → Verify correct patient info displays
- [ ] Test mobile view → Verify title doesn't overflow or wrap badly
- [ ] Test with long patient names → Verify layout remains acceptable

## Future Enhancements (Optional)

### Phase 2: Allergy Alert Banner in Modals
If allergies exist, add warning banner inside modal:
```tsx
{allergies && allergies.length > 0 && (
  <Alert
    type="error"
    message={`⚠️ Patient has allergies: ${allergies.join(', ')}`}
    banner
    closable={false}
    style={{ marginBottom: 16 }}
  />
)}
```

### Additional Considerations
- Add patient photo thumbnail in modal title area
- Add VIP indicator if patient has special status
- Add age alongside name (e.g., "John Doe, 45y")
- Color-code modal borders for allergy patients (red border)

## Related Features

This enhancement complements the existing **PatientContextHeader** component:
- **Header:** Persistent patient context across all tabs (sticky positioning)
- **Modals:** Patient context in modal titles (this feature)
- **Together:** Comprehensive patient identification system

## Compliance & Standards

This implementation aligns with:
- Healthcare UX best practices
- Patient safety protocols
- Joint Commission patient identification standards
- Industry-standard EMR/EHR interfaces

## Status

✅ **COMPLETE** - All three modal types updated with patient context
- [x] Diagnosis modals
- [x] Vitals modals  
- [x] Clinical Notes modals
- [x] Data flow established
- [x] Fallback values configured
- [ ] User acceptance testing (pending)
