/**
 * GameChallengeButton Component (User Story 6)
 * T172: Component for creating game challenges
 */

import React, { useState } from 'react';
import { Button, Modal, Select, Input, InputNumber, message, Space, Radio } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { createChallenge } from '@/services/api/social';
import type { Friend } from '@/services/api/social';

const { Option } = Select;
const { TextArea } = Input;

interface GameChallengeButtonProps {
  friend: Friend;
  gameId?: number;
  gameTitle?: string;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'small' | 'middle' | 'large';
  onChallengeCreated?: () => void;
}

const GameChallengeButton: React.FC<GameChallengeButtonProps> = ({
  friend,
  gameId,
  gameTitle,
  type = 'default',
  size = 'middle',
  onChallengeCreated,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(gameId);
  const [challengeType, setChallengeType] = useState<'high_score' | 'time_attack' | 'completion' | 'custom'>('high_score');
  const [targetValue, setTargetValue] = useState<number | undefined>();
  const [messageText, setMessageText] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [creating, setCreating] = useState(false);

  // Handle open modal
  const handleOpenModal = () => {
    setModalVisible(true);
    if (gameId) {
      setSelectedGameId(gameId);
    }
  };

  // Handle create challenge
  const handleCreateChallenge = async () => {
    if (!selectedGameId) {
      message.warning('请选择游戏');
      return;
    }

    setCreating(true);
    try {
      await createChallenge({
        challenged_id: friend.friend_id,
        game_id: selectedGameId,
        challenge_type: challengeType,
        target_value: targetValue,
        message: messageText || undefined,
        expires_in_hours: expiresInHours,
      });

      message.success('挑战已发送');
      setModalVisible(false);
      onChallengeCreated?.();
    } catch (error: any) {
      if (error.response?.status === 400) {
        message.error(error.response?.data?.message || '创建挑战失败');
      } else if (error.response?.status === 409) {
        message.error('该游戏已有进行中的挑战');
      } else {
        message.error('创建挑战失败');
      }
      console.error('Create challenge error:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button
        type={type}
        size={size}
        icon={<TrophyOutlined />}
        onClick={handleOpenModal}
      >
        挑战
      </Button>

      <Modal
        title={`向 ${friend.nickname || friend.friend_username} 发起挑战`}
        open={modalVisible}
        onOk={handleCreateChallenge}
        onCancel={() => setModalVisible(false)}
        confirmLoading={creating}
        okText="发起挑战"
        cancelText="取消"
        width={560}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Game Selection */}
          {!gameId && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                选择游戏 <span style={{ color: '#ff4d4f' }}>*</span>
              </div>
              <Select
                placeholder="选择要挑战的游戏"
                value={selectedGameId}
                onChange={setSelectedGameId}
                style={{ width: '100%' }}
                disabled={creating}
              >
                {/* TODO: Load games from API */}
                <Option value={1}>Puzzle Quest</Option>
                <Option value={2}>Speed Runner</Option>
                <Option value={3}>Memory Master</Option>
              </Select>
            </div>
          )}

          {gameId && gameTitle && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>游戏</div>
              <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '4px' }}>
                {gameTitle}
              </div>
            </div>
          )}

          {/* Challenge Type */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              挑战类型 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Radio.Group
              value={challengeType}
              onChange={(e) => setChallengeType(e.target.value)}
              disabled={creating}
            >
              <Space direction="vertical">
                <Radio value="high_score">最高分挑战</Radio>
                <Radio value="time_attack">限时挑战</Radio>
                <Radio value="completion">完成度挑战</Radio>
                <Radio value="custom">自定义挑战</Radio>
              </Space>
            </Radio.Group>
          </div>

          {/* Target Value */}
          {(challengeType === 'high_score' || challengeType === 'time_attack') && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                目标{challengeType === 'high_score' ? '分数' : '时间（秒）'}
              </div>
              <InputNumber
                placeholder={`输入目标${challengeType === 'high_score' ? '分数' : '时间'}`}
                value={targetValue}
                onChange={(value) => setTargetValue(value || undefined)}
                style={{ width: '100%' }}
                min={0}
                disabled={creating}
              />
            </div>
          )}

          {/* Message */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              挑战宣言（可选）
            </div>
            <TextArea
              placeholder="向对方发起挑战宣言..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              maxLength={200}
              showCount
              disabled={creating}
            />
          </div>

          {/* Expires In */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              挑战有效期
            </div>
            <Select
              value={expiresInHours}
              onChange={setExpiresInHours}
              style={{ width: '100%' }}
              disabled={creating}
            >
              <Option value={1}>1 小时</Option>
              <Option value={6}>6 小时</Option>
              <Option value={24}>24 小时</Option>
              <Option value={72}>3 天</Option>
              <Option value={168}>7 天</Option>
            </Select>
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default GameChallengeButton;

