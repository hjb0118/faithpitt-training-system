/**
 * 数据库适配层
 * 提供与原data.json相同的接口，但底层使用SQLite
 * 
 * 使用方式：
 *   const dbAdapter = require('./db-adapter');
 *   const db = dbAdapter.readData();  // 返回与原data.json相同格式的对象
 *   dbAdapter.safeWrite(db);          // 保存数据
 */

const db = require('./db');

// 初始化数据库
db.initDatabase();

/**
 * 读取数据（兼容原data.json格式）
 */
function readData() {
  try {
    const records = db.getAllRecords();
    const users = db.getAllUsers();
    const logs = db.getAllLogs();
    const depts = db.getDepts();
    const settings = db.getSettings();
    const budgets = db.getBudgets();
    
    // 获取通知（可能是数组或对象格式）
    const notifs = db.getNotifications();
    let notifications = [];
    if (notifs.notifications) {
      try { notifications = JSON.parse(notifs.notifications); } catch { notifications = []; }
    } else {
      notifications = Object.entries(notifs).map(([id, msg]) => ({ id, message: msg }));
    }
    
    // 获取nextId
    const idCounters = db.getDb().prepare('SELECT * FROM id_counters').all();
    const nextId = {};
    idCounters.forEach(r => { nextId[r.name] = r.value; });
    
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
    return { records: [], users: [], logs: [], notifications: [], depts: [], budgets: [], settings: {}, nextId: {} };
  }
}

/**
 * 保存数据（兼容原safeWrite接口）
 * 注意：SQLite是事务性的，不需要像JSON那样整体写入
 * 这个函数主要用于兼容旧代码，实际写入由各操作函数完成
 */
function safeWrite(data) {
  // SQLite已经自动保存，这个函数主要用于兼容旧代码
  // 如果需要批量更新，可以在这里实现
  return Promise.resolve();
}

/**
 * 添加日志
 */
function addLog(operator, action, detail) {
  const time = new Date().toLocaleString('zh-CN');
  db.addLog({ time, operator, action, detail: detail || '' });
}

/**
 * 获取数据库实例（用于高级操作）
 */
function getDb() {
  return db;
}

/**
 * 关闭数据库连接
 */
function close() {
  db.closeDatabase();
}

module.exports = {
  readData,
  safeWrite,
  addLog,
  getDb,
  close,
  
  // 直接暴露db的方法，方便使用
  getAllRecords: db.getAllRecords,
  getRecord: db.getRecord,
  insertRecord: db.insertRecord,
  updateRecord: db.updateRecord,
  deleteRecord: db.deleteRecord,
  archiveRecord: db.archiveRecord,
  
  getAllUsers: db.getAllUsers,
  getUser: db.getUser,
  insertUser: db.insertUser,
  updateUser: db.updateUser,
  deleteUser: db.deleteUser,
  
  getAllLogs: db.getAllLogs,
  
  getNotifications: db.getNotifications,
  setNotification: db.setNotification,
  
  getBudgets: db.getBudgets,
  setBudget: db.setBudget,
  
  getDepts: db.getDepts,
  addDept: db.addDept,
  deleteDept: db.deleteDept,
  
  getSettings: db.getSettings,
  setSetting: db.setSetting,
  
  getNextId: db.getNextId
};
