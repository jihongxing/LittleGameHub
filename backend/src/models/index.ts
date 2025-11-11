import { sequelize } from '@/config/database'
import User from './User'
import Game from './Game'
import Favorite from './Favorite'
import Download from './Download'

// 定义模型关联关系
const defineAssociations = () => {
  // 用户与游戏的收藏关系（多对多）
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

  // 用户与收藏记录的关系（一对多）
  User.hasMany(Favorite, {
    foreignKey: 'userId',
    as: 'favorites'
  })

  Favorite.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  })

  // 游戏与收藏记录的关系（一对多）
  Game.hasMany(Favorite, {
    foreignKey: 'gameId',
    as: 'favorites'
  })

  Favorite.belongsTo(Game, {
    foreignKey: 'gameId',
    as: 'game'
  })

  // 用户与下载记录的关系（一对多）
  User.hasMany(Download, {
    foreignKey: 'userId',
    as: 'downloads'
  })

  Download.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  })

  // 游戏与下载记录的关系（一对多）
  Game.hasMany(Download, {
    foreignKey: 'gameId',
    as: 'downloads'
  })

  Download.belongsTo(Game, {
    foreignKey: 'gameId',
    as: 'game'
  })
}

// 初始化关联关系
defineAssociations()

// 导出所有模型
export {
  sequelize,
  User,
  Game,
  Favorite,
  Download
}

// 导出模型类型
export type {
  UserAttributes,
  UserCreationAttributes
} from './User'

export type {
  GameAttributes,
  GameCreationAttributes,
  Platform,
  Genre,
  SystemRequirements
} from './Game'

export type {
  FavoriteAttributes,
  FavoriteCreationAttributes
} from './Favorite'

export type {
  DownloadAttributes,
  DownloadCreationAttributes,
  DownloadStatus
} from './Download'