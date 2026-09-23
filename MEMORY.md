# MEMORY.md · 凡碧诗培训管理系统 · AI 总记忆

> **用途**：任何 AI / 开发者开新会话，先读本文件即可 5 分钟内掌握全貌。
> 详细运维手册（逐条操作步骤、踩坑记录）见 `PROJECT_CONTEXT.md`；逐日变更见 `logs/`。
> **维护规则**：每次代码/数据/配置变更后必须 ①检查 ②部署 ③写 `logs/YYYY-MM-DD.md` 当天日志 ④更新本文件与 PROJECT_CONTEXT.md。

---

## 一、系统一句话
统计员工参加**外部培训**的轻量管理系统：申请 → 审批 → 学习总结 → 30天回访 → 90天评估 的四阶段闭环，带企业微信通知、AI 辅助（DeepSeek）、数据看板与报表。
技术形态：**单机 SQLite + 无框架 Node 原生 http + 单页前端**，无 ORM、无构建流程，所有逻辑都在明面上。

## 二、技术架构

```
前端（浏览器）
  index.html (495行)   单页结构
  css/main.css (1482行) 设计系统（黄绿 #CCEF7F 品牌色）
  js/app.js (5163行)    全部前端逻辑（IIFE 闭包，⚠️禁止拆分只允许追加）
  js/icons.js           SVG 图标库
        │ fetch → /api  (JSON + Bearer Token)
后端（Node 原生 http，无 Express）
  server.js (≈1870行)   全部 API / 认证鉴权 / 限流 / 状态机 / 定时任务 / 企微回调
  db-adapter.js         兼容层：readData() 读全量 → safeWrite() 全量写回
  db.js                 SQLite 数据层（better-sqlite3，WAL 模式）+ FIELD_MAP 中英字段映射
  wechat_notify.js      企微群机器人 Webhook + 20+ 消息模板
  training.db           SQLite 主库（不进 git，本地/云端各一份需手动同步）
```

## 三、核心机制（改代码前必读，都是踩过坑的）

1. **中英字段映射**：DB 列名英文、代码里字段名中文（`r['员工']`、`r['状态']`），靠 db.js 的 `FIELD_MAP` 自动转换。直接查 SQLite 用英文列名；调 API/改 server.js 用中文字段名。新增字段要同时改 FIELD_MAP 和建表语句。
2. **持久化只有一条路**：`readData()` 读全量到内存 → 改对象 → `safeWrite(data)` 全量写回。**忘调 safeWrite = 数据丢失**（出过致命事故）。例外：`addLog()` 直接写 SQLite。
3. **SQLite 是 WAL 模式**：同步/拷贝 training.db 前必须先停服务再 `wal_checkpoint(TRUNCATE)`，**两个方向都是**——最新数据常在 `training.db-wal` 里，只拷主库文件会拿到旧快照（pullFromCloud 曾因此"拉不到"新数据，已修为下载前先远程 checkpoint）。
4. **状态机白名单**（server.js `VALID_TRANSITIONS`）：待审批→已通过/已驳回/学习中/已撤回→…→已完成（终态），不允许跳环节；员工只能做 已通过/学习中→总结已提交。
5. **骨架屏会替换整个 DOM**：`hideSkeleton()` 后必须重新绑定事件（`bindUsersPageEvents()` / `bindAllPageEvents()`），历史上按钮失效事故 x2。
6. **js/app.js 禁止拆分**（拆分失败过），只允许追加；IIFE 内禁用 onclick 内联事件，用 addEventListener。
7. **附件下载必须流式**（createReadStream + Content-Length），readFileSync 大文件会损坏。
8. **改前端 ID 要同步改两边**：index.html 和 js/app.js。
9. **静态文件白名单**（2026-09-23 加）：只公开 index.html / css/ / js/，其余路径 404——别改成全放行，会泄露 config.local.json、training.db。

## 四、关键文件速查

| 文件 | 说明 | 进 git |
|---|---|---|
| server.js | 后端全部 API + 定时任务（每天03:00备份、09:00提醒、每小时清Token） | ✅ |
| db.js / db-adapter.js | SQLite 层 / 兼容层 | ✅ |
| index.html / js/app.js / js/icons.js / css/main.css | 前端全部 | ✅ |
| wechat_notify.js | 企微通知模板 | ✅ |
| PROJECT_CONTEXT.md | 详细运维手册（交接文档） | ✅ |
| MEMORY.md（本文件） | AI 总记忆入口 | ✅ |
| logs/ | 每日工作日志 | ✅ |
| training.db / config.local.json / tokens.json / uploads/ / backups/ | 数据与凭据 | ❌ |
| sync_to_server.py | 本地→云端同步工具（密码读 config.local.json） | ✅ |
| .github/workflows/deploy.yml | push main 自动部署云端 | ✅ |

