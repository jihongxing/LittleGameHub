import { DataTypes, Model, Optional, Op } from 'sequelize'
import { sequelize } from '@/config/database'

/**
 * 游戏平台枚举
 */
export enum Platform {
  WINDOWS = 'Windows',
  MACOS = 'macOS',
  LINUX = 'Linux',
  ANDROID = 'Android',
  IOS = 'iOS',
  WEB = 'Web'
}

/**
 * 游戏类型枚举
 */
export enum Genre {
  ACTION = '动作',
  ADVENTURE = '冒险',
  RPG = '角色扮演',
  STRATEGY = '策略',
  SIMULATION = '模拟',
  SPORTS = '体育',
  RACING = '竞速',
  PUZZLE = '益智',
  CASUAL = '休闲',
  OTHER = '其他'
}

/**
 * 系统需求接口
 */
export interface SystemRequirements {
  os?: string
  processor?: string
  memory?: string
  graphics?: string
  storage?: string
}

/**
 * 游戏属性接口
 */
export interface GameAttributes {
  id: string
  title: string
  description: string
  shortDescription?: string
  genre: Genre
  platform: Platform[]
  releaseDate: Date
  developer: string
  publisher?: string
  version?: string
  size?: number
  coverImage?: string
  screenshots?: string[]
  trailerUrl?: string
  downloadUrl?: string
  price: number
  isFree: boolean
  rating?: number
  ratingCount?: number
  downloadCount?: number
  isActive: boolean
  isFeatured: boolean
  systemRequirements?: SystemRequirements
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建游戏时的可选属性
 */
export interface GameCreationAttributes extends Optional<GameAttributes, 
  'id' | 'shortDescription' | 'publisher' | 'version' | 'size' | 'coverImage' | 
  'screenshots' | 'trailerUrl' | 'downloadUrl' | 'rating' | 'ratingCount' | 
  'downloadCount' | 'isActive' | 'isFeatured' | 'systemRequirements' | 
  'tags' | 'createdAt' | 'updatedAt'
> {}

/**
 * 游戏模型类
 */
export class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
  public id!: string
  public title!: string
  public description!: string
  public shortDescription?: string
  public genre!: Genre
  public platform!: Platform[]
  public releaseDate!: Date
  public developer!: string
  public publisher?: string
  public version?: string
  public size?: number
  public coverImage?: string
  public screenshots?: string[]
  public trailerUrl?: string
  public downloadUrl?: string
  public price!: number
  public isFree!: boolean
  public rating?: number
  public ratingCount?: number
  public downloadCount?: number
  public isActive!: boolean
  public isFeatured!: boolean
  public systemRequirements?: SystemRequirements
  public tags?: string[]
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  /**
   * 获取格式化的价格
   */
  public getFormattedPrice(): string {
    if (this.isFree) return '免费'
    return `¥${this.price.toFixed(2)}`
  }

  /**
   * 获取格式化的大小
   */
  public getFormattedSize(): string {
    if (!this.size) return '未知'
    
    const mb = this.size / (1024 * 1024)
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`
    }
    
    const gb = mb / 1024
    return `${gb.toFixed(2)} GB`
  }

  /**
   * 检查是否支持特定平台
   */
  public supportsPlatform(platform: Platform): boolean {
    return this.platform.includes(platform)
  }

  /**
   * 查询支持指定平台的游戏
   * @param platform 平台名称
   * @returns 查询选项
   */
  public static findByPlatform(platform: Platform) {
    return this.findAll({
      where: {
        platform: {
          [Op.contains]: [platform]
        }
      }
    });
  }

  /**
   * 查询包含指定标签的游戏
   * @param tag 标签名称
   * @returns 查询选项
   */
  public static findByTag(tag: string) {
    return this.findAll({
      where: {
        tags: {
          [Op.contains]: [tag]
        }
      }
    });
  }
}

/**
 * 初始化游戏模型
 */
Game.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 2000],
      },
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    genre: {
      type: DataTypes.ENUM(...Object.values(Genre)),
      allowNull: false,
    },
    platform: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      // 添加GIN索引以支持高效的JSON查询
      comment: '游戏支持的平台列表，使用JSONB存储以提高查询性能'
    },
    releaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    developer: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    publisher: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    screenshots: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: '游戏截图URL列表，使用JSONB存储以提高查询性能'
    },
    trailerUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    downloadUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    isFree: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5,
      },
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    systemRequirements: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '系统需求信息，使用JSONB存储以提高查询性能'
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: '游戏标签列表，使用JSONB存储以提高查询性能'
    },
  },
  {
    sequelize,
    modelName: 'Game',
    tableName: 'games',
    timestamps: true,
  }
)

export default Game