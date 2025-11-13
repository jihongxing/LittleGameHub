import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../modules/games/entities/game.entity';

/**
 * 聚合游戏数据结构
 * Aggregated game data structure
 */
export interface AggregatedGame {
  source: string;
  sourceId: string | number;
  title: string;
  description: string;
  coverUrl: string;
  rating: number;
  genres: string[];
  platforms: string[];
  releaseDate: string;
}

@Injectable()
export class GameAggregationService {
  private readonly logger = new Logger(GameAggregationService.name);
  private readonly rawgApiKey = process.env.RAWG_API_KEY;
  private readonly itchApiKey = process.env.ITCH_API_KEY;

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  /**
   * 从RAWG获取游戏（最简单，推荐首先使用）
   */
  async fetchRAWGGames(page = 1): Promise<AggregatedGame[]> {
    try {
      this.logger.log(`正在获取RAWG第${page}页游戏...`);
      
      const response = await axios.get('https://api.rawg.io/api/games', {
        params: {
          key: this.rawgApiKey,
          page,
          page_size: 100,
          ordering: '-rating', // 按评分排序
        },
      });

      return response.data.results.map((game: any) => ({
        source: 'rawg',
        sourceId: game.id,
        title: game.name,
        description: game.description || '',
        coverUrl: game.background_image || '',
        rating: game.rating || 0,
        genres: game.genres?.map((g: any) => g.name) || [],
        platforms: game.platforms?.map((p: any) => p.platform.name) || [],
        releaseDate: game.released || '',
      }));
    } catch (error) {
      this.logger.error('RAWG获取失败:', error);
      return [];
    }
  }

  /**
   * 从Itch.io获取游戏
   */
  async fetchItchGames(page = 1): Promise<AggregatedGame[]> {
    try {
      this.logger.log(`正在获取Itch.io第${page}页游戏...`);
      
      const response = await axios.get(
        `https://itch.io/api/1/${this.itchApiKey}/games`,
        {
          params: {
            page,
            sort_by: 'rating',
          },
        }
      );

      return response.data.games.map((game: any) => ({
        source: 'itch',
        sourceId: game.id,
        title: game.title,
        description: game.description || '',
        coverUrl: game.cover_url || '',
        rating: game.rating || 0,
        genres: [],
        platforms: ['Web'],
        releaseDate: game.created_at || '',
      }));
    } catch (error) {
      this.logger.error('Itch.io获取失败:', error);
      return [];
    }
  }

