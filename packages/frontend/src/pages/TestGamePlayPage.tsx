/**
 * 游戏试玩测试页面
 * Test Game Play Page
 */

import React, { useState } from 'react';
import { Card, Button, Typography, Space, message, Alert } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { startGameSession } from '@/services/api/games';

const { Title, Text } = Typography;

const TestGamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 使用一个测试游戏ID
  const testGameId = 'b82b7d55-90db-47d6-bb55-580a456eb8c6';

  const handleTestPlay = async () => {
    try {
      setLoading(true);
      
      // 开始游戏会话
      const sessionResponse = await startGameSession(testGameId);
      
      // 保存会话ID到localStorage
      localStorage.setItem(`game_session_${testGameId}`, sessionResponse.session_id);
      
      message.success('游戏会话创建成功！');
      
      // 跳转到游戏播放页面
      navigate(`/games/${testGameId}/play`);
      
    } catch (error: any) {
      console.error('Failed to start game session:', error);
      message.error(error.message || '启动游戏失败');
    } finally {
      setLoading(false);
    }
  };

  const checkLocalStorage = () => {
    const sessionId = localStorage.getItem(`game_session_${testGameId}`);
    if (sessionId) {
      message.info(`当前会话ID: ${sessionId}`);
    } else {
      message.warning('没有找到会话ID');
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem(`game_session_${testGameId}`);
    message.success('已清除会话ID');
  };

  return (
    <div className="container mx-auto p-6">
      <Title level={2}>游戏试玩测试</Title>
      
      <Space direction="vertical" size="large" className="w-full">
        <Alert
          message="测试说明"
          description="这个页面用于测试游戏会话创建和游戏播放功能。点击'测试游戏试玩'按钮将创建一个游戏会话并跳转到游戏播放页面。"
          type="info"
          showIcon
        />

        <Card title="游戏会话测试">
          <Space direction="vertical" size="middle">
            <Text>
              <strong>测试游戏ID:</strong> {testGameId}
            </Text>
            
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={loading}
                onClick={handleTestPlay}
              >
                测试游戏试玩
              </Button>
              
              <Button onClick={checkLocalStorage}>
                检查会话ID
              </Button>
              
              <Button onClick={clearLocalStorage}>
                清除会话ID
              </Button>
            </Space>
          </Space>
        </Card>

        <Card title="测试步骤">
          <ol className="list-decimal list-inside space-y-2">
            <li>点击"测试游戏试玩"按钮</li>
            <li>系统会创建游戏会话并保存会话ID</li>
            <li>自动跳转到游戏播放页面</li>
            <li>游戏播放页面应该能找到会话ID并正常加载</li>
            <li>如果出现"未找到游戏会话"错误，说明修复未生效</li>
          </ol>
        </Card>
      </Space>
    </div>
  );
};

export default TestGamePlayPage;
