/**
 * Collections Module (User Story 7)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameCollection } from './entities/game-collection.entity';
import { CollectionItem } from './entities/collection-item.entity';
import { GameCollectionService } from './services/collection.service';
import { CollectionSyncService } from './services/collection-sync.service';
import { CollectionsController } from './controllers/collections.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameCollection, CollectionItem]),
  ],
  providers: [GameCollectionService, CollectionSyncService],
  controllers: [CollectionsController],
  exports: [GameCollectionService, CollectionSyncService],
})
export class CollectionsModule {}

