# 培训管理系统 - 项目全景文档

> 本文档是培训管理系统的技术全景文档。任何AI或开发者接手此项目时，阅读此文件即可快速了解系统全貌。
> 最后更新：2026-06-05

---

## 一、系统概览

- **项目名称**：凡碧诗培训管理系统（FAITHPITT Training System）
- **本地路径**：`C:\Users\PC\Desktop\培训系统\`
- **云端地址**：`http://47.96.158.178:3000`（阿里云ECS）
- **云端路径**：`/root/training-system/`
- **GitHub仓库**：`git@github.com:hjb0118/faithpitt-training-system.git`
- **管理员账号**：HR / password123
- **当前版本**：v32

---

## 二、技术架构

```
前端：单文件SPA（index.html + css/main.css + js/app.js + js/icons.js）
后端：Node.js 原生 http 模块（server.js，约1500行，无 Express）
数据库：SQLite（better-sqlite3），db.js(数据层) + db-adapter.js(兼容层)
部署：git push → GitHub Actions → SCP + pm2 restart
同步：paramiko SSH直传（数据库文件不走git）
```

---

## 三、文件清单

| 文件 | 说明 | 行数 |
|------|------|------|
| `server.js` | 后端主文件，原生http，含认证/限流/状态机/所有API | ~1500 |
| `index.html` | 前端页面，SPA结构 | ~490 |
| `css/main.css` | 样式，设计系统/响应式/打印/骨架屏/日历 | ~1483 |
| `js/app.js` | 前端逻辑，IIFE闭包，**禁止拆分** | ~5100 |
| `js/icons.js` | SVG图标库（Lucide风格），通过window.ICONS引用 | ~48 |
| `db.js` | SQLite数据层，表结构/CRUD/字段映射/迁移 | ~694 |
| `db-adapter.js` | 兼容层，readData()/safeWrite()，server.js通过此层访问数据 | ~262 |
| `wechat_notify.js` | 企业微信Webhook通知，从SQLite读写配置 | ~130 |
| `package.json` | 依赖：better-sqlite3 ^12.10.0 | 5 |
| `config.local.json` | 本地配置（GitHub token + 服务器密码），**不提交git** | - |
| `tokens.json` | 企微OAuth token缓存，**不提交git** | - |
| `training.db` | SQLite数据库，**不提交git** | - |
| `sync_to_server.py` | 手动同步脚本（paramiko），同步代码+uploads到云端 | ~203 |
| `migrate.js` | data.json → training.db 本地迁移脚本 | - |
| `migrate_cloud.js` | 云端专用迁移脚本 | - |
| `.github/workflows/deploy.yml` | CI/CD：push到main自动SCP部署 | ~44 |
| `运行部署.bat` | Windows一键启动脚本 | - |
| `PROJECT_CONTEXT.md` | 本文件，项目全景文档 | - |

---

## 四、数据库结构（SQLite）

### 表结构

```sql
-- 培训记录表（主表）
records(
  id TEXT PRIMARY KEY,
  employee TEXT,      -- 员工
  dept TEXT,          -- 部门
  level TEXT,         -- 职级
  project TEXT,       -- 培训项目
  institution TEXT,   -- 培训机构
  type TEXT,          -- 培训类型
  train_date TEXT,    -- 培训日期
  cost REAL,          -- 费用
  location TEXT,      -- 地点
  goal TEXT,          -- 学习目标
  output TEXT,        -- 承诺产出
  status TEXT DEFAULT '待审批',  -- 状态
  hr_note TEXT,       -- HR备注
  summary TEXT,       -- 总结内容
  action_plan TEXT,   -- 行动计划
  metrics TEXT,       -- 可衡量指标
  exec_30d TEXT,      -- 30天执行
  visit_date TEXT,    -- 回访日期
  visit_detail TEXT,  -- 回访详情
  eval_score TEXT,    -- 评估分数
  eval_date TEXT,     -- 评估日期
  eval_comment TEXT,  -- 评估意见
  recommend TEXT,     -- 推荐程度
  created_at TEXT,    -- 创建时间
  operator TEXT,      -- 操作人
  pre_score TEXT,     -- 培训前评分
  post_score TEXT,    -- 培训后评分
  review_date TEXT,   -- 评审日期
  reviewer TEXT,      -- 评审人
  review_score TEXT,  -- 评审分数
  review_comment TEXT,-- 评审意见
  review_tag TEXT,    -- 评审标签
  self_eval_30d TEXT, -- 30天自评内容
  self_eval_date TEXT,-- 自评提交日期
  self_eval_90d TEXT, -- 90天自评内容
  self_eval_90d_date TEXT, -- 90天自评日期
  archived INTEGER DEFAULT 0  -- 归档标记
)

-- 附件表（一对多）
files(id, record_id FK, name, saved, size, time)

-- 提醒表（一对多）
reminders(id, record_id FK, type, date, time, hr)

-- 评价表（一对一）
evaluations(id, record_id FK UNIQUE, score, tag, comment, evaluator, time)

-- 用户表
users(username PK, password, name, role, dept)

-- 其他表
logs(id, time, operator, action, detail)
notifications(key PK, value)
budgets(id, year, dept, amount)
depts(name PK)
settings(key PK, value)
id_counters(name PK, value)
```

### 中文字段映射

db.js中定义了FIELD_MAP映射表（中文字段名→英文列名），server.js中使用中文字段名，db层自动转换。
例如：`'员工'→'employee'`, `'培训项目'→'project'`, `'状态'→'status'`

---

## 五、API接口

### 认证机制

- POST `/api` body: `{action: "login", username, password}` → `{ok, token, user}`
- GET/POST `/api` 需 `Authorization: Bearer <token>` header
- Token：64位hex，存储在内存（重启失效）

### 主要接口

| 接口 | 方法 | 说明 | 权限 |
|------|------|------|------|
| login | POST | 登录 | 公开 |
| register | POST | 首次注册管理员 | 公开(首次) |
| checkFirst | GET | 检查是否首次使用 | 公开 |
| getRecords | GET | 获取培训记录 | 员工只看自己的 |
| addRecord | POST | 新增培训申请 | 员工只能给自己提交 |
| updateRecord | POST | 更新记录(含状态变更) | HR全部+员工提交总结 |
| getUsers | GET | 获取用户列表 | HR only |
| addUser | POST | 新增用户 | HR only |
| deleteUser | POST | 删除用户 | HR only |
| updateUser | POST | 编辑用户 | HR only |
| resetPwd | POST | 重置密码 | HR only |
| changePwd | POST | 修改自己的密码 | 已登录 |
| getDepts / addDept / deleteDept | GET/POST | 部门管理 | HR |
| getLogs | GET | 操作日志 | HR |
| getNotifications | GET | 通知 | 已登录 |
| getWebhookConfig / setWebhookConfig | GET/POST | 企微Webhook配置 | HR |

### 状态转换规则（server.js VALID_TRANSITIONS）

```
待审批 → 已通过 / 已驳回 / 学习中 / 已撤回
已通过 → 学习中 / 总结已提交 / 已完成
学习中 → 总结已提交 / 已完成
总结已提交 → 待评审 / 已完成
待评审 → 30天已回访 / 已完成 / 学习中
已完成 = 终态，不可回退
```

---

## 六、安全机制

- **密码哈希**：scrypt（`scrypt:salt:hash`格式），兼容旧SHA256自动升级
- **登录限流**：每IP 10次/15分钟，超限锁定15分钟
- **账号锁定**：单账号5次失败 → 锁定15分钟
- **API限流**：每IP 60次/分钟（内存存储，重启清除）
- **Token**：内存存储，重启失效
- **路径穿越防护**：上传文件路径校验
- **输入消毒**：sanitize()函数

---

## 七、部署与同步

### CI/CD（自动部署前端）

```bash
git add -A && git commit -m "msg" && git push origin main
# → GitHub Actions自动SCP部署：server.js, index.html, wechat_notify.js, db.js, db-adapter.js, css/, js/
# → pm2 restart training-system
```

**注意**：deploy.yml不同步数据库文件（training.db），需要手动上传。

### 手动同步数据库

```bash
# 方式1：运行sync_to_server.py（推荐，已配置好）
python sync_to_server.py

# 方式2：手动paramiko脚本
# 流程：停本地node → WAL checkpoint → SSH停云端pm2 → 上传training.db → 删云端WAL/SHM → 重启两端
```

**关键**：必须先停服务→checkpoint→上传→重启，否则WAL数据丢失。

### 云端SSH

- 地址：root@47.96.158.178
- 密码：REN01250099q
- PM2应用名：training-system

---

## 八、完整版本时间线

### 2026-04-11 安全加固
- 删除data.json根级别明文密码
- 密码哈希从SHA256升级为scrypt（异步，格式scrypt:salt:hash）
- 批量迁移9个用户哈希
- 登录失败锁定（5次/15分钟）
- 局域网CORS白名单

### 2026-04-13 体验优化（第15~16轮）
- HR首页：待处理快捷卡片（待审批/待提交总结/待30天回访/待90天评估）
- 员工登录后主动提示（绿色摘要卡片，8秒自动淡出）
- 我的培训Tab切换（待处理/已完成）+ 倒计时
- 自动定时备份（每天凌晨3点，保留30天）
- 开机自动启动（注册表HKCU\Run）
- 各部门完成率看板 + 日志日期范围筛选

### 2026-04-15 信息对称+操作效率（第17~19轮）
- 员工端：驳回原因可见、查看自己的总结
- HR端：30天回访详情弹窗、查看总结按钮
- 点击员工名跳转成长档案
- 审批/驳回弹窗内嵌历史（申请次数/完成率）
- 员工自助修改密码（需验证旧密码）
- 备份恢复系统（listBackups/restoreBackup/deleteBackup）
- 开机自启改为任务计划程序（更稳定）
- 一键培训报告导出
- 记录归档功能
- 手机端响应式优化（抽屉式侧边栏、表格卡片化）
- 附件预览增强

### 2026-04-17 代码审计修复（v24）
- 修复generateReport弹窗函数（openModal→openM）
- 修复doConfirm30Visit状态缺失
- 企业微信通知补全（6类通知）
- esc函数XSS防护增强（单引号转义）
- 全面XSS复查：全部安全

### 2026-04-23 品牌色+设计重构（v25）
- 品牌色从玫瑰粉改为黄绿色系（#CCEF7F/#96C93D）
- 重建CSS变量体系（主色/辅色/功能色/中性色/侧边栏）
- 统计卡片渐变装饰、内容卡片竖线、弹窗阴影升级
- 企微通知https bug修复（v22以来一直存在）
- 保存Webhook设置失败修复（相对路径→绝对路径）
- 提醒栏SVG显示修复（textContent→innerHTML）
- 按钮onclick ReferenceError修复（内联→addEventListener）
- 侧边栏光标重置修复（新增CURRENT_PAGE全局变量）
- 员工附件无法查看修复（token查询参数fallback）
- 培训报告重构：四层架构（概览→诊断→明细→建议）+ 闭环健康度评分

### 2026-04-24 全面审计（v24复查）
- 误删恢复（90天评估功能11个前端触点）
- triggerNotify权限校验、通知重复发送修复
- batchUpdate状态转换失败静默返回修复
- 多处字段sanitize补全
- 评审弹窗简化（去掉评分/评语/标签，只保留通过/退回）

### 2026-05-27 数据看板+大升级（v28~v30）
- v28：数据看板增强（时间范围筛选、统计卡片穿透、部门完成率进度条、ROI表格卡片化）+ 移动端适配
- v29：icons.js独立、移动端touch-action、表单实时校验、离线提示条、浮动快速提交按钮
- v30：Toast队列动画、骨架屏加载、空状态引导、Excel批量导入

### 2026-05-28 SQLite迁移+大升级（v31~v32）
- v31：SQLite迁移（db.js + db-adapter.js + migrate.js），从data.json迁移到SQLite
- v32：部门排名/ROI热力图/趋势预测、API限流/版本化、错误监控、日志导出、敏感操作二次确认
- safeWrite致命Bug修复：server.js有自己的safeWrite（空操作），覆盖了db-adapter的版本 → 重写为完整数据同步

### 2026-05-29 清理+修复
- 删除15个无用文件（13个.bak + data.json + deploy_all.py）
- 全系统测试：本地31/31通过，云端9/9通过
- Git修复：training.db从git移除，.gitignore更新
- 版本号页脚v26→v32
- SSH远程地址改为git@（HTTPS被墙）

### 2026-06-03 审查+修复
1. wechat_notify.js：从读写data.json改为使用db-adapter的settings表
2. deploy.yml：补充db.js/db-adapter.js到CI/CD同步列表
3. sync_to_server.py：补充db.js/db-adapter.js，去掉已不存在的data.json
4. app.js：清理未使用的origGo变量
5. 用户管理按钮无响应修复：showSkeleton替换DOM导致事件丢失 → bindUsersPageEvents()函数 + hideSkeleton恢复后重新调用

