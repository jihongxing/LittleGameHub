/**
 * FriendList Component (User Story 6)
 * T167: Component for displaying and managing friend list
 */

import React, { useState } from 'react';
import { List, Avatar, Button, Space, Modal, Input, message, Tag, Popconfirm } from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  MessageOutlined,
  TrophyOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { Friend } from '@/services/api/social';
import { removeFriend, updateFriendNickname } from '@/services/api/social';

interface FriendListProps {
  friends: Friend[];
  loading?: boolean;
  onFriendRemoved?: (friendId: number) => void;
  onFriendUpdated?: () => void;
  onMessageClick?: (friend: Friend) => void;
  onChallengeClick?: (friend: Friend) => void;
}

const FriendList: React.FC<FriendListProps> = ({
  friends,
  loading = false,
  onFriendRemoved,
  onFriendUpdated,
  onMessageClick,
  onChallengeClick,
}) => {
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [nickname, setNickname] = useState('');
  const [updating, setUpdating] = useState(false);

  // Handle remove friend
  const handleRemoveFriend = async (friendId: number) => {
    try {
      await removeFriend(friendId);
      message.success('已删除好友');
      onFriendRemoved?.(friendId);
    } catch (error) {
      message.error('删除好友失败');
      console.error('Remove friend error:', error);
    }
  };

  // Handle edit nickname
  const handleEditNickname = (friend: Friend) => {
    setSelectedFriend(friend);
    setNickname(friend.nickname || '');
    setNicknameModalVisible(true);
  };

  // Handle update nickname
  const handleUpdateNickname = async () => {
    if (!selectedFriend) return;

    setUpdating(true);
    try {
      await updateFriendNickname(selectedFriend.friend_id, nickname);
      message.success('备注已更新');
      setNicknameModalVisible(false);
      onFriendUpdated?.();
    } catch (error) {
      message.error('更新备注失败');
      console.error('Update nickname error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Get status tag
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待确认', color: 'gold' },
      accepted: { text: '已添加', color: 'green' },
      rejected: { text: '已拒绝', color: 'red' },
      blocked: { text: '已屏蔽', color: 'default' },
    };

    const statusInfo = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  return (
    <>
      <List
        loading={loading}
        dataSource={friends}
        renderItem={(friend) => (
          <List.Item
            actions={[
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditNickname(friend)}
              >
                备注
              </Button>,
              <Button
                type="text"
                icon={<MessageOutlined />}
                onClick={() => onMessageClick?.(friend)}
              >
                消息
              </Button>,
              <Button
                type="text"
                icon={<TrophyOutlined />}
                onClick={() => onChallengeClick?.(friend)}
              >
                挑战
              </Button>,
              <Popconfirm
                title="确定要删除这个好友吗？"
                onConfirm={() => handleRemoveFriend(friend.friend_id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={48}
                  src={friend.friend_avatar}
                  icon={<UserOutlined />}
                />
              }
              title={
                <Space>
                  <span>{friend.nickname || friend.friend_username}</span>
                  {friend.nickname && (
                    <span style={{ fontSize: '0.85em', color: '#888' }}>
                      ({friend.friend_username})
                    </span>
                  )}
                  {getStatusTag(friend.status)}
                </Space>
              }
              description={
                <div>
                  <div>{friend.friend_email}</div>
                  {friend.last_interaction_at && (
                    <div style={{ fontSize: '0.85em', color: '#888', marginTop: '4px' }}>
                      最近互动: {new Date(friend.last_interaction_at).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
        locale={{
          emptyText: (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
              <UserOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>还没有好友</div>
              <div style={{ fontSize: '0.9em', marginTop: '8px' }}>
                去添加一些好友，一起玩游戏吧！
              </div>
            </div>
          ),
        }}
      />

      {/* Nickname Modal */}
      <Modal
        title="设置好友备注"
        open={nicknameModalVisible}
        onOk={handleUpdateNickname}
        onCancel={() => setNicknameModalVisible(false)}
        confirmLoading={updating}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            好友：{selectedFriend?.friend_username}
          </div>
          <Input
            placeholder="输入备注名称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            showCount
          />
        </div>
      </Modal>
    </>
  );
};

export default FriendList;

