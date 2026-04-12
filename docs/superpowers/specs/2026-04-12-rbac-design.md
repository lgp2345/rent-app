# 房屋租赁系统 - 后台管理 RBAC 权限模块设计

## 项目概述

房屋租赁系统，包含三个子应用：

- **apps/app**：移动端（Expo + React Native + HeroUI Native），当前数据本地存储，暂不做登录
- **apps/server**：后端（NestJS + Drizzle + Zod + PostgreSQL）
- **apps/admin**：后台管理前端（React + TanStack Router + Zustand + HeroUI + Tailwind + Zod + Axios）
- **packages/schema**：共享 Zod schema（前后端复用）

## 边界条件决策

| 项目         | 决策                                         |
| ------------ | -------------------------------------------- |
| 权限粒度     | 页面级（控制菜单/路由可见性）                |
| super_admin  | 走权限表，默认分配所有权限                   |
| refreshToken | 落库，支持强制下线/吊销                      |
| 审计日志     | 仅关键操作                                   |
| 组织维度     | 多租户 SaaS，共享数据库 + tenant_id 字段隔离 |
| 用户体系     | 移动端暂不做登录，先做后台 RBAC              |
| 初始角色     | 两级：super_admin + admin，后续按需加        |
| ID 策略      | BIGINT + Snowflake 雪花算法                  |
| 登录方式     | 租户编码 + 用户名 + 密码                     |

## 数据库 Schema

所有表均包含 `created_at`、`updated_at` 字段，所有 `id` 使用 BIGINT + Snowflake。

### tenants（租户/组织）

| 字段       | 类型      | 说明         |
| ---------- | --------- | ------------ |
| id         | bigint    | Snowflake ID |
| code       | varchar   | 租户唯一编码 |
| name       | varchar   | 租户名称     |
| created_at | timestamp |              |
| updated_at | timestamp |              |

### users（用户）

| 字段           | 类型       | 说明                                |
| -------------- | ---------- | ----------------------------------- |
| id             | bigint     | Snowflake ID                        |
| tenant_id      | bigint     | FK → tenants.id                     |
| name           | varchar    | 用户名（tenant_id + name 联合唯一） |
| password_hash  | varchar    | bcrypt 哈希                         |
| role           | varchar    | super_admin / admin                 |
| status         | smallint   | 0=禁用, 1=正常, 2=锁定              |
| login_attempts | int        | 密码错误次数，默认0                 |
| locked_at      | timestamp? | 锁定时间                            |
| created_at     | timestamp  |                                     |
| updated_at     | timestamp  |                                     |

### refresh_tokens

| 字段       | 类型       | 说明                 |
| ---------- | ---------- | -------------------- |
| id         | bigint     | Snowflake ID         |
| user_id    | bigint     | FK → users.id        |
| token_hash | varchar    | refreshToken 的 hash |
| expires_at | timestamp  | 过期时间             |
| revoked_at | timestamp? | 吊销时间             |
| created_at | timestamp  |                      |
| updated_at | timestamp  |                      |

### permissions（权限定义）

| 字段       | 类型      | 说明         |
| ---------- | --------- | ------------ |
| id         | bigint    | Snowflake ID |
| name       | varchar   | 权限标识     |
| created_at | timestamp |              |
| updated_at | timestamp |              |

预置权限：dashboard, buildings, rooms, tenants_mgmt, fees, users, roles

### role_permissions（角色-权限映射）

| 字段          | 类型      | 说明                |
| ------------- | --------- | ------------------- |
| id            | bigint    | Snowflake ID        |
| role          | varchar   | 角色名              |
| permission_id | bigint    | FK → permissions.id |
| tenant_id     | bigint    | FK → tenants.id     |
| created_at    | timestamp |                     |
| updated_at    | timestamp |                     |

### audit_logs（审计日志）

| 字段        | 类型      | 说明                         |
| ----------- | --------- | ---------------------------- |
| id          | bigint    | Snowflake ID                 |
| tenant_id   | bigint?   | 归属租户                     |
| user_id     | bigint?   | 操作人                       |
| action      | varchar   | 操作类型                     |
| target_type | varchar   | 目标实体类型                 |
| target_id   | bigint?   | 目标实体 ID                  |
| metadata    | jsonb     | 额外信息（IP、修改前后值等） |
| created_at  | timestamp |                              |

