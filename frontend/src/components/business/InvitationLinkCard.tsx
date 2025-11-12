/**
 * Invitation Link Card Component
 * Displays invitation link with QR code and sharing options
 * T132: Create InvitationLinkCard component with QR code generation
 */

import React, { useState } from 'react';
import { Card, Button, Input, message, Space, Modal } from 'antd';
import {
  CopyOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import ShareButton from './ShareButton';
import type { GenerateInvitationResponse } from '@/services/api/invitations';

interface InvitationLinkCardProps {
  invitation: GenerateInvitationResponse;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

/**
 * Invitation Link Card Component
 */
const InvitationLinkCard: React.FC<InvitationLinkCardProps> = ({
  invitation,
  onRegenerate,
  regenerating = false,
}) => {
  const [qrModalVisible, setQrModalVisible] = useState<boolean>(false);

  /**
   * Copy invitation link to clipboard
   */
  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitation.invitation_link);
    message.success('邀请链接已复制到剪贴板！');
  };

  /**
   * Copy invitation code to clipboard
   */
  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitation.invitation_code);
    message.success('邀请码已复制！');
  };

  return (
    <>
      <Card
        className="invitation-link-card bg-gradient-to-r from-blue-500 to-purple-600 text-white"
        data-testid="invitation-link-card"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold mb-0">我的邀请链接</h3>
            {onRegenerate && (
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={onRegenerate}
                loading={regenerating}
                className="text-white hover:text-white hover:bg-white/20"
              >
                重新生成
              </Button>
            )}
          </div>

          {/* Invitation Code */}
          <div>
            <div className="text-sm opacity-90 mb-1">邀请码</div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold font-mono tracking-wider">
                {invitation.invitation_code}
              </span>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopyCode}
                className="text-white hover:text-white hover:bg-white/20"
                data-testid="copy-code-button"
              />
            </div>
          </div>

          {/* Invitation Link */}
          <div>
            <div className="text-sm opacity-90 mb-2">邀请链接</div>
            <Input
              value={invitation.invitation_link}
              readOnly
              className="bg-white/20 border-white/30 text-white placeholder-white/50"
              addonAfter={
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={handleCopyLink}
                  className="text-white hover:text-white"
                  data-testid="copy-link-button"
                >
                  复制
                </Button>
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              icon={<QrcodeOutlined />}
              onClick={() => setQrModalVisible(true)}
              size="large"
              className="flex-1"
              data-testid="qr-code-button"
            >
              查看二维码
            </Button>
            <ShareButton
              title="邀请你加入游戏平台"
              description="注册即可获得积分奖励！"
              url={invitation.invitation_link}
            />
          </div>
        </div>
      </Card>

      {/* QR Code Modal */}
      <Modal
        title="邀请二维码"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            关闭
          </Button>,
        ]}
        centered
        data-testid="qr-code-modal"
      >
        <div className="text-center py-4">
          <div className="bg-white p-4 inline-block rounded-lg shadow-sm">
            <img
              src={invitation.qr_code_url}
              alt="Invitation QR Code"
              className="w-64 h-64"
              data-testid="qr-code-image"
            />
          </div>
          <p className="mt-4 text-gray-600">
            扫描二维码即可注册
          </p>
          <p className="text-sm text-gray-500">
            邀请码：<span className="font-mono font-bold">{invitation.invitation_code}</span>
          </p>
        </div>
      </Modal>
    </>
  );
};

export default InvitationLinkCard;

