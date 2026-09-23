# 培训管理系统 · 交接运维文档

> **用途**：本文件是「凡碧诗培训管理系统」的完整交接文档。接手方（AI 或开发者）读完本文件即可独立运维整个系统。
> **最后更新**：2026-09-23
> **维护要求**：任何代码/数据/配置变更后，**必须同步更新本文件** + 记录到 WorkBuddy 记忆。

---

## 〇、接手须知（先读这一段）

### 这套系统的本质
一个**单机 SQLite 数据库 + 无框架 Node 服务 + 单页前端**的轻量培训管理系统。没有云数据库、没有 ORM、没有构建流程。所有"魔法"都在明面上。

### 三个必须理解的设计
1. **数据有两份，代码只有一份**
   - 代码：本地改 → `git push` → GitHub Actions 自动部署到云端
   - 数据：`training.db` **不走 git**，本地和云端各存一份，需**手动同步**（见第七章）
   - ⚠️ 结论：**只在一端操作数据**（建议本地），改完再同步。两端都改会产生冲突。

2. **改数据不用改代码**
   日常运营（建账号、建培训记录、审批）直接在网页界面上做，不需要碰代码，也不会触发部署。

3. **前端是单文件 5164 行的 IIFE**
   `js/app.js` 禁止拆分、禁止重组（历史上有过拆分失败）。只允许**追加**。

### 凭据在哪
| 凭据 | 位置 |
|---|---|
| 云端 SSH 密码 | `config.local.json` → `server_pass` |
| GitHub Token | `config.local.json` → `github_token` |
| 企微应用密钥 | `config.local.json` → `wecom.{corpId,agentId,secret,callbackToken,encodingAESKey}` |
| DeepSeek API Key | `config.local.json` → `deepseek_api_key` |
| 系统登录账号 | 见第九章 |

`config.local.json` **已在 .gitignore 中，不提交 git**。本文件不写明文凭据。

---

## 一、系统概览

| 项目 | 值 |
|---|---|
| 名称 | 凡碧诗培训管理系统（FAITHPITT Training System） |
| 本地路径 | `C:\Users\PC\Desktop\培训系统\` |
| 云端地址 | http://47.96.158.178:3000 （阿里云 ECS，Ubuntu，root） |
| 云端路径 | `/root/training-system/` |
| 代码仓库 | `git@github.com:hjb0118/faithpitt-training-system.git`（HTTPS 被墙，必须用 SSH） |
| 前端版本号 | v32（显示在页面页脚） |
| 服务管理 | PM2，应用名 `training-system` |
| 运行环境 | Node.js v22.22.2 / better-sqlite3 |

---

## 二、技术架构

```
┌─────────────── 前端（浏览器） ───────────────┐
│ index.html  (495行)  单页结构 + 各功能页容器  │
│ css/main.css (1482行) 设计系统/响应式/打印     │
│ js/app.js   (5164行) 全部前端逻辑（IIFE 闭包）│
│ js/icons.js (48行)   SVG 图标库 → window.ICONS│
└──────────────────┬───────────────────────────┘
                   │ fetch → /api (JSON, Bearer Token)
┌──────────────────▼───────────────────────────┐
│ server.js (1861行)  Node 原生 http（无 Express）│
│  · 认证鉴权 / 限流 / 状态机 / 全部 API         │
│  · 静态文件服务 / 附件上传下载 / 定时任务       │
├──────────────────────────────────────────────┤
│ db-adapter.js (266行)  兼容层                  │
│  · readData()  读全量数据（含中文字段名）      │
│  · safeWrite() 全量写回（核心！见下）          │
├──────────────────────────────────────────────┤
│ db.js (693行)  SQLite 数据层                   │
│  · 建表 / CRUD / FIELD_MAP 中英字段映射        │
├──────────────────────────────────────────────┤
│ training.db  SQLite（WAL 模式）                │
├──────────────────────────────────────────────┤
│ wechat_notify.js (127行)  企业微信 Webhook 通知│
└──────────────────────────────────────────────┘
```

### 数据读写模型（最关键的机制）

```javascript
// 读：一次性读全库 → 内存对象（字段名是中文，如 r['员工']、r['状态']）
var db = readData();

// 改：修改内存对象
db.records[i]['状态'] = '已通过';

// 写：全量写回数据库（不是增量更新！）
safeWrite(db);
```

- `safeWrite()` 是**全量同步**：把内存里的 records/users/depts/notifications/settings/budgets/nextId 全部写回
- **例外**：操作日志 `addLog()` 直接写 SQLite，不经过 safeWrite
- **陷阱**：忘了调用 `safeWrite()` = 数据不持久化（历史上出过致命 Bug，见第十三章）

---

## 三、文件清单

### 核心代码

| 文件 | 行数 | 说明 | 是否入 git |
|---|---|---|---|
| `server.js` | 1861 | 后端主文件，所有 API + 定时任务 | ✅ |
| `index.html` | 495 | 前端页面结构 | ✅ |
| `css/main.css` | 1482 | 全部样式 | ✅ |
| `js/app.js` | 5164 | 全部前端逻辑（**禁止拆分**） | ✅ |
| `js/icons.js` | 48 | SVG 图标 | ✅ |
| `db.js` | 693 | SQLite 数据层 | ✅ |
| `db-adapter.js` | 266 | 兼容层（readData/safeWrite） | ✅ |
| `wechat_notify.js` | 127 | 企微通知 + 15 类消息模板 | ✅ |
| `package.json` | - | 唯一依赖：better-sqlite3 | ✅ |
| `.github/workflows/deploy.yml` | 44 | CI/CD 自动部署 | ✅ |
| `PROJECT_CONTEXT.md` | - | **本文件** | ✅ |

### 数据与配置（不入 git）

| 文件 | 说明 |
|---|---|
| `training.db` | SQLite 主数据库（含 WAL/SHM 伴生文件） |
| `config.local.json` | 本地配置（凭据），**云端目前缺失**（见第八章） |
| `tokens.json` | 登录 Token 缓存（重启可重建） |
| `uploads/` | 附件存储目录（随机文件名） |
| `backups/` | 自动/手动备份（JSON 格式） |
| `error.log` | 前端错误上报日志 |

### 辅助脚本

| 文件 | 说明 |
|---|---|
| `sync_to_server.py` | 手动同步脚本（代码 + uploads 到云端） |
| `migrate.js` / `migrate_cloud.js` | 历史迁移脚本（data.json → SQLite，已用完，可保留参考） |
| `运行部署.bat` | Windows 一键启动 |

### 目录
`backups/`、`css/`、`js/`、`node_modules/`、`uploads/`、`.git/`、`.github/`

---

## 四、数据库结构

### 表清单（截至 2026-09-23 实际行数）

| 表 | 行数 | 说明 |
|---|---|---|
| `records` | 49 | 培训记录（主表） |
| `users` | 34 | 用户账号 |
| `logs` | 347 | 操作日志 |
| `reminders` | 60 | 提醒记录 |
| `files` | 10 | 附件 |
| `depts` | 5 | 部门 |
| `evaluations` | 1 | 评价（历史遗留表） |
| `notifications` | 1 | 站内通知 |
| `settings` | 1 | 系统设置（含企微 Webhook 配置） |
| `budgets` | 0 | 预算（预留，未启用） |
| `id_counters` | 1 | ID 自增计数器 |

### records 主表字段（36 列）

```sql
records(
  id TEXT PRIMARY KEY,        -- 记录ID，格式 R+数字（R1、R64…）
  employee TEXT,              -- 员工姓名
  dept TEXT,                  -- 部门
  level TEXT,                 -- 职级
  project TEXT,               -- 培训项目
  institution TEXT,           -- 培训机构
  type TEXT,                  -- 培训类型
  train_date TEXT,            -- 培训日期
  cost REAL,                  -- 费用
  location TEXT,              -- 地点
  goal TEXT,                  -- 学习目标
  output TEXT,                -- 承诺产出
  status TEXT DEFAULT '待审批', -- 状态
  hr_note TEXT,               -- HR备注（驳回原因也放这里）
  summary TEXT,               -- 总结内容
  action_plan TEXT,           -- 行动计划
  metrics TEXT,               -- 可衡量指标
  exec_30d TEXT,              -- 30天执行情况
  visit_date TEXT,            -- 回访日期
  visit_detail TEXT,          -- 回访详情
  eval_score TEXT,            -- 90天评估分数
  eval_date TEXT,             -- 评估日期
  eval_comment TEXT,          -- 评估意见
  recommend TEXT,             -- 推荐程度
  created_at TEXT,            -- 创建时间
  operator TEXT,              -- 操作人
  pre_score TEXT,             -- 培训前评分
  post_score TEXT,            -- 培训后评分
  review_date TEXT,           -- 评审日期
  reviewer TEXT,              -- 评审人
  review_score TEXT,          -- 评审分数（已弃用）   --+
  review_comment TEXT,        -- 评审意见（已弃用）     | 评审简化为
  review_tag TEXT,            -- 评审标签（已弃用）     | 只保留通过/退回
  self_eval_30d TEXT,         -- 30天自评内容         |
  self_eval_date TEXT,        -- 自评提交日期          |
  self_eval_90d TEXT,         -- 90天复盘内容          |
  self_eval_90d_date TEXT     -- 90天复盘日期         --+
)
```

### 其他表

```sql
files(id, record_id FK, name, saved, size, time)      -- 附件（一对多）
reminders(id, record_id FK, type, date, time, hr)     -- 提醒（一对多）
evaluations(id, record_id FK UNIQUE, score, tag, comment, evaluator, time)
users(username PK, password, name, role, dept)        -- role: 'hr' | 'employee'
logs(id, time, operator, action, detail)
notifications(id, to, message, time, read)            -- 注意：key 是 id
depts(name PK)
settings(key PK, value)                               -- 企微 Webhook 存在这
budgets(id, year, dept, amount)
id_counters(name PK, value)
```

### ⚠️ 中文字段映射机制（新手最容易踩的坑）

- **数据库列名是英文**，但 **server.js 和 app.js 里用的全是中文字段名**
- `db.js` 里的 `FIELD_MAP` 负责自动转换：`'员工'→'employee'`、`'培训项目'→'project'`、`'状态'→'status'`
- 所以：
  - 写 Node 脚本直接查 SQLite → 用**英文列名**（`SELECT employee, status FROM records`）
  - 调 API 或在 server.js 里 → 用**中文字段名**（`r['员工']`、`data.data['状态']`）
- **新增字段时**：必须在 `db.js` 的 FIELD_MAP 和建表语句两处同步添加

---

## 五、API 接口

### 通用约定

- 端点：`/api`（`/api/v1` 也兼容）
- POST：JSON body，`{action: "xxx", ...参数}`，带 `Authorization: Bearer <token>` 头
- GET：`/api?action=xxx&参数`，同样需要 Bearer 头
- 返回：统一 `{ok: true/false, msg?, data?}`
- Token：64 位 hex，**存内存 + tokens.json**，有效期 24h，每次请求自动续期

### 完整 action 列表（35 个）

**公开接口（无需登录）**

| action | 方法 | 说明 |
|---|---|---|
| `checkFirst` | GET | 检查是否首次使用（无任何用户） |
| `login` | POST | 登录，返回 token（**有 IP 限流 + 账号锁定**） |
| `register` | POST | 首次注册管理员（仅当用户表为空） |

**认证相关**

| action | 方法 | 说明 |
|---|---|---|
| `logout` | POST | 登出（删除 token） |
| `checkAuth` | GET | 校验 token 并返回当前用户信息 |
| `changePwd` | POST | 改自己的密码（需验证旧密码） |

**培训记录**

| action | 方法 | 说明 | 权限 |
|---|---|---|---|
| `getRecords` | GET | 获取记录（员工只返回自己的） | 两者 |
| `addRecord` | POST | 新增记录（员工只能给自己提交） | 两者 |
| `updateRecord` | POST | 更新记录（含状态流转校验） | 两者（字段权限不同） |
| `batchUpdate` | POST | 批量改状态/备注/部门/职级 | HR |
| `deleteRecord` | POST | 删除记录 | HR |
| `withdrawRecord` | POST | 员工撤回「待审批」申请 | 两者 |

**用户与部门**

| action | 方法 | 说明 | 权限 |
|---|---|---|---|
| `getUsers` | GET | 用户列表（**已过滤掉 password**） | HR |
| `addUser` | POST | 新增用户 | HR |
| `updateUser` | POST | 编辑用户（改名会自动同步记录里的员工名） | HR |
| `deleteUser` | POST | 删除用户（不能删自己） | HR |
| `resetPwd` | POST | 重置他人密码 | HR |
| `getDepts` | GET | 部门列表 | 两者 |
| `addDept` / `deleteDept` | POST | 部门增删 | HR |

**通知与日志**

| action | 方法 | 说明 | 权限 |
|---|---|---|---|
| `getNotifications` | GET | 我的站内通知 | 两者 |
| `markRead` | POST | 标记已读 | 两者 |
| `addNotification` | POST | 手动发通知 | HR |
| `getLogs` | GET | 操作日志 | HR |
| `getReminders` | GET | 待办提醒（实时算，不查库） | 两者 |

**企微与 AI**

| action | 方法 | 说明 | 权限 |
|---|---|---|---|
| `getWebhook` | GET | 读企微 Webhook 配置 | HR |
| `saveWebhook` | POST | 存企微 Webhook（校验域名格式） | HR |
| `testWebhook` | POST | 发测试消息 | HR |
| `triggerNotify` | POST | 触发通知（HR 全部类型；员工仅 3 类提交事件） | 两者 |
| `urgeSummary` | POST | 一键催缴（总结/30天自评/90天复盘） | HR |
| `ai-assist-return-visit` | POST | AI 生成回访备注（调 DeepSeek） | HR |

**备份与同步**

| action | 方法 | 说明 | 权限 |
|---|---|---|---|
| `backup` | POST | 立即备份（JSON 存 backups/） | HR |
| `listBackups` | GET | 备份列表 | HR |
| `restoreBackup` | POST | 从备份恢复（会先自动备份当前数据） | HR |
| `deleteBackup` | POST | 删除备份 | HR |
| `pullFromCloud` | POST | **从云端拉取数据库覆盖本地**（见第八章） | HR |

**其他端点**

| 路径 | 方法 | 说明 |
|---|---|---|
| `/api/error-report` | POST | 前端错误上报（**无需认证**） |
| `/wecom_hook` | GET/POST | 企业微信消息回调（URL 验证 + 收消息） |
| `/wecom/callback` | GET | 企微 OAuth 登录回调 |
| `/uploads/<文件名>` | GET | 附件下载（需 Bearer 或 `?token=`） |

---

## 六、状态机（server.js VALID_TRANSITIONS）

```
待审批 ──→ 已通过 / 已驳回 / 学习中 / 已撤回
已驳回 ──→ 待审批
已撤回 ──→ 待审批
已通过 ──→ 学习中 / 总结已提交
学习中 ──→ 总结已提交
总结已提交 ──→ 待评审
待评审 ──→ 30天已回访 / 学习中（不合格打回）
30天已回访 ──→ 已完成
已完成 ──→ （终态，不可回退）
```

**设计意图**：强制走完整闭环，**不允许跳过任何环节**（2026-06-05 曾移除「已通过→已完成」等跳跃路径）。

**员工端额外限制**（server.js `updateRecord`）：

- 员工只能改这些字段：`总结内容`、`行动计划`、`可衡量指标`、`培训前评分`、`培训后评分`、`30天自评内容`、`自评提交日期`、`90天自评内容`、`90天自评日期`、`状态`
- 员工只能做这一个状态转换：`已通过`/`学习中` → `总结已提交`

---

## 七、安全机制

| 机制 | 参数 | 位置 |
|---|---|---|
| 密码哈希 | scrypt（`scrypt:salt:hash`），兼容旧 SHA256 自动升级 | server.js |
| 登录 IP 限流 | 10 次 / 15 分钟 | server.js `checkLoginRateLimit` |
| 账号锁定 | 单账号 5 次失败 → 锁 15 分钟 | server.js `LOGIN_LOCK` |
| API 限流 | 60 次 / 分钟 / IP | server.js `checkApiRateLimit` |
| Token | 64 位 hex，24h 有效，请求自动续期 | server.js `TOKENS` |
| CORS | 白名单（localhost / 127.0.0.1 / 云端 IP / 局域网 IP 自动探测） | server.js `ALLOWED_ORIGINS` |
| 路径穿越防护 | 上传与下载两处都校验 `startsWith` | server.js |
| 输入消毒 | `sanitize(str, maxLen)` 全字段覆盖 | server.js |
| 文件上传限制 | 白名单扩展名 + 单文件 ≤ 10MB | server.js |

**注意**：`LOGIN_LOCK` 和限流数据都是**内存存储**，服务重启即清空。频繁测试时容易被自己的限流误伤。

---

## 八、部署与同步

### 8.1 代码部署（自动）

```
本地 git push origin main
   ↓
GitHub Actions（.github/workflows/deploy.yml）
   ↓ appleboy/scp-action，凭据用 GitHub Secrets
   · SERVER_HOST / SERVER_USER / SERVER_PASS
   ↓ 同步文件：server.js, index.html, wechat_notify.js, db.js, db-adapter.js, css/, js/
   ↓
云端 pm2 restart training-system
```

⚠️ **deploy.yml 不包含 PROJECT_CONTEXT.md**，改文档不会自动上云（也没必要）。
⚠️ **deploy.yml 不同步数据库、附件、config.local.json**。

### 8.2 数据同步（手动）

**方向：本地 → 云端**（这是主流程）

```bash
# 1. 停本地服务，避免 WAL 数据丢失
taskkill /f /im node.exe

# 2. WAL checkpoint（把 WAL 合并进主库）
node -e "var db=require('./db');db.initDatabase();db.getDb().pragma('wal_checkpoint(TRUNCATE)');db.closeDatabase()"

# 3. SSH 上传
#    用 paramiko（注意：必须用装了 paramiko 的解释器，见 8.4）
python -c "
import paramiko, time
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.96.158.178', 22, 'root', '<见 config.local.json 的 server_pass>')
ssh.exec_command('pm2 stop training-system')[1].channel.recv_exit_status()
time.sleep(2)
sftp = ssh.open_sftp()
sftp.put(r'C:\Users\PC\Desktop\培训系统\training.db', '/root/training-system/training.db')
sftp.close()
for f in ['training.db-wal', 'training.db-shm']:
    ssh.exec_command('rm -f /root/training-system/' + f)
