/**
 * Membership Expiration Notice Component
 * Displays notification when membership is about to expire
 * T116: Implement membership expiration notification
 */

import React, { useState, useEffect } from 'react';
import { Alert, Button } from 'antd';
import { ClockCircleOutlined, CrownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCurrentMembership, type MembershipInfo } from '@/services/api/membership';

interface MembershipExpirationNoticeProps {
  warningDays?: number; // Show notice when X days before expiration
}

/**
 * Membership Expiration Notice Component
 */
const MembershipExpirationNotice: React.FC<MembershipExpirationNoticeProps> = ({
  warningDays = 7,
}) => {
  const navigate = useNavigate();
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [showNotice, setShowNotice] = useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    const fetchMembershipInfo = async () => {
      try {
        const info = await getCurrentMembership();
        setMembershipInfo(info);

        // Check if membership is expiring soon
        if (info.current_membership) {
          const endDate = new Date(info.current_membership.end_date);
          const now = new Date();
          const diffTime = endDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          setDaysRemaining(diffDays);

          // Show notice if expiring within warning period and auto-renew is off
          if (diffDays <= warningDays && diffDays > 0 && !info.current_membership.auto_renew) {
            setShowNotice(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch membership info:', err);
      }
    };

    fetchMembershipInfo();

    // Refresh every hour
    const interval = setInterval(fetchMembershipInfo, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [warningDays]);

  if (!showNotice || !membershipInfo?.current_membership) {
    return null;
  }

  return (
    <Alert
      message={
        <div className="flex items-center gap-2">
          <CrownOutlined style={{ color: '#722ed1' }} />
          <span>会员即将过期</span>
        </div>
      }
      description={
        <div>
          <p>
            您的 <strong>{membershipInfo.tier.toUpperCase()}</strong> 会员将在{' '}
            <strong className="text-orange-500">{daysRemaining}</strong> 天后过期。
          </p>
          <p className="mt-2">
            续订会员以继续享受特权福利。
          </p>
        </div>
      }
      type="warning"
      showIcon
      icon={<ClockCircleOutlined />}
      action={
        <Button
          type="primary"
          size="small"
          onClick={() => navigate('/membership')}
          data-testid="renew-button"
        >
          立即续订
        </Button>
      }
      closable
      onClose={() => setShowNotice(false)}
      className="mb-4"
      data-testid="expiration-notice"
    />
  );
};

export default MembershipExpirationNotice;

