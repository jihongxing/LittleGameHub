/**
 * FriendRequestButton Component (User Story 6)
 * T171: Component for sending and managing friend requests
 */

import React, { useState } from 'react';
import { Button, Modal, Input, message, Space, Tooltip } from 'antd';
import { UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { sendFriendRequest, checkFriendship } from '@/services/api/social';

interface FriendRequestButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
  onRequestSent?: () => void;
}

const FriendRequestButton: React.FC<FriendRequestButtonProps> = ({
  type = 'primary',
  size = 'middle',
  block = false,
  onRequestSent,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [friendIdOrUsername, setFriendIdOrUsername] = useState('');
  const [message_text, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  // Handle open modal
  const handleOpenModal = () => {
    setModalVisible(true);
    setFriendIdOrUsername('');
    setMessageText('');
  };

  // Handle send friend request
  const handleSendRequest = async () => {
    if (!friendIdOrUsername.trim()) {
      message.warning('请输入好友ID或用户名');
      return;
    }

    // Parse friend ID (assuming it's a number for now)
    const friendId = parseInt(friendIdOrUsername.trim(), 10);
    if (isNaN(friendId)) {
      message.warning('请输入有效的好友ID');
      return;
    }

    setSending(true);
    try {
      // Check if already friends
      const areFriends = await checkFriendship(friendId);
      if (areFriends) {
        message.info('你们已经是好友了');
        setSending(false);
        return;
      }

      // Send friend request
      await sendFriendRequest(friendId, message_text || undefined);
      message.success('好友请求已发送');
      setModalVisible(false);
      onRequestSent?.();
    } catch (error: any) {
      if (error.response?.status === 404) {
        message.error('用户不存在');
      } else if (error.response?.status === 409) {
        message.error('好友请求已存在');
      } else {
        message.error(error.response?.data?.message || '发送好友请求失败');
      }
      console.error('Send friend request error:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle check friendship
  const handleCheckFriendship = async () => {
    if (!friendIdOrUsername.trim()) {
      message.warning('请输入好友ID或用户名');
      return;
    }

    const friendId = parseInt(friendIdOrUsername.trim(), 10);
    if (isNaN(friendId)) {
      message.warning('请输入有效的好友ID');
      return;
    }

    setChecking(true);
    try {
      const areFriends = await checkFriendship(friendId);
      if (areFriends) {
        message.success('你们已经是好友了');
      } else {
        message.info('你们还不是好友');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        message.error('用户不存在');
      } else {
        message.error('查询失败');
      }
      console.error('Check friendship error:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Button
        type={type}
        size={size}
        block={block}
        icon={<UserAddOutlined />}
        onClick={handleOpenModal}
      >
        添加好友
      </Button>

      <Modal
        title="添加好友"
        open={modalVisible}
        onOk={handleSendRequest}
        onCancel={() => setModalVisible(false)}
        confirmLoading={sending}
        okText="发送请求"
        cancelText="取消"
        width={480}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              好友ID或用户名 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入好友ID或用户名"
                value={friendIdOrUsername}
                onChange={(e) => setFriendIdOrUsername(e.target.value)}
                onPressEnter={handleSendRequest}
                disabled={sending}
              />
              <Tooltip title="查询是否已是好友">
                <Button
                  icon={<SearchOutlined />}
                  onClick={handleCheckFriendship}
                  loading={checking}
                  disabled={sending}
                >
                  查询
                </Button>
              </Tooltip>
            </Space.Compact>
            <div style={{ marginTop: 8, fontSize: '0.85em', color: '#888' }}>
              提示：目前仅支持通过好友ID添加，后续将支持用户名搜索
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              附加消息（可选）
            </div>
            <Input.TextArea
              placeholder="向对方介绍一下自己吧..."
              value={message_text}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              maxLength={200}
              showCount
              disabled={sending}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default FriendRequestButton;

