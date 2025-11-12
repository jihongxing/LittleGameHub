/**
 * Add to Collection Button Component
 * Integration 1: 游戏详情页添加"添加到收藏夹"按钮
 */

import React, { useState, useEffect } from 'react';
import { Button, Modal, Select, Input, message, Space } from 'antd';
import { FolderAddOutlined, PlusOutlined } from '@ant-design/icons';
import * as collectionsApi from '@/services/api/collections';
import type { Collection } from '@/services/api/collections';

interface AddToCollectionButtonProps {
  gameId: number;
  gameTitle?: string;
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
}

const AddToCollectionButton: React.FC<AddToCollectionButtonProps> = ({
  gameId,
  gameTitle,
  size = 'middle',
  block = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Fetch user's collections
  const fetchCollections = async () => {
    try {
      const result = await collectionsApi.getCollections();
      setCollections(result.collections);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchCollections();
    }
  }, [modalVisible]);

  // Handle add to collection
  const handleAddToCollection = async () => {
    if (!selectedCollectionId && !createMode) {
      message.warning('请选择一个收藏夹');
      return;
    }

    setLoading(true);
    try {
      let collectionId = selectedCollectionId;

      // Create new collection if in create mode
      if (createMode) {
        if (!newCollectionName.trim()) {
          message.warning('请输入收藏夹名称');
          setLoading(false);
          return;
        }

        const newCollection = await collectionsApi.createCollection({
          name: newCollectionName,
          description: '',
          is_public: false,
        });
        collectionId = newCollection.id;
      }

      if (!collectionId) {
        message.error('收藏夹 ID 无效');
        setLoading(false);
        return;
      }

      // Add game to collection
      await collectionsApi.addGameToCollection(collectionId, gameId);

      message.success('已添加到收藏夹');
      setModalVisible(false);
      setNote('');
      setCreateMode(false);
      setNewCollectionName('');
      setSelectedCollectionId(null);
    } catch (error: any) {
      if (error.response?.status === 409) {
        message.warning('该游戏已在此收藏夹中');
      } else {
        message.error('添加失败，请重试');
      }
      console.error('Failed to add to collection:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        icon={<FolderAddOutlined />}
        size={size}
        block={block}
        onClick={() => setModalVisible(true)}
      >
        添加到收藏夹
      </Button>

      <Modal
        title="添加到收藏夹"
        open={modalVisible}
        onOk={handleAddToCollection}
        onCancel={() => {
          setModalVisible(false);
          setCreateMode(false);
          setNote('');
          setNewCollectionName('');
        }}
        confirmLoading={loading}
        okText="添加"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {gameTitle && (
            <div>
              <div className="text-gray-600 text-sm mb-1">游戏</div>
              <div className="font-medium">{gameTitle}</div>
            </div>
          )}

          {!createMode ? (
            <>
              <div>
                <div className="text-gray-600 text-sm mb-2">选择收藏夹</div>
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择一个收藏夹"
                  value={selectedCollectionId}
                  onChange={setSelectedCollectionId}
                  options={collections.map(c => ({
                    value: c.id,
                    label: `${c.name} (${c.game_count} 个游戏)`,
                  }))}
                />
              </div>

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setCreateMode(true)}
                block
              >
                创建新收藏夹
              </Button>
            </>
          ) : (
            <>
              <div>
                <div className="text-gray-600 text-sm mb-2">新收藏夹名称</div>
                <Input
                  placeholder="输入收藏夹名称"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <Button onClick={() => setCreateMode(false)} block>
                取消创建
              </Button>
            </>
          )}

          <div>
            <div className="text-gray-600 text-sm mb-2">备注（可选）</div>
            <Input.TextArea
              placeholder="添加一些备注..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default AddToCollectionButton;

