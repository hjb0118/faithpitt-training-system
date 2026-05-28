/**
 * 数据库模块 - SQLite 数据访问层
 * 使用 better-sqlite3 实现高性能本地数据库
 * 
 * 注意：SQLite列名使用英文，通过映射表与中文字段名转换
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, 'training.db');

// 数据库实例（单例）
let db = null;

// 中文字段名 -> 英文列名映射
const FIELD_MAP = {
  'ID': 'id',
  '员工': 'employee',
  '部门': 'dept',
  '职级': 'level',
  '培训项目': 'project',
  '培训机构': 'institution',
  '培训类型': 'type',
  '培训日期': 'train_date',
  '费用': 'cost',
  '地点': 'location',
  '学习目标': 'goal',
  '承诺产出': 'output',
  '状态': 'status',
  'HR备注': 'hr_note',
  '总结内容': 'summary',
  '行动计划': 'action_plan',
  '可衡量指标': 'metrics',
  '30天执行': 'exec_30d',
  '回访日期': 'visit_date',
  '回访详情': 'visit_detail',
  '评估分数': 'eval_score',
  '评估日期': 'eval_date',
  '评估意见': 'eval_comment',
  '推荐程度': 'recommend',
  'createdAt': 'created_at',
  '_operator': 'operator',
  '培训前评分': 'pre_score',
  '培训后评分': 'post_score',
  '评审日期': 'review_date',
  '评审人': 'reviewer',
  '评审分数': 'review_score',
  '评审意见': 'review_comment',
  '评审标签': 'review_tag',
  '30天自评内容': 'self_eval_30d',
  '自评提交日期': 'self_eval_date',
  '90天自评内容': 'self_eval_90d',
  '90天自评日期': 'self_eval_90d_date'
};

// 反向映射：英文列名 -> 中文字段名
const REVERSE_MAP = {};
Object.entries(FIELD_MAP).forEach(([cn, en]) => { REVERSE_MAP[en] = cn; });

/**
 * 将中文字段的记录转换为英文列名
 * 只转换已知字段，忽略未知字段
 */
function toDbRecord(record) {
  const result = {};
  Object.entries(record).forEach(([key, val]) => {
    // 跳过关联数据
    if (key === '_files' || key === '_reminders' || key === '_eval') return;
    // 只转换映射表中的字段
    if (FIELD_MAP.hasOwnProperty(key)) {
      result[FIELD_MAP[key]] = val;
    }
  });
  return result;
}

/**
 * 将英文列名的记录转换为中文字段
 */
function fromDbRecord(row) {
  if (!row) return null;
  const result = {};
  Object.entries(row).forEach(([col, val]) => {
    const cn = REVERSE_MAP[col] || col;
    result[cn] = val;
  });
  return result;
}

/**
 * 初始化数据库连接
 */
function initDatabase() {
  if (db) return db;
  
  db = new Database(DB_FILE, { verbose: null });
  
  // 启用 WAL 模式（更好的并发性能）
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  
  // 创建表结构
  createTables();
  
  return db;
}

/**
 * 创建所有数据表
 */
function createTables() {
  db.exec(`
    -- 培训记录表
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      employee TEXT NOT NULL,
      dept TEXT NOT NULL,
      level TEXT DEFAULT '',
      project TEXT NOT NULL,
      institution TEXT DEFAULT '',
      type TEXT DEFAULT '',
      train_date TEXT NOT NULL,
      cost REAL DEFAULT 0,
      location TEXT DEFAULT '',
      goal TEXT DEFAULT '',
      output TEXT DEFAULT '',
      status TEXT DEFAULT '待审批',
      hr_note TEXT DEFAULT '',
      summary TEXT DEFAULT '',
      action_plan TEXT DEFAULT '',
      metrics TEXT DEFAULT '',
      exec_30d TEXT DEFAULT '',
      visit_date TEXT DEFAULT '',
      visit_detail TEXT DEFAULT '',
      eval_score TEXT DEFAULT '',
      eval_date TEXT DEFAULT '',
      eval_comment TEXT DEFAULT '',
      recommend TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      operator TEXT DEFAULT '',
      pre_score TEXT DEFAULT '',
      post_score TEXT DEFAULT '',
      review_date TEXT DEFAULT '',
      reviewer TEXT DEFAULT '',
      review_score TEXT DEFAULT '',
      review_comment TEXT DEFAULT '',
      review_tag TEXT DEFAULT '',
      self_eval_30d TEXT DEFAULT '',
      self_eval_date TEXT DEFAULT '',
      self_eval_90d TEXT DEFAULT '',
      self_eval_90d_date TEXT DEFAULT '',
      archived INTEGER DEFAULT 0
    );

    -- 附件表（一对多）
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      name TEXT NOT NULL,
      saved TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      time TEXT NOT NULL,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    );

    -- 提醒表（一对多）
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      hr TEXT DEFAULT '',
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    );

    -- 评价表（一对一）
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL UNIQUE,
      score INTEGER DEFAULT 0,
      tag TEXT DEFAULT '',
      comment TEXT DEFAULT '',
      evaluator TEXT DEFAULT '',
      time TEXT DEFAULT '',
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    );

    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'employee',
      dept TEXT DEFAULT ''
    );

    -- 操作日志表
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      operator TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT DEFAULT ''
    );

    -- 通知设置表
    CREATE TABLE IF NOT EXISTS notifications (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- 预算表
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      dept TEXT NOT NULL,
      amount REAL DEFAULT 0,
      UNIQUE(year, dept)
    );

    -- 部门表
    CREATE TABLE IF NOT EXISTS depts (
      name TEXT PRIMARY KEY
    );

    -- 系统设置表
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- ID计数器表
    CREATE TABLE IF NOT EXISTS id_counters (
      name TEXT PRIMARY KEY,
      value INTEGER DEFAULT 0
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_records_employee ON records(employee);
    CREATE INDEX IF NOT EXISTS idx_records_dept ON records(dept);
    CREATE INDEX IF NOT EXISTS idx_records_status ON records(status);
    CREATE INDEX IF NOT EXISTS idx_records_date ON records(train_date);
    CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(time);
    CREATE INDEX IF NOT EXISTS idx_files_record ON files(record_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_record ON reminders(record_id);
  `);
}

/**
 * 获取数据库实例
 */
function getDb() {
  if (!db) initDatabase();
  return db;
}

/**
 * 关闭数据库连接
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// ==================== 记录操作 ====================

/**
 * 获取所有记录（含附件、提醒、评价）
 */
function getAllRecords() {
  const db = getDb();
  
  const rows = db.prepare('SELECT * FROM records WHERE archived = 0 ORDER BY created_at DESC').all();
  
  // 批量加载关联数据
  const filesMap = new Map();
  const remindersMap = new Map();
  const evalsMap = new Map();
  
  const files = db.prepare('SELECT * FROM files').all();
  files.forEach(f => {
    if (!filesMap.has(f.record_id)) filesMap.set(f.record_id, []);
    filesMap.get(f.record_id).push({ name: f.name, saved: f.saved, size: f.size, time: f.time });
  });
  
  const reminders = db.prepare('SELECT * FROM reminders').all();
  reminders.forEach(r => {
    if (!remindersMap.has(r.record_id)) remindersMap.set(r.record_id, []);
    remindersMap.get(r.record_id).push({ type: r.type, date: r.date, time: r.time, hr: r.hr });
  });
  
  const evals = db.prepare('SELECT * FROM evaluations').all();
  evals.forEach(e => {
    evalsMap.set(e.record_id, { score: e.score, tag: e.tag, comment: e.comment, evaluator: e.evaluator, time: e.time });
  });
  
  // 组装数据
  return rows.map(row => {
    const record = fromDbRecord(row);
    record._files = filesMap.get(row.id) || [];
    record._reminders = remindersMap.get(row.id) || [];
    const evalData = evalsMap.get(row.id);
    if (evalData) record._eval = evalData;
    return record;
  });
}

/**
 * 获取单条记录
 */
