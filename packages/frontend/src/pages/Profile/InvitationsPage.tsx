/**
 * Invitations Page
 * Main page for managing invitations and viewing stats
 * T131: Create InvitationsPage component
 */

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Alert, message } from 'antd';
import { UserAddOutlined, TrophyOutlined, BarChartOutlined } from '@ant-design/icons';
import Loading from '@/components/common/Loading';
import InvitationLinkCard from '@/components/business/InvitationLinkCard';
import InvitationStats from '@/components/business/InvitationStats';
import InvitationLeaderboard from '@/components/business/InvitationLeaderboard';
import {
  generateInvitation,
  getInvitationStats,
  getUserInvitations,
  type GenerateInvitationResponse,
  type InvitationStats as IStats,
  type Invitation,
} from '@/services/api/invitations';

const { TabPane } = Tabs;

/**
 * Invitations Page Component
 */
const InvitationsPage: React.FC = () => {
  const [invitation, setInvitation] = useState<GenerateInvitationResponse | null>(null);
  const [stats, setStats] = useState<IStats | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch initial data
   */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, invitationsData] = await Promise.all([
        getInvitationStats(),
        getUserInvitations({ limit: 10 }),
      ]);

      setStats(statsData);
      setInvitations(invitationsData.invitations);

      // Generate initial invitation if user has none
      if (invitationsData.invitations.length === 0) {
        await handleGenerateInvitation();
      } else {
        // Use the most recent invitation
        const recent = invitationsData.invitations[0];
        setInvitation({
          invitation_id: recent.id,
          invitation_code: recent.invitation_code,
          invitation_link: recent.invitation_link,
          qr_code_url: `/api/invitations/qr/${recent.invitation_code}`,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch invitation data:', err);
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate new invitation
   */
  const handleGenerateInvitation = async () => {
    try {
      setGenerating(true);
      const newInvitation = await generateInvitation();
      setInvitation(newInvitation);
      message.success('邀请链接已生成！');
      
      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error('Failed to generate invitation:', err);
      message.error(err.response?.data?.error || '生成邀请链接失败');
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !invitation) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading message="加载邀请信息中..." />
      </div>
    );
  }

  return (
    <div className="invitations-page min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <UserAddOutlined />
            邀请好友
          </h1>
          <p className="text-gray-600">
            邀请好友注册，好友完成任务，双方均可获得积分奖励！
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Invitation Link Card */}
        {invitation && (
          <InvitationLinkCard
            invitation={invitation}
            onRegenerate={handleGenerateInvitation}
            regenerating={generating}
          />
        )}

        {/* Stats and Content Tabs */}
        <Card className="mt-6">
          <Tabs defaultActiveKey="stats">
            <TabPane
              tab={
                <span>
                  <BarChartOutlined />
                  我的数据
                </span>
              }
              key="stats"
            >
              {stats && <InvitationStats stats={stats} />}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <TrophyOutlined />
                  排行榜
                </span>
              }
              key="leaderboard"
            >
              <InvitationLeaderboard />
            </TabPane>
          </Tabs>
        </Card>

        {/* Invitation History */}
        {invitations.length > 0 && (
          <Card title="邀请记录" className="mt-6">
            <div className="space-y-2">
              {invitations.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-mono text-sm">{inv.invitation_code}</span>
                    <span className="text-gray-500 ml-2">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        inv.status === 'accepted' || inv.status === 'rewarded'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {inv.status === 'pending' && '待使用'}
                      {inv.status === 'accepted' && '已接受'}
                      {inv.status === 'rewarded' && '已奖励'}
                      {inv.status === 'expired' && '已过期'}
                    </span>
                    <span className="text-orange-500 font-semibold">
                      +{inv.points_awarded} 积分
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvitationsPage;

