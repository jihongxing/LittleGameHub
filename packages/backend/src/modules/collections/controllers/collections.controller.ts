/**
 * Collections Controller (User Story 7)
 * T185-T187: API endpoints for collection management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { GameCollectionService } from '../services/collection.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

export class CreateCollectionDto {
  name: string;
  description?: string;
  is_public?: boolean;
  cover_image_url?: string;
  category?: string;
}

export class UpdateCollectionDto {
  name?: string;
  description?: string;
  is_public?: boolean;
  cover_image_url?: string;
  category?: string;
  sort_order?: number;
}

export class AddGameDto {
  game_id: number;
  note?: string;
}

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionService: GameCollectionService) {}

  /**
   * T185: GET /collections
   */
  @Get()
  async getCollections(@Request() req, @Query() query: any) {
    const userId = req.user.userId || req.user.sub;
    
    return await this.collectionService.getCollections({
      user_id: userId,
      is_public: query.is_public === 'true' ? true : query.is_public === 'false' ? false : undefined,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    });
  }

  /**
   * T186: POST /collections
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCollection(@Request() req, @Body() dto: CreateCollectionDto) {
    const userId = req.user.userId || req.user.sub;
    
    return await this.collectionService.createCollection({
      user_id: userId,
      ...dto,
    });
  }

  /**
   * GET /collections/:id
   */
  @Get(':id')
  async getCollection(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.userId || req.user.sub;
    return await this.collectionService.getCollectionById(id, userId);
  }

  /**
   * PUT /collections/:id
   */
  @Put(':id')
  async updateCollection(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectionDto,
  ) {
    const userId = req.user.userId || req.user.sub;
    return await this.collectionService.updateCollection(id, userId, dto);
  }

  /**
   * DELETE /collections/:id
   */
  @Delete(':id')
  async deleteCollection(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.userId || req.user.sub;
    await this.collectionService.deleteCollection(id, userId);
    return { success: true, message: 'Collection deleted' };
  }

  /**
   * T187: POST /collections/:id/games
   */
  @Post(':id/games')
  @HttpCode(HttpStatus.CREATED)
  async addGameToCollection(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddGameDto,
  ) {
    const userId = req.user.userId || req.user.sub;
    return await this.collectionService.addGameToCollection(
      id,
      dto.game_id,
      userId,
      dto.note,
    );
  }

  /**
   * DELETE /collections/:id/games/:gameId
   */
  @Delete(':id/games/:gameId')
  async removeGameFromCollection(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('gameId', ParseIntPipe) gameId: number,
  ) {
    const userId = req.user.userId || req.user.sub;
    await this.collectionService.removeGameFromCollection(id, gameId, userId);
    return { success: true, message: 'Game removed from collection' };
  }

  /**
   * GET /collections/:id/games
   */
  @Get(':id/games')
  async getCollectionGames(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.userId || req.user.sub;
    const games = await this.collectionService.getCollectionGames(id, userId);
    return { games, total: games.length };
  }
}

