<!--
Sync Impact Report:
Version: 1.0.0 (initial creation)
Date: 2025-11-12
Changes:
  - Initial constitution creation
  - Added 4 core principles: Code Quality, Testing Standards, UX Consistency, Performance Requirements
  - Templates updated:
    ✅ .specify/templates/plan-template.md - Added Constitution Check section with all 4 principles
    ✅ .specify/templates/spec-template.md - Added Performance, Testing, and UX criteria sections
    ✅ .specify/templates/tasks-template.md - Added tasks for all 4 principles in Polish phase
  - Follow-up: None - all dependent templates updated
-->

# GameHub 项目宪法

**项目名称**: GameHub - 小游戏聚合平台  
**宪法版本**: 1.0.0  
**批准日期**: 2025-11-12  
**最后修订日期**: 2025-11-12

---

## 前言

本宪法确立了 GameHub 项目的核心开发原则和不可协商的规则。所有团队成员、贡献者和自动化系统必须遵守这些原则。本宪法旨在确保代码质量、测试覆盖、用户体验一致性和系统性能达到生产级标准。

---

## 核心原则

### 原则 1: 代码质量 (Code Quality)

**规则**:
- **MUST**: 所有代码必须通过 ESLint 和 TypeScript 类型检查，零错误零警告
- **MUST**: 所有函数、类、模块必须包含清晰的 JSDoc 注释，说明用途、参数和返回值
- **MUST**: 代码复杂度（圈复杂度）不得超过 10，超过必须重构
- **MUST**: 遵循项目统一的代码风格（Prettier 格式化，约定式提交规范）
- **MUST**: 所有公共 API 必须提供 TypeScript 类型定义
- **MUST**: 禁止使用 `any` 类型，特殊情况必须添加 `@ts-ignore` 注释并说明原因
- **SHOULD**: 优先使用函数式编程范式，减少副作用
- **SHOULD**: 单一职责原则，每个函数/类只做一件事
- **SHOULD**: DRY 原则，避免代码重复，提取公共逻辑

**理由**: 高质量的代码是项目可维护性、可扩展性和团队协作效率的基础。严格的代码质量标准能够减少技术债务，降低 bug 率，提升开发速度。

**验证方式**:
- CI/CD 流水线中集成 ESLint、TypeScript 类型检查
- 代码审查时必须检查代码质量和注释完整性
- 使用 SonarQube 或类似工具进行代码质量分析

---

### 原则 2: 测试标准 (Testing Standards)

**规则**:
- **MUST**: 所有业务逻辑代码必须达到 80% 以上的测试覆盖率
- **MUST**: 所有 API 端点必须包含集成测试
- **MUST**: 所有工具函数和工具类必须包含单元测试
- **MUST**: 所有前端组件必须包含组件测试（React Testing Library）
- **MUST**: 关键用户流程必须包含端到端测试（E2E）
- **MUST**: 测试必须独立运行，不依赖外部服务或数据库状态
- **MUST**: 测试用例命名必须清晰描述测试场景和预期结果
- **SHOULD**: 使用测试驱动开发（TDD）方法编写新功能
- **SHOULD**: 测试数据使用工厂模式或 fixtures，避免硬编码
- **SHOULD**: 性能关键路径必须包含性能基准测试

**理由**: 全面的测试覆盖是确保代码正确性、防止回归和提升重构信心的关键。严格的测试标准能够及早发现问题，降低生产环境故障率。

**验证方式**:
- CI/CD 流水线中集成测试覆盖率检查，未达标阻止合并
- 使用 Jest/Vitest 覆盖率报告验证测试覆盖
- 代码审查时必须检查测试用例的完整性和质量

---

### 原则 3: 用户体验一致性 (User Experience Consistency)

**规则**:
- **MUST**: 所有用户界面必须遵循统一的设计系统（Ant Design 组件库）
- **MUST**: 所有交互操作必须在 100ms 内提供视觉反馈
- **MUST**: 所有错误状态必须提供清晰的错误提示和恢复建议
- **MUST**: 所有加载状态必须显示加载指示器，超过 1 秒的操作必须显示进度
- **MUST**: 所有表单输入必须包含实时验证和错误提示
- **MUST**: 所有页面必须支持响应式设计，适配移动端和桌面端
- **MUST**: 所有可访问性要求必须符合 WCAG 2.1 AA 级别标准
- **SHOULD**: 使用统一的动画和过渡效果，保持交互一致性
- **SHOULD**: 提供离线状态提示和离线功能支持（PWA）
- **SHOULD**: 支持国际化（i18n），至少支持中英文