ssh.exec_command('pm2 restart training-system')[1].channel.recv_exit_status()
ssh.close()
"

# 4. 重启本地服务
node server.js
```

**关键顺序**：停服务 → checkpoint → 上传 → 清云端 WAL/SHM → 重启。搞错顺序会丢数据。

**方向：云端 → 本地**

用系统设置页的「⬇️ 拉取云端数据」按钮（`pullFromCloud` API），或在本地执行等价 Python 脚本反向下载。

### 8.3 附件同步

附件在 `uploads/`，**不随 git 走**。需手动上传（`sync_to_server.py` 包含此步）：
```bash
sftp.put('本地/uploads/*', '/root/training-system/uploads/')
```

### 8.4 云端环境现状与已知问题 ⚠️

| 项 | 状态 |
|---|---|
| 云端 `config.local.json` | ❌ **不存在** |
| 后果 | 云端企微密钥、DeepSeek Key 全为空 → 云端「AI 辅助回访备注」不可用；企微 OAuth 本来也因备案域名卡着 |
| 影响面 | 不影响核心功能（记录增删改查、审批、附件），只影响 AI 辅助 |
| 修复方法 | 把本地 `config.local.json` 上传到 `/root/training-system/`（**注意该文件含凭据，别提交到公开仓库**） |

| 项 | 状态 |
|---|---|
| Python + paramiko | 本地需要（用于同步脚本和 pullFromCloud） |
| 可用解释器 | `C:\Users\PC\.workbuddy\binaries\python\envs\default\Scripts\python.exe` |
| 注意 | **该环境可能被重置**，paramiko 消失时执行 `pip install paramiko` |

### 8.5 pullFromCloud 的实现要点（踩过坑）

`server.js` 中拉取云端数据的 Python 调用有特殊处理：

```javascript
// ❌ 不能这样：服务以重定向方式启动时，默认 pipe 创建管道会 EBUSY
spawnSync(pyExe, [tmpFile], { encoding: 'utf8' })

