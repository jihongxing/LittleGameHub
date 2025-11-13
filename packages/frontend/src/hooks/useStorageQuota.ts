/**
 * Storage Quota Hook
 * Integration 3: 集成会员系统获取真实存储配额
 */

import { useState, useEffect } from 'react';
import * as offlineApi from '@/services/api/offline';
import type { StorageQuota } from '@/services/api/offline';

export interface UseStorageQuotaResult {
  quota: StorageQuota | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canDownload: (fileSize: number) => boolean;
  percentageUsed: number;
}

/**
 * Hook to manage storage quota
 */
export function useStorageQuota(): UseStorageQuotaResult {
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = async () => {
    setLoading(true);
    setError(null);
    try {
      const games = await offlineApi.getOfflineGames();
      setQuota(games.storage);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch storage quota');
      console.error('Failed to fetch storage quota:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const canDownload = (fileSize: number): boolean => {
    if (!quota) return false;
    return quota.available >= fileSize;
  };

  const percentageUsed = quota ? quota.percentage_used : 0;

  return {
    quota,
    loading,
    error,
    refresh: fetchQuota,
    canDownload,
    percentageUsed,
  };
}

/**
 * Hook to check if user can download based on membership
 */
export function useDownloadPermission() {
  const { quota, canDownload: checkSpace } = useStorageQuota();

  const canDownload = (fileSize: number): {
    allowed: boolean;
    reason?: string;
    quota?: StorageQuota;
  } => {
    if (!quota) {
      return {
        allowed: false,
        reason: '无法获取存储配额',
      };
    }

    if (!checkSpace(fileSize)) {
      return {
        allowed: false,
        reason: `存储空间不足。需要 ${formatBytes(fileSize)}，剩余 ${formatBytes(quota.available)}`,
        quota,
      };
    }

    return {
      allowed: true,
      quota,
    };
  };

  const getUpgradeMessage = (): string | null => {
    if (!quota) return null;

    if (quota.tier === 'free') {
      return '升级为会员可获得 5GB 存储空间（当前 1GB）';
    }

    if (quota.tier === 'member') {
      return '升级为离线会员可获得 20GB 存储空间（当前 5GB）';
    }

    return null;
  };

  return {
    quota,
    canDownload,
    getUpgradeMessage,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default useStorageQuota;

