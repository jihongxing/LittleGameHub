/**
 * 审计日志实体
 * Audit Log Entity
 *
 * 记录系统中的重要操作和事件，用于安全审计和合规性检查
 * Records important operations and events in the system for security auditing and compliance
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditEventType {
  // 用户操作
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_UPDATE_PROFILE = 'user_update_profile',
  USER_CHANGE_PASSWORD = 'user_change_password',
  USER_DELETE_ACCOUNT = 'user_delete_account',

  // 管理员操作
  ADMIN_USER_MANAGEMENT = 'admin_user_management',
  ADMIN_GAME_MANAGEMENT = 'admin_game_management',
  ADMIN_SYSTEM_CONFIG = 'admin_system_config',
  ADMIN_SECURITY_SETTINGS = 'admin_security_settings',

  // 游戏相关操作
  GAME_PLAY = 'game_play',
  GAME_DOWNLOAD = 'game_download',
  GAME_RATE = 'game_rate',
  GAME_FAVORITE = 'game_favorite',

  // 积分和奖励
  POINTS_EARN = 'points_earn',
  POINTS_SPEND = 'points_spend',
  POINTS_TRANSFER = 'points_transfer',
  REWARD_CLAIM = 'reward_claim',

  // 安全事件
  SECURITY_FAILED_LOGIN = 'security_failed_login',
  SECURITY_RATE_LIMIT_EXCEEDED = 'security_rate_limit_exceeded',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security_suspicious_activity',
  SECURITY_PASSWORD_RESET = 'security_password_reset',

  // 系统事件
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  SYSTEM_BACKUP = 'system_backup',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_ERROR = 'system_error',
}

export enum AuditSeverity {
  LOW = 'low',       // 常规操作
  MEDIUM = 'medium', // 重要操作
  HIGH = 'high',     // 敏感操作
  CRITICAL = 'critical', // 关键安全事件
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
}

@Entity('audit_logs')
@Index(['userId'], { where: 'user_id IS NOT NULL' })
@Index(['eventType'])
@Index(['severity'])
@Index(['status'])
@Index(['ipAddress'])
@Index(['createdAt'])
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 用户ID（如果适用）
   * User ID (if applicable)
   */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  /**
   * 用户名（便于查询）
   * Username (for easier querying)
   */
  @Column({ name: 'username', type: 'varchar', length: 50, nullable: true })
  username: string | null;

  /**
   * 事件类型
   * Event type
   */
  @Column({
    name: 'event_type',
    type: 'enum',
    enum: AuditEventType,
  })
  eventType: AuditEventType;

  /**
   * 事件描述
   * Event description
   */
  @Column({ type: 'varchar', length: 255 })
  description: string;

  /**
   * 事件严重程度
   * Event severity
   */
  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.LOW,
  })
  severity: AuditSeverity;

  /**
   * 操作状态
   * Operation status
   */
  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.SUCCESS,
  })
  status: AuditStatus;

  /**
   * IP地址
   * IP address
   */
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  /**
   * 用户代理
   * User agent
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  /**
   * 请求方法（HTTP方法）
   * Request method (HTTP method)
   */
  @Column({ name: 'request_method', type: 'varchar', length: 10, nullable: true })
  requestMethod: string | null;

  /**
   * 请求路径
   * Request path
   */
  @Column({ name: 'request_path', type: 'varchar', length: 500, nullable: true })
  requestPath: string | null;

  /**
   * 响应状态码
   * Response status code
   */
  @Column({ name: 'response_status', type: 'int', nullable: true })
  responseStatus: number | null;

  /**
   * 执行时间（毫秒）
   * Execution time (milliseconds)
   */
  @Column({ name: 'execution_time', type: 'int', nullable: true })
  executionTime: number | null;

  /**
   * 资源ID（被操作的资源ID）
   * Resource ID (ID of the resource being operated on)
   */
  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
  resourceId: string | null;

  /**
   * 资源类型（被操作的资源类型）
   * Resource type (type of resource being operated on)
   */
  @Column({ name: 'resource_type', type: 'varchar', length: 50, nullable: true })
  resourceType: string | null;

  /**
   * 旧值（JSON格式，用于记录变更前的值）
   * Old value (JSON format, for recording values before change)
   */
  @Column({ type: 'jsonb', nullable: true })
  oldValues: any | null;

  /**
   * 新值（JSON格式，用于记录变更后的值）
   * New value (JSON format, for recording values after change)
   */
  @Column({ type: 'jsonb', nullable: true })
  newValues: any | null;

  /**
   * 元数据（额外的上下文信息）
   * Metadata (additional context information)
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  /**
   * 错误信息（如果操作失败）
   * Error message (if operation failed)
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /**
   * 会话ID
   * Session ID
   */
  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  sessionId: string | null;

  /**
   * 地理位置信息
   * Geographic location information
   */
  @Column({ type: 'jsonb', nullable: true })
  location: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null;

  /**
   * 创建时间
   * Creation time
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}

/**
 * 审计日志查询接口
 * Audit log query interface
 */
export interface AuditLogQuery {
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  status?: AuditStatus;
  ipAddress?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 审计日志统计接口
 * Audit log statistics interface
 */
export interface AuditLogStats {
  totalLogs: number;
  eventTypeBreakdown: Record<AuditEventType, number>;
  severityBreakdown: Record<AuditSeverity, number>;
  statusBreakdown: Record<AuditStatus, number>;
  recentActivity: {
    hour: number;
    day: number;
    week: number;
  };
  topUsers: Array<{
    userId: string;
    username: string | null;
    logCount: number;
  }>;
  topIPs: Array<{
    ipAddress: string;
    logCount: number;
  }>;
}

