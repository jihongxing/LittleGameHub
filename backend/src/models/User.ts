import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '@/config/database'
import bcrypt from 'bcryptjs'

/**
 * 用户属性接口
 */
export interface UserAttributes {
  id: string
  username: string
  email: string
  password: string
  avatar?: string
  role: 'user' | 'admin'
  isActive: boolean
  isEmailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建用户时的可选属性
 */
export interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'avatar' | 'isActive' | 'isEmailVerified' | 'emailVerificationToken' | 
  'passwordResetToken' | 'passwordResetExpires' | 'lastLoginAt' | 'createdAt' | 'updatedAt'
> {}

/**
 * 用户模型类
 */
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string
  public username!: string
  public email!: string
  public password!: string
  public avatar?: string
  public role!: 'user' | 'admin'
  public isActive!: boolean
  public isEmailVerified!: boolean
  public emailVerificationToken?: string
  public passwordResetToken?: string
  public passwordResetExpires?: Date
  public lastLoginAt?: Date
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  /**
   * 检查密码是否匹配
   */
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password)
  }
}

/**
 * 初始化用户模型
 */
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 20],
        is: /^[a-zA-Z0-9_]+$/,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255],
      },
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const saltRounds = 12
          user.password = await bcrypt.hash(user.password, saltRounds)
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const saltRounds = 12
          user.password = await bcrypt.hash(user.password, saltRounds)
        }
      },
    },
  }
)

export default User