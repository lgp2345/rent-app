# rent

这是一个房屋租赁全栈 Monorepo 项目，包含 app 应用、用户权限系统（RBAC + 多租户）、管理后台。基于 **Node.js + Turborepo** 构建。

## 项目概览

| 模块              | 描述                                 | 端口 |
| ----------------- | ------------------------------------ | ---- |
| `apps/app`        | React Native 房屋租赁移动端 app 应用 | —    |
| `apps/admin`      | React 管理后台（用户/角色/权限）     | 5173 |
| `apps/server`     | NestJS 用户/认证/RBAC 服务           | 3000 |
| `packages/schema` | 共享 Zod 验证 Schema                 | —    |

## 技术栈

| 层级     | 技术                                                         |
| -------- | ------------------------------------------------------------ |
| 包管理   | pnpm + Workspaces                                            |
| 构建编排 | Turborepo                                                    |
| 前端     | React 19 + Tailwind CSS + HeroUI + Zustand + TanStack Router |
| 后端     | NestJS 11 + Passport JWT + Fastify + Nestjs-zod              |
| 数据库   | PostgreSQL + Drizzle ORM                                     |

## 快速导航

- [产品与业务设计总览](./DESIGN.md)
- [RBAC 设计文档](./docs/superpowers/specs/2026-04-12-rbac-design.md)
- [RBAC 实施计划](./docs/superpowers/plans/2026-04-12-rbac-implementation.md)
- [Claude Code 指令](./CLAUDE.md)

## 开发指南

### 前置要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL

### 安装与运行

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev
```

### 项目结构

```
apps/
  app/          # React Native 移动端应用
  admin/        # 管理后台
  server/       # NestJS 后端服务
packages/
  schema/       # 共享 Zod 验证 Schema
docs/           # 设计文档与计划
```

## 贡献指南

请参见 [CLAUDE.md](./CLAUDE.md) 中的硬性规则与提交规范。
