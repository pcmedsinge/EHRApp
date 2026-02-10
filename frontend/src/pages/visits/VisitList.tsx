/**
 * Visit List Page
 * ===============
 * 
 * Purpose:
 *   Display paginated list of visits with filters, search, and actions.
 * 
 * Module: src/pages/visits/VisitList.tsx
 * Phase: 2D (Frontend - Visit Pages)
 * 
 * References:
 *   - Phase 2D Spec: docs/phases/phase2/Phase2D_Frontend_VisitPages.md
 */

import { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Card,
  Tooltip,
  Select,
  DatePicker,
  Row,
  Col,
  Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ClearOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useVisits, useCancelVisit } from '@/hooks/useVisits';
import { VisitStatusBadge, VisitPriorityBadge, VisitTypeBadge } from '@/components/visits';
import type { Visit, VisitStatus, VisitType } from '@/types';
import {
  VISIT_STATUS_OPTIONS,
  VISIT_TYPE_OPTIONS,
  DATE_FORMAT,
  TIME_FORMAT,
} from '@/config/constants';
import dayjs, { Dayjs } from 'dayjs';
import { colors } from '@/theme';

const { Search } = Input;
const { RangePicker } = DatePicker;

const VisitList = () => {
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<VisitStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<VisitType | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // Build query params
  const queryParams = {
    page,
    size: pageSize,
    search: search || undefined,
    status: statusFilter,
    visit_type: typeFilter,
    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
  };

  const { data, isLoading, refetch } = useVisits(queryParams);
  const cancelVisit = useCancelVisit();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter(undefined);
    setTypeFilter(undefined);
    setDateRange(null);
    setSearch('');
    setPage(1);
  };

  const hasFilters = statusFilter || typeFilter || dateRange || search;

  const handleCancel = (visit: Visit) => {
    Modal.confirm({
      title: 'Cancel Visit',
      content: (
        <div>
          <p>Are you sure you want to cancel this visit?</p>
          <p>
            <strong>{visit.visit_number}</strong> - {visit.patient_name || visit.patient?.full_name || 'Unknown'}
          </p>
        </div>
      ),
      okText: 'Cancel Visit',
      okType: 'danger',
      cancelText: 'Keep',
      onOk: async () => {
        await cancelVisit.mutateAsync({
          id: visit.id,
          reason: 'Cancelled by staff',
        });
      },
    });
  };

  const columns: ColumnsType<Visit> = [
    {
      title: 'Visit #',
      dataIndex: 'visit_number',
      key: 'visit_number',
      width: 130,
      fixed: 'left',
      render: (visitNumber: string) => (
        <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>
          {visitNumber}
        </Tag>
      ),
    },
    {
      title: 'Patient',
      key: 'patient',
      width: 180,
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: colors.primary.main }} />
          <span style={{ fontWeight: 500 }}>{record.patient_name || 'Unknown'}</span>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'visit_type',
      key: 'visit_type',
      width: 120,
      render: (type: VisitType) => <VisitTypeBadge type={type} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: VisitStatus) => <VisitStatusBadge status={status} />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <VisitPriorityBadge priority={priority as any} />
      ),
    },
    {
      title: 'Doctor',
      key: 'doctor',
      width: 150,
      render: (_, record) => record.assigned_doctor?.full_name || '-',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 130,
      render: (dept: string) => dept || '-',
    },
    {
      title: 'Visit Date',
      dataIndex: 'visit_date',
      key: 'visit_date',
      width: 100,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
    {
      title: 'Check-in',
      key: 'check_in_time',
      width: 80,
      render: (_, record) =>
        record.check_in_time
          ? dayjs(record.check_in_time).format(TIME_FORMAT)
          : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/visits/${record.id}`)}
            />
          </Tooltip>
          {['registered', 'waiting', 'in_progress'].includes(record.status) && (
            <Tooltip title="Cancel Visit">
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancel(record)}
                loading={cancelVisit.isPending}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined style={{ color: colors.primary.main }} />
          <span>Visit Management</span>
          <Tag color="blue">{data?.total || 0} visits</Tag>
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
            onClick={() => navigate('/visits/create')}
          >
            New Visit
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Filters Row */}
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="Search visits..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              loading={isLoading}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[...VISIT_STATUS_OPTIONS]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Type"
              style={{ width: '100%' }}
              allowClear
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
              options={[...VISIT_TYPE_OPTIONS]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as [Dayjs, Dayjs] | null);
                setPage(1);
              }}
              format={DATE_FORMAT}
            />
          </Col>
          <Col>
            {hasFilters && (
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                type="text"
              >
                Clear
              </Button>
            )}
          </Col>
        </Row>

        {/* Active Filters Display */}
        {hasFilters && (
          <Space wrap>
            <FilterOutlined style={{ color: colors.text.secondary }} />
            {search && (
              <Tag closable onClose={() => setSearch('')}>
                Search: {search}
              </Tag>
            )}
            {statusFilter && (
              <Tag closable onClose={() => setStatusFilter(undefined)}>
                Status: {statusFilter}
              </Tag>
            )}
            {typeFilter && (
              <Tag closable onClose={() => setTypeFilter(undefined)}>
                Type: {typeFilter}
              </Tag>
            )}
            {dateRange && (
              <Tag closable onClose={() => setDateRange(null)}>
                Date: {dateRange[0].format(DATE_FORMAT)} - {dateRange[1].format(DATE_FORMAT)}
              </Tag>
            )}
          </Space>
        )}

        {/* Visits Table */}
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1300 }}
          size="middle"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} visits`,
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

export default VisitList;
