-- 游戏聚合字段迁移脚本
-- Game Aggregation Fields Migration Script

-- 添加游戏来源字段
ALTER TABLE games ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- 添加原始平台ID字段
ALTER TABLE games ADD COLUMN IF NOT EXISTS source_id VARCHAR(100);

-- 添加原始游戏链接字段
ALTER TABLE games ADD COLUMN IF NOT EXISTS source_url VARCHAR(500);

-- 添加游戏类型字段（JSONB）
ALTER TABLE games ADD COLUMN IF NOT EXISTS genres JSONB DEFAULT '[]';

-- 添加游戏平台字段（JSONB）
ALTER TABLE games ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '[]';

-- 添加发布日期字段
ALTER TABLE games ADD COLUMN IF NOT EXISTS release_date VARCHAR(100);

-- 添加游戏评分字段
ALTER TABLE games ADD COLUMN IF NOT EXISTS rating DECIMAL(5,2);

-- 创建唯一索引（用于去重检查）
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_source_source_id ON games (source, source_id);

-- 创建普通索引（用于按来源筛选）
CREATE INDEX IF NOT EXISTS idx_games_source ON games (source);

-- 创建普通索引（用于按评分排序）
CREATE INDEX IF NOT EXISTS idx_games_rating ON games (rating);

-- 创建 GIN 索引（用于 JSONB 查询）
CREATE INDEX IF NOT EXISTS idx_games_genres ON games USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_games_platforms ON games USING GIN (platforms);

-- 完成
SELECT 'Migration completed successfully!' as result;
