/**
 * Collections Page Component (User Story 7)
 * T193: Main page for managing game collections
 */

import React, { useEffect, useState } from 'react';
import { Card, Button, Modal, Input, Switch, Space, Empty, Spin, message, Row, Col, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { Collection } from '@/services/api/collections';
import * as collectionsApi from '@/services/api/collections';
import CollectionManager from '@/components/business/CollectionManager';

const { TextArea } = Input;

const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });

  // Fetch collections
  const fetchCollections = async () => {
    setLoading(true);
    try {
      const result = await collectionsApi.getCollections();
      setCollections(result.collections);
    } catch (error) {
      message.error('加载收藏夹失败');
      console.error('Fetch collections error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Handle create collection
  const handleCreate = () => {
    setEditMode(false);
    setSelectedCollection(null);
    setFormData({ name: '', description: '', is_public: false });
    setModalVisible(true);
  };

  // Handle edit collection
  const handleEdit = (collection: Collection) => {
    setEditMode(true);
    setSelectedCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      is_public: collection.is_public,
    });
    setModalVisible(true);
  };

  // Handle save collection
  const handleSave = async () => {
    if (!formData.name.trim()) {
      message.warning('请输入收藏夹名称');
      return;
    }

    try {
      if (editMode && selectedCollection) {
        await collectionsApi.updateCollection(selectedCollection.id, formData);
        message.success('收藏夹已更新');
      } else {
        await collectionsApi.createCollection(formData);
        message.success('收藏夹已创建');
      }
      setModalVisible(false);
      fetchCollections();
    } catch (error) {
      message.error(editMode ? '更新失败' : '创建失败');
      console.error('Save collection error:', error);
    }
  };

  // Handle delete collection
  const handleDelete = async (id: number) => {
    try {
      await collectionsApi.deleteCollection(id);
      message.success('收藏夹已删除');
      fetchCollections();
    } catch (error) {
      message.error('删除失败');
      console.error('Delete collection error:', error);
    }
  };

  return (
    <div className="collections-page min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">我的收藏夹</h1>
            <p className="text-gray-600">管理你的游戏收藏，分类整理喜欢的游戏</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
            创建收藏夹
          </Button>
        </div>

        {/* Collections Grid */}
        <Spin spinning={loading}>
          {collections.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="还没有收藏夹"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  创建第一个收藏夹
                </Button>
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {collections.map((collection) => (
                <Col key={collection.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    cover={
                      collection.cover_image_url ? (
                        <img alt={collection.name} src={collection.cover_image_url} style={{ height: 150, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: 150, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FolderOpenOutlined style={{ fontSize: 48, color: 'white' }} />
                        </div>
                      )
                    }
                    actions={[
                      <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(collection)}>
                        编辑
                      </Button>,
                      <Popconfirm
                        title="确定要删除这个收藏夹吗？"
                        onConfirm={() => handleDelete(collection.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          <span>{collection.name}</span>
                          {collection.is_public ? (
                            <UnlockOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <LockOutlined style={{ color: '#999' }} />
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <div className="text-gray-600 mb-2" style={{ minHeight: 40 }}>
                            {collection.description || '暂无描述'}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {collection.game_count} 个游戏
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>

        {/* Collection Modal */}
        <Modal
          title={editMode ? '编辑收藏夹' : '创建收藏夹'}
          open={modalVisible}
          onOk={handleSave}
          onCancel={() => setModalVisible(false)}
          okText={editMode ? '保存' : '创建'}
          cancelText="取消"
          width={560}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                收藏夹名称 <span style={{ color: '#ff4d4f' }}>*</span>
              </div>
              <Input
                placeholder="输入收藏夹名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={100}
                showCount
              />
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>描述</div>
              <TextArea
                placeholder="添加一些描述..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                maxLength={500}
                showCount
              />
            </div>

            <div>
              <Space>
                <Switch
                  checked={formData.is_public}
                  onChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <span>公开收藏夹</span>
              </Space>
              <div style={{ marginTop: 8, fontSize: '0.85em', color: '#888' }}>
                公开后其他用户可以查看这个收藏夹
              </div>
            </div>
          </Space>
        </Modal>

        {/* Collection Manager for selected collection */}
        {selectedCollection && (
          <CollectionManager collectionId={selectedCollection.id} />
        )}
      </div>
    </div>
  );
};

export default CollectionsPage;

