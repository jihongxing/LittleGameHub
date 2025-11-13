/**
 * Download Queue Manager
 * Enhancement 2 & 3: 批量下载和下载队列管理
 */

import * as offlineApi from '@/services/api/offline';
import { downloadGameData } from './offline-storage';

export interface QueueItem {
  id: string;
  gameId: number;
  gameTitle: string;
  gameUrl: string;
  fileSize: number;
  priority: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export type QueueStatusCallback = (queue: QueueItem[]) => void;

class DownloadQueueManager {
  private queue: QueueItem[] = [];
  private maxConcurrent = 2; // Maximum concurrent downloads
  private activeDownloads = 0;
  private statusCallbacks: Set<QueueStatusCallback> = new Set();
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * Add game to download queue
   */
  addToQueue(
    gameId: number,
    gameTitle: string,
    gameUrl: string,
    fileSize: number,
    priority: number = 0,
  ): string {
    const id = `download-${gameId}-${Date.now()}`;
    
    const item: QueueItem = {
      id,
      gameId,
      gameTitle,
      gameUrl,
      fileSize,
      priority,
      status: 'pending',
      progress: 0,
    };

    this.queue.push(item);
    this.sortQueue();
    this.notifyStatusChange();
    this.processQueue();

    return id;
  }

  /**
   * Add multiple games to queue
   */
  addBatchToQueue(games: Array<{
    gameId: number;
    gameTitle: string;
    gameUrl: string;
    fileSize: number;
    priority?: number;
  }>): string[] {
    const ids: string[] = [];

    for (const game of games) {
      const id = this.addToQueue(
        game.gameId,
        game.gameTitle,
        game.gameUrl,
        game.fileSize,
        game.priority || 0,
      );
      ids.push(id);
    }

    return ids;
  }

  /**
   * Process download queue
   */
  private async processQueue(): Promise<void> {
    // Check if we can start more downloads
    while (this.activeDownloads < this.maxConcurrent) {
      const nextItem = this.queue.find(item => item.status === 'pending');
      
      if (!nextItem) {
        break; // No more pending items
      }

      this.startDownload(nextItem);
    }
  }

  /**
   * Start downloading an item
   */
  private async startDownload(item: QueueItem): Promise<void> {
    item.status = 'downloading';
    item.startedAt = new Date();
    this.activeDownloads++;
    this.notifyStatusChange();

    try {
      // Create abort controller for this download
      const abortController = new AbortController();
      this.abortControllers.set(item.id, abortController);

      // Initiate download on backend
      await offlineApi.downloadGame(item.gameId);

      // Download game data with progress tracking
      const blob = await downloadGameData(item.gameUrl, (progress) => {
        item.progress = progress;
        this.notifyStatusChange();
      });

      // Save to IndexedDB
      // (This would integrate with offline-storage.ts)

      item.status = 'completed';
      item.progress = 100;
      item.completedAt = new Date();
      
      console.log(`[Download Queue] Completed: ${item.gameTitle}`);
    } catch (error) {
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Download failed';
      console.error(`[Download Queue] Failed: ${item.gameTitle}`, error);
    } finally {
      this.activeDownloads--;
      this.abortControllers.delete(item.id);
      this.notifyStatusChange();
      this.processQueue(); // Start next download
    }
  }

  /**
   * Pause a download
   */
  pauseDownload(id: string): void {
    const item = this.queue.find(q => q.id === id);
    if (item && item.status === 'downloading') {
      const controller = this.abortControllers.get(id);
      if (controller) {
        controller.abort();
        item.status = 'paused';
        this.activeDownloads--;
        this.notifyStatusChange();
        this.processQueue();
      }
    }
  }

  /**
   * Resume a paused download
   */
  resumeDownload(id: string): void {
    const item = this.queue.find(q => q.id === id);
    if (item && item.status === 'paused') {
      item.status = 'pending';
      this.notifyStatusChange();
      this.processQueue();
    }
  }

  /**
   * Cancel and remove a download
   */
  cancelDownload(id: string): void {
    const index = this.queue.findIndex(q => q.id === id);
    if (index !== -1) {
      const item = this.queue[index];
      
      if (item.status === 'downloading') {
        const controller = this.abortControllers.get(id);
        if (controller) {
          controller.abort();
        }
        this.activeDownloads--;
      }

      this.queue.splice(index, 1);
      this.abortControllers.delete(id);
      this.notifyStatusChange();
      this.processQueue();
    }
  }

  /**
   * Change download priority
   */
  setPriority(id: string, priority: number): void {
    const item = this.queue.find(q => q.id === id);
    if (item) {
      item.priority = priority;
      this.sortQueue();
      this.notifyStatusChange();
    }
  }

  /**
   * Sort queue by priority (higher first)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Downloading items stay at top
      if (a.status === 'downloading' && b.status !== 'downloading') return -1;
      if (b.status === 'downloading' && a.status !== 'downloading') return 1;
      
      // Then by priority
      return b.priority - a.priority;
    });
  }

  /**
   * Get queue status
   */
  getQueue(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Get queue statistics
   */
  getStatistics(): {
    total: number;
    pending: number;
    downloading: number;
    completed: number;
    failed: number;
    paused: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(q => q.status === 'pending').length,
      downloading: this.queue.filter(q => q.status === 'downloading').length,
      completed: this.queue.filter(q => q.status === 'completed').length,
      failed: this.queue.filter(q => q.status === 'failed').length,
      paused: this.queue.filter(q => q.status === 'paused').length,
    };
  }

  /**
   * Subscribe to queue status changes
   */
  onStatusChange(callback: QueueStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  /**
   * Notify all subscribers of status change
   */
  private notifyStatusChange(): void {
    const queue = this.getQueue();
    this.statusCallbacks.forEach(callback => callback(queue));
  }

  /**
   * Clear completed downloads
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(q => q.status !== 'completed');
    this.notifyStatusChange();
  }

  /**
   * Pause all downloads
   */
  pauseAll(): void {
    this.queue.forEach(item => {
      if (item.status === 'downloading' || item.status === 'pending') {
        this.pauseDownload(item.id);
      }
    });
  }

  /**
   * Resume all paused downloads
   */
  resumeAll(): void {
    this.queue.forEach(item => {
      if (item.status === 'paused') {
        this.resumeDownload(item.id);
      }
    });
  }
}

// Export singleton instance
export const downloadQueue = new DownloadQueueManager();

export default downloadQueue;