function getRecord(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
  if (!row) return null;
  
  const record = fromDbRecord(row);
  record._files = db.prepare('SELECT * FROM files WHERE record_id = ?').all(id).map(f => ({
    name: f.name, saved: f.saved, size: f.size, time: f.time
  }));
  
  record._reminders = db.prepare('SELECT * FROM reminders WHERE record_id = ?').all(id).map(r => ({
    type: r.type, date: r.date, time: r.time, hr: r.hr
  }));
  
  const evalData = db.prepare('SELECT * FROM evaluations WHERE record_id = ?').get(id);
  if (evalData) record._eval = { score: evalData.score, tag: evalData.tag, comment: evalData.comment, evaluator: evalData.evaluator, time: evalData.time };
  
  return record;
}

/**
 * 插入记录
 */
function insertRecord(record) {
  const db = getDb();
  const dbRecord = toDbRecord(record);
  
  const cols = Object.keys(dbRecord);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map(c => dbRecord[c] ?? '');
  
  const stmt = db.prepare(`INSERT INTO records (${cols.join(', ')}) VALUES (${placeholders})`);
  stmt.run(...values);
  
  // 插入附件
  if (record._files && record._files.length > 0) {
    const fileStmt = db.prepare('INSERT INTO files (record_id, name, saved, size, time) VALUES (?, ?, ?, ?, ?)');
    record._files.forEach(f => fileStmt.run(record.ID, f.name, f.saved, f.size, f.time));
  }
  
  // 插入提醒
  if (record._reminders && record._reminders.length > 0) {
    const remStmt = db.prepare('INSERT INTO reminders (record_id, type, date, time, hr) VALUES (?, ?, ?, ?, ?)');
    record._reminders.forEach(r => remStmt.run(record.ID, r.type, r.date, r.time, r.hr || ''));
  }
  
  // 插入评价
  if (record._eval) {
    const evalStmt = db.prepare('INSERT INTO evaluations (record_id, score, tag, comment, evaluator, time) VALUES (?, ?, ?, ?, ?, ?)');
    evalStmt.run(record.ID, record._eval.score || 0, record._eval.tag || '', record._eval.comment || '', record._eval.evaluator || '', record._eval.time || '');
  }
  
  return record;
}

/**
 * 更新记录
 */