// ✅ 必须用文件句柄接管 stdio
var logFd = fs.openSync(logFile, 'w');
spawnSync(pyExe, [tmpFile], { stdio: ['ignore', logFd, logFd], timeout: 120000 });
```

同时 Python 解释器是**按优先级依次尝试**的：venv 路径 → 硬编码路径 → PATH 里的 `python`。

---

## 九、系统使用约定

### 9.1 登录账号

| 角色 | 账号 | 密码 |
|---|---|---|
| HR 管理员 | `HR` | `password123` |
| 员工 | 姓名（如 `徐楠`） | `123456` |
| 另一个 HR | `任奕晨` | `123456` |

### 9.2 分期培训的登记规范 ⭐

适用于「一期一期办、每期每人填一份」的培训（如「客涨价培训战营」）：

- **项目命名**：`培训名·第N期`，例 `客涨价培训战营·第1期`
  → 后续按项目名筛选即可汇总全部期次
- **粒度**：1 人 × 1 期 = 1 条记录
- **初始状态**：`已通过`（表示已批准参加，等待填内容）
- **课堂一页纸 → 系统字段映射**：

| 一页纸栏目 | 系统字段 |
|---|---|
| 01 部门 | 部门 |
| 02 姓名 | 员工 |
| 03 三大学习启发 | 总结内容 |
| 04 三大计划落地 | 行动计划 |
| 05 三大其他问题 | 可衡量指标 |

- **内容录入**二选一：
  - 方案A（推荐）：HR 批量建记录 → 员工登录自助填写 → 提交
  - 方案B：HR 在「所有记录」页用「📥导入」批量导入 Excel

**已办期次**

| 期次 | 日期 | 人数 | 记录 ID |
|---|---|---|---|
| 客涨价培训战营·第1期 | 2026-09-23 | 17 | R48 ~ R64 |

---

## 十、当前数据现状（截至 2026-09-23）

- **用户**：34 个账号
- **培训记录**：49 条，最新 ID `R64`
- **记录状态分布**：已通过 42、30天已回访 6、已完成 1
- **操作日志**：347 条｜**附件**：10 个｜**部门**：5 个

### 用户名单（按部门）

| 部门 | 用户 |
|---|---|
| CEO | 任奕晨 |
| 人才运营中心 | 贺京博(HR)、Allen、金媛阳（账号名 `金阳阳`） |
| 品牌营销中心 | 黄艳艳、冯青青、王佳佳、齐小曼 |
| 类直营中心 | 刘国翠、任文婷、武聪聪、何茹柳、赵琳珊、董曼曼、赵佳宝、张俊卿、要兵、胡鹏利、邵文渊、上官常乐、戈恒基、张慧娟、张园园、吴桂雪、张磊、陈洋 |
| 用户增长中心 | 徐楠、付苏恒、王慧英、曹振、雨鑫 |
| 财务管控中心 | 郝华 |
| 测试（可清理） | test_1780020352625、auto_test_1780020402778 |

> 注意：`金媛阳` 的登录账号是 `金阳阳`（username 与 name 不一致），按姓名匹配时不要搞错。

---

## 十一、运维手册（常见操作）

### 11.1 本地启动服务

```bash
cd C:\Users\PC\Desktop\培训系统
node server.js      # 或双击 运行部署.bat
# 访问 http://localhost:3000
```
开机自启：Windows 任务计划程序（`启用开机自启.bat`）。云端由 PM2 托管。

### 11.2 批量创建账号 / 批量建记录

写临时 Node 脚本调 API（**用完即删**）：

```javascript
var http = require('http');
function apiPost(body, token) {
  return new Promise(function(r) {
    var d = JSON.stringify(body);
    var h = {'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)};
    if (token) h['Authorization'] = 'Bearer ' + token;
    var req = http.request({hostname:'127.0.0.1',port:3000,path:'/api',method:'POST',headers:h},
      function(res){var b='';res.on('data',function(c){b+=c});res.on('end',function(){r(JSON.parse(b))})});
    req.end(d);
  });
}
// 1) 登录拿 token  2) 循环调用 addUser / addRecord
```

**要点**：
- 用 `127.0.0.1` 而非 `localhost`（避免 IPv6 解析问题）
- 字段名用**中文**（`'员工'`、`'培训项目'`、`'状态'`）
- 建账号默认 `password: '123456'`、`role: 'employee'`

### 11.3 改代码的标准流程

```bash
# 1. 先备份（改 3+ 文件或改现有功能时）
# 2. 先读文件，再改
# 3. 本地测试：node --check xxx.js 语法检查 + 启动服务实测
# 4. 提交推送（自动部署到云端）
git add 具体文件 && git commit -m "描述" && git push origin main
# 5. 若涉及数据变更 → 手动同步数据库（见 8.2）
# 6. 更新文档：PROJECT_CONTEXT.md + WorkBuddy 记忆
```

### 11.4 备份与恢复

- **自动**：每天凌晨 3:00 全量备份到 `backups/`，自动保留最近 30 个
- **手动**：系统设置页「立即备份」；恢复同样在设置页操作（恢复前会自动备份当前数据）
- 备份是 JSON 格式（全量数据导出）

### 11.5 定时任务一览（server.js）

| 时间 | 任务 |
|---|---|
| 每天 03:00 | 自动备份 + 清理 30 个之外的旧备份 |
| 每天 09:00 | 提醒检查（总结/30天自评/90天复盘/HR待评审，多层级提醒 + 防重复发送） |
| 每小时 | 清理过期 Token 和限流记录 |

### 11.6 企微通知配置

系统设置页 → 通知设置 → 填群机器人 Webhook URL（必须 `https://qyapi.weixin.qq.com/cgi-bin/webhook/send` 开头）→ 测试 → 启用。
共 15 类通知模板（新申请/审批通过/驳回/总结提交/待评审/催缴/到期提醒/逾期提醒等），定义在 `wechat_notify.js`。

---

## 十二、技术陷阱（血泪教训，务必逐条看）

### 12.1 前端

1. **骨架屏会替换整个 DOM** → `hideSkeleton()` 恢复 DOM 后，**必须重新绑定事件监听**。
   历史上两次事故：用户管理页按钮全失效、所有记录页按钮全失效（修法：抽出 `bindXxxPageEvents()` 函数，在 `hideSkeleton` 后调用）。
2. **员工端「我的记录」卡死在加载中** → 原因是 `showSkeleton` 后访问了不存在的元素抛异常，导致 `renderMy()` 永不执行。修法：Tab 样式代码移入 `renderMy()` 内部（在 hideSkeleton 之后）。
3. **IIFE 闭包内禁用 onclick 内联事件**，必须 `addEventListener`。
4. **改前端 ID 要同步改两边**：`index.html` 和 `js/app.js`。
5. **页面切换靠 `go(page)` + CSS `.pg.on`**，IIFE 内 `go()` 不挂全局。
6. **`js/app.js` 禁止拆分**（历史上拆分失败过）。只允许追加。

### 12.2 后端

7. **`safeWrite()` 是唯一持久化出口**——忘调用 = 数据丢失。历史上出过致命 Bug：server.js 自己定义了一个空的 `safeWrite` 覆盖了 db-adapter 的正确版本，导致所有写入不持久化。**改这块务必警惕**。
8. **`addLog()` 是例外**，直接写 SQLite，不走 safeWrite。
9. **`nextId`** 在 `readData()` 中返回数字（不是对象）。
10. **附件下载必须流式**：`fs.createReadStream(fpath).pipe(res)` + `Content-Length` 头。用 `res.end(fs.readFileSync())` 会导致大文件（>30MB）下载损坏。
11. **SQLite 是 WAL 模式**：同步数据库前必须 `wal_checkpoint(TRUNCATE)`，否则丢数据。
12. **`spawnSync` 默认 pipe 在重定向启动的服务里会 EBUSY**，必须用文件句柄接管 stdio（见 8.5）。
13. **登录 IP 限流**（10次/15分钟）会伪装成「用户名或密码错误」，调试时别被骗；重启服务可清除。

### 12.3 部署

14. **HTTPS 连 GitHub 被墙**，必须用 SSH（`git@github.com:...`）。
15. **GitHub Push Protection 会拦截含明文 Token 的提交**——文档里不要粘贴真实的 Personal Access Token，否则 push 直接被拒（历史踩过）。
16. **deploy.yml 不同步数据库/附件/配置**，这三样必须手动传。

---

## 十三、版本时间线

| 日期 | 版本 | 主要内容 |
|---|---|---|
| 2026-04-11 | - | 安全加固：删明文密码、SHA256→scrypt、登录失败锁定、局域网 CORS |
| 2026-04-13 | - | 待处理卡片、员工登录提示、我的培训 Tab+倒计时、自动备份、各部门完成率看板 |
| 2026-04-15 | - | 信息对称（驳回原因可见/查看总结）、回访详情弹窗、备份恢复系统、一键报告、归档、移动端响应式 |
| 2026-04-17 | v24 | 代码审计：弹窗函数修复、企微通知补全 6 类、XSS 防护增强 |
| 2026-04-23 | v25 | 品牌色改黄绿色系、CSS 变量体系重建、企微 https bug 修复、培训报告四层架构重构 |
| 2026-04-24 | - | 全面审计、评审弹窗简化（只留通过/退回） |
| 2026-05-27 | v28~v30 | 数据看板增强、移动端优化、icons.js 独立、Toast 队列、骨架屏、空状态、Excel 导入 |
| 2026-05-28 | v31~v32 | **SQLite 迁移**、部门排名/ROI 热力图/趋势预测、API 限流/版本化、错误监控、日志导出。**修复 safeWrite 空操作致命 Bug** |
| 2026-05-29 | - | 删 15 个无用文件、全系统测试通过、training.db 移出 git、SSH 远程地址 |
| 2026-06-03 | - | 审查修复（wechat 改用 settings 表、deploy.yml 补文件）、用户管理按钮失效修复 |
| 2026-06-05 | - | 全面审查 + 31 项功能测试；**密钥外部化到 config.local.json**；状态机收紧；系统设置页加「云端数据同步」；骨架屏 Bug 两连修 |
| 2026-08-24 | - | **修复大附件下载损坏**（改流式传输 + Content-Length） |
| 2026-09-23 | - | 修复 pullFromCloud 的 EBUSY；建立「分期培训」登记规范；「客涨价培训战营·第1期」建档 17 人 |

---

## 十四、已知问题与待办

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| 1 | 云端缺 `config.local.json` | 云端 AI 辅助回访不可用 | 上传该文件到云端（注意含凭据） |
| 2 | 本地 `nul` 残留文件（48B） | 无（Windows 保留设备名，删不掉） | 在资源管理器用 `\\?\` 前缀删除，或忽略 |
| 3 | 环境重置会丢 paramiko | 同步脚本和 pullFromCloud 失效 | 重装 `pip install paramiko` |
| 4 | `tokens.json` 明文存 Token | 低风险（本机文件） | 无需处理 |
| 5 | 数据库双份、需手动同步 | 两端都改会冲突 | 约定只在一端操作数据 |
| 6 | 测试账号 2 个（`__TEST__`） | 数据噪音 | 可删除 |
| 7 | `budgets` 表为空、`evaluations` 表仅 1 行 | 功能已弃用 | 保留不影响 |
| 8 | 企微 OAuth 深度集成 | 卡 ICP 备案域名 | 需公司备案域名解析到 47.96.158.178 |
| 9 | `review_score/review_comment/review_tag` 字段已弃用 | 无 | 保留兼容历史数据 |

---

## 十五、给接手方的一句话总结

> 这是一个**改数据靠页面、改代码靠 git push、同步数据靠手动**的轻量系统。
> 改动前先读文件，改完先本地验证，推代码会自动上云，但**数据要记得手动同步**。
> 遇到"数据没变"先想 WAL 和 safeWrite；遇到"按钮没反应"先想骨架屏和事件绑定。