## 五、部署与数据同步（两套体系，别混）

- **代码**：`git push origin main` → GitHub Actions 自动 scp 到云端 → `pm2 restart training-system`。deploy.yml 只同步 server.js、index.html、wechat_notify.js、db.js、db-adapter.js、css/、js/。
- **数据**：training.db 不进 git，**手动同步**（本地→云端为主）：停服务 → WAL checkpoint → 上传 → 删云端 -wal/-shm → 重启。云端→本地用系统设置页「拉取云端数据」。**只在一端改数据**。
- **凭据**：`config.local.json`（不进 git）：`server_pass`（云服务器密码）、`github_token`、`wecom.{corpId,agentId,secret,callbackToken,encodingAESKey}`、`deepseek_api_key`。⚠️ 云端目前缺此文件。
- **本地启动**：`C:\Users\PC\.workbuddy\binaries\node\versions\22.22.2-3\node.exe server.js`（必须 Node 22，默认 node v24 与 better-sqlite3 不匹配会报错）。云端 PM2 托管，地址 http://47.96.158.178:3000。

## 六、账号

| 角色 | 账号 | 密码 |
|---|---|---|
| HR 管理员 | `HR` | `password123` |
| 另一 HR | `任奕晨` | `123456` |
| 员工 | 姓名（如 `徐楠`） | `123456` |

注意：`金媛阳` 的登录账号是 `金阳阳`（username≠name），按姓名匹配别搞错。

## 七、状态快照（2026-09-23）

- 培训记录 24 条（ID 区间 R1~R64，nextId=65）：已通过 16 / 学习中 1（张磊 R52，总结已退回待修改，总结 946 字在库）/ 30天已回访 6 / 已完成 1
- 2026-09-23 数据操作：①全部员工账号密码统一重置为 `123456`（`HR`/`任奕晨` 两个 HR 账号不动）②删除「高管领导力」培训 25 条（原 R19~R42、R47）③已同步云端，云端旧库备份 `backups/cloud_before_push_2026-09-23.db`
- 用户 34（含 2 个测试号）｜部门 5：人才运营中心、品牌营销中心、用户增长中心、类直营中心、财务管控中心
- 前端版本 v32｜最近业务：客涨价培训战营·第1期（2026-09-23，17 人，R48~R64，项目命名 `培训名·第N期` 规范）

## 八、已知问题摘要（全表见 PROJECT_CONTEXT.md 第十四章）

- **【紧急】服务器 root 密码曾明文进 git 历史 → 必须轮换**，换完更新 config.local.json 和 GitHub Secrets
- Excel 批量导入记录失效（前端 POST `/api/apply`，服务端无此端点）；`运行部署.bat` 引用不存在的 deploy_all.py
- 企微 OAuth 卡 ICP 备案域名；云端缺 config.local.json（AI 辅助不可用）

## 九、变更日志索引

- [2026-09-23](logs/2026-09-23.md) 全量代码审查；安全加固 3 项（静态文件任意下载 / register 越权 / SSH 密码硬编码）；环境修复（Node 22）；建立 MEMORY.md + logs/ 日志制度；数据操作（员工密码统一 123456、删「高管领导力」25 条并同步云端）；bug 修复 x2（状态机缺评审退回路径、pullFromCloud 不做云端 WAL checkpoint）+ 张磊 R52 退回 + 两端数据归一；新功能「退回后编辑重新提交」（Playwright 11/11 通过）

## 十、标准工作流（每次改代码照做）

1. **检查**：`node --check xxx.js` + 本地用 Node 22 启动实测关键路径
2. **部署**：`git add 具体文件 && git commit && git push origin main`（自动上云）→ 用 `curl http://47.96.158.178:3000/...` 确认云端生效
3. **日志**：写/追加 `logs/YYYY-MM-DD.md`，标明改了什么、怎么验证的、遗留什么
4. **记忆**：更新本文件（架构/状态有变时）与 PROJECT_CONTEXT.md（文档要求强制同步）
5. 涉及数据变更时：手动同步 training.db（见第五章），同步前先备份云端库
6. ⚠️ **两端数据会分叉（员工直接在云端操作！）**：任何"本地→云端"覆盖之前，必须先拉取云端数据比对、确认没有本地没有的变更，否则会覆盖丢失云端新数据（2026-09-23 张磊的 946 字总结差点被覆盖）
7. ⚠️ 批量调 API 注意 **60 次/分钟限流**，分批执行；被限流的响应是 `{ok:false,msg:'请求过于频繁'}`，验证结果时别被 `data||[]` 兜底误导。PowerShell 发含中文的 JSON 必须显式 UTF-8 编码（否则用户名乱码误报"用户不存在"）
