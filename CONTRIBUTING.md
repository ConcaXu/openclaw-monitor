# 贡献指南

感谢你考虑为电商价格监控技能做出贡献！

## 开发流程

### 1. 环境设置
```bash
# 克隆仓库
git clone https://github.com/ConcaXu/ecommerce-price-monitor.git
cd ecommerce-price-monitor

# 安装依赖
npm install

# 运行测试
npm test
```

### 2. 代码规范
- 使用 ESLint 和 Prettier 格式化代码
- 遵循 JavaScript Standard Style
- 提交前运行 `npm run lint` 检查代码

### 3. 提交规范
使用 Conventional Commits 格式：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具变动

### 4. 分支策略
- `main`: 稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: bug修复分支
- `release/*`: 发布分支

## 添加新功能

### 1. 电商平台支持
如果要添加新的电商平台支持：

1. 在 `simple-fetcher.js` 中添加新的解析方法
2. 更新 `platforms` 配置
3. 添加对应的测试用例
4. 更新文档

### 2. 通知渠道
如果要添加新的通知渠道：

1. 创建新的通知模块
2. 集成到 `monitor.js` 的 `sendNotification` 方法
3. 添加配置选项
4. 更新文档

## 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --grep "淘宝"

# 生成测试覆盖率报告
npm run coverage
```

### 测试要求
- 新功能必须包含测试用例
- 测试覆盖率不低于80%
- 集成测试要模拟真实场景

## 文档

### 更新文档
- README.md: 项目概述和使用说明
- API.md: API文档（如果有）
- CHANGELOG.md: 版本更新日志
- docs/: 详细文档

### 文档要求
- 使用中文编写
- 包含代码示例
- 保持更新

## 问题报告

### 提交issue
1. 使用issue模板
2. 描述清晰的问题
3. 提供复现步骤
4. 包含环境信息

### Bug报告模板
```markdown
## 问题描述
清晰描述问题

## 复现步骤
1. ...
2. ...
3. ...

## 预期行为
应该发生什么

## 实际行为
实际发生了什么

## 环境信息
- 系统: [如 Ubuntu 20.04]
- Node版本: [如 v18.0.0]
- 版本: [如 v1.0.0]

## 附加信息
日志、截图等
```

## Pull Request流程

### 1. 创建PR
1. Fork仓库
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 2. PR要求
- 关联issue（如果有）
- 通过所有CI检查
- 代码审查通过
- 更新相关文档

### 3. 合并策略
- Squash and merge: 功能分支
- Rebase and merge: bug修复
- Create a merge commit: 发布分支

## 发布流程

### 版本号规则
- `major`: 不兼容的API修改
- `minor`: 向下兼容的功能性新增
- `patch`: 向下兼容的问题修正

### 发布步骤
1. 更新CHANGELOG.md
2. 更新版本号
3. 创建release分支
4. 运行完整测试
5. 创建GitHub Release
6. 发布到npm（如果需要）

## 行为准则

请遵守 [贡献者公约](CODE_OF_CONDUCT.md)。

## 获取帮助

- 查看 [文档](docs/)
- 搜索 [issues](https://github.com/ConcaXu/ecommerce-price-monitor/issues)
- 加入讨论

---

感谢你的贡献！ 🦞