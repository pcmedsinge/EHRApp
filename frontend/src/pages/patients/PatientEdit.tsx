/**
 * Patient Edit Page
 * 
 * Form for updating existing patient information.
 */

import { useEffect } from 'react';
import { Form, Input, Button, Card, Row, Col, Select, DatePicker, Space, Divider, Spin, Empty } from 'antd';
import {
  UserOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient, useUpdatePatient } from '@/hooks/usePatients';
import { PatientContextHeader } from '@/components/patient';
import type { PatientUpdateData, Gender, BloodGroup } from '@/types';
import dayjs from 'dayjs';
import { GENDER_OPTIONS, BLOOD_GROUP_OPTIONS, DATE_FORMAT, INDIAN_STATES } from '@/config/constants';
import { colors } from '@/theme';

const { TextArea } = Input;

const PatientEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { data: patient, isLoading, error } = usePatient(id!);
  const updatePatient = useUpdatePatient();

  // Populate form when patient data loads
  useEffect(() => {
    if (patient) {
      form.setFieldsValue({
        ...patient,
        address: patient.address_line1,
        date_of_birth: patient.date_of_birth ? dayjs(patient.date_of_birth) : undefined,
      });
    }
  }, [patient, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!id) return;

    const patientData: PatientUpdateData = {
      first_name: values.first_name as string,
      last_name: values.last_name as string,
      date_of_birth: (values.date_of_birth as dayjs.Dayjs).format('YYYY-MM-DD'),
      gender: values.gender as Gender,
      phone: values.phone as string,
      email: values.email as string || undefined,
      address_line1: values.address as string || undefined,
      city: values.city as string || undefined,
      state: values.state as string || undefined,
      pincode: values.pincode as string || undefined,
      blood_group: values.blood_group as BloodGroup || undefined,
      emergency_contact_name: values.emergency_contact_name as string || undefined,
      emergency_contact_phone: values.emergency_contact_phone as string || undefined,
      allergies: values.allergies as string || undefined,
      medical_notes: values.notes as string || undefined,
    };

    try {
      await updatePatient.mutateAsync({ id, data: patientData });
      navigate(`/patients/${id}`);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Loading patient details..." />
        </div>
      </Card>
    );
  }

  if (error || !patient) {
    return (
      <Card>
        <Empty
          description="Patient not found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/patients')}>
            Back to Patients
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <UserOutlined style={{ color: colors.primary.main }} />
          <span>Edit Patient</span>
          <span style={{ color: colors.text.secondary }}>
            - {patient.full_name} ({patient.mrn})
          </span>
        </Space>
      }
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/patients/${id}`)}>
          Back to Details
        </Button>
      }
    >
      {/* Patient Context Header */}
      <PatientContextHeader
        patient={patient}
        showVisitInfo={false}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        scrollToFirstError
      >
        {/* Basic Information */}
        <Divider>
          <Space>
            <UserOutlined />
            Basic Information
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[
                { required: true, message: 'First name is required' },
                { min: 2, message: 'Minimum 2 characters' },
                { max: 50, message: 'Maximum 50 characters' },
              ]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[
                { required: true, message: 'Last name is required' },
                { min: 2, message: 'Minimum 2 characters' },
                { max: 50, message: 'Maximum 50 characters' },
              ]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="date_of_birth"
              label="Date of Birth"
              rules={[{ required: true, message: 'Date of birth is required' }]}
            >
              <DatePicker
                format={DATE_FORMAT}
                placeholder="Select date"
                style={{ width: '100%' }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Gender is required' }]}
            >
              <Select placeholder="Select gender">
                {GENDER_OPTIONS.map((g) => (
                  <Select.Option key={g.value} value={g.value}>
                    {g.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="blood_group"
              label="Blood Group"
            >
              <Select placeholder="Select blood group" allowClear>
                {BLOOD_GROUP_OPTIONS.map((bg) => (
                  <Select.Option key={bg.value} value={bg.value}>
                    {bg.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Contact Information */}
        <Divider>
          <Space>
            <PhoneOutlined />
            Contact Information
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Phone number is required' },
                {
                  pattern: /^[6-9]\d{9}$/,
                  message: 'Enter valid 10-digit Indian mobile number',
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter phone number"
                maxLength={10}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: 'Enter valid email' }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter email address"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Address Information */}
        <Divider>
          <Space>
            <HomeOutlined />
            Address Information
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item name="address" label="Address">
              <TextArea rows={2} placeholder="Enter street address" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="city" label="City">
              <Input placeholder="Enter city" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="state" label="State">
              <Select
                showSearch
                placeholder="Select state"
                optionFilterProp="children"
                allowClear
              >
                {INDIAN_STATES.map((state) => (
                  <Select.Option key={state} value={state}>
                    {state}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="pincode"
              label="Pincode"
              rules={[
                { pattern: /^\d{6}$/, message: 'Enter valid 6-digit pincode' },
              ]}
            >
              <Input placeholder="Enter pincode" maxLength={6} />
            </Form.Item>
          </Col>
        </Row>

        {/* Emergency Contact */}
        <Divider>
          <Space>
            <PhoneOutlined style={{ color: colors.error.main }} />
            Emergency Contact
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="emergency_contact_name" label="Emergency Contact Name">
              <Input placeholder="Enter emergency contact name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="emergency_contact_phone"
              label="Emergency Contact Phone"
              rules={[
                {
                  pattern: /^[6-9]\d{9}$/,
                  message: 'Enter valid 10-digit Indian mobile number',
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter phone number"
                maxLength={10}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Medical Information */}
        <Divider>
          <Space>
            <HeartOutlined style={{ color: colors.error.main }} />
            Medical Information
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="allergies" label="Known Allergies">
              <TextArea rows={2} placeholder="Enter known allergies (comma-separated)" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="notes" label="Additional Notes">
              <TextArea rows={3} placeholder="Enter any additional notes" />
            </Form.Item>
          </Col>
        </Row>

        {/* Form Actions */}
        <Divider />

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={updatePatient.isPending}
              size="large"
            >
              Save Changes
            </Button>
            <Button 
              onClick={() => {
                if (patient) {
                  form.setFieldsValue({
                    ...patient,
                    address: patient.address_line1,
                    date_of_birth: patient.date_of_birth ? dayjs(patient.date_of_birth) : undefined,
                  });
                }
              }} 
              size="large"
            >
              Reset Changes
            </Button>
            <Button onClick={() => navigate(`/patients/${id}`)} size="large">
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PatientEdit;
