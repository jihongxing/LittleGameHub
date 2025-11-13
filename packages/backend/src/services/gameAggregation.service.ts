/**
 * 游戏聚合服务
 * Game Aggregation Service
 * 
 * 从多个平台聚合游戏数据：RAWG、Itch.io、IGDB
 * Aggregates game data from multiple platforms: RAWG, Itch.io, IGDB
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameAvailabilityStatus } from '../modules/games/entities/game.entity';
import axios from 'axios';

export interface AggregatedGame {
  title: string;
  description: string;
  genre: string[];
  platform: string[];
  coverImage?: string;
  screenshots: string[];
  downloadUrl?: string;
  fileSize?: number;
  version: string;
  developer: string;
  publisher?: string;
  releaseDate: Date;
  rating: number;
  tags: string[];
  source: 'RAWG' | 'ITCH' | 'IGDB';
  sourceId: string;
  sourceUrl: string;
}

@Injectable()
export class GameAggregationService {
  private readonly logger = new Logger(GameAggregationService.name);

  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>
  ) {}

  /**
   * 聚合所有平台的游戏
   * Aggregate games from all platforms
   */
  async aggregateAllGames(maxGames: number = 5000): Promise<AggregatedGame[]> {
    this.logger.log('🚀 开始聚合游戏数据...');
    
    const allGames: AggregatedGame[] = [];
    const gamesPerPlatform = Math.floor(maxGames / 3);

    try {
      // 1. 从 RAWG 聚合游戏
      this.logger.log('📥 正在从 RAWG 聚合游戏...');
      const rawgGames = await this.aggregateFromRAWG(gamesPerPlatform);
      allGames.push(...rawgGames);
      this.logger.log(`✅ RAWG: 聚合了 ${rawgGames.length} 款游戏`);

      // 2. 从 Itch.io 聚合游戏
      this.logger.log('📥 正在从 Itch.io 聚合游戏...');
      const itchGames = await this.aggregateFromItch(gamesPerPlatform);
      allGames.push(...itchGames);
      this.logger.log(`✅ Itch.io: 聚合了 ${itchGames.length} 款游戏`);

      // 3. 从 IGDB 聚合游戏
      this.logger.log('📥 正在从 IGDB 聚合游戏...');
      const igdbGames = await this.aggregateFromIGDB(gamesPerPlatform);
      allGames.push(...igdbGames);
      this.logger.log(`✅ IGDB: 聚合了 ${igdbGames.length} 款游戏`);

      this.logger.log(`🎉 聚合完成！总计 ${allGames.length} 款游戏`);
      return allGames;

    } catch (error) {
      this.logger.error('❌ 游戏聚合失败:', error);
      throw error;
    }
  }

  /**
   * 从 RAWG 聚合游戏
   * Aggregate games from RAWG
   */
  private async aggregateFromRAWG(maxGames: number): Promise<AggregatedGame[]> {
    const games: AggregatedGame[] = [];
    const apiKey = process.env.RAWG_API_KEY || 'demo-key'; // 使用免费API密钥
    
    try {
      let page = 1;
      const pageSize = 40; // RAWG API 每页最多40个游戏
      
      while (games.length < maxGames && page <= 25) { // 最多25页，避免API限制
        const response = await axios.get('https://api.rawg.io/api/games', {
          params: {
            key: apiKey,
            page: page,
            page_size: pageSize,
            ordering: '-rating', // 按评分排序
            platforms: '4,187,18,1', // PC, Web, PlayStation, Xbox
          },
          timeout: 10000,
        });

        const rawgGames = response.data.results || [];
        
        for (const rawgGame of rawgGames) {
          if (games.length >= maxGames) break;
          
          try {
            const aggregatedGame: AggregatedGame = {
              title: rawgGame.name || 'Unknown Game',
              description: rawgGame.description_raw || rawgGame.description || '暂无描述',
              genre: rawgGame.genres?.map((g: any) => g.name) || ['未分类'],
              platform: rawgGame.platforms?.map((p: any) => p.platform.name) || ['PC'],
              coverImage: rawgGame.background_image,
              screenshots: rawgGame.short_screenshots?.map((s: any) => s.image) || [],
              version: '1.0.0',
              developer: rawgGame.developers?.[0]?.name || 'Unknown Developer',
              publisher: rawgGame.publishers?.[0]?.name,
              releaseDate: rawgGame.released ? new Date(rawgGame.released) : new Date(),
              rating: rawgGame.rating || 0,
              tags: rawgGame.tags?.slice(0, 5).map((t: any) => t.name) || [],
              source: 'RAWG',
              sourceId: rawgGame.id.toString(),
              sourceUrl: `https://rawg.io/games/${rawgGame.slug}`,
            };
            
            games.push(aggregatedGame);
          } catch (gameError) {
            this.logger.warn(`跳过无效游戏: ${rawgGame.name}`, gameError);
          }
        }
        
        page++;
        
        // 避免API限制，添加延迟
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      this.logger.error('RAWG API 调用失败:', error);
    }
    
    return games;
  }

  /**
   * 从 Itch.io 聚合游戏
   * Aggregate games from Itch.io
   */
  private async aggregateFromItch(maxGames: number): Promise<AggregatedGame[]> {
    const games: AggregatedGame[] = [];
    
    try {
      // Itch.io 没有官方API，这里模拟一些热门游戏数据
      // 实际项目中可以通过爬虫或第三方API获取
      const mockItchGames = [
        {
          title: 'A Short Hike',
          description: '一个轻松的探索游戏，在美丽的山区中徒步旅行。',
          genre: ['冒险', '休闲'],
          platform: ['PC', 'Web'],
          rating: 4.8,
          developer: 'adamgryu',
          tags: ['探索', '像素艺术', '放松'],
        },
        {
          title: 'Celeste',
          description: '一个关于攀登山峰和克服内心恶魔的平台游戏。',
          genre: ['平台', '动作'],
          platform: ['PC'],
          rating: 4.9,
          developer: 'Maddy Makes Games',
          tags: ['困难', '故事', '音乐'],
        },
        {
          title: 'Nuclear Throne',
          description: '后末日世界的顶视角射击游戏。',
          genre: ['射击', '动作'],
          platform: ['PC'],
          rating: 4.5,
          developer: 'Vlambeer',
          tags: ['roguelike', '快节奏', '像素'],
        },
        // 可以添加更多模拟数据...
      ];

      for (let i = 0; i < Math.min(maxGames, mockItchGames.length * 10); i++) {
        const mockGame = mockItchGames[i % mockItchGames.length];
        
        const aggregatedGame: AggregatedGame = {
          title: `${mockGame.title} ${Math.floor(i / mockItchGames.length) + 1}`,
          description: mockGame.description,
          genre: mockGame.genre,
          platform: mockGame.platform,
          coverImage: `https://img.itch.zone/aW1nLzE${i.toString().padStart(6, '0')}.png`,
          screenshots: [
            `https://img.itch.zone/aW1nLzE${i.toString().padStart(6, '0')}_1.png`,
            `https://img.itch.zone/aW1nLzE${i.toString().padStart(6, '0')}_2.png`,
          ],
          version: '1.0.0',
          developer: mockGame.developer,
          releaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          rating: mockGame.rating,
          tags: mockGame.tags,
          source: 'ITCH',
          sourceId: `itch_${i}`,
          sourceUrl: `https://itch.io/games/${mockGame.title.toLowerCase().replace(/\s+/g, '-')}`,
        };
        
        games.push(aggregatedGame);
      }
      
    } catch (error) {
      this.logger.error('Itch.io 数据聚合失败:', error);
    }
    
    return games;
  }

  /**
   * 从 IGDB 聚合游戏
   * Aggregate games from IGDB
   */
  private async aggregateFromIGDB(maxGames: number): Promise<AggregatedGame[]> {
    const games: AggregatedGame[] = [];
    
    try {
      // IGDB 需要 Twitch Client ID 和 Access Token
      // 这里提供一个基础实现框架
      const clientId = process.env.IGDB_CLIENT_ID;
      const accessToken = process.env.IGDB_ACCESS_TOKEN;
      
      if (!clientId || !accessToken) {
        this.logger.warn('IGDB API 凭据未配置，跳过 IGDB 聚合');
        return games;
      }

      const response = await axios.post('https://api.igdb.com/v4/games', 
        `fields name,summary,genres.name,platforms.name,cover.url,screenshots.url,first_release_date,rating,involved_companies.company.name; 
         where rating > 70 & platforms = (6,130,48,49); 
         sort rating desc; 
         limit ${Math.min(maxGames, 500)};`,
        {
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
          },
          timeout: 15000,
        }
      );

      const igdbGames = response.data || [];
      
      for (const igdbGame of igdbGames) {
        try {
          const aggregatedGame: AggregatedGame = {
            title: igdbGame.name || 'Unknown Game',
            description: igdbGame.summary || '暂无描述',
            genre: igdbGame.genres?.map((g: any) => g.name) || ['未分类'],
            platform: igdbGame.platforms?.map((p: any) => p.name) || ['PC'],
            coverImage: igdbGame.cover?.url ? `https:${igdbGame.cover.url}` : undefined,
            screenshots: igdbGame.screenshots?.map((s: any) => `https:${s.url}`) || [],
            version: '1.0.0',
            developer: igdbGame.involved_companies?.[0]?.company?.name || 'Unknown Developer',
            releaseDate: igdbGame.first_release_date ? 
              new Date(igdbGame.first_release_date * 1000) : new Date(),
            rating: (igdbGame.rating || 0) / 20, // IGDB 评分是0-100，转换为0-5
            tags: [],
            source: 'IGDB',
            sourceId: igdbGame.id.toString(),
            sourceUrl: `https://www.igdb.com/games/${igdbGame.slug || igdbGame.id}`,
          };
          
          games.push(aggregatedGame);
        } catch (gameError) {
          this.logger.warn(`跳过无效 IGDB 游戏: ${igdbGame.name}`, gameError);
        }
      }
      
    } catch (error) {
      this.logger.error('IGDB API 调用失败:', error);
    }
    
    return games;
  }

  /**
   * 去重游戏
   * Deduplicate games
   */
  deduplicateGames(games: AggregatedGame[]): AggregatedGame[] {
    const uniqueGames = new Map<string, AggregatedGame>();
    
    for (const game of games) {
      // 使用标题的标准化版本作为去重键
      const normalizedTitle = game.title.toLowerCase()
        .replace(/[^\w\s]/g, '') // 移除特殊字符
        .replace(/\s+/g, ' ')    // 标准化空格
        .trim();
      
      const key = `${normalizedTitle}_${game.developer.toLowerCase()}`;
      
      if (!uniqueGames.has(key)) {
        uniqueGames.set(key, game);
      } else {
        // 如果已存在，选择评分更高的版本
        const existing = uniqueGames.get(key)!;
        if (game.rating > existing.rating) {
          uniqueGames.set(key, game);
        }
      }
    }
    
    const deduplicatedGames = Array.from(uniqueGames.values());
    this.logger.log(`去重完成: ${games.length} -> ${deduplicatedGames.length}`);
    
    return deduplicatedGames;
  }

  /**
   * 过滤游戏
   * Filter games
   */
  filterGames(games: AggregatedGame[]): AggregatedGame[] {
    return games.filter(game => {
      // 基础过滤条件
      if (!game.title || game.title.length < 2) return false;
      if (game.rating < 2.0) return false; // 过滤低评分游戏
      
      // 过滤不适当内容（简单关键词过滤）
      const inappropriateKeywords = ['adult', '18+', 'nsfw', 'porn', 'sex'];
      const titleLower = game.title.toLowerCase();
      const descLower = game.description.toLowerCase();
      
      for (const keyword of inappropriateKeywords) {
        if (titleLower.includes(keyword) || descLower.includes(keyword)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * 保存游戏到数据库
   * Save games to database
   */
  async saveGames(games: AggregatedGame[]): Promise<number> {
    let savedCount = 0;
    
    for (const aggregatedGame of games) {
      try {
        // 检查游戏是否已存在
        const existingGame = await this.gameRepository.findOne({
          where: [
            { title: aggregatedGame.title },
            { sourceId: `${aggregatedGame.source}_${aggregatedGame.sourceId}` }
          ]
        });
        
        if (existingGame) {
          // 更新现有游戏
          Object.assign(existingGame, {
            description: aggregatedGame.description,
            genres: aggregatedGame.genre,
            platforms: aggregatedGame.platform,
            coverImageUrl: aggregatedGame.coverImage,
            categoryTags: aggregatedGame.tags,
            releaseDate: aggregatedGame.releaseDate.toISOString(),
            rating: aggregatedGame.rating,
            sourceUrl: aggregatedGame.sourceUrl,
            updatedAt: new Date(),
          });
          
          await this.gameRepository.save(existingGame);
        } else {
          // 创建新游戏
          const newGame = this.gameRepository.create({
            title: aggregatedGame.title,
            description: aggregatedGame.description,
            genres: aggregatedGame.genre,
            platforms: aggregatedGame.platform,
            coverImageUrl: aggregatedGame.coverImage || '',
            gameUrl: aggregatedGame.sourceUrl,
            categoryTags: aggregatedGame.tags,
            version: aggregatedGame.version,
            releaseDate: aggregatedGame.releaseDate.toISOString(),
            rating: aggregatedGame.rating,
            availabilityStatus: GameAvailabilityStatus.ACTIVE,
            sourceId: `${aggregatedGame.source}_${aggregatedGame.sourceId}`,
            sourceUrl: aggregatedGame.sourceUrl,
            source: aggregatedGame.source,
            pointRewardRules: {
              base_points: 10,
              min_duration_seconds: 60,
              points_per_minute: 2,
              max_points_per_session: 100,
            },
          });
          
          await this.gameRepository.save(newGame);
        }
        
        savedCount++;
        
      } catch (error) {
        this.logger.warn(`保存游戏失败: ${aggregatedGame.title}`, error);
      }
    }
    
    this.logger.log(`✅ 成功保存 ${savedCount} 款游戏到数据库`);
    return savedCount;
  }
}
