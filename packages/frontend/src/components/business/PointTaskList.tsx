/**
 * Point Task List Component
 * Displays available point-earning tasks
 * T085: Create PointTaskList component
 * T089: Implement daily check-in task UI
 */

import React, { useState, useEffect } from 'react';
import { List, Card, Button, Tag, Space, message, Modal, Progress } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { getPointTasks, completeTask, type PointTask } from '@/services/api/points';
import AdWatchTask from './AdWatchTask';

interface PointTaskListProps {
  onTaskComplete?: () => void;
}

/**
 * Point Task List Component
 */
const PointTaskList: React.FC<PointTaskListProps> = ({ onTaskComplete }) => {
  const [tasks, setTasks] = useState<PointTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [adTaskVisible, setAdTaskVisible] = useState<boolean>(false);

  /**
   * Fetch available tasks
   */
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getPointTasks();
      setTasks(data.tasks);
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
      message.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  /**
   * Handle task completion
   */
  const handleCompleteTask = async (taskId: string) => {
    // Special handling for ad watch task
    if (taskId === 'watch_ad') {
      setAdTaskVisible(true);
      return;
    }

    try {
      setCompletingTask(taskId);
      const result = await completeTask(taskId);

      message.success({
        content: (
          <span>
            恭喜！获得 <strong>{result.points_earned}</strong> 积分
          </span>
        ),
        duration: 3,
      });

      // Refresh tasks
      await fetchTasks();

      // Notify parent
      if (onTaskComplete) {
        onTaskComplete();
      }
    } catch (err: any) {
      console.error('Failed to complete task:', err);
      message.error(err.response?.data?.message || '完成任务失败');
    } finally {
      setCompletingTask(null);
    }
  };

  /**
   * Handle ad watch completion
   */
  const handleAdWatchComplete = async (pointsEarned: number) => {
    message.success(`观看广告完成！获得 ${pointsEarned} 积分`);
    setAdTaskVisible(false);
    await fetchTasks();
    if (onTaskComplete) {
      onTaskComplete();
    }
  };

  /**
   * Get task icon
   */
  const getTaskIcon = (taskId: string) => {
    const icons: Record<string, React.ReactNode> = {
      daily_checkin: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      watch_ad: <VideoCameraOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      invite_friend: <UserAddOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      play_game: <PlayCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
    };
    return icons[taskId] || <TrophyOutlined style={{ fontSize: 24 }} />;
  };

  /**
   * Format cooldown time
   */
  const formatCooldown = (cooldownUntil: string | null): string => {
    if (!cooldownUntil) return '';

    const cooldown = new Date(cooldownUntil);
    const now = new Date();
    const diff = cooldown.getTime() - now.getTime();

    if (diff <= 0) return '';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}小时${minutes}分钟后可用`;
    }
    return `${minutes}分钟后可用`;
  };

  return (
    <div className="point-task-list">
      {/* Task Instructions */}
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <Space direction="vertical" size="small">
          <div className="font-semibold text-blue-800">如何赚取积分？</div>
          <div className="text-sm text-blue-600">
            完成下方任务即可获得相应积分奖励。积分可用于兑换各种奖励！
          </div>
        </Space>
      </Card>

      {/* Task List */}
      <List
        loading={loading}
        dataSource={tasks}
        renderItem={(task: any) => {
          const isCompleting = completingTask === task.id;
          const cooldownText = formatCooldown(task.cooldown_until);

          return (
            <Card
              className="mb-4"
              data-testid={`task-${task.id}`}
              hoverable={!task.is_completed && !cooldownText}
            >
              <div className="flex items-center justify-between">
                {/* Task Info */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Icon */}
                  <div>{getTaskIcon(task.id)}</div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold mb-0">{task.name}</h3>
                      {task.is_completed && (
                        <Tag color="success" data-testid="task-status">
                          已完成
                        </Tag>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{task.description}</p>

                    {/* Reward */}
                    <Space>
                      <Tag color="orange" data-testid="task-reward">
                        <TrophyOutlined /> +{task.point_reward} 积分
                      </Tag>
                      {cooldownText && (
                        <Tag color="default" icon={<ClockCircleOutlined />} data-testid="task-cooldown">
                          {cooldownText}
                        </Tag>
                      )}
                    </Space>

                    {/* Special: Daily Check-in Streak (T089) */}
                    {task.id === 'daily_checkin' && task.is_completed && (
                      <div className="mt-2">
                        <Progress
                          percent={70}
                          size="small"
                          status="active"
                          format={() => '连续签到 7 天'}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  {task.is_completed ? (
                    <Button disabled>已完成</Button>
                  ) : cooldownText ? (
                    <Button disabled>冷却中</Button>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      loading={isCompleting}
                      onClick={() => handleCompleteTask(task.id)}
                      data-testid="complete-task-button"
                    >
                      {task.id === 'daily_checkin' && '立即签到'}
                      {task.id === 'watch_ad' && '观看广告'}
                      {task.id === 'invite_friend' && '邀请好友'}
                      {task.id === 'play_game' && '开始游戏'}
                      {!['daily_checkin', 'watch_ad', 'invite_friend', 'play_game'].includes(task.id) && '完成任务'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        }}
      />

      {/* Ad Watch Modal */}
      <AdWatchTask
        visible={adTaskVisible}
        onClose={() => setAdTaskVisible(false)}
        onComplete={handleAdWatchComplete}
      />
    </div>
  );
};

export default PointTaskList;

