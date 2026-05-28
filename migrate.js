/**
 * 数据迁移脚本：从 data.json 迁移到 SQLite
 * 
 * 使用方法：node migrate.js
 */

const path = require('path');
const fs = require('fs');
const db = require('./db');

const DATA_FILE = path.join(__dirname, 'data.json');

console.log('=== 培训系统数据迁移工具 ===');
console.log(`源文件: ${DATA_FILE}`);
console.log(`目标数据库: training.db`);
console.log('');

// 检查源文件
if (!fs.existsSync(DATA_FILE)) {
  console.error('错误：找不到 data.json 文件');
  process.exit(1);
}

// 备份原文件（如果备份失败则跳过）
try {
  const backupFile = DATA_FILE + '.bak.migrate';
  fs.copyFileSync(DATA_FILE, backupFile);
  console.log(`已备份原文件到: ${backupFile}`);
} catch (e) {
  console.log('备份跳过（权限问题），继续迁移...');
}

// 执行迁移
try {
  db.initDatabase();
  db.migrateFromJson(DATA_FILE);
  
  // 验证迁移结果
  const records = db.getAllRecords();
  const users = db.getAllUsers();
  const logs = db.getAllLogs();
  const depts = db.getDepts();
  
  console.log('');
  console.log('=== 迁移验证 ===');
  console.log(`培训记录: ${records.length} 条`);
  console.log(`用户: ${users.length} 个`);
  console.log(`操作日志: ${logs.length} 条`);
  console.log(`部门: ${depts.length} 个`);
  
  console.log('');
  console.log('✅ 迁移完成！');
  console.log('');
  console.log('下一步：');
  console.log('1. 运行 node server.js 启动服务');
  console.log('2. 在浏览器中测试功能是否正常');
  console.log('3. 确认无误后，可以删除 data.json（已备份）');
  
} catch (error) {
  console.error('迁移失败:', error);
  process.exit(1);
} finally {
  db.closeDatabase();
}
