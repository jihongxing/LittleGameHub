/**
 * Input Sanitization Pipe (T246)
 * Prevent XSS and injection attacks
 */

import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Sanitize strings
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    // Sanitize objects recursively
    if (typeof value === 'object' && !Array.isArray(value)) {
      return this.sanitizeObject(value);
    }

    // Sanitize arrays
    if (Array.isArray(value)) {
      return value.map(item => this.transform(item, metadata));
    }

    return value;
  }

  private sanitizeString(input: string): string {
    // Remove potentially dangerous HTML/script tags
    let sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
    });

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Limit length (prevent DoS)
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000);
    }

    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize key
        const sanitizedKey = this.sanitizeString(key);
        
        // Sanitize value
        sanitized[sanitizedKey] = this.transform(obj[key], {} as ArgumentMetadata);
      }
    }

    return sanitized;
  }
}

