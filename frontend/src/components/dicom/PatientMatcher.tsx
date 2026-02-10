/**
 * PatientMatcher Component
 * ========================
 * 
 * Auto-matches DICOM PatientID with EHR patients.
 * Allows manual patient selection if auto-match fails.
 * 
 * Module: frontend/src/components/dicom/PatientMatcher.tsx
 * Phase: 5B (Upload Frontend)
 */

import React, { useState, useEffect } from 'react';
import { Card, Select, Alert, Space, Typography, Tag, Descriptions, Spin } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { usePatients } from '@/hooks/usePatients';
import type { Patient } from '@/types';
import type { PatientMatchResult } from '@/types/dicom';

const { Text } = Typography;
const { Option } = Select;

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface PatientMatcherProps {
  dicomPatientId?: string;
  dicomPatientName?: string;
  dicomPatientBirthDate?: string;
  preSelectedPatientId?: string;
  onPatientSelected: (patient: Patient | null, matchResult: PatientMatchResult) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PatientMatcher: React.FC<PatientMatcherProps> = ({
  dicomPatientId,
  dicomPatientName,
  dicomPatientBirthDate,
  preSelectedPatientId,
  onPatientSelected,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(preSelectedPatientId);
  const [matchResult, setMatchResult] = useState<PatientMatchResult | null>(null);

  // Fetch all patients for dropdown
  const { data: patientsResponse, isLoading: isLoadingPatients, error: patientsError } = usePatients({
    page: 1,
    size: 100, // Maximum allowed by backend
  });

  const patients = patientsResponse?.items || [];

  // Log for debugging
  console.log('PatientMatcher - patientsResponse:', patientsResponse);
  console.log('PatientMatcher - patients count:', patients.length);
  console.log('PatientMatcher - error:', patientsError);

  // Auto-match on component mount or when DICOM data changes
  useEffect(() => {
    if (preSelectedPatientId) {
      // If patient is pre-selected (from Order), use that
      const patient = patients.find(p => p.id === preSelectedPatientId);
      if (patient) {
        const result: PatientMatchResult = {
          matchType: 'exact',
          confidence: 1.0,
          matchedBy: 'pre-selected',
        };
        setMatchResult(result);
        onPatientSelected(patient, result);
      }
      return;
    }

    if (!dicomPatientId && !dicomPatientName) {
      return;
    }

    // Try to auto-match
    performAutoMatch();
  }, [dicomPatientId, dicomPatientName, dicomPatientBirthDate, patients, preSelectedPatientId]);

  // Perform auto-match
  const performAutoMatch = () => {
    if (patients.length === 0) {
      return;
    }

    let bestMatch: Patient | null = null;
    let matchType: 'exact' | 'partial' | 'manual' = 'manual';
    let confidence = 0;
    let matchedBy: string[] = [];

    // Try exact match by MRN (PatientID)
    if (dicomPatientId) {
      const mrnMatch = patients.find(p => p.mrn === dicomPatientId);
      if (mrnMatch) {
        bestMatch = mrnMatch;
        matchType = 'exact';
        confidence = 1.0;
        matchedBy.push('MRN');
      }
    }

    // Try partial match by name and DOB
    if (!bestMatch && dicomPatientName && dicomPatientBirthDate) {
      const nameMatch = patients.find(p => {
        const dicomName = dicomPatientName.toLowerCase().replace(/\^/g, ' ');
        const patientName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const dobMatch = p.date_of_birth === dicomPatientBirthDate;
        
        return patientName.includes(dicomName) || dicomName.includes(patientName) && dobMatch;
      });

      if (nameMatch) {
        bestMatch = nameMatch;
        matchType = 'partial';
        confidence = 0.8;
        matchedBy.push('Name', 'DOB');
      }
    }

    // Try partial match by name only
    if (!bestMatch && dicomPatientName) {
      const nameOnlyMatch = patients.find(p => {
        const dicomName = dicomPatientName.toLowerCase().replace(/\^/g, ' ');
        const patientName = `${p.first_name} ${p.last_name}`.toLowerCase();
        
        return patientName.includes(dicomName) || dicomName.includes(patientName);
      });

      if (nameOnlyMatch) {
        bestMatch = nameOnlyMatch;
        matchType = 'partial';
        confidence = 0.6;
        matchedBy.push('Name');
      }
    }

    const result: PatientMatchResult = {
      matchType,
      confidence,
      matchedBy: matchedBy.join(', '),
    };

    setMatchResult(result);
    setSelectedPatientId(bestMatch?.id);
    onPatientSelected(bestMatch, result);
  };

  // Handle manual selection
  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find((p: Patient) => p.id === patientId);
    if (patient) {
      const result: PatientMatchResult = {
        matchType: 'manual',
        confidence: 1.0,
        matchedBy: 'manual-selection',
      };
      setMatchResult(result);
      setSelectedPatientId(patientId);
      onPatientSelected(patient, result);
    }
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    if (dateStr.length === 8) {
      // YYYYMMDD format
      return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    return dateStr;
  };

  // Get selected patient details
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Match status
  const getMatchStatus = () => {
    if (!matchResult) {
      return {
        type: 'warning' as const,
        icon: <SearchOutlined />,
        message: 'No match found - Please select patient manually',
      };
    }

    switch (matchResult.matchType) {
      case 'exact':
        return {
          type: 'success' as const,
          icon: <CheckCircleOutlined />,
          message: `Exact match found (${matchResult.confidence * 100}% confidence)`,
        };
      case 'partial':
        return {
          type: 'warning' as const,
          icon: <ExclamationCircleOutlined />,
          message: `Partial match found (${matchResult.confidence * 100}% confidence) - Please verify`,
        };
      case 'manual':
        return {
          type: 'info' as const,
          icon: <CheckCircleOutlined />,
          message: 'Patient selected manually',
        };
      default:
        return {
          type: 'warning' as const,
          icon: <SearchOutlined />,
          message: 'No match found - Please select patient manually',
        };
    }
  };

  const matchStatus = getMatchStatus();

  if (isLoadingPatients) {
    return (
      <Card>
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <Spin size="large" />
          <Text type="secondary">Loading patients...</Text>
        </Space>
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* DICOM Patient Info */}
      <Card title="DICOM Patient Information" size="small">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Patient ID (MRN)">
            <Text strong>{dicomPatientId || 'N/A'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Patient Name">
            <Text strong>{dicomPatientName?.replace(/\^/g, ' ') || 'N/A'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            <Text strong>{formatDate(dicomPatientBirthDate)}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Match Status */}
      <Alert
        message={matchStatus.message}
        description={matchResult?.matchedBy && `Matched by: ${matchResult.matchedBy}`}
        type={matchStatus.type}
        icon={matchStatus.icon}
        showIcon
      />

      {/* Patient Selector */}
      <Card title="Select EHR Patient" size="small">
        {patients.length === 0 ? (
          <Alert
            message="No patients found"
            description="Unable to load patients from the system. Please ensure you are properly authenticated and patients exist in the database."
            type="error"
            showIcon
          />
        ) : (
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder={`Search by name or MRN (${patients.length} patient${patients.length !== 1 ? 's' : ''} available)`}
            optionFilterProp="children"
            value={selectedPatientId}
            onChange={handlePatientSelect}
            filterOption={(input, option) => {
              const patient = patients.find((p: Patient) => p.id === option?.value);
              if (!patient) return false;
              
              const searchLower = input.toLowerCase();
              const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
              const mrn = patient.mrn.toLowerCase();
              
              return fullName.includes(searchLower) || mrn.includes(searchLower);
            }}
          >
            {patients.map((patient: Patient) => (
              <Option key={patient.id} value={patient.id}>
                <Space>
                  <Text strong>{patient.first_name} {patient.last_name}</Text>
                  <Tag color="blue">MRN: {patient.mrn}</Tag>
                  <Text type="secondary">DOB: {patient.date_of_birth}</Text>
                </Space>
              </Option>
            ))}
          </Select>
        )}
      </Card>

      {/* Selected Patient Details */}
      {selectedPatient && (
        <Card 
          title={
            <Space>
              <Text>Selected Patient</Text>
              {matchResult?.matchType === 'exact' && (
                <Tag color="success">Exact Match</Tag>
              )}
              {matchResult?.matchType === 'partial' && (
                <Tag color="warning">Partial Match</Tag>
              )}
              {matchResult?.matchType === 'manual' && (
                <Tag color="default">Manual Selection</Tag>
              )}
            </Space>
          }
          size="small"
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Name">
              <Text strong>{selectedPatient.first_name} {selectedPatient.last_name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="MRN">
              <Text strong>{selectedPatient.mrn}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Date of Birth">
              <Text>{selectedPatient.date_of_birth}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              <Text>{selectedPatient.gender}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              <Text>{selectedPatient.phone}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <Text>{selectedPatient.email}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Space>
  );
};

export default PatientMatcher;
