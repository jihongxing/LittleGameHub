/**
 * OAuth State Management Utilities
 * OAuth 状态管理工具
 *
 * Provides utilities for generating and validating OAuth state parameters
 * 用于生成和验证OAuth状态参数的工具
 */

// 在Node.js环境中导入crypto
let cryptoModule: any;
try {
  cryptoModule = require('crypto');
} catch (error) {
  // 在浏览器环境中，crypto是全局可用的
  cryptoModule = { createHash: null };
}

const { createHash } = cryptoModule;

/**
 * Generate OAuth state parameter
 * 生成OAuth状态参数
 *
 * @param sessionId User session ID for additional security
 * @returns Random state string
 */
export function generateOAuthState(sessionId?: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);

  let state = `${timestamp}.${random}`;

  if (sessionId && createHash) {
    // Add session hash for additional security (Node.js环境)
    const hash = createHash('sha256')
      .update(`${sessionId}.${timestamp}`)
      .digest('hex')
      .substring(0, 8);
    state = `${state}.${hash}`;
  }

  return state;
}

/**
 * Validate OAuth state parameter
 * 验证OAuth状态参数
 *
 * @param state Received state parameter
 * @param storedState Stored state parameter
 * @param maxAge Maximum age in milliseconds (default: 10 minutes)
 * @returns True if state is valid
 */
export function validateOAuthState(
  state: string,
  storedState: string,
  maxAge: number = 10 * 60 * 1000 // 10 minutes
): boolean {
  if (!state || !storedState) {
    return false;
  }

  if (state !== storedState) {
    return false;
  }

  // Check timestamp if included in state
  const parts = state.split('.');
  if (parts.length >= 2) {
    const timestamp = parseInt(parts[0], 10);
    if (isNaN(timestamp)) {
      return false;
    }

    const age = Date.now() - timestamp;
    if (age > maxAge || age < 0) {
      return false; // State too old or from future
    }
  }

  return true;
}

/**
 * Extract timestamp from OAuth state
 * 从OAuth状态中提取时间戳
 *
 * @param state OAuth state parameter
 * @returns Timestamp or null if not found
 */
export function extractTimestampFromState(state: string): number | null {
  const parts = state.split('.');
  if (parts.length >= 1) {
    const timestamp = parseInt(parts[0], 10);
    return isNaN(timestamp) ? null : timestamp;
  }
  return null;
}