function updateRecord(id, updates) {
  const db = getDb();
  
  // 分离关联数据
  const { _files, _reminders, _eval, ...fields } = updates;
  
  // 转换为英文列名
  const dbUpdates = toDbRecord(fields);
  
  // 更新主表字段
  const fieldEntries = Object.entries(dbUpdates).filter(([k]) => k !== 'id');
  if (fieldEntries.length > 0) {
    const setClause = fieldEntries.map(([k]) => `${k} = ?`).join(', ');
    const values = fieldEntries.map(([, v]) => v ?? '');
    db.prepare(`UPDATE records SET ${setClause} WHERE id = ?`).run(...values, id);
  }
  
  // 更新附件（先删后插）
  if (_files !== undefined) {
    db.prepare('DELETE FROM files WHERE record_id = ?').run(id);
    if (_files && _files.length > 0) {
      const stmt = db.prepare('INSERT INTO files (record_id, name, saved, size, time) VALUES (?, ?, ?, ?, ?)');
      _files.forEach(f => stmt.run(id, f.name, f.saved, f.size, f.time));
    }
  }
  
  // 更新提醒
  if (_reminders !== undefined) {
    db.prepare('DELETE FROM reminders WHERE record_id = ?').run(id);
    if (_reminders && _reminders.length > 0) {
      const stmt = db.prepare('INSERT INTO reminders (record_id, type, date, time, hr) VALUES (?, ?, ?, ?, ?)');
      _reminders.forEach(r => stmt.run(id, r.type, r.date, r.time, r.hr || ''));
    }
  }
  
  // 更新评价
  if (_eval !== undefined) {
    db.prepare('DELETE FROM evaluations WHERE record_id = ?').run(id);
    if (_eval) {
      const stmt = db.prepare('INSERT INTO evaluations (record_id, score, tag, comment, evaluator, time) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run(id, _eval.score || 0, _eval.tag || '', _eval.comment || '', _eval.evaluator || '', _eval.time || '');
    }
  }
  
  return getRecord(id);
}

/**
 * 删除记录
 */
function deleteRecord(id) {
  const db = getDb();
  db.prepare('DELETE FROM records WHERE id = ?').run(id);
}

/**
 * 归档记录
 */
function archiveRecord(id) {
  const db = getDb();
  db.prepare('UPDATE records SET archived = 1 WHERE id = ?').run(id);
}

// ==================== 用户操作 ====================

function getAllUsers() {
  return getDb().prepare('SELECT * FROM users').all();
}

function getUser(username) {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function insertUser(user) {
  return getDb().prepare('INSERT INTO users (username, password, name, role, dept) VALUES (?, ?, ?, ?, ?)').run(
    user.username, user.password, user.name, user.role || 'employee', user.dept || ''
  );
}

function updateUser(username, updates) {
  const fields = Object.entries(updates).filter(([k]) => k !== 'username');
  if (fields.length === 0) return;
  const setClause = fields.map(([k]) => `${k} = ?`).join(', ');
  const values = fields.map(([, v]) => v);
  return getDb().prepare(`UPDATE users SET ${setClause} WHERE username = ?`).run(...values, username);
}

function deleteUser(username) {
  return getDb().prepare('DELETE FROM users WHERE username = ?').run(username);
}

// ==================== 日志操作 ====================

function getAllLogs() {
  return getDb().prepare('SELECT * FROM logs ORDER BY time DESC').all();
}

function addLog(log) {
  return getDb().prepare('INSERT INTO logs (time, operator, action, detail) VALUES (?, ?, ?, ?)').run(
    log.time, log.operator, log.action, log.detail || ''
  );
}

// ==================== 通知设置 ====================

function getNotifications() {
  const rows = getDb().prepare('SELECT * FROM notifications').all();
  const result = {};
  rows.forEach(r => { result[r.key] = r.value; });
  return result;
}

function setNotification(key, value) {
  return getDb().prepare('INSERT OR REPLACE INTO notifications (key, value) VALUES (?, ?)').run(key, value);
}

// ==================== 预算操作 ====================

function getBudgets() {
  return getDb().prepare('SELECT * FROM budgets ORDER BY year DESC, dept').all();
}

function setBudget(year, dept, amount) {
  return getDb().prepare('INSERT OR REPLACE INTO budgets (year, dept, amount) VALUES (?, ?, ?)').run(year, dept, amount);
}

// ==================== 部门操作 ====================

function getDepts() {
  return getDb().prepare('SELECT * FROM depts ORDER BY name').all().map(r => r.name);
}

function addDept(name) {
  return getDb().prepare('INSERT OR IGNORE INTO depts (name) VALUES (?)').run(name);
}

function deleteDept(name) {
  return getDb().prepare('DELETE FROM depts WHERE name = ?').run(name);
}

// ==================== 系统设置 ====================

function getSettings() {
  const rows = getDb().prepare('SELECT * FROM settings').all();
  const result = {};
  rows.forEach(r => {
    try { result[r.key] = JSON.parse(r.value); } catch { result[r.key] = r.value; }
  });
  return result;
}

function setSetting(key, value) {
  const v = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, v);
}

// ==================== ID计数器 ====================

function getNextId(prefix) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM id_counters WHERE name = ?').get(prefix);
  const next = row ? row.value + 1 : 1;
  db.prepare('INSERT OR REPLACE INTO id_counters (name, value) VALUES (?, ?)').run(prefix, next);
  return `${prefix}${next}`;
}

// ==================== 数据迁移 ====================

/**
 * 从 data.json 迁移到 SQLite
 */