  /**
   * 从IGDB获取游戏（数据最完整）
   */
  async fetchIGDBGames(offset = 0): Promise<AggregatedGame[]> {
    try {
      this.logger.log(`正在获取IGDB游戏 (offset: ${offset})...`);
      
      const response = await axios.post(
        'https://api.igdb.com/v4/games',
        `fields name,summary,cover.url,rating,genres.name,platforms.name,first_release_date;
         where rating > 50;
         sort rating desc;
         limit 500;
         offset ${offset};`,
        {
          headers: {
            'Client-ID': process.env.IGDB_CLIENT_ID,
            'Authorization': `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
          },
        }
      );

      return response.data.map((game: any) => ({
        source: 'igdb',
        sourceId: game.id,
        title: game.name,
        description: game.summary || '',
        coverUrl: game.cover?.url ? `https:${game.cover.url}` : '',
        rating: game.rating || 0,
        genres: game.genres?.map((g: any) => g.name) || [],
        platforms: game.platforms?.map((p: any) => p.name) || [],
        releaseDate: game.first_release_date || '',
      }));
    } catch (error) {
      this.logger.error('IGDB获取失败:', error);
      return [];
    }
  }

  /**
   * 聚合所有来源的游戏
   */
  async aggregateAllGames(limit = 1000): Promise<AggregatedGame[]> {
    const allGames: AggregatedGame[] = [];
    
    // 1. 获取RAWG游戏
    try {
      for (let page = 1; page <= Math.ceil(limit / 100); page++) {
        const games = await this.fetchRAWGGames(page);
        allGames.push(...games);
        if (allGames.length >= limit) break;
        // 避免速率限制
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      this.logger.error('RAWG聚合失败:', error);
    }

    // 2. 获取Itch.io游戏
    try {
      for (let page = 1; page <= Math.ceil((limit - allGames.length) / 100); page++) {
        const games = await this.fetchItchGames(page);
        allGames.push(...games);
        if (allGames.length >= limit) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      this.logger.error('Itch.io聚合失败:', error);
    }

    // 3. 获取IGDB游戏
    try {
      for (let offset = 0; offset < limit - allGames.length; offset += 500) {
        const games = await this.fetchIGDBGames(offset);
        allGames.push(...games);
        if (allGames.length >= limit) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      this.logger.error('IGDB聚合失败:', error);
    }

    this.logger.log(`✅ 总共聚合了 ${allGames.length} 款游戏`);
    return allGames;
  }

  /**
   * 去重游戏
   */
  deduplicateGames(games: AggregatedGame[]): AggregatedGame[] {
    const seen = new Map<string, AggregatedGame>();
    
    for (const game of games) {
      // 使用标题和平台作为唯一标识
      const key = `${game.title.toLowerCase().trim()}_${game.platforms.join(',')}`;
      
      // 如果已存在，保留评分更高的
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        if (game.rating > existing.rating) {
          seen.set(key, game);
        }
      } else {
        seen.set(key, game);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * 过滤不适当的游戏
   */
  filterGames(games: AggregatedGame[]): AggregatedGame[] {
    return games.filter(game => {
      // 排除空标题
      if (!game.title || game.title.trim().length === 0) return false;
      
      // 排除没有封面的游戏
      if (!game.coverUrl) return false;
      
      // 排除评分过低的游戏
      if (game.rating < 2) return false;
      
      // 排除特定类型（可选）
      const bannedGenres = ['Adult', 'Erotic'];
      if (game.genres.some(g => bannedGenres.includes(g))) return false;
      
      return true;
    });
  }

  /**
   * 将聚合的游戏保存到数据库
   * Save aggregated games to database
   */
  async saveGames(games: AggregatedGame[]): Promise<number> {
    let savedCount = 0;

    for (const game of games) {
      try {
        // 检查游戏是否已存在
        const existing = await this.gameRepository.findOne({
          where: {
            source: game.source,
            sourceId: game.sourceId.toString(),
          },
        });

        if (existing) {
          // 更新现有游戏
          await this.gameRepository.update(
            { id: existing.id },
            {
              title: game.title,
              description: game.description,
              coverImageUrl: game.coverUrl,
              rating: game.rating,
              genres: game.genres,
              platforms: game.platforms,
              releaseDate: game.releaseDate,
              updatedAt: new Date(),
            }
          );
          this.logger.debug(`Updated game: ${game.title}`);
        } else {
          // 创建新游戏
          const newGame = this.gameRepository.create({
            source: game.source,
            sourceId: game.sourceId.toString(),
            sourceUrl: this.buildSourceUrl(game.source, game.sourceId),
            title: game.title,
            description: game.description,
            coverImageUrl: game.coverUrl,
            rating: game.rating,
            genres: game.genres,
            platforms: game.platforms,
            releaseDate: game.releaseDate,
            categoryTags: game.genres,
            pointRewardRules: {
              base_points: 10,
              min_duration_seconds: 180,
              points_per_minute: 1,
              max_points_per_session: 100,
            },
          });

          await this.gameRepository.save(newGame);
          this.logger.debug(`Created game: ${game.title}`);
        }
        savedCount++;
      } catch (error) {
        this.logger.error(`Failed to save game ${game.title}:`, error);
      }
    }

    this.logger.log(`✅ Successfully saved ${savedCount}/${games.length} games`);
    return savedCount;
  }

  /**
   * 构建原始游戏链接
   * Build source game URL
   */
  private buildSourceUrl(source: string, sourceId: string | number): string {
    const urls: Record<string, string> = {
      rawg: `https://rawg.io/games/${sourceId}`,
      itch: `https://itch.io/games/${sourceId}`,
      igdb: `https://www.igdb.com/games/${sourceId}`,
      wechat: `https://minigame.qq.com/game/${sourceId}`,
      douyin: `https://www.douyin.com/game/${sourceId}`,
    };
    return urls[source] || '';
  }
}