**理由**: 一致的用户体验能够降低用户学习成本，提升用户满意度和留存率。统一的交互模式能够减少用户困惑，提升产品专业度。

**验证方式**:
- 设计审查检查 UI/UX 一致性
- 使用 Lighthouse 进行可访问性审计
- 代码审查检查交互反馈和错误处理
- 用户测试验证关键流程的可用性

---

### 原则 4: 性能要求 (Performance Requirements)

**规则**:
- **MUST**: 页面首次内容绘制（FCP）必须小于 1.8 秒
- **MUST**: 最大内容绘制（LCP）必须小于 2.5 秒
- **MUST**: 首次输入延迟（FID）必须小于 100 毫秒
- **MUST**: 累积布局偏移（CLS）必须小于 0.1
- **MUST**: API 响应时间 P95 必须小于 200 毫秒，P99 必须小于 500 毫秒
- **MUST**: 数据库查询必须使用索引，慢查询（>100ms）必须优化
- **MUST**: 前端资源必须启用压缩（Gzip/Brotli）和 CDN 加速
- **MUST**: 图片资源必须使用 WebP 格式，并提供降级方案
- **MUST**: 实现代码分割和懒加载，减少初始包体积
- **SHOULD**: 使用缓存策略（Redis、HTTP 缓存）减少重复计算和请求
- **SHOULD**: 实现虚拟滚动和分页，处理大量数据列表
- **SHOULD**: 监控和告警关键性能指标，设置性能预算

**理由**: 优秀的性能是用户体验的核心要素，直接影响用户留存和转化率。严格的性能要求能够确保系统在高负载下仍能提供流畅体验。

**验证方式**:
- CI/CD 流水线中集成 Lighthouse CI，性能指标未达标阻止合并
- 使用 WebPageTest 和 Chrome DevTools 进行性能分析
- 生产环境监控 Core Web Vitals 和 API 响应时间
- 定期进行负载测试和压力测试

---

## 治理 (Governance)

### 修订程序

1. **修订提议**: 任何团队成员可以提出宪法修订建议，通过 Issue 或 Pull Request 提交
2. **讨论评估**: 核心团队评估修订的必要性、影响范围和可行性
3. **团队共识**: 修订内容必须经过团队讨论并达成共识
4. **版本更新**: 修订后必须更新版本号（遵循语义化版本）和修订日期
5. **同步传播**: 修订后必须更新所有依赖模板和文档

### 版本控制策略

- **MAJOR 版本**: 向后不兼容的原则移除或重新定义
- **MINOR 版本**: 新增原则或显著扩展现有原则的指导
- **PATCH 版本**: 澄清说明、措辞修正、非语义性改进

### 合规审查

- **代码审查**: 所有代码提交必须经过审查，确保符合宪法原则
- **定期审计**: 每季度进行一次宪法合规性审计
- **自动化检查**: CI/CD 流水线自动检查代码质量、测试覆盖率和性能指标
- **持续改进**: 根据审计结果和团队反馈持续优化原则和流程

---

## 执行与责任

### 团队责任

- **开发者**: 负责编写符合宪法原则的代码，参与代码审查
- **技术负责人**: 负责监督宪法执行，处理违规情况
- **QA 工程师**: 负责验证测试覆盖率和用户体验一致性
- **DevOps 工程师**: 负责监控性能指标和系统稳定性

### 违规处理

- **轻微违规**: 代码审查中提出修改建议，要求修正后合并
- **严重违规**: 阻止代码合并，要求重新设计或重构
- **重复违规**: 进行团队培训，强化宪法意识

---

## 附录

### 相关文档

- [项目宪章](../constitution/GameHub_项目宪章.md)
- [开发规范](../constitution/GameHub_开发规范.md)
- [工作流程](../constitution/GameHub_工作流程.md)

### 工具与资源

- **代码质量**: ESLint, Prettier, TypeScript, SonarQube
- **测试框架**: Jest, Vitest, React Testing Library, Supertest
- **性能监控**: Lighthouse, WebPageTest, Chrome DevTools, Prometheus
- **设计系统**: Ant Design, Material Design Guidelines

---

**承诺**: 我们，GameHub 项目团队，承诺遵守本宪法所规定的所有原则和规则，以质量为核心，以用户为中心，共同打造优秀的游戏聚合平台。
