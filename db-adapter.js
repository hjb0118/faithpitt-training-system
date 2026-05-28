/**
 * 数据库适配层
 * 提供与原data.json相同的接口，但底层使用SQLite
 *
 * 使用方式：
 *   const dbAdapter = require('./db-adapter');
 *   const data = dbAdapter.readData();  // 返回与原data.json相同格式的对象
 *   // ... 在内存中修改 data ...
 *   dbAdapter.safeWrite(data);          // 将内存中的修改持久化到SQLite
 */

const dbModule = require('./db');

// 初始化数据库
dbModule.initDatabase();

/**
 * 读取数据（兼容原data.json格式）
 * 
 * 重要：返回的是全新对象，修改后必须调用 safeWrite() 才能持久化！
 */
function readData() {
  try {
    const records = dbModule.getAllRecords();
    const users = dbModule.getAllUsers();
    const logs = dbModule.getAllLogs();
    const depts = dbModule.getDepts();
    const settings = dbModule.getSettings();
    const budgets = dbModule.getBudgets();

    // 获取通知（数组格式）
    const notifs = dbModule.getNotifications();
    let notifications = [];
    if (notifs.notifications) {
      try { notifications = JSON.parse(notifs.notifications); } catch { notifications = []; }
    } else {
      notifications = Object.entries(notifs).map(([id, msg]) => ({ id, message: msg }));
    }

    // 获取nextId（返回数字，兼容原data.json格式）
    const idCounters = dbModule.getDb().prepare('SELECT * FROM id_counters').all();
    let nextId = 10; // 默认值
    const nc = idCounters.find(r => r.name === 'next');
    if (nc) nextId = nc.value;
    // 如果id_counters为空，从现有记录推算
    if (!nc && records.length > 0) {
      var maxNum = 0;
      records.forEach(r => {
        var m = String(r.ID || '').match(/^R(\d+)$/);
        if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]);
      });
      if (maxNum > 0) nextId = maxNum + 1;
    }

    return {
      records: records,
      users: users,
      logs: logs,
      notifications: notifications,
      depts: depts,
      budgets: budgets,
      settings: settings,
      nextId: nextId
    };
  } catch (e) {
    console.error('[db-adapter] readData error:', e);
    return { records: [], users: [], logs: [], notifications: [], depts: [], budgets: [], settings: {}, nextId: 10 };
  }
}

/**
 * 保存数据到SQLite
 * 
 * server.js 的模式是：readData() → 内存修改 → safeWrite(data)
 * 这个函数负责把内存中的完整状态同步到SQLite
 * 
 * 注意：日志(addLog)已经直接写入SQLite，这里不需要处理
 */
function safeWrite(data) {
  try {
    var database = dbModule.getDb();

    database.transaction(function() {
      // === 1. 同步培训记录 ===
      // 获取DB中现有的非归档记录ID集合
      var existingRows = database.prepare('SELECT id, archived FROM records').all();
      var existingMap = {}; // id -> archived
      existingRows.forEach(function(r) { existingMap[r.id] = r.archived; });
      var memoryIds = {};

      (data.records || []).forEach(function(record) {
        var id = record.ID;
        if (!id) return;
        memoryIds[id] = true;
        var dbRecord = dbModule.toDbRecord(record);

        if (existingMap.hasOwnProperty(id)) {
          // 更新现有记录
          var fields = Object.entries(dbRecord).filter(function(kv) { return kv[0] !== 'id'; });
          if (fields.length > 0) {
            var setClause = fields.map(function(kv) { return kv[0] + ' = ?'; }).join(', ');
            var values = fields.map(function(kv) { return kv[1] != null ? kv[1] : ''; });
            database.prepare('UPDATE records SET ' + setClause + ' WHERE id = ?').run(values.concat([id]));
          }
        } else {
          // 插入新记录
          var cols = Object.keys(dbRecord);
          var placeholders = cols.map(function() { return '?'; }).join(', ');
          var insertValues = cols.map(function(c) { return dbRecord[c] != null ? dbRecord[c] : ''; });
          database.prepare('INSERT INTO records (' + cols.join(', ') + ') VALUES (' + placeholders + ')').run(insertValues);
        }

        // 同步附件（先删后插）
        database.prepare('DELETE FROM files WHERE record_id = ?').run(id);
        if (record._files && record._files.length > 0) {
          var fstmt = database.prepare('INSERT INTO files (record_id, name, saved, size, time) VALUES (?, ?, ?, ?, ?)');
          record._files.forEach(function(f) { fstmt.run(id, f.name, f.saved, f.size || 0, f.time); });
        }

        // 同步提醒（先删后插）
        database.prepare('DELETE FROM reminders WHERE record_id = ?').run(id);
        if (record._reminders && record._reminders.length > 0) {
          var rstmt = database.prepare('INSERT INTO reminders (record_id, type, date, time, hr) VALUES (?, ?, ?, ?, ?)');
          record._reminders.forEach(function(r) { rstmt.run(id, r.type, r.date, r.time, r.hr || ''); });
        }

        // 同步评价（先删后插）
        database.prepare('DELETE FROM evaluations WHERE record_id = ?').run(id);
        if (record._eval) {
          var e = record._eval;
          database.prepare('INSERT INTO evaluations (record_id, score, tag, comment, evaluator, time) VALUES (?, ?, ?, ?, ?, ?)').run(
            id, e.score || 0, e.tag || '', e.comment || '', e.evaluator || '', e.time || ''
          );
        }
      });

      // 删除内存中不存在的非归档记录（被deleteRecord操作删除的）
      existingRows.forEach(function(r) {
        if (!memoryIds[r.id] && !r.archived) {
          database.prepare('DELETE FROM records WHERE id = ?').run(r.id);
        }
      });

      // === 2. 同步用户 ===
      database.prepare('DELETE FROM users').run();
      if (data.users && data.users.length > 0) {
        var ustmt = database.prepare('INSERT INTO users (username, password, name, role, dept) VALUES (?, ?, ?, ?, ?)');
        data.users.forEach(function(u) {
          ustmt.run(u.username, u.password, u.name, u.role || 'employee', u.dept || '');
        });
      }

      // === 3. 同步部门 ===
      database.prepare('DELETE FROM depts').run();
      if (data.depts && data.depts.length > 0) {
        var dstmt = database.prepare('INSERT OR IGNORE INTO depts (name) VALUES (?)');
        data.depts.forEach(function(d) { dstmt.run(d); });
      }

      // === 4. 同步通知 ===
      database.prepare('DELETE FROM notifications').run();
      if (data.notifications) {
        var nstmt = database.prepare('INSERT INTO notifications (key, value) VALUES (?, ?)');
        if (Array.isArray(data.notifications)) {
          nstmt.run('notifications', JSON.stringify(data.notifications));
        } else {
          Object.entries(data.notifications).forEach(function(kv) {
            nstmt.run(kv[0], typeof kv[1] === 'object' ? JSON.stringify(kv[1]) : String(kv[1]));
          });
        }
      }

      // === 5. 同步设置 ===
      database.prepare('DELETE FROM settings').run();
      if (data.settings) {
        var sstmt = database.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        Object.entries(data.settings).forEach(function(kv) {
          sstmt.run(kv[0], typeof kv[1] === 'object' ? JSON.stringify(kv[1]) : String(kv[1]));
        });
      }

      // === 6. 同步预算 ===
      database.prepare('DELETE FROM budgets').run();
      if (data.budgets && data.budgets.length > 0) {
        var bstmt = database.prepare('INSERT INTO budgets (year, dept, amount) VALUES (?, ?, ?)');
        data.budgets.forEach(function(b) { bstmt.run(b.year, b.dept, b.amount); });
      }

      // === 7. 同步nextId ===
      var nextVal = typeof data.nextId === 'number' ? data.nextId : 10;
      database.prepare('DELETE FROM id_counters').run();
      database.prepare('INSERT INTO id_counters (name, value) VALUES (?, ?)').run('next', nextVal);

      // 注意：日志(addLog)已直接写入SQLite，不需要在这里同步
    })();

  } catch (e) {
    console.error('[db-adapter] safeWrite error:', e);
  }
}

/**
 * 添加日志（直接写入SQLite）
 */
function addLog(operator, action, detail) {
  var time = new Date().toLocaleString('zh-CN');
  dbModule.addLog({ time: time, operator: operator, action: action, detail: detail || '' });
}

/**
 * 获取数据库模块（用于高级操作）
 */
function getDb() {
  return dbModule;
}

/**
 * 关闭数据库连接
 */
function close() {
  dbModule.closeDatabase();
}

module.exports = {
  readData: readData,
  safeWrite: safeWrite,
  addLog: addLog,
  getDb: getDb,
  close: close,

  // 直接暴露db的方法，方便使用
  getAllRecords: dbModule.getAllRecords,
  getRecord: dbModule.getRecord,
  insertRecord: dbModule.insertRecord,
  updateRecord: dbModule.updateRecord,
  deleteRecord: dbModule.deleteRecord,
  archiveRecord: dbModule.archiveRecord,

  getAllUsers: dbModule.getAllUsers,
  getUser: dbModule.getUser,
  insertUser: dbModule.insertUser,
  updateUser: dbModule.updateUser,
  deleteUser: dbModule.deleteUser,

  getAllLogs: dbModule.getAllLogs,

  getNotifications: dbModule.getNotifications,
  setNotification: dbModule.setNotification,

  getBudgets: dbModule.getBudgets,
  setBudget: dbModule.setBudget,

  getDepts: dbModule.getDepts,
  addDept: dbModule.addDept,
  deleteDept: dbModule.deleteDept,

  getSettings: dbModule.getSettings,
  setSetting: dbModule.setSetting,

  getNextId: dbModule.getNextId
};
