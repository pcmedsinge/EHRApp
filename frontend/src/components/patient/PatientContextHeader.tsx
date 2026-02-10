/**
 * Patient Context Header Component
 * ==================================
 * 
 * Purpose:
 *   Persistent patient identification banner that stays visible across all tabs
 *   to maintain patient context and improve safety.
 * 
 * Design: Full Width Banner (3-row layout)
 * Features:
 *   - Patient demographics (name, MRN, DOB, age, gender)
 *   - Allergy alerts (color-coded)
 *   - Visit information
 *   - Contact details
 *   - Sticky positioning
 */

import React from 'react';
import { Card, Space, Tag, Typography, Row, Col, Divider } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  WarningOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '@/theme';

const { Text } = Typography;

interface Patient {
  id: string;
  full_name: string;
  mrn: string;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  phone?: string;
  email?: string;
}

interface Visit {
  id: string;
  visit_number: string;
  status: string;
  visit_type?: string;
  assigned_doctor?: {
    full_name: string;
  };
}

interface PatientContextHeaderProps {
  patient: Patient;
  visit?: Visit;
  allergies?: string[];
  showVisitInfo?: boolean;
}

const PatientContextHeader: React.FC<PatientContextHeaderProps> = ({
  patient,
  visit,
  allergies,
  showVisitInfo = true,
}) => {
  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    return dayjs().diff(dayjs(dob), 'year');
  };

  const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : null;
  const hasAllergies = allergies && allergies.length > 0;

  // Determine card style based on allergies
  const cardStyle: React.CSSProperties = {
    position: 'sticky',
    top: 64, // Below main app header
    zIndex: 100,
    marginBottom: 16,
    borderWidth: hasAllergies ? 3 : 2,
    borderColor: hasAllergies ? '#ff4d4f' : '#1677ff',
    backgroundColor: hasAllergies ? '#fff1f0' : '#f0f5ff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  };

  // Format visit status
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      registered: 'blue',
      in_progress: 'processing',
      completed: 'success',
      cancelled: 'error',
    };
    return statusMap[status] || 'default';
  };

  return (
    <Card style={cardStyle} bodyStyle={{ padding: '12px 24px' }}>
      {/* Row 1: Patient Name, MRN, and Allergy Alert */}
      <Row align="middle" gutter={24}>
        <Col flex="auto">
          <Space size="large" wrap>
            <Space size="small">
              <UserOutlined style={{ fontSize: 20, color: colors.primary.main }} />
              <Text strong style={{ fontSize: 18 }}>
                {patient.full_name}
              </Text>
            </Space>
            
            <Space size="small">
              <IdcardOutlined style={{ color: colors.text.secondary }} />
              <Text strong>MRN:</Text>
              <Text copyable>{patient.mrn}</Text>
            </Space>

            {patient.blood_group && (
              <Tag color="red" style={{ fontSize: 13, padding: '2px 8px' }}>
                🩸 {patient.blood_group}
              </Tag>
            )}
          </Space>
        </Col>

        {hasAllergies && (
          <Col>
            <Tag
              icon={<WarningOutlined />}
              color="error"
              style={{
                fontSize: 14,
                padding: '4px 12px',
                fontWeight: 'bold',
              }}
            >
              ALLERGIES: {allergies.join(', ')}
            </Tag>
          </Col>
        )}
      </Row>

      <Divider style={{ margin: '8px 0' }} />

      {/* Row 2: Demographics and Visit Info */}
      <Row gutter={16}>
        <Col>
          <Space size="small">
            <Text type="secondary">Gender:</Text>
            <Text>{patient.gender || 'N/A'}</Text>
          </Space>
        </Col>
        
        {age !== null && (
          <>
            <Divider type="vertical" />
            <Col>
              <Space size="small">
                <CalendarOutlined style={{ color: colors.text.secondary }} />
                <Text type="secondary">Age:</Text>
                <Text strong style={{ color: colors.primary.main }}>
                  {age} years old
                </Text>
              </Space>
            </Col>
          </>
        )}

        {showVisitInfo && visit && (
          <>
            <Divider type="vertical" />
            <Col>
              <Space size="small">
                <MedicineBoxOutlined style={{ color: colors.text.secondary }} />
                <Text type="secondary">Visit:</Text>
                <Text strong>{visit.visit_number}</Text>
                <Tag color={getStatusColor(visit.status)}>
                  {visit.status.replace('_', ' ').toUpperCase()}
                </Tag>
              </Space>
            </Col>
          </>
        )}
      </Row>

      <Divider style={{ margin: '8px 0' }} />

      {/* Row 3: Contact Information and Doctor */}
      <Row gutter={16} align="middle">
        {patient.phone && (
          <Col>
            <Space size="small">
              <PhoneOutlined style={{ color: colors.text.secondary }} />
              <Text>{patient.phone}</Text>
            </Space>
          </Col>
        )}

        {patient.email && (
          <>
            {patient.phone && <Divider type="vertical" />}
            <Col>
              <Space size="small">
                <MailOutlined style={{ color: colors.text.secondary }} />
                <Text>{patient.email}</Text>
              </Space>
            </Col>
          </>
        )}

        {showVisitInfo && visit?.assigned_doctor && (
          <>
            <Divider type="vertical" />
            <Col>
              <Space size="small">
                <UserOutlined style={{ color: colors.text.secondary }} />
                <Text type="secondary">Assigned Doctor:</Text>
                <Text strong>{visit.assigned_doctor.full_name}</Text>
              </Space>
            </Col>
          </>
        )}
      </Row>
    </Card>
  );
};

export default PatientContextHeader;
