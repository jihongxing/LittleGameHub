/**
 * Compression Middleware (T241)
 * Enable Gzip/Brotli compression for API responses
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private compressionHandler = compression({
    // Compression level (0-9)
    level: 6,
    
    // Minimum response size to compress (bytes)
    threshold: 1024,
    
    // Filter function to determine if response should be compressed
    filter: (req: Request, res: Response) => {
      // Don't compress if client doesn't accept encoding
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Use compression filter
      return compression.filter(req, res);
    },
  });

  use(req: Request, res: Response, next: NextFunction): void {
    this.compressionHandler(req, res, next);
  }
}

