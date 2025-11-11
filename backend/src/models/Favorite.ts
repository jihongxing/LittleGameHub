import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '@/config/database'
import { User } from './User'
import { Game } from './Game'

/**
 * 用户收藏属性接口
 */
export interface FavoriteAttributes {
  id: string
  userId: string
  gameId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建收藏时的可选属性
 */
export interface FavoriteCreationAttributes extends Optional<FavoriteAttributes, 
  'id' | 'createdAt' | 'updatedAt'
> {}

/**
 * 用户收藏模型类
 */
export class Favorite extends Model<FavoriteAttributes, FavoriteCreationAttributes> implements FavoriteAttributes {
  public id!: string
  public userId!: string
  public gameId!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

/**
 * 初始化用户收藏模型
 */
Favorite.init(
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
  },
  {
    sequelize,
    modelName: 'Favorite',
    tableName: 'favorites',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'gameId'],
      },
    ],
  }
)

// 定义关联关系
User.belongsToMany(Game, {
  through: Favorite,
  foreignKey: 'userId',
  otherKey: 'gameId',
  as: 'favoriteGames'
})

Game.belongsToMany(User, {
  through: Favorite,
  foreignKey: 'gameId',
  otherKey: 'userId',
  as: 'favoritedBy'
})

User.hasMany(Favorite, {
  foreignKey: 'userId',
  as: 'favorites'
})

Favorite.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
})

Game.hasMany(Favorite, {
  foreignKey: 'gameId',
  as: 'favorites'
})

Favorite.belongsTo(Game, {
  foreignKey: 'gameId',
  as: 'game'
})

export default Favorite