const db = require('./db');
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, 'data.json');

console.log('检查data.json...');
if (!fs.existsSync(DATA_FILE)) {
  console.error('data.json不存在！');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
console.log('data.json记录数:', data.records ? data.records.length : 0);

console.log('初始化数据库...');
db.initDatabase();

console.log('执行迁移...');
db.migrateFromJson(DATA_FILE);

const records = db.getAllRecords();
const users = db.getAllUsers();
console.log('迁移完成！');
console.log('  记录:', records.length, '条');
console.log('  用户:', users.length, '个');

db.closeDatabase();
