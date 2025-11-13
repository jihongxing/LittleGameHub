/**
 * Share Button Component
 * Social sharing functionality (WeChat, QQ, etc.)
 * T134: Implement social sharing functionality
 */

import React, { useState } from 'react';
import { Button, Modal, Space, message } from 'antd';
import { ShareAltOutlined, WechatOutlined } from '@ant-design/icons';

interface ShareButtonProps {
  title: string;
  description: string;
  url: string;
}

/**
 * Share Button Component
 */
const ShareButton: React.FC<ShareButtonProps> = ({ title, description, url }) => {
  const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);

  /**
   * Share to WeChat (simulated)
   */
  const handleShareWeChat = () => {
    // In production, integrate with WeChat JS-SDK
    message.info('请复制链接后在微信中分享');
    navigator.clipboard.writeText(url);
    setShareModalVisible(false);
  };

  /**
   * Share to QQ (simulated)
   */
  const handleShareQQ = () => {
    // In production, integrate with QQ Connect
    const qqShareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`;
    
    // Open in new window
    window.open(qqShareUrl, '_blank', 'width=600,height=400');
    setShareModalVisible(false);
  };

  /**
   * Share to Weibo (simulated)
   */
  const handleShareWeibo = () => {
    const weiboShareUrl = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + ' - ' + description)}`;
    
    window.open(weiboShareUrl, '_blank', 'width=600,height=400');
    setShareModalVisible(false);
  };

  /**
   * Copy link
   */
  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    message.success('链接已复制！');
    setShareModalVisible(false);
  };

  return (
    <>
      <Button
        icon={<ShareAltOutlined />}
        onClick={() => setShareModalVisible(true)}
        size="large"
        type="primary"
        className="flex-1"
        data-testid="share-button"
      >
        分享
      </Button>

      <Modal
        title="分享邀请链接"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
        centered
        data-testid="share-modal"
      >
        <div className="space-y-3">
          <p className="text-gray-600 mb-4">选择分享方式</p>

          {/* WeChat Share */}
          <Button
            block
            size="large"
            icon={
              <span className="text-green-500 text-xl">
                <WechatOutlined />
              </span>
            }
            onClick={handleShareWeChat}
            className="flex items-center justify-center gap-2"
          >
            <span>分享到微信</span>
          </Button>

          {/* QQ Share */}
          <Button
            block
            size="large"
            icon={<span className="text-blue-500 text-xl">💬</span>}
            onClick={handleShareQQ}
            className="flex items-center justify-center gap-2"
          >
            <span>分享到QQ</span>
          </Button>

          {/* Weibo Share */}
          <Button
            block
            size="large"
            icon={<span className="text-red-500 text-xl">📱</span>}
            onClick={handleShareWeibo}
            className="flex items-center justify-center gap-2"
          >
            <span>分享到微博</span>
          </Button>

          {/* Copy Link */}
          <Button
            block
            size="large"
            icon={<span className="text-gray-500 text-xl">🔗</span>}
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2"
          >
            <span>复制链接</span>
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ShareButton;

