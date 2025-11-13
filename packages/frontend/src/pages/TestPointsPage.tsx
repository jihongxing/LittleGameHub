/**
 * 积分系统测试页面
 * Test Points Page
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, message, Alert, Statistic, Row, Col } from 'antd';
import { TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getPointBalance, getPointTasks } from '@/services/api/points';
import type { PointBalance, PointTask } from '@/services/api/points';

const { Title, Text } = Typography;

const TestPointsPage: React.FC = () => {
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [tasks, setTasks] = useState<PointTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPointBalance();
      setBalance(data);
      message.success('积分余额获取成功');
    } catch (err: any) {
      console.error('Failed to fetch balance:', err);
      setError(`获取积分余额失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPointTasks();
      setTasks(data.tasks);
      message.success('任务列表获取成功');
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
      setError(`获取任务列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Title level={2}>积分系统测试</Title>
      
      <Space direction="vertical" size="large" className="w-full">
        <Alert
          message="测试说明"
          description="这个页面用于测试积分系统的各个API端点。请确保已登录后再进行测试。"
          type="info"
          showIcon
        />

        {error && (
          <Alert
            message="错误信息"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        <Card title="积分余额测试">
          <Space direction="vertical" size="middle" className="w-full">
            <Button 
              type="primary" 
              loading={loading}
              onClick={fetchBalance}
            >
              获取积分余额
            </Button>
            
            {balance && (
              <Row gutter={16}>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="当前积分"
                      value={balance.balance}
                      prefix={<TrophyOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="待入账积分"
                      value={balance.pending}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </Space>
        </Card>

        <Card title="任务列表测试">
          <Space direction="vertical" size="middle" className="w-full">
            <Button 
              type="primary" 
              loading={loading}
              onClick={fetchTasks}
            >
              获取任务列表
            </Button>
            
            {tasks.length > 0 && (
              <div>
                <Text strong>任务列表 ({tasks.length} 个任务):</Text>
                <div className="mt-4 space-y-2">
                  {tasks.map((task) => (
                    <Card key={task.id} size="small">
                      <div className="flex justify-between items-center">
                        <div>
                          <Text strong>{task.name}</Text>
                          <div className="text-gray-600 text-sm">{task.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 font-bold">+{task.point_reward} 积分</div>
                          <div className="text-sm">
                            {task.is_completed ? '已完成' : '可完成'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Space>
        </Card>

        <Card title="API测试结果">
          <Space direction="vertical">
            <Text>
              <strong>积分余额API:</strong> {balance ? '✅ 正常' : '❌ 未测试'}
            </Text>
            <Text>
              <strong>任务列表API:</strong> {tasks.length > 0 ? '✅ 正常' : '❌ 未测试'}
            </Text>
            {balance && (
              <Text type="secondary">
                当前积分: {balance.balance}, 待入账: {balance.pending}
              </Text>
            )}
            {tasks.length > 0 && (
              <Text type="secondary">
                可用任务: {tasks.length} 个
              </Text>
            )}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default TestPointsPage;