function migrateFromJson(jsonPath) {
  const db = getDb();
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  const migrate = db.transaction(() => {
    // 迁移记录
    if (data.records && data.records.length > 0) {
      const fileStmt = db.prepare('INSERT INTO files (record_id, name, saved, size, time) VALUES (?, ?, ?, ?, ?)');
      const remStmt = db.prepare('INSERT INTO reminders (record_id, type, date, time, hr) VALUES (?, ?, ?, ?, ?)');
      const evalStmt = db.prepare('INSERT INTO evaluations (record_id, score, tag, comment, evaluator, time) VALUES (?, ?, ?, ?, ?, ?)');
      
      data.records.forEach(r => {
        const dbRecord = toDbRecord(r);
        const cols = Object.keys(dbRecord);
        const placeholders = cols.map(() => '?').join(', ');
        const values = cols.map(c => dbRecord[c] ?? '');
        
        db.prepare(`INSERT OR REPLACE INTO records (${cols.join(', ')}) VALUES (${placeholders})`).run(...values);
        
        if (r._files) {
          r._files.forEach(f => fileStmt.run(r.ID, f.name, f.saved, f.size, f.time));
        }
        
        if (r._reminders) {
          r._reminders.forEach(rem => remStmt.run(r.ID, rem.type, rem.date, rem.time, rem.hr || ''));
        }
        
        if (r._eval) {
          evalStmt.run(r.ID, r._eval.score || 0, r._eval.tag || '', r._eval.comment || '', r._eval.evaluator || '', r._eval.time || '');
        }
      });
      
      console.log(`迁移 ${data.records.length} 条培训记录`);
    }
    
    // 迁移用户
    if (data.users && data.users.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO users (username, password, name, role, dept) VALUES (?, ?, ?, ?, ?)');
      data.users.forEach(u => stmt.run(u.username, u.password, u.name, u.role || 'employee', u.dept || ''));
      console.log(`迁移 ${data.users.length} 个用户`);
    }
    
    // 迁移日志
    if (data.logs && data.logs.length > 0) {
      const stmt = db.prepare('INSERT INTO logs (time, operator, action, detail) VALUES (?, ?, ?, ?)');
      data.logs.forEach(l => stmt.run(l.time, l.operator, l.action, l.detail || ''));
      console.log(`迁移 ${data.logs.length} 条日志`);
    }
    
    // 迁移通知设置（可能是数组或对象）
    if (data.notifications) {
      const stmt = db.prepare('INSERT OR REPLACE INTO notifications (key, value) VALUES (?, ?)');
      if (Array.isArray(data.notifications)) {
        // 数组格式：直接存储为JSON
        stmt.run('notifications', JSON.stringify(data.notifications));
      } else {
        // 对象格式：逐个存储
        Object.entries(data.notifications).forEach(([k, v]) => stmt.run(k, typeof v === 'object' ? JSON.stringify(v) : String(v)));
      }
      console.log('迁移通知设置');
    }
    
    // 迁移预算
    if (data.budgets && data.budgets.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO budgets (year, dept, amount) VALUES (?, ?, ?)');
      data.budgets.forEach(b => stmt.run(b.year, b.dept, b.amount));
      console.log(`迁移 ${data.budgets.length} 条预算`);
    }
    
    // 迁移部门
    if (data.depts && data.depts.length > 0) {
      const stmt = db.prepare('INSERT OR IGNORE INTO depts (name) VALUES (?)');
      data.depts.forEach(d => stmt.run(d));
      console.log(`迁移 ${data.depts.length} 个部门`);
    }
    
    // 迁移设置
    if (data.settings) {
      const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      Object.entries(data.settings).forEach(([k, v]) => stmt.run(k, typeof v === 'object' ? JSON.stringify(v) : String(v)));
      console.log('迁移系统设置');
    }
    
    // 迁移ID计数器
    if (data.nextId) {
      Object.entries(data.nextId).forEach(([k, v]) => {
        db.prepare('INSERT OR REPLACE INTO id_counters (name, value) VALUES (?, ?)').run(k, v);
      });
      console.log('迁移ID计数器');
    }
  });
  
  migrate();
  console.log('数据迁移完成！');
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase,
  
  // 记录
  getAllRecords,
  getRecord,
  insertRecord,
  updateRecord,
  deleteRecord,
  archiveRecord,
  
  // 用户
  getAllUsers,
  getUser,
  insertUser,
  updateUser,
  deleteUser,
  
  // 日志
  getAllLogs,
  addLog,
  
  // 通知
  getNotifications,
  setNotification,
  
  // 预算
  getBudgets,
  setBudget,
  
  // 部门
  getDepts,
  addDept,
  deleteDept,
  
  // 设置
  getSettings,
  setSetting,
  
  // ID
  getNextId,
  
  // 迁移
  migrateFromJson,
  
  // 映射表（供server.js使用）
  FIELD_MAP,
  REVERSE_MAP,
  toDbRecord,
  fromDbRecord
};
