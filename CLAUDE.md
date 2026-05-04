# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指导。

## 常用命令

### 环境准备

```bash
pnpm install          # 安装所有依赖
```

### 开发

```bash
pnpm dev              # 启动所有工作区开发模式（turbo dev）
pnpm dev:app          # 仅启动移动端开发
pnpm start:app        # 启动 Expo（ios/android/web 也可用）
```

### 构建、检查、类型校验

```bash
pnpm build            # turbo build（自动处理上游依赖）
pnpm lint             # turbo lint
pnpm typecheck        # turbo typecheck
```

### 服务端专用

```bash
pnpm --filter server dev              # 启动 NestJS 服务（watch 模式，端口 3000）
pnpm --filter server db:generate      # 生成 Drizzle 迁移文件
pnpm --filter server db:migrate       # 执行 Drizzle 迁移
pnpm --filter server db:seed          # 填充数据库种子数据
```

### EAS 构建（移动端）

```bash
pnpm eas:build:preview  # Android 预览 APK，通过 EAS 构建
```

## 架构总览

这是一个 **pnpm monorepo**，使用 **Turborepo** 编排构建。工作区包含：`apps/server`、`apps/app`、`packages/schema`。`apps/admin` 工作区在计划中但尚未创建。

### 服务端 (`apps/server`) — NestJS 11 + Fastify

服务端使用 **Fastify**（而非 Express）作为 HTTP 适配器。启动入口在 `src/main.ts` — 创建 `NestFastifyApplication`，注册 `@fastify/cors`，全局应用 `ZodValidationPipe`。监听 3000 端口。

**认证流程** (`src/modules/auth/`)：JWT + 刷新令牌。登录接受租户编码 + 账号 + 密码，通过 bcrypt 哈希校验，返回 access token 和 refresh token。access token 有效期 15 分钟；refresh token 为 64 字节随机 hex 字符串，存储前经 SHA-256 哈希。5 次登录失败后锁定 15 分钟。

**守卫链** — `AppModule` 中通过 `APP_GUARD` 注册两个全局守卫：

1. `JwtAuthGuard` — 继承 Passport 的 `AuthGuard('jwt')`。标注 `@Public()` 的路由跳过认证。
2. `PermissionGuard` — 根据 `role_permissions` 表检查 `@RequirePermission()` 声明的权限。

**多租户**：共享数据库，通过 `tenant_id` 列隔离数据。`TenantContextMiddleware` 从 JWT payload 中提取租户 ID 并挂载到请求上。所有业务表均包含 `tenant_id`。

**数据库**：PostgreSQL + Drizzle ORM。Schema 定义在 `src/db/schema.ts`（13 张表）。所有 ID 使用自定义 **Snowflake** 算法（`src/common/utils/snowflake.ts`）生成 64 位 `bigint` — 起始时间戳 `1704067200000`，10 位 worker ID，12 位序列号。

目前仅实现了 `auth` 模块。RBAC 设计文档中规划了 8 个模块（auth、users、permissions、audit、buildings、rooms、tenants-mgmt、fees）。

### Schema 包 (`packages/schema`) — Zod v4

共享的 Zod schema 和类型定义，涵盖认证、用户、租户、权限以及通用校验（分页、ID 参数）。

### 移动端 (`apps/app`) — Expo SDK 54

React Native 应用，使用 React Navigation 7 导航、Zustand 5 状态管理、AsyncStorage 持久化。当前为**纯本地模式** — 尚未对接服务端，所有数据存储在设备本地。使用 Tailwind CSS 4（通过 `uninwind`）、HeroUI Native、Reanimated 4。

### 硬性规则

要点：

- 依赖方向：`types/ → config/ → repo/ → service/ → runtime/ → ui/`
- 横切关注点（auth、logging、telemetry）只能通过 Provider 注入
- 单文件不超过 300 行
- 新增代码必须有对应测试
- 禁止 `console.log`，使用结构化日志
- 提交规范：`feat:`、`fix:`、`refactor:`、`docs:`、`test:`
