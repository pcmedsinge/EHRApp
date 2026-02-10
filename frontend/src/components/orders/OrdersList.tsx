/**
 * Orders List Component
 * Phase: 4B (Orders Frontend)
 */

import React from 'react';
import {
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Tooltip,
  Empty,
} from 'antd';
import {
  FileImageOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Order, OrderType, OrderStatus, OrderPriority } from '@/types/orders';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface OrdersListProps {
  orders: Order[];
  loading?: boolean;
  onViewOrder?: (order: Order) => void;
  showPatient?: boolean;
}

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  loading = false,
  onViewOrder,
  showPatient = false,
}) => {
  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case 'IMAGING':
        return <FileImageOutlined style={{ color: '#1890ff' }} />;
      case 'LAB':
        return <ExperimentOutlined style={{ color: '#52c41a' }} />;
      case 'PROCEDURE':
        return <MedicineBoxOutlined style={{ color: '#722ed1' }} />;
      default:
        return null;
    }
  };

  const getOrderTypeColor = (type: OrderType) => {
    switch (type) {
      case 'IMAGING':
        return 'blue';
      case 'LAB':
        return 'green';
      case 'PROCEDURE':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'ordered':
        return 'default';
      case 'scheduled':
        return 'processing';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'reported':
        return 'cyan';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: OrderPriority) => {
    switch (priority) {
      case 'stat':
        return 'red';
      case 'urgent':
        return 'orange';
      case 'routine':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getOrderDescription = (order: Order): string => {
    if (order.order_type === 'IMAGING' && order.order_details) {
      // In real implementation, we'd look up the modality and body part names
      return `Imaging Order`;
    } else if (order.order_type === 'LAB' && order.order_details) {
      const details = order.order_details as any;
      const testCount = details.lab_test_ids?.length || 0;
      return `${testCount} Lab Test${testCount !== 1 ? 's' : ''}`;
    } else if (order.order_type === 'PROCEDURE' && order.order_details) {
      return `Procedure Order`;
    }
    return '';
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order #',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 150,
      render: (text: string) => (
        <Text strong style={{ fontFamily: 'monospace' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Accession #',
      dataIndex: 'accession_number',
      key: 'accession_number',
      width: 150,
      render: (text: string) => (
        <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 120,
      filters: [
        { text: 'Imaging', value: 'IMAGING' },
        { text: 'Lab', value: 'LAB' },
        { text: 'Procedure', value: 'PROCEDURE' },
      ],
      onFilter: (value, record) => record.order_type === value,
      render: (type: OrderType) => (
        <Tag icon={getOrderTypeIcon(type)} color={getOrderTypeColor(type)}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Description',
      key: 'description',
      render: (_, record) => (
        <div>
          <Text>{getOrderDescription(record)}</Text>
          {record.clinical_indication && (
            <Tooltip title={record.clinical_indication}>
              <div>
                <Text
                  type="secondary"
                  ellipsis
                  style={{ fontSize: '12px', maxWidth: 200, display: 'block' }}
                >
                  {record.clinical_indication}
                </Text>
              </div>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Ordered', value: 'ordered' },
        { text: 'Scheduled', value: 'scheduled' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Reported', value: 'reported' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: OrderStatus) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      filters: [
        { text: 'STAT', value: 'stat' },
        { text: 'Urgent', value: 'urgent' },
        { text: 'Routine', value: 'routine' },
      ],
      onFilter: (value, record) => record.priority === value,
      render: (priority: OrderPriority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    ...(showPatient
      ? [
          {
            title: 'Patient',
            key: 'patient',
            width: 180,
            render: (_: any, record: Order) => (
              <div>
                {record.patient ? (
                  <>
                    <Text strong>
                      {record.patient.first_name} {record.patient.last_name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      MRN: {record.patient.mrn}
                    </Text>
                  </>
                ) : (
                  <Text type="secondary">-</Text>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      title: 'Ordered Date',
      dataIndex: 'ordered_date',
      key: 'ordered_date',
      width: 160,
      sorter: (a, b) =>
        dayjs(a.ordered_date).valueOf() - dayjs(b.ordered_date).valueOf(),
      defaultSortOrder: 'descend',
      render: (date: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#999' }} />
          <Text>{dayjs(date).format('MMM DD, YYYY HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: 'Scheduled',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      width: 160,
      render: (date: string) =>
        date ? (
          <Text type="secondary">{dayjs(date).format('MMM DD, YYYY HH:mm')}</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => onViewOrder?.(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={orders}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} orders`,
      }}
      scroll={{ x: 1400 }}
      locale={{
        emptyText: (
          <Empty
            description="No orders found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
    />
  );
};
