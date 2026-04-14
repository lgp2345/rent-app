# rent

这是一个房屋租赁全栈 Monorepo 项目，包含 app应用、用户权限系统（RBAC + 多租户）、管理后台。基于 **nodejs + Turborepo** 构建。

## 项目概览

| 模块              | 描述                               | 端口 |
| ----------------- | ---------------------------------- | ---- |
| `apps/app`        | react-native 房屋租赁移动端app应用 |
| `apps/admin`      | react 管理后台（用户/角色/权限）   | 5173 |
| `apps/server`     | NestJS 用户/认证/RBAC 服务         | 3000 |
| `packages/schema` | 共享 Zod 验证 Schema               | —    |

## 技术栈

| 层级     | 技术                                                         |
| -------- | ------------------------------------------------------------ |
| 包管理   | pnpm + Workspaces                                            |
| 构建编排 | Turborepo                                                    |
| 前端     | React 19 + Tailwind CSS + Heroui + Zustand + TanStack Router |
| 后端     | NestJS 11 + Passport JWT + Fastify + Nestjs-zod              |
| 数据库   | PostgreSQL + Drizzle ORM                                     |

## 快速导航

| 产品与业务设计总览 | DESIGN.md |
| RBAC 设计文档 | docs/superpowers/specs/2026-04-12-rbac-design.md |
| RBAC 实施计划 | docs/superpowers/plans/2026-04-12-rbac-implementation.md |

## 硬性规则（必须遵守，CI 会验证）

1. 依赖方向：types/ → config/ → repo/ → service/ → runtime/ → ui/
2. 横切关注点（auth/log/telemetry）只能通过 Provider 注入
3. 单文件不超过 300 行
4. 新增代码必须有对应测试
5. 使用结构化日志，禁止 console.log

## 提交规范

- feat: 新功能
- fix: 修复
- refactor: 重构
- docs: 文档
- test: 测试
