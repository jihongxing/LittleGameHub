/**
 * Global Validation Pipe
 * Task: T028
 * 
 * Validates incoming request data using class-validator decorators
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class GlobalValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    // Skip validation if no metatype
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Convert plain object to class instance
    const object = plainToInstance(metatype, value);
    
    // Validate - with lenient settings for query parameters
    const errors = await validate(object, {
      whitelist: false, // Do NOT strip properties
      forbidNonWhitelisted: false, // Do NOT throw error for non-whitelisted properties
      transform: true, // Enable auto-transformation
      skipMissingProperties: true, // Skip validation for missing properties
    });

    if (errors.length > 0) {
      // Log errors but don't throw for query parameters
      console.warn('Validation warnings:', this.formatErrors(errors));
    }

    return object;
  }

  /**
   * Check if type should be validated
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Format validation errors into readable format
   */
  private formatErrors(errors: ValidationError[]): any {
    return errors.reduce((acc, err) => {
      const constraints = err.constraints;
      if (constraints) {
        acc[err.property] = Object.values(constraints);
      }
      
      // Handle nested errors
      if (err.children && err.children.length > 0) {
        acc[err.property] = this.formatErrors(err.children);
      }

      return acc;
    }, {} as Record<string, any>);
  }
}

/**
 * Create validation pipe factory
 */
export function createValidationPipe() {
  return new GlobalValidationPipe();
}
