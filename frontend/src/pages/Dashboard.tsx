/**
 * Dashboard Page
 * ==============
 * 
 * Purpose:
 *   Main dashboard with welcome message, statistics, visit widgets, and quick actions.
 * 
 * Module: src/pages/Dashboard.tsx
 * Phase: 2F (Integration - Dashboard)
 * 
 * References:
 *   - Phase 2F Spec: docs/phases/phase2/Phase2F_Integration_Dashboard.md
 */

import { Card, Row, Col, Statistic, Typography, Space, Tag, Divider, Button, List, Empty, Spin, Badge } from 'antd';
import { 
  UserOutlined, 
  MedicineBoxOutlined, 
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  SyncOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePatientCount } from '@/hooks/usePatients';
import { useTodayVisits, useVisitStats } from '@/hooks/useVisits';
import { VisitPriorityBadge } from '@/components/visits';
import { colors } from '@/theme';
import type { Visit } from '@/types';

const { Title, Text } = Typography;

// =============================================================================
// ROLE COLORS
// =============================================================================

const roleColors: Record<string, string> = {
  admin: 'red',
  doctor: 'blue',
  nurse: 'green',
  receptionist: 'orange',
};

// =============================================================================
// COMPONENT
// =============================================================================

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: patientCountData } = usePatientCount();
  const { data: todayVisitsData, isLoading: visitsLoading, refetch: refetchVisits } = useTodayVisits();
  const { data: visitStats } = useVisitStats();

  // Separate visits by status
  const allVisits = todayVisitsData || [];
  const waitingVisits = allVisits.filter((v: Visit) => v.status === 'waiting');
  const inProgressVisits = allVisits.filter((v: Visit) => v.status === 'in_progress');
  const registeredCount = allVisits.filter((v: Visit) => v.status === 'registered').length;
  const completedCount = allVisits.filter((v: Visit) => v.status === 'completed').length;
  const cancelledCount = allVisits.filter((v: Visit) => v.status === 'cancelled').length;

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Welcome Section */}
      <Card 
        style={{ marginBottom: 24 }}
        bordered={false}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col flex="auto">
            <Title level={3} style={{ marginBottom: 4 }}>
              {getGreeting()}, {user?.full_name}!
            </Title>
            <Space>
              <Text type="secondary">
                Logged in as <Text strong>{user?.username}</Text>
              </Text>
              <Tag color={roleColors[user?.role || 'admin']}>
                {user?.role?.toUpperCase()}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" align="end" size={0}>
              <Text type="secondary">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <Text type="secondary">
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                {new Date().toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            hoverable
            onClick={() => navigate('/patients')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Total Patients"
              value={patientCountData ?? 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: colors.success.main }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            hoverable
            onClick={() => navigate('/visits')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Today's Visits"
              value={allVisits.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: colors.primary.main }}
              loading={visitsLoading}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            hoverable
            onClick={() => navigate('/visits?status=waiting')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Waiting Now"
              value={waitingVisits.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: colors.warning.main }}
              loading={visitsLoading}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            hoverable
            onClick={() => navigate('/visits?status=in_progress')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="In Progress"
              value={inProgressVisits.length}
              prefix={<SyncOutlined spin={inProgressVisits.length > 0} />}
              valueStyle={{ color: colors.info.main }}
              loading={visitsLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Visit Status Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <MedicineBoxOutlined style={{ color: colors.primary.main }} />
                <span>Today's Visit Statistics</span>
              </Space>
            }
            bordered={false}
            extra={
              <Button 
                icon={<SyncOutlined />} 
                onClick={() => refetchVisits()}
                loading={visitsLoading}
              >
                Refresh
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={8} sm={4}>
                <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                    {registeredCount}
                  </div>
                  <Text type="secondary">Registered</Text>
                </Card>
              </Col>
              <Col xs={8} sm={4}>
                <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>
                    {waitingVisits.length}
                  </div>
                  <Text type="secondary">Waiting</Text>
                </Card>
              </Col>
              <Col xs={8} sm={4}>
                <Card size="small" style={{ textAlign: 'center', background: '#e6f4ff' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>
                    {inProgressVisits.length}
                  </div>
                  <Text type="secondary">In Progress</Text>
                </Card>
              </Col>
              <Col xs={8} sm={4}>
                <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                    {completedCount}
                  </div>
                  <Text type="secondary">Completed</Text>
                </Card>
              </Col>
              <Col xs={8} sm={4}>
                <Card size="small" style={{ textAlign: 'center', background: '#f5f5f5' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#8c8c8c' }}>
                    {cancelledCount}
                  </div>
                  <Text type="secondary">Cancelled</Text>
                </Card>
              </Col>
              <Col xs={8} sm={4}>
                <Card size="small" style={{ textAlign: 'center', background: colors.primary.lightest }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: colors.primary.main }}>
                    {visitStats?.average_wait_time_minutes ?? 0}
                  </div>
                  <Text type="secondary">Avg Wait (min)</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Today's Visits & Quick Actions */}
      <Row gutter={[16, 16]}>
        {/* Today's Visits Widget */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: colors.primary.main }} />
                <span>Today's Appointments</span>
                <Badge count={waitingVisits.length + inProgressVisits.length} style={{ backgroundColor: colors.warning.main }} />
              </Space>
            }
            bordered={false}
            extra={
              <Button type="link" onClick={() => navigate('/visits')}>
                View All <RightOutlined />
              </Button>
            }
            style={{ height: '100%' }}
          >
            {visitsLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : (waitingVisits.length === 0 && inProgressVisits.length === 0) ? (
              <Empty 
                description="No active visits" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/visits/create')}>
                  Create Visit
                </Button>
              </Empty>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* Waiting Section */}
                {waitingVisits.length > 0 && (
                  <>
                    <Text strong style={{ color: colors.warning.main }}>
                      <ClockCircleOutlined /> Waiting ({waitingVisits.length})
                    </Text>
                    <List
                      size="small"
                      dataSource={waitingVisits.slice(0, 3)}
                      renderItem={(visit: Visit) => (
                        <List.Item
                          style={{ cursor: 'pointer', padding: '8px 12px', background: '#fffbe6', borderRadius: 4, marginBottom: 4 }}
                          onClick={() => navigate(`/visits/${visit.id}`)}
                        >
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <Text strong>{visit.patient?.full_name || 'Unknown'}</Text>
                              <VisitPriorityBadge priority={visit.priority} showLabel={false} />
                            </Space>
                            <Text type="secondary">
                              {visit.wait_time_minutes ? `${visit.wait_time_minutes} min` : ''}
                            </Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                    {waitingVisits.length > 3 && (
                      <Button type="link" size="small" onClick={() => navigate('/visits?status=waiting')}>
                        +{waitingVisits.length - 3} more...
                      </Button>
                    )}
                  </>
                )}

                {/* In Progress Section */}
                {inProgressVisits.length > 0 && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text strong style={{ color: colors.info.main }}>
                      <SyncOutlined spin /> In Progress ({inProgressVisits.length})
                    </Text>
                    <List
                      size="small"
                      dataSource={inProgressVisits.slice(0, 3)}
                      renderItem={(visit: Visit) => (
                        <List.Item
                          style={{ cursor: 'pointer', padding: '8px 12px', background: '#e6f4ff', borderRadius: 4, marginBottom: 4 }}
                          onClick={() => navigate(`/visits/${visit.id}`)}
                        >
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <Text strong>{visit.patient?.full_name || 'Unknown'}</Text>
                              <Text type="secondary">with {visit.assigned_doctor?.full_name || 'Unassigned'}</Text>
                            </Space>
                            <Text type="secondary">
                              {visit.consultation_duration_minutes ? `${visit.consultation_duration_minutes} min` : ''}
                            </Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </>
                )}
              </Space>
            )}
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <MedicineBoxOutlined style={{ color: colors.primary.main }} />
                <span>Quick Actions</span>
              </Space>
            }
            bordered={false}
            style={{ marginBottom: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                block
                size="large"
                onClick={() => navigate('/visits/create')}
              >
                New Visit
              </Button>
              <Button 
                icon={<UserOutlined />} 
                block
                onClick={() => navigate('/patients/create')}
              >
                Register New Patient
              </Button>
              <Button 
                icon={<UnorderedListOutlined />} 
                block
                onClick={() => navigate('/visits')}
              >
                View All Visits
              </Button>
              <Button 
                icon={<UnorderedListOutlined />} 
                block
                onClick={() => navigate('/patients')}
              >
                View All Patients
              </Button>
            </Space>
          </Card>

          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: colors.primary.main }} />
                <span>System Status</span>
              </Space>
            }
            bordered={false}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text>Backend API</Text>
                <Tag color="success">Online</Tag>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Text>Database</Text>
                <Tag color="success">Connected</Tag>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Text>PACS/Orthanc</Text>
                <Tag color="success">Online</Tag>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