审计操作范围：login, login_failed, logout, user_created, user_updated, user_deleted, permission_changed, building_deleted, room_deleted, tenant_created

### 业务表

buildings, floors, rooms, room_tenants, monthly_fees 结构与移动端 `apps/app/src/types/rental.ts` 对齐，所有业务表带 `tenant_id` 用于多租户隔离。

## 认证流程

### 登录

```
POST /auth/login (code + name + password)
  → 通过 code 查 tenants 表定位 tenant_id
  → 通过 tenant_id + name 查 users 表
  → 检查 status：0=拒绝登录, 2=返回"账号已锁定"
  → 校验密码
    → 失败：login_attempts + 1，达到阈值(5次)则 status=2, locked_at=now()
    → 成功：login_attempts 归零，签发 accessToken(15min) + refreshToken(7d)
  → refreshToken hash 后存入 refresh_tokens 表
  → 记录审计日志(login)
  → 返回 { accessToken, refreshToken, user }
```

### Token 刷新

```
POST /auth/refresh (refreshToken)
  → hash 后查 refresh_tokens 表
  → 校验：未吊销、未过期
  → 旧 token 标记 revoked_at=now()
  → 签发新 accessToken + refreshToken（轮换）
  → 返回 { accessToken, refreshToken }
```

### 登出

```
POST /auth/logout (需登录)
  → 吊销当前 refreshToken
  → 记录审计日志(logout)
```

### accessToken payload

```json
{ "sub": "userId", "tenantId": "xxx", "role": "admin" }
```

### 锁定解除

super_admin 可手动解锁（status 改回 1，login_attempts 归零）。

## 权限模型与鉴权

### 后端鉴权（NestJS Guard）

```
请求进入
  → JwtAuthGuard：校验 accessToken，提取 userId/tenantId/role
  → PermissionGuard：读取路由上的 @RequirePermission('buildings') 装饰器
    → 查 role_permissions 表判断当前 role + tenantId 是否有该权限
    → 无权限返回 403
```

### 前台鉴权（React）

- 登录成功后请求 `GET /auth/permissions` 获取当前用户的权限列表
- 存入 Zustand，控制侧边栏菜单渲染
- `<PermissionRoute>` 组件包裹路由，无权限重定向到 403 页面

### 多租户数据过滤

- NestJS 中间件从 JWT 提取 tenantId 挂到请求上下文
- 封装 Drizzle 查询工具函数，所有业务查询自动注入 `WHERE tenant_id = ?`

## 后端目录结构（apps/server）

```
src/
  main.ts
  app.module.ts
  common/
    guards/
      jwt-auth.guard.ts
      permission.guard.ts
    decorators/
      require-permission.decorator.ts
      public.decorator.ts
    middleware/
      tenant-context.middleware.ts
    utils/
      snowflake.ts
  modules/
    auth/
    users/
    permissions/
    audit/
    buildings/
    rooms/
    tenants-mgmt/
    fees/
  db/
    schema.ts
    index.ts
    seed.ts
  drizzle.config.ts
```

### 种子数据（seed.ts）

- 创建默认租户（code: default）
- 创建 super_admin 用户（预设密码）
- 插入全量 permissions 记录
- 为 super_admin 插入全量 role_permissions

## 后台前端目录结构（apps/admin）

```
src/
  routes/
    __root.tsx
    _auth.tsx
    _auth/
      dashboard.tsx
      buildings.tsx
      rooms.tsx
      tenants.tsx
      fees.tsx
      users.tsx
      permissions.tsx
      audit-logs.tsx
    login.tsx
  stores/
    auth.ts
  api/
    request.ts          # axios 封装（token 注入、401 自动刷新）
    auth.ts
    buildings.ts
    ...
  components/
    permission-route.tsx
    sidebar.tsx
```

### request.ts（Axios 封装）

- 请求拦截器：自动注入 Authorization header
- 响应拦截器：401 时自动用 refreshToken 刷新，重试原请求，刷新失败跳登录页

## 共享 Schema（packages/schema）

```
packages/schema/
  package.json          # name: "@rent-app/schema"
  src/
    auth.ts
    user.ts
    building.ts
    room.ts
    tenant.ts
    fee.ts
    permission.ts
    common.ts
    index.ts
  tsconfig.json
```

apps/server 和 apps/admin 均依赖 `@rent-app/schema: workspace:*`，前后端共用 Zod schema 做数据校验。