### 2026-06-03~04 批量操作
- 从导入.xlsx批量创建16个用户账号（类直营中心12人、用户增长中心3人、财务管控中心1人）
- 批量提交24人"高管领导力"培训申请（中恩教育，外部课程，2026-06-05，2980元，郑州）
- paramiko同步数据库到云端（停服务→WAL checkpoint→上传→重启）

### 2026-06-05 全面审查+修复
- 代码审查：逐文件审查server.js/db.js/db-adapter.js/wechat_notify.js/app.js/index.html/main.css
- 功能测试：31项模拟操作（HR端+员工端完整业务流程），28通过
- 修复：
  1. DeepSeek API Key硬编码 → 改为从config.local.json读取
  2. 企微密钥硬编码 → 改为从config.local.json读取
  3. 状态机"已通过→已完成"跳跃 → 移除，强制走完整闭环
  4. DATA_FILE死代码 → 删除
  5. fs_error冗余引用 → 删除

### 2026-06-05 系统功能增强
- 系统设置页新增"云端数据同步"：拉取云端数据按钮（pullFromCloud API，paramiko下载+热重载数据库）
- 骨架屏Bug两连修：所有记录页按钮失效（bindAllPageEvents）+ 员工端我的记录卡死（Tab样式移入renderMy）

### 2026-08-24 附件下载损坏修复
- 问题：大附件（33MB/181MB PPT）下载后文件损坏
- 根因：res.end(fs.readFileSync())一次性发送大文件被截断
- 修复：改用 fs.createReadStream().pipe(res) 流式传输 + Content-Length头
- 验证：下载字节数与磁盘完全一致

---

## 九、当前用户数据（截至2026-06-04）

共29个用户：

| 部门 | 用户 |
|------|------|
| CEO | 任奕晨（HR） |
| 人才运营中心 | 贺京博（HR）、Allen、金阳阳 |
| 品牌营销中心 | 黄艳艳、冯青青、王佳佳、齐小曼 |
| 类直营中心 | 刘国翠、任文婷、武聪聪、何茹柳、赵琳珊、董曼曼、赵佳宝、张俊卿、要兵、胡鹏利、邵文渊、上官常乐、戈恒基、张慧娟、张园园 |
| 用户增长中心 | 徐楠、付苏恒、王慧英 |
| 财务管控中心 | 郝华 |
| 测试 | test_1780020352625、auto_test_1780020402778 |

密码：HR=password123，其余=123456

---

## 十、技术陷阱与注意事项

### 必须遵守
- **app.js禁止拆分**：前端架构拆分失败过，保持单文件，禁止AI再拆
- **代码修改**：先备份再改，先读再改
- **同步铁律**：改完必须git push → CI/CD自动部署 → 手动同步数据库 → 记MEMORY.md

### 技术陷阱
- IIFE闭包内函数禁用onclick内联事件，必须addEventListener
- 前端ID修改必须同步index.html和app.js两边
- 页面导航通过go(page)函数+CSS .pg.on控制显示
- 骨架屏会替换DOM：hideSkeleton恢复后必须重新绑定事件监听器
- 登录IP限流（10次/15分钟）会导致频繁测试时误判为"用户名或密码错误"
- SQLite WAL模式：同步数据库时必须先checkpoint再上传
- safeWrite()是全量同步模式：readData()→内存修改→safeWrite(data)
- 日志(addLog)直接写SQLite不经过safeWrite
- nextId在readData()中返回数字（不是对象）
- deploy.yml不同步database文件，需手动paramiko上传

### 企微集成
- 群机器人Webhook：可用（不依赖域名）
- 深度集成（OAuth登录）：卡在ICP备案域名，需公司名下备案域名解析到47.96.158.178

---

## 十一、快速上手指南

### 本地启动
```bash
cd C:\Users\PC\Desktop\培训系统
node server.js
# 访问 http://localhost:3000
```

### 修改代码流程
```bash
# 1. 修改文件（先备份）
# 2. 本地测试
# 3. git push（自动部署前端+重启云端）
git add -A && git commit -m "描述" && git push origin main
# 4. 如有数据库变更，手动同步
python sync_to_server.py
```

### 批量操作模式
```javascript
// Node.js脚本：登录→获取token→批量API调用
// 参见项目中已有的batch_create_users.js / batch_apply.js写法
// 用完记得删除临时脚本
```

### Git凭据
- SSH：git@github.com:hjb0118/faithpitt-training-system.git
- HTTPS被墙，用SSH
- GitHub Token：存在config.local.json中（不提交git）
