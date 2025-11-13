/**
 * Offline Module (User Story 7)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfflineGame } from './entities/offline-game.entity';
import { Game } from '../games/entities/game.entity';
import { OfflineGameService } from './services/offline-game.service';
import { StorageQuotaService } from './services/storage-quota.service';
import { FileServerService } from './services/file-server.service';
import { OfflineController } from './controllers/offline.controller';
import { FileServerController } from './controllers/file-server.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfflineGame, Game]),
  ],
  providers: [OfflineGameService, StorageQuotaService, FileServerService],
  controllers: [OfflineController, FileServerController],
  exports: [OfflineGameService, StorageQuotaService, FileServerService],
})
export class OfflineModule {}

