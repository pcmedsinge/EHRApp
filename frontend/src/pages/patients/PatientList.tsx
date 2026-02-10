/**
 * Patient List Page
 * ===================
 * 
 * Purpose:
 *   Displays paginated list of patients with search, sorting, and actions,
 *   including quick action to create a new visit.
 * 
 * Module: src/pages/patients/PatientList.tsx
 * Phase: 2F (Integration - Dashboard)
 * 
 * References:
 *   - Phase 2F Spec: docs/phases/phase2/Phase2F_Integration_Dashboard.md
 */

import { useState } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Card, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  ReloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePatients, useDeletePatient } from '@/hooks/usePatients';
import type { Patient } from '@/types';
import dayjs from 'dayjs';
import { DATE_FORMAT } from '@/config/constants';
import { colors } from '@/theme';

const { Search } = Input;

const PatientList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = usePatients({ page, size: pageSize, search });
  const deletePatient = useDeletePatient();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on new search
  };

  const handleDelete = (patient: Patient) => {
    Modal.confirm({
      title: 'Delete Patient',
      content: (
        <div>
          <p>Are you sure you want to delete this patient?</p>
          <p><strong>{patient.full_name}</strong> ({patient.mrn})</p>
          <p style={{ color: colors.warning.main, fontSize: 12 }}>
            This action can be undone by an administrator.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await deletePatient.mutateAsync(patient.id);
      },
    });
  };

  const columns: ColumnsType<Patient> = [
    {
      title: 'MRN',
      dataIndex: 'mrn',
      key: 'mrn',
      width: 140,
      fixed: 'left',
      render: (mrn: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>{mrn}</Tag>
      ),
    },
    {
      title: 'Name',
      key: 'name',
      width: 200,
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: colors.primary.main }} />
          <span style={{ fontWeight: 500 }}>{record.full_name}</span>
        </Space>
      ),
    },
    {
      title: 'Age / Gender',
      key: 'age_gender',
      width: 110,
      render: (_, record) => (
        <span>
          {record.age}Y / {record.gender.charAt(0).toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (city: string) => city || '-',
    },
    {
      title: 'Blood Group',
      dataIndex: 'blood_group',
      key: 'blood_group',
      width: 100,
      align: 'center',
      render: (blood_group: string) =>
        blood_group ? <Tag color="red">{blood_group}</Tag> : '-',
    },
    {
      title: 'Registered',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/patients/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Create Visit">
            <Button
              type="text"
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => navigate(`/visits/create?patientId=${record.id}`)}
              style={{ color: colors.primary.main }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/patients/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              loading={deletePatient.isPending}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <UserOutlined style={{ color: colors.primary.main }} />
          <span>Patient Management</span>
          <Tag color="blue">{data?.total || 0} patients</Tag>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/patients/create')}
          >
            Add Patient
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Search Bar */}
        <Search
          placeholder="Search by name, MRN, or phone..."
          allowClear
          enterButton={<><SearchOutlined /> Search</>}
          size="large"
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
          loading={isLoading}
        />

        {/* Patients Table */}
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          size="middle"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} patients`,
            onChange: (newPage, newSize) => {
              setPage(newPage);
              if (newSize !== pageSize) {
                setPageSize(newSize);
                setPage(1);
              }
            },
          }}
        />
      </Space>
    </Card>
  );
};

export default PatientList;
