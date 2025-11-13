/**
 * Unit tests for SecureFileUploadService
 * 安全文件上传服务的单元测试
 *
 * Tests file validation, security checks, and upload processing
 * 测试文件验证、安全检查和上传处理
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SecureFileUploadService } from '../../src/modules/file-upload/services/secure-file-upload.service';
import { FileUploadError } from '../../src/modules/file-upload/errors/file-upload-error';
import { promises as fs } from 'fs';
import path from 'path';

// Mock Sharp for image processing
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    metadata: jest.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg',
      size: 1024000,
    }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({
      size: 512000,
      width: 1920,
      height: 1080,
    }),
  }));
});

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('SecureFileUploadService', () => {
  let service: SecureFileUploadService;
  let mockDataSource: any;

  beforeEach(async () => {
    mockDataSource = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecureFileUploadService,
        {
          provide: 'DataSource',
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SecureFileUploadService>(SecureFileUploadService);

    // Mock fs methods
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'copyFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'stat').mockResolvedValue({
      size: 1024000,
      birthtime: new Date(),
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false,
    } as any);
    jest.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('test file content'));
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    jest.spyOn(fs, 'access').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic File Validation', () => {
    it('should validate file size within limits', async () => {
      const validFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024000, // 1MB
        buffer: Buffer.from('test'),
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const result = await service.processUpload(validFile, config);
      expect(result).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });

    it('should reject file that exceeds size limit', async () => {
      const oversizedFile = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024, // 5MB
        buffer: Buffer.from('test'),
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 2 * 1024 * 1024, // 2MB limit
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      await expect(service.processUpload(oversizedFile, config))
        .rejects
        .toThrow(FileUploadError);
    });

    it('should reject invalid MIME type', async () => {
      const invalidFile = {
        originalname: 'test.exe',
        mimetype: 'application/octet-stream',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'file',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        allowedExtensions: ['.jpg', '.png'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      await expect(service.processUpload(invalidFile, config))
        .rejects
        .toThrow(FileUploadError);
    });

    it('should reject dangerous file extension', async () => {
      const dangerousFile = {
        originalname: 'malware.exe',
        mimetype: 'application/octet-stream',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'file',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['application/octet-stream'],
        allowedExtensions: ['.exe'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      // This should be caught by the middleware, but let's test the service logic
      await expect(service.processUpload(dangerousFile, config))
        .rejects
        .toThrow(FileUploadError);
    });
  });

  describe('File Content Validation', () => {
    it('should detect JPEG file signature correctly', async () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: jpegBuffer,
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const result = await service.processUpload(file, config);
      expect(result).toBeDefined();
    });

    it('should detect PNG file signature correctly', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: pngBuffer,
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/png'],
        allowedExtensions: ['.png'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const result = await service.processUpload(file, config);
      expect(result).toBeDefined();
    });

    it('should reject file with mismatched MIME type and signature', async () => {
      // JPEG header but claimed as PNG
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const file = {
        originalname: 'fake.png',
        mimetype: 'image/png', // Claimed as PNG
        size: 1024,
        buffer: jpegBuffer, // But actually JPEG
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/png'],
        allowedExtensions: ['.png'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      await expect(service.processUpload(file, config))
        .rejects
        .toThrow('文件内容验证失败');
    });
  });

  describe('Security Threat Detection', () => {
    it('should detect executable files', async () => {
      const exeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]); // Windows EXE header
      const file = {
        originalname: 'malware.exe',
        mimetype: 'application/octet-stream',
        size: 1024,
        buffer: exeBuffer,
        fieldname: 'file',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['application/octet-stream'],
        allowedExtensions: ['.exe'],
        uploadPath: 'uploads/test/',
        enableVirusScan: true,
        enableCompression: false,
      };

      await expect(service.processUpload(file, config))
        .rejects
        .toThrow('检测到安全威胁');
    });

    it('should detect malicious script patterns', async () => {
      const scriptBuffer = Buffer.from('<script>alert("xss")</script>');
      const file = {
        originalname: 'evil.html',
        mimetype: 'text/html',
        size: 1024,
        buffer: scriptBuffer,
        fieldname: 'file',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['text/html'],
        allowedExtensions: ['.html'],
        uploadPath: 'uploads/test/',
        enableVirusScan: true,
        enableCompression: false,
      };

      await expect(service.processUpload(file, config))
        .rejects
        .toThrow('检测到安全威胁');
    });

    it('should detect SQL injection patterns', async () => {
      const sqlBuffer = Buffer.from("'; DROP TABLE users; --");
      const file = {
        originalname: 'evil.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: sqlBuffer,
        fieldname: 'file',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['text/plain'],
        allowedExtensions: ['.txt'],
        uploadPath: 'uploads/test/',
        enableVirusScan: true,
        enableCompression: false,
      };

      await expect(service.processUpload(file, config))
        .rejects
        .toThrow('检测到安全威胁');
    });
  });

  describe('File Processing and Optimization', () => {
    it('should process image files with compression', async () => {
      const imageBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
      const file = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 2048000, // 2MB
        buffer: imageBuffer,
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: true,
        maxWidth: 256,
        maxHeight: 256,
        quality: 80,
      };

      const result = await service.processUpload(file, config);
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.width).toBeDefined();
      expect(result.metadata?.height).toBeDefined();
    });

    it('should skip compression for non-image files', async () => {
      const textBuffer = Buffer.from('Hello World');
      const file = {
        originalname: 'document.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: textBuffer,
        fieldname: 'document',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['text/plain'],
        allowedExtensions: ['.txt'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const result = await service.processUpload(file, config);
      expect(result).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('File Naming and Path Security', () => {
    it('should generate secure filenames', async () => {
      const file = {
        originalname: 'test file.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const result = await service.processUpload(file, config);

      // Should not contain original filename parts
      expect(result.filename).not.toContain('test file');
      // Should have timestamp and random parts
      expect(result.filename).toMatch(/^\d+-[a-f0-9]+-avatar\..+$/);
      // Should have extension
      expect(result.filename).toMatch(/\.jpg$/);
    });

    it('should create secure directory paths', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const result = await service.processUpload(file, config);

      // Path should be safe and structured
      expect(result.path).toMatch(/^avatars\/\d{4}\/\d{2}\/\d{2}\/.+$/);
      expect(result.url).toMatch(/^\/uploads\/.+$/);
    });

    it('should sanitize unsafe filenames', async () => {
      const file = {
        originalname: '../../../etc/passwd',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'document',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['text/plain'],
        allowedExtensions: ['.txt'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      // This should be caught during validation, but let's see what happens
      await expect(service.processUpload(file, config))
        .rejects
        .toThrow();
    });
  });

  describe('Batch Upload Processing', () => {
    it('should process multiple files successfully', async () => {
      const files = [
        {
          originalname: 'avatar1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
          fieldname: 'avatar',
        },
        {
          originalname: 'avatar2.png',
          mimetype: 'image/png',
          size: 1024,
          buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
          fieldname: 'avatar',
        },
      ] as Express.Multer.File[];

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        allowedExtensions: ['.jpg', '.png'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const results = await service.processBatchUpload(files, config);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.filename).toBeDefined();
        expect(result.size).toBeGreaterThan(0);
      });
    });

    it('should handle partial batch failures gracefully', async () => {
      const files = [
        {
          originalname: 'valid.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
          fieldname: 'avatar',
        },
        {
          originalname: 'invalid.exe',
          mimetype: 'application/octet-stream',
          size: 1024,
          buffer: Buffer.from([0x4D, 0x5A, 0x90, 0x00]), // EXE header
          fieldname: 'avatar',
        },
      ] as Express.Multer.File[];

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        allowedExtensions: ['.jpg', '.png'],
        uploadPath: 'uploads/test/',
        enableVirusScan: true,
        enableCompression: false,
      };

      const results = await service.processBatchUpload(files, config);

      // Should return only the successful uploads
      expect(results).toHaveLength(1);
      expect(results[0].originalName).toBe('valid.jpg');
    });
  });

  describe('File Hash and Integrity', () => {
    it('should calculate file hash correctly', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test content'),
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const result = await service.processUpload(file, config);

      expect(result.hash).toBeDefined();
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
    });

    it('should generate consistent hashes for same content', async () => {
      const content = 'test content for hashing';
      const files = [
        {
          originalname: 'test1.jpg',
          mimetype: 'image/jpeg',
          size: content.length,
          buffer: Buffer.from(content),
          fieldname: 'avatar',
        },
        {
          originalname: 'test2.jpg',
          mimetype: 'image/jpeg',
          size: content.length,
          buffer: Buffer.from(content),
          fieldname: 'avatar',
        },
      ] as Express.Multer.File[];

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      const [result1, result2] = await service.processBatchUpload(files, config);

      expect(result1.hash).toBe(result2.hash);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle file system errors gracefully', async () => {
      // Mock fs.mkdir to throw an error
      jest.spyOn(fs, 'mkdir').mockRejectedValueOnce(new Error('Disk full'));

      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      await expect(service.processUpload(file, config))
        .rejects
        .toThrow('文件存储失败');
    });

    it('should cleanup temporary files on error', async () => {
      // Mock fs.copyFile to throw an error
      jest.spyOn(fs, 'copyFile').mockRejectedValueOnce(new Error('Write failed'));

      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'avatar',
      } as Express.Multer.File;

      const config = {
        maxFileSize: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        allowedExtensions: ['.jpg'],
        uploadPath: 'uploads/test/',
        enableVirusScan: false,
        enableCompression: false,
      };

      await expect(service.processUpload(file, config))
        .rejects
        .toThrow();

      // Should have attempted to cleanup
      expect(fs.unlink).toHaveBeenCalled();
    });
  });
});
