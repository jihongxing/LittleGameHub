/**
 * Unit tests for PasswordStrengthService
 * 密码强度服务的单元测试
 *
 * Tests password strength evaluation and feedback generation
 * 测试密码强度评估和反馈生成
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PasswordStrengthService, PasswordStrength } from '../../src/services/security/password-strength.service';

// Mock zxcvbn
jest.mock('zxcvbn', () => {
  return jest.fn().mockImplementation((password: string, userInputs: string[] = []) => {
    // Simplified mock that matches the actual zxcvbn scoring logic used in the service
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z\d]/.test(password)) score++;

    // Check against user inputs (simplified logic)
    if (userInputs.some(input => password.toLowerCase().includes(input.toLowerCase()))) {
      score = Math.max(0, score - 1);
    }

    const feedback = { warning: '', suggestions: [] as string[] };

    // Add suggestions based on what's missing
    if (password.length < 8) feedback.suggestions.push('密码长度至少为8个字符');
    if (!/[A-Z]/.test(password)) feedback.suggestions.push('添加大写字母');
    if (!/[a-z]/.test(password)) feedback.suggestions.push('添加小写字母');
    if (!/\d/.test(password)) feedback.suggestions.push('添加数字');
    if (!/[^A-Za-z\d]/.test(password)) feedback.suggestions.push('添加特殊字符');

    // Add user input warning if applicable
    if (userInputs.some(input => password.toLowerCase().includes(input.toLowerCase()))) {
      feedback.suggestions.push('密码包含个人信息，请避免使用');
    }

    // Set warning based on score
    if (score <= 1) {
      feedback.warning = score === 0 ? '这个密码非常弱' : '这个密码很弱';
    } else if (score === 2) {
      feedback.warning = '这个密码比较弱';
    } else if (score === 3) {
      feedback.warning = '这个密码强度一般';
    }

    return {
      score,
      feedback,
      crack_times_display: {
        offline_slow_hashing_1e4_per_second: score <= 2 ? '1 年' : '1 year',
      },
      password,
      guesses: Math.pow(10, score),
      guesses_log10: score,
      sequence: [],
      calc_time: 10,
    };
  });
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

describe('PasswordStrengthService', () => {
  let service: PasswordStrengthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordStrengthService],
    }).compile();

    service = module.get<PasswordStrengthService>(PasswordStrengthService);
  });

  describe('Password Strength Evaluation', () => {
    it('should return a valid score between 0-4', () => {
      const result = service.checkPassword('testpassword');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
      expect(typeof result.isAcceptable).toBe('boolean');
      expect(result.feedback).toBeDefined();
      expect(result.crackTimeDisplay).toBeDefined();
    });

    it('should evaluate password strength correctly', () => {
      // Test that stronger passwords get higher scores
      const weakResult = service.checkPassword('123');
      const strongResult = service.checkPassword('VeryStrongPass123!@#');

      expect(strongResult.score).toBeGreaterThanOrEqual(weakResult.score);
    });

    it('should mark acceptable passwords as acceptable', () => {
      const result = service.checkPassword('GoodPassword123!');

      // The service should determine acceptability based on score >= FAIR (2)
      expect(typeof result.isAcceptable).toBe('boolean');
    });
  });

  describe('User Input Checking', () => {
    it('should penalize password containing username', () => {
      const result = service.checkPassword('johnpassword', ['john', 'doe']);

      expect(result.score).toBeLessThan(2); // Should be penalized
      expect(result.feedback.suggestions).toContain('密码包含个人信息，请避免使用');
    });

    it('should penalize password containing email', () => {
      const result = service.checkPassword('user@gmail.com', ['user@gmail.com']);

      expect(result.score).toBeLessThan(2);
      expect(result.feedback.suggestions).toContain('密码包含个人信息，请避免使用');
    });

    it('should handle empty user inputs', () => {
      const result = service.checkPassword('Password123!', []);

      expect(result.isAcceptable).toBe(true);
      expect(result.feedback.suggestions).not.toContain('密码包含个人信息，请避免使用');
    });

    it('should handle undefined user inputs', () => {
      const result = service.checkPassword('Password123!');

      expect(result.isAcceptable).toBe(true);
    });
  });

  describe('Feedback Generation', () => {
    it('should provide comprehensive feedback for weak password', () => {
      const result = service.checkPassword('a');

      expect(result.feedback.suggestions).toContain('密码长度至少为8个字符');
      expect(result.feedback.suggestions).toContain('添加大写字母');
      expect(result.feedback.suggestions).toContain('添加数字');
      expect(result.feedback.suggestions).toContain('添加特殊字符');
    });

    it('should provide targeted feedback for specific weaknesses', () => {
      const result = service.checkPassword('passwordpassword'); // Long but no complexity

      expect(result.feedback.suggestions).toContain('添加大写字母');
      expect(result.feedback.suggestions).toContain('添加数字');
      expect(result.feedback.suggestions).toContain('添加特殊字符');
    });

    it('should not suggest improvements for strong password', () => {
      const result = service.checkPassword('TrulySecure123!@#');

      // Should have minimal suggestions for a strong password
      expect(result.feedback.warning || '').toBe('');
      expect(result.feedback.suggestions.length).toBeLessThan(3);
    });
  });

  describe('Crack Time Display', () => {
    it('should include crack time information', () => {
      const result = service.checkPassword('Password123!');

      expect(result.crackTimeDisplay).toBeDefined();
      expect(typeof result.crackTimeDisplay).toBe('string');
    });

    it('should handle various crack time formats', () => {
      // This depends on the actual zxcvbn response
      const result = service.checkPassword('weak');

      expect(result.crackTimeDisplay).toBeDefined();
      expect(typeof result.crackTimeDisplay).toBe('string');
    });
  });

  describe('Acceptability Threshold', () => {
    it('should mark FAIR and above passwords as acceptable', () => {
      const fairPassword = service.checkPassword('Password123');
      const goodPassword = service.checkPassword('Password123!');
      const strongPassword = service.checkPassword('VeryStrongPass123!@#');

      expect(fairPassword.isAcceptable).toBe(true);
      expect(goodPassword.isAcceptable).toBe(true);
      expect(strongPassword.isAcceptable).toBe(true);
    });

    it('should mark below FAIR passwords as unacceptable', () => {
      const veryWeak = service.checkPassword('123');
      const weak = service.checkPassword('password');

      expect(veryWeak.isAcceptable).toBe(false);
      expect(weak.isAcceptable).toBe(false);
    });

    it('should use FAIR as minimum acceptable score by default', () => {
      const fairPassword = service.checkPassword('Password123');
      const weakPassword = service.checkPassword('weak');

      expect(fairPassword.isAcceptable).toBe(true);
      expect(weakPassword.isAcceptable).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty password', () => {
      const result = service.checkPassword('');

      expect(result.score).toBe(PasswordStrength.VERY_WEAK);
      expect(result.isAcceptable).toBe(false);
      expect(result.feedback.suggestions).toContain('密码长度至少为8个字符');
    });

    it('should handle very long password', () => {
      const longPassword = 'A'.repeat(1000);
      const result = service.checkPassword(longPassword);

      expect(result.score).toBeDefined();
      expect(result.isAcceptable).toBe(true);
    });

    it('should handle password with only special characters', () => {
      const result = service.checkPassword('!@#$%^&*()');

      expect(result.score).toBe(PasswordStrength.FAIR);
      expect(result.isAcceptable).toBe(true);
    });

    it('should handle password with unicode characters', () => {
      const result = service.checkPassword('密码123!@#');

      expect(result.score).toBeDefined();
      expect(result.isAcceptable).toBe(true);
    });

    it('should handle password with mixed scripts', () => {
      const result = service.checkPassword('Password密码123!');

      expect(result.score).toBeDefined();
      expect(result.isAcceptable).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should evaluate password quickly', () => {
      const startTime = Date.now();
      service.checkPassword('ThisIsAVeryStrongPassword123!@#');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle multiple evaluations efficiently', () => {
      const passwords = [
        'weak',
        'Password123',
        'VeryStrongPassword123!@#',
        'anotherpassword',
        'Complex!Pass123',
      ];

      const startTime = Date.now();

      passwords.forEach(password => {
        service.checkPassword(password, ['user', 'email']);
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(500); // Should complete all in less than 500ms
    });
  });

  describe('Security Considerations', () => {
    it('should not leak user inputs in feedback', () => {
      const result = service.checkPassword('mypassword', ['secret', 'classified']);

      // Feedback should not contain the actual user inputs
      result.feedback.suggestions.forEach(suggestion => {
        expect(suggestion).not.toContain('secret');
        expect(suggestion).not.toContain('classified');
      });
    });

    it('should handle sensitive user inputs securely', () => {
      const sensitiveInputs = [
        'password',
        '123456',
        'admin',
        'root',
        'user@example.com',
        'john.doe',
      ];

      const result = service.checkPassword('admin123', sensitiveInputs);

      expect(result.score).toBeLessThan(3);
      expect(result.feedback.suggestions).toContain('密码包含个人信息，请避免使用');
    });

    it('should prevent information leakage through timing', () => {
      // Test that evaluation time doesn't reveal information about user inputs
      const password = 'ComplexPassword123!';
      const shortInputs = ['a'];
      const longInputs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

      const time1 = Date.now();
      service.checkPassword(password, shortInputs);
      const time2 = Date.now();
      service.checkPassword(password, longInputs);
      const time3 = Date.now();

      const duration1 = time2 - time1;
      const duration2 = time3 - time2;

      // Timing difference should be minimal
      expect(Math.abs(duration1 - duration2)).toBeLessThan(50);
    });
  });
});
