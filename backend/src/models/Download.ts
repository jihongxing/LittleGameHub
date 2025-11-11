import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '@/config/database'
import { User } from './User'
import { Game } from './Game'

/**
 * 下载状态枚举
 */
export enum DownloadStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

/**
 * 下载记录属性接口
 */
export interface DownloadAttributes {
  id: string
  userId: string
  gameId: string
  status: DownloadStatus
  progress: number
  downloadPath?: string
  fileSize?: number
  downloadedSize?: number
  downloadSpeed?: number
  estimatedTimeRemaining?: number
  error?: string
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建下载记录时的可选属性
 */
export interface DownloadCreationAttributes extends Optional<DownloadAttributes, 
  'id' | 'status' | 'progress' | 'downloadPath' | 'fileSize' | 'downloadedSize' | 
  'downloadSpeed' | 'estimatedTimeRemaining' | 'error' | 'startedAt' | 'completedAt' | 
  'createdAt' | 'updatedAt'
> {}

/**
 * 下载记录模型类
 */
export class Download extends Model<DownloadAttributes, DownloadCreationAttributes> implements DownloadAttributes {
  public id!: string
  public userId!: string
  public gameId!: string
  public status!: DownloadStatus
  public progress!: number
  public downloadPath?: string
  public fileSize?: number
  public downloadedSize?: number
  public downloadSpeed?: number
  public estimatedTimeRemaining?: number
  public error?: string
  public startedAt?: Date
  public completedAt?: Date
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  /**
   * 获取格式化的下载进度
   */
  public getFormattedProgress(): string {
    return `${Math.round(this.progress)}%`
  }

  /**
   * 获取格式化的文件大小
   */
  public getFormattedFileSize(): string {
    if (!this.fileSize) return '未知'
    
    const mb = this.fileSize / (1024 * 1024)
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`
    }
    
    const gb = mb / 1024
    return `${gb.toFixed(2)} GB`
  }

  /**
   * 获取格式化的已下载大小
   */
  public getFormattedDownloadedSize(): string {
    if (!this.downloadedSize) return '0 B'
    
    const mb = this.downloadedSize / (1024 * 1024)
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`
    }
    
    const gb = mb / 1024
    return `${gb.toFixed(2)} GB`
  }

  /**
   * 获取格式化的下载速度
   */
  public getFormattedDownloadSpeed(): string {
    if (!this.downloadSpeed) return '0 B/s'
    
    const mb = this.downloadSpeed / (1024 * 1024)
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB/s`
    }
    
    const gb = mb / 1024
    return `${gb.toFixed(2)} GB/s`
  }

  /**
   * 获取格式化的剩余时间
   */
  public getFormattedEstimatedTimeRemaining(): string {
    if (!this.estimatedTimeRemaining || this.estimatedTimeRemaining <= 0) return '未知'
    
    const seconds = Math.floor(this.estimatedTimeRemaining)
    if (seconds < 60) {
      return `${seconds} 秒`
    }
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return `${minutes} 分钟`
    }
    
    const hours = Math.floor(minutes / 60)
    return `${hours} 小时`
  }

  /**
   * 检查下载是否正在进行中
   */
  public isInProgress(): boolean {
    return this.status === DownloadStatus.IN_PROGRESS
  }

  /**
   * 检查下载是否已完成
   */
  public isCompleted(): boolean {
    return this.status === DownloadStatus.COMPLETED
  }

  /**
   * 检查下载是否失败
   */
  public isFailed(): boolean {
    return this.status === DownloadStatus.FAILED
  }
}

/**
 * 初始化下载记录模型
 */
Download.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    gameId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Game,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DownloadStatus)),
      allowNull: false,
      defaultValue: DownloadStatus.PENDING,
    },
    progress: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    downloadPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    downloadedSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
    },
    downloadSpeed: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    estimatedTimeRemaining: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Download',
    tableName: 'downloads',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'gameId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
)

// 定义关联关系
User.hasMany(Download, {
  foreignKey: 'userId',
  as: 'downloads'
})

Download.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
})

Game.hasMany(Download, {
  foreignKey: 'gameId',
  as: 'downloads'
})

Download.belongsTo(Game, {
  foreignKey: 'gameId',
  as: 'game'
})

export default Download