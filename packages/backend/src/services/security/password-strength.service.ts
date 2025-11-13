/**
 * 密码强度检查服务
 * 使用 zxcvbn 库进行密码强度评估
 */
import zxcvbn from 'zxcvbn';

/**
 * 密码强度等级
 */
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

/**
 * 密码强度检查结果
 */
export interface PasswordStrengthResult {
  score: PasswordStrength;
  feedback: {
    warning?: string;
    suggestions: string[];
  };
  crackTimeDisplay: string;
  isAcceptable: boolean;
}

/**
 * 密码强度服务类
 */
export class PasswordStrengthService {
  /**
   * 最低可接受的密码强度分数
   */
  private readonly MIN_ACCEPTABLE_SCORE = PasswordStrength.FAIR;

  /**
   * 检查密码强度
   * @param password 待检查的密码
   * @param userInputs 用户相关信息（用户名、邮箱等），用于检测密码中是否包含这些信息
   * @returns 密码强度检查结果
   */
  checkPassword(password: string, userInputs: string[] = []): PasswordStrengthResult {
    // 使用 zxcvbn 进行密码强度评估
    const result = zxcvbn(password, userInputs);

    return {
      score: result.score as PasswordStrength,
      feedback: {
        warning: this.translateWarning(result.feedback.warning),
        suggestions: result.feedback.suggestions.map((s) => this.translateSuggestion(s)),
      },
      crackTimeDisplay: this.getCrackTimeDisplay(
        String(result.crack_times_display.offline_slow_hashing_1e4_per_second)
      ),
      isAcceptable: result.score >= this.MIN_ACCEPTABLE_SCORE,
    };
  }

  /**
   * 验证密码是否符合最低强度要求
   * @param password 待验证的密码
   * @param userInputs 用户相关信息
   * @returns 是否符合要求
   */
  isPasswordAcceptable(password: string, userInputs: string[] = []): boolean {
    const result = this.checkPassword(password, userInputs);
    return result.isAcceptable;
  }

  /**
   * 获取密码强度建议
   * @param password 待检查的密码
   * @param userInputs 用户相关信息
   * @returns 建议列表
   */
  getPasswordSuggestions(password: string, userInputs: string[] = []): string[] {
    const result = this.checkPassword(password, userInputs);
    const suggestions: string[] = [];

    if (result.feedback.warning) {
      suggestions.push(result.feedback.warning);
    }

    suggestions.push(...result.feedback.suggestions);

    if (!result.isAcceptable) {
      suggestions.push('密码强度不足，建议使用更复杂的密码');
    }

    return suggestions;
  }

  /**
   * 翻译 zxcvbn 的警告信息
   */
  private translateWarning(warning?: string): string | undefined {
    if (!warning) return undefined;

    const translations: Record<string, string> = {
      'This is a top-10 common password': '这是最常用的10个密码之一',
      'This is a top-100 common password': '这是最常用的100个密码之一',
      'This is a very common password': '这是一个非常常见的密码',
      'This is similar to a commonly used password': '这与常用密码相似',
      'Straight rows of keys are easy to guess': '键盘上的连续按键很容易被猜到',
      'Short keyboard patterns are easy to guess': '短的键盘模式很容易被猜到',
      'Repeats like "aaa" are easy to guess': '像 "aaa" 这样的重复很容易被猜到',
      'Repeats like "abcabcabc" are only slightly harder to guess than "abc"':
        '像 "abcabcabc" 这样的重复只比 "abc" 稍难猜一点',
      'Sequences like "abc" or "6543" are easy to guess': '像 "abc" 或 "6543" 这样的序列很容易被猜到',
      'Recent years are easy to guess': '近年份很容易被猜到',
      'Dates are often easy to guess': '日期通常很容易被猜到',
    };

    return translations[warning] || warning;
  }

  /**
   * 翻译 zxcvbn 的建议信息
   */
  private translateSuggestion(suggestion: string): string {
    const translations: Record<string, string> = {
      'Use a few words, avoid common phrases': '使用几个单词，避免常见短语',
      'No need for symbols, digits, or uppercase letters': '不需要符号、数字或大写字母',
      'Add another word or two. Uncommon words are better.': '添加一两个单词，不常见的单词更好',
      'Capitalization doesn\'t help very much': '大写并不会有太大帮助',
      'All-uppercase is almost as easy to guess as all-lowercase': '全大写几乎和全小写一样容易猜到',
      'Reversed words aren\'t much harder to guess': '反转的单词不会更难猜',
      'Predictable substitutions like "@" instead of "a" don\'t help very much':
        '像用 "@" 代替 "a" 这样的可预测替换没有太大帮助',
      'Use a longer keyboard pattern with more turns': '使用更长的键盘模式，包含更多转折',
      'Avoid repeated words and characters': '避免重复的单词和字符',
      'Avoid sequences': '避免序列',
      'Avoid recent years': '避免近年份',
      'Avoid years that are associated with you': '避免与你相关的年份',
      'Avoid dates and years that are associated with you': '避免与你相关的日期和年份',
    };

    return translations[suggestion] || suggestion;
  }

  /**
   * 获取破解时间显示
   */
  private getCrackTimeDisplay(crackTime: string): string {
    const translations: Record<string, string> = {
      'less than a second': '少于1秒',
      'second': '秒',
      'seconds': '秒',
      'minute': '分钟',
      'minutes': '分钟',
      'hour': '小时',
      'hours': '小时',
      'day': '天',
      'days': '天',
      'month': '月',
      'months': '月',
      'year': '年',
      'years': '年',
      'centuries': '世纪',
    };

    let translated = crackTime;
    Object.entries(translations).forEach(([en, zh]) => {
      translated = translated.replace(new RegExp(en, 'gi'), zh);
    });

    return translated;
  }
}

// 导出单例
export const passwordStrengthService = new PasswordStrengthService();

