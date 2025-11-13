/**
 * File Server Controller (User Story 7)
 * Integration 4: API endpoints for game file serving
 */

import { Controller, Get, Param, Res, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { FileServerService } from '../services/file-server.service';
// import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'; // Uncomment when auth is ready

@Controller('offline/files')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class FileServerController {
  constructor(private readonly fileServerService: FileServerService) {}

  /**
   * Download game file
   * GET /offline/files/:gameId/download
   */
  @Get(':gameId/download')
  async downloadGameFile(
    @Param('gameId') gameId: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    // TODO: Get user ID from JWT token
    const userId = '1'; // Placeholder

    await this.fileServerService.streamGameFile(gameId, userId, response);
  }

  /**
   * Get file metadata
   * GET /offline/files/:gameId/metadata
   */
  @Get(':gameId/metadata')
  async getFileMetadata(
    @Param('gameId') gameId: string,
    @Req() request: Request,
  ): Promise<any> {
    // TODO: Get user ID from JWT token
    const userId = '1'; // Placeholder

    return this.fileServerService.getFileMetadata(gameId, userId);
  }

  /**
   * Check file availability
   * GET /offline/files/:gameId/availability
   */
  @Get(':gameId/availability')
  async checkFileAvailability(
    @Param('gameId') gameId: string,
  ): Promise<any> {
    return this.fileServerService.checkFileAvailability(gameId);
  }

  /**
   * Validate download request
   * GET /offline/files/:gameId/validate
   */
  @Get(':gameId/validate')
  async validateDownloadRequest(
    @Param('gameId') gameId: string,
    @Req() request: Request,
  ): Promise<any> {
    // TODO: Get user ID from JWT token
    const userId = '1'; // Placeholder

    return this.fileServerService.validateDownloadRequest(gameId, userId);
  }
}

