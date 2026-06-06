const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');
const wechat = require('./wechat_notify');
const dbAdapter = require('./db-adapter');

const https = require('https');

const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const BACKUP_DIR = path.join(__dirname, 'backups');

// ─── 加载本地配置（config.local.json 不提交git） ───
var LOCAL_CONFIG = {};
try { LOCAL_CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.local.json'), 'utf-8')); } catch(e) {}

// ─── 企业微信 OAuth 配置（优先从config.local.json读取） ───
var _wc = LOCAL_CONFIG.wecom || {};
const WECOM = {
  corpId: _wc.corpId || '',
  agentId: _wc.agentId || '',
  secret: _wc.secret || '',
  callbackToken: _wc.callbackToken || '',
  encodingAESKey: _wc.encodingAESKey || '',
  getTokenUrl: function() {
    return 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=' + this.corpId + '&corpsecret=' + this.secret;
  },
  getUserInfoUrl: function(code) {
    return 'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=ACCESS_TOKEN&code=' + code;
  },
  getUserDetailUrl: function(userid) {
    return 'https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=ACCESS_TOKEN&userid=' + userid;
  }
};
// 企微 access_token 缓存
var WECOM_TOKEN = { token: '', expires: 0 };
function getWeComToken(callback) {
  if (WECOM_TOKEN.token && WECOM_TOKEN.expires > Date.now()) {
    return callback(null, WECOM_TOKEN.token);
  }
  var reqUrl = WECOM.getTokenUrl();
  https.get(reqUrl, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      try {
        var data = JSON.parse(body);
        if (data.access_token) {
          WECOM_TOKEN = { token: data.access_token, expires: Date.now() + (data.expires_in - 300) * 1000 };
          callback(null, data.access_token);
        } else {
          callback(new Error('获取access_token失败: ' + (data.errmsg || body)));
        }
      } catch(e) { callback(e); }
    });
  }).on('error', callback);
}

// ─── Token 存储（内存 + 持久化） ───
const TOKENS_FILE = path.join(__dirname, 'tokens.json');
var TOKENS = loadTokens(); // token -> { username, name, role, dept, expires }
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24h

function loadTokens() {
  try {
    var data = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
    var now = Date.now();
    var valid = {};
    for (var t in data) {
      if (data[t].expires > now) valid[t] = data[t];
    }
    return valid;
  } catch (e) {
    return {};
  }
}

function saveTokens() {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(TOKENS, null, 2));
  } catch (e) { /* 静默失败，不影响主流程 */ }
}

// ─── 登录限流（每 IP 每15分钟最多10次） ───
const LOGIN_RATE_LIMIT = {};  // ip -> { attempts: number, resetAt: timestamp }
const LOGIN_RATE_MAX = 10;
const LOGIN_RATE_WINDOW = 15 * 60 * 1000; // 15分钟

function checkLoginRateLimit(ip) {
  var now = Date.now();
  var entry = LOGIN_RATE_LIMIT[ip];
  if (!entry || entry.resetAt < now) {
    LOGIN_RATE_LIMIT[ip] = { attempts: 1, resetAt: now + LOGIN_RATE_WINDOW };
    return { ok: true };
  }
  entry.attempts++;
  if (entry.attempts > LOGIN_RATE_MAX) {
    var remainMin = Math.ceil((entry.resetAt - now) / 60000);
    return { ok: false, msg: '登录请求过于频繁，请在 ' + remainMin + ' 分钟后重试' };
  }
  return { ok: true };
}

// ─── 通用API限流（每 IP 每分钟60次） ───
const API_RATE_LIMIT = {};  // ip -> { count: number, resetAt: timestamp }
const API_RATE_MAX = 60;
const API_RATE_WINDOW = 60 * 1000; // 1分钟

function checkApiRateLimit(ip) {
  var now = Date.now();
  var entry = API_RATE_LIMIT[ip];
  if (!entry || entry.resetAt < now) {
    API_RATE_LIMIT[ip] = { count: 1, resetAt: now + API_RATE_WINDOW };
    return { ok: true };
  }
  entry.count++;
  if (entry.count > API_RATE_MAX) {
    return { ok: false, msg: '请求过于频繁，请稍后再试' };
  }
  return { ok: true };
}

// ─── 错误日志 ───
const ERROR_LOG_FILE = path.join(__dirname, 'error.log');

function logError(type, message, stack) {
  var time = new Date().toISOString();
  var line = '[' + time + '] ' + type + ': ' + message + (stack ? '\n' + stack : '') + '\n';
  fs.appendFile(ERROR_LOG_FILE, line, function() {});
}

// ─── 登录失败锁定 ───
const LOGIN_LOCK = {};           // username -> { attempts: number, lockedUntil: timestamp }
const MAX_LOGIN_ATTEMPTS = 5;    // 最多尝试次数
const LOCK_DURATION = 15 * 60 * 1000; // 锁定15分钟

// ─── 允许上传的文件类型 ───
const ALLOWED_FILE_EXT = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── 允许的 CORS 来源（按需修改） ───
// 自动检测局域网IP并加入白名单
var LAN_IP = (function() {
  var nets = os.networkInterfaces();
  for (var name in nets) {
    for (var i = 0; i < nets[name].length; i++) {
      if (nets[name][i].family === 'IPv4' && !nets[name][i].internal) {
        return nets[name][i].address;
      }
    }
  }
  return null;
})();

var LAN_ORIGIN = LAN_IP ? 'http://' + LAN_IP + ':3000' : null;

var ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://47.96.158.178:3000', // 阿里云外网访问
]);
if (LAN_ORIGIN) {
  ALLOWED_ORIGINS.add(LAN_ORIGIN);
  console.log('  LAN:     http://' + LAN_IP + ':3000');
}

[UPLOAD_DIR, BACKUP_DIR].forEach(function(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── 密码哈希（scrypt，专为密码设计，比 SHA256 安全得多） ───
// 格式：scrypt:salt_hex:hash_hex
function hashPassword(password, callback) {
  var salt = crypto.randomBytes(16).toString('hex');
  crypto.scrypt(password, salt, 64, function(err, derived) {
    if (err) { callback(err); return; }
    callback(null, 'scrypt:' + salt + ':' + derived.toString('hex'));
  });
}

function verifyPassword(password, stored, callback) {
  // 兼容旧的 SHA256 哈希（格式不含 'scrypt:' 前缀）
  if (!stored || !stored.startsWith('scrypt:')) {
    var legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    callback(null, legacyHash === stored);
    return;
  }
  var parts = stored.split(':');
  if (parts.length !== 3) { callback(null, false); return; }
  var salt = parts[1];
  var hash = parts[2];
  crypto.scrypt(password, salt, 64, function(err, derived) {
    if (err) { callback(err); return; }
    var ok = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
    callback(null, ok);
  });
}

// ─── 生成安全 Token ───
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── 数据持久化（将内存修改同步到SQLite） ───
function safeWrite(data) {
  try {
    dbAdapter.safeWrite(data);
  } catch (e) {
    console.error('[safeWrite] Error:', e.message);
  }
}

function readData() {
  return dbAdapter.readData();
}

function addLog(db, operator, action, detail) {
  dbAdapter.addLog(operator, action, detail);
}

function parseMultipart(buffer, boundary) {
  var parts = {};
  var boundaryBuf = Buffer.from('--' + boundary);
  var start = 0;
  var idx = buffer.indexOf(boundaryBuf, start);
  while (idx !== -1) {
    start = idx + boundaryBuf.length + 2;
    idx = buffer.indexOf(boundaryBuf, start);
    if (idx === -1) break;
    var part = buffer.slice(start, idx - 2);
    var headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    var header = part.slice(0, headerEnd).toString();
    var body = part.slice(headerEnd + 4);
    var nameMatch = header.match(/name="([^"]+)"/);
    var filenameMatch = header.match(/filename="([^"]+)"/);
    if (nameMatch) {
      var fieldName = nameMatch[1];
      if (filenameMatch) {
        parts[fieldName] = { filename: filenameMatch[1], data: body };
      } else {
        parts[fieldName] = { value: body.toString().trim() };
      }
    }
  }
  return parts;
}

function sendJson(res, obj) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

// ─── 状态机：白名单模式，默认拒绝 ───
var VALID_TRANSITIONS = {
  '待审批': ['已通过', '已驳回', '学习中', '已撤回'],
  '已驳回': ['待审批'],
  '已撤回': ['待审批'],
  '已通过': ['学习中', '总结已提交'],
  '学习中': ['总结已提交'],
  '总结已提交': ['待评审'],
  '待评审': ['30天已回访', '学习中'],  // 评审通过→30天回访，不合格→回退学习
  '30天已回访': ['已完成'],
  '已完成': []  // 终态，不可回退
};

function canTransition(from, to) {
  if (from === to) return true; // 不变 = 允许
  var allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false; // 未知状态 = 拒绝
  return allowed.indexOf(to) >= 0;
}

// ─── 输入消毒（服务端） ───
function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  str = str.trim();
  if (maxLen && str.length > maxLen) str = str.slice(0, maxLen);
  return str;
}

// ─── 认证中间件 ───
function authenticate(req) {
  var authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  var token = authHeader.slice(7);
  var info = TOKENS[token];
  if (!info) return null;
  if (Date.now() > info.expires) {
    delete TOKENS[token];
    return null;
  }
  // 续期
  info.expires = Date.now() + TOKEN_TTL;
  return { username: info.username, name: info.name, role: info.role, dept: info.dept };
}

// ─── 定期清理过期 Token 和限流记录 ───
setInterval(function() {
  var now = Date.now();
  var changed = false;
  for (var t in TOKENS) {
    if (TOKENS[t].expires < now) { delete TOKENS[t]; changed = true; }
  }
  if (changed) saveTokens();
  // 清理过期限流记录
  for (var ip in LOGIN_RATE_LIMIT) {
    if (LOGIN_RATE_LIMIT[ip].resetAt < now) delete LOGIN_RATE_LIMIT[ip];
  }
  // 清理过期API限流记录
  for (var ip2 in API_RATE_LIMIT) {
    if (API_RATE_LIMIT[ip2].resetAt < now) delete API_RATE_LIMIT[ip2];
  }
}, 60 * 60 * 1000);

var server = http.createServer(function(req, res) {
  var parsed = url.parse(req.url, true);
  var pathname = parsed.pathname;

  // ─── API限流检查 ───
  var clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (pathname.startsWith('/api')) {
    var rateCheck = checkApiRateLimit(clientIp);
    if (!rateCheck.ok) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, msg: rateCheck.msg }));
      return;
    }
  }

  // ─── CORS：检查 Origin ───
  var origin = req.headers['origin'] || '';
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // 同源请求无 Origin header，放行
    // 同源请求无 Origin header，不需要 CORS 头
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // ─── 企业微信消息验证 & 回调（接收消息服务器URL） ───
  if (pathname === '/wecom_hook') {
    var wecomHook = function() {
      // AES-256-CBC 加解密
      var _key = Buffer.from(WECOM.encodingAESKey + '=', 'base64');
      var _iv = _key.slice(0, 16);
      function _sha1(args) {
        return crypto.createHash('sha1').update(args.sort().join('')).digest('hex');
      }
      function _decrypt(encrypted) {
        var decipher = crypto.createDecipheriv('aes-256-cbc', _key, _iv);
        decipher.setAutoPadding(false);
        var buf = Buffer.concat([decipher.update(encrypted, 'base64'), decipher.final()]);
        // 去除PKCS7填充
        var pad = buf[buf.length - 1];
        if (pad < 1 || pad > 32) pad = 0;
        buf = buf.slice(0, buf.length - pad);
        // 格式: 16字节随机串(4字节长度) + 明文长度(4字节网络字节序) + 明文 + CorpID
        var msgLen = buf.readUInt32BE(16);
        var msg = buf.slice(20, 20 + msgLen).toString('utf-8');
        return msg;
      }
      function _encrypt(text) {
        var random = crypto.randomBytes(16);
        var textBuf = Buffer.from(text, 'utf-8');
        var corpBuf = Buffer.from(WECOM.corpId, 'utf-8');
        var msgLen = Buffer.alloc(4);
        msgLen.writeUInt32BE(textBuf.length, 0);
        var raw = Buffer.concat([random, msgLen, textBuf, corpBuf]);
        // PKCS7填充到32字节的倍数
        var blockSize = 32;
        var padLen = blockSize - (raw.length % blockSize);
        var padBuf = Buffer.alloc(padLen, padLen);
        raw = Buffer.concat([raw, padBuf]);
        var cipher = crypto.createCipheriv('aes-256-cbc', _key, _iv);
        cipher.setAutoPadding(false);
        return Buffer.concat([cipher.update(raw), cipher.final()]).toString('base64');
      }

      if (req.method === 'GET') {
        // URL验证：解密 echostr 并返回
        var q = parsed.query;
        var signature = q.msg_signature || '';
        var timestamp = q.timestamp || '';
        var nonce = q.nonce || '';
        var echostr = q.echostr || '';
        var devSignature = _sha1([WECOM.callbackToken, timestamp, nonce, echostr]);
        if (signature !== devSignature) {
          console.log('[企微Hook] GET签名验证失败');
          res.writeHead(403); res.end('Signature mismatch'); return;
        }
        try {
          var reply = _decrypt(echostr);
          console.log('[企微Hook] URL验证成功');
          res.setHeader('Content-Type', 'text/plain');
          res.end(reply);
        } catch(e) {
          console.log('[企微Hook] 解密echostr失败:', e.message);
          res.writeHead(500); res.end('Decrypt failed'); return;
        }
        return;
      }

      if (req.method === 'POST') {
        // 接收企微推送的消息/事件
        var body = '';
        req.on('data', function(chunk) { body += chunk; });
        req.on('end', function() {
          console.log('[企微Hook] 收到POST回调:', body.substring(0, 200));
          res.setHeader('Content-Type', 'application/json');
          res.end('{"errcode":0,"errmsg":"ok"}');
          // TODO: 后续可在此解析消息体，处理事件回调
        });
        return;
      }

      res.writeHead(405); res.end('Method Not Allowed'); return;
    };
    wecomHook();
    return;
  }

  // ─── 企业微信 OAuth 回调 ───
  if (pathname === '/wecom/callback') {
    var wecomCode = parsed.query.code || '';
    if (!wecomCode) { res.writeHead(400); res.end('缺少 code 参数'); return; }
    // 1) 获取 access_token
    getWeComToken(function(err, accessToken) {
      if (err) { res.writeHead(500); res.end('获取access_token失败: ' + err.message); return; }
      // 2) 用 code 换取 userid
      var infoUrl = WECOM.getUserInfoUrl(wecomCode).replace('ACCESS_TOKEN', accessToken);
      https.get(infoUrl, function(infoRes) {
        var infoBody = '';
        infoRes.on('data', function(chunk) { infoBody += chunk; });
        infoRes.on('end', function() {
          var infoData;
          try { infoData = JSON.parse(infoBody); } catch(e) { res.writeHead(500); res.end('解析用户信息失败'); return; }
          if (!infoData.UserId) {
            res.writeHead(400); res.end('获取用户信息失败: ' + (infoData.errmsg || infoBody)); return;
          }
          // 3) 获取用户详情
          var detailUrl = WECOM.getUserDetailUrl(infoData.UserId).replace('ACCESS_TOKEN', accessToken);
          https.get(detailUrl, function(detailRes) {
            var detailBody = '';
            detailRes.on('data', function(chunk) { detailBody += chunk; });
            detailRes.on('end', function() {
              var detail;
              try { detail = JSON.parse(detailBody); } catch(e) { res.writeHead(500); res.end('解析用户详情失败'); return; }
              if (!detail.userid) {
                res.writeHead(400); res.end('获取用户详情失败: ' + (detail.errmsg || detailBody)); return;
              }
              // 4) 用企微 userid 匹配系统用户（username 字段）
              var db = readData();
              var user = db.users.find(function(u) { return u.username === detail.userid; });
              if (!user) {
                // 企微用户不在系统中，显示提示页
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<html><head><meta charset="utf-8"><title>未授权</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f5f5f5"><div style="text-align:center"><h2 style="color:#333">暂无访问权限</h2><p style="color:#666">您的企微账号（' + sanitize(detail.name || detail.userid, 50) + '）未在培训系统中注册。</p><p style="color:#999;margin-top:20px">请联系HR管理员 贺京博 开通账号。</p></div></body></html>');
                return;
              }
              // 5) 登录成功，生成 token
              var token = generateToken();
              TOKENS[token] = { username: user.username, name: user.name, role: user.role, dept: user.dept, expires: Date.now() + TOKEN_TTL };
              saveTokens();
              console.log('[企微OAuth] 用户 ' + user.name + '（' + user.username + '）通过企微登录');
              // 6) 重定向到首页，token 放 URL 参数
              res.writeHead(302, { 'Location': '/?wecom_token=' + token });
              res.end();
            });
          }).on('error', function(e) { res.writeHead(500); res.end('请求用户详情失败: ' + e.message); });
        });
      }).on('error', function(e) { res.writeHead(500); res.end('请求用户信息失败: ' + e.message); });
    });
    return;
  }

  // ─── 静态文件（index.html 等） ───
  if (pathname !== '/api' && !pathname.startsWith('/uploads/')) {
    var filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);
    // 防止路径穿越
    if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end('Forbidden'); return; }
    var ext = path.extname(filePath);
    var types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
    fs.readFile(filePath, function(err, data) {
      if (err) { res.writeHead(404); res.end('Not Found'); return; }
      res.writeHead(200, { 'Content-Type': (types[ext] || 'text/plain') + '; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // ─── 上传文件服务 ───
  if (pathname.startsWith('/uploads/')) {
    var fname = path.basename(pathname.replace('/uploads/', ''));
    try { fname = decodeURIComponent(fname); } catch(e) { /* 解码失败就用原始值 */ }
    var publicFiles = ['logo.png','mascot.png','2+685+.png','指脸IP.png','资源 17.png','资源 18.png','6126.png','1 (13).png','3.png','login_bg.png'];
    if (!publicFiles.includes(fname)) {
      var user = authenticate(req);
      // 浏览器用 <a>/<img> 打开附件时不会带 Authorization 头，允许用 ?token= 查询参数认证
      if (!user) {
        var qToken = parsed.query.token || '';
        var tInfo = TOKENS[qToken];
        if (tInfo && Date.now() <= tInfo.expires) {
          user = { username: tInfo.username, name: tInfo.name, role: tInfo.role, dept: tInfo.dept };
        }
      }
      if (!user) { res.writeHead(401); res.end('Unauthorized'); return; }
    }
    // Re-extract fname after auth check
    fname = path.basename(pathname.replace('/uploads/', ''));
    try { fname = decodeURIComponent(fname); } catch(e) { /* 解码失败就用原始值 */ }
    var fpath = path.join(UPLOAD_DIR, fname);
    // 防止路径穿越
    if (!fpath.startsWith(UPLOAD_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (fs.existsSync(fpath)) {
      var ext = path.extname(fname);
      var fileTypes = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
      // 可预览的文件类型使用 inline，其他使用 attachment
      var previewExts = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
      var disposition = previewExts.includes(ext) ? 'inline' : 'attachment';
      res.writeHead(200, {
        'Content-Type': fileTypes[ext] || 'application/octet-stream',
        'Content-Disposition': disposition + '; filename="' + encodeURIComponent(fname) + '"'
      });
      res.end(fs.readFileSync(fpath));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  // ─── 错误报告接口（无需认证） ───
  if (pathname === '/api/error-report' && req.method === 'POST') {
    var errBody = '';
    req.on('data', function(c) { errBody += c; });
    req.on('end', function() {
      try {
        var errData = JSON.parse(errBody);
        logError(errData.type || 'client_error', errData.message || '', errData.stack || '');
        sendJson(res, { ok: true });
      } catch(e) {
        sendJson(res, { ok: false });
      }
    });
    return;
  }

  // ─── API 路由 ───
  if (pathname === '/api' || pathname === '/api/v1') {
    var action = parsed.query.action || '';

    // ════════ 无需认证的接口 ════════

    if (action === 'checkFirst') {
      // 简单的IP限流，避免被探测
      var cfIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      var cfEntry = LOGIN_RATE_LIMIT['_cf_' + cfIp];
      var cfNow = Date.now();
      if (cfEntry && cfEntry.count > 20 && cfEntry.resetAt > cfNow) {
        sendJson(res, { ok: false, msg: '请求过于频繁' }); return;
      }
      if (!cfEntry || cfEntry.resetAt < cfNow) {
        LOGIN_RATE_LIMIT['_cf_' + cfIp] = { count: 1, resetAt: cfNow + 60000 };
      } else {
        LOGIN_RATE_LIMIT['_cf_' + cfIp].count++;
      }
      var db = readData();
      sendJson(res, { ok: true, isFirst: db.users.length === 0 });
      return;
    }

    // ════════ 登录（仅 POST） ════════
    if (req.method === 'POST') {
      var body = '';
      var contentType = req.headers['content-type'] || '';

      // 文件上传
      if (contentType.indexOf('multipart/form-data') >= 0) {
        // 需要认证
        var uploadUser = authenticate(req);
        if (!uploadUser) { sendJson(res, { ok: false, msg: '请先登录' }); return; }

        var boundaryMatch = contentType.match(/boundary=(.+)/);
        if (!boundaryMatch) { sendJson(res, { ok: false, msg: 'no boundary' }); return; }
        var boundary = boundaryMatch[1];
        var chunks = [];
        req.on('data', function(c) { chunks.push(c); });
        req.on('end', function() {
          var buf = Buffer.concat(chunks);
          if (buf.length > MAX_FILE_SIZE) { sendJson(res, { ok: false, msg: '文件大小不能超过10MB' }); return; }
          var parts = parseMultipart(buf, boundary);
          var db2 = readData();
          var recordId = parts.recordId ? parts.recordId.value : '';
          var file = parts.file;
          if (!file || !file.filename) { sendJson(res, { ok: false, msg: 'no file' }); return; }

          // 文件类型校验
          var ext = path.extname(file.filename).toLowerCase();
          if (!ALLOWED_FILE_EXT.has(ext)) { sendJson(res, { ok: false, msg: '不支持的文件类型：' + ext }); return; }

          var newName = Date.now().toString(36) + '_' + crypto.randomBytes(6).toString('hex') + ext;
          var filePath = path.join(UPLOAD_DIR, newName);
          // 防止路径穿越
          if (path.resolve(filePath) !== filePath || !filePath.startsWith(UPLOAD_DIR)) { sendJson(res, { ok: false, msg: 'invalid filename' }); return; }
          fs.writeFileSync(filePath, file.data);
          var fileInfo = { name: file.filename, saved: newName, size: file.data.length, time: new Date().toLocaleString('zh-CN') };
          if (recordId) {
            var idx = db2.records.findIndex(function(r) { return r.ID === recordId; });
            if (idx >= 0) {
              if (!db2.records[idx]._files) db2.records[idx]._files = [];
              db2.records[idx]._files.push(fileInfo);
            }
          }
          addLog(db2, uploadUser.name, 'upload', file.filename);
          safeWrite(db2);
          sendJson(res, { ok: true, file: fileInfo });
        });
        return;
      }

      // JSON POST
      var MAX_JSON_SIZE = 1024 * 1024;
      req.on('data', function(c) {
        body += c;
        if (body.length > MAX_JSON_SIZE) {
          try { sendJson(res, { ok: false, msg: '请求数据过大' }); } catch(e) {}
          req.destroy();
        }
      });
      req.on('end', function() {
        try {
          var data = JSON.parse(body);
          var action = data.action;

          // ─── 登录（POST only，返回 token） ───
          if (action === 'login') {
            // IP 限流
            var clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            var rateCheck = checkLoginRateLimit(clientIp);
            if (!rateCheck.ok) { sendJson(res, { ok: false, msg: rateCheck.msg }); return; }

            var lp = sanitize(data.username, 50);
            var lpass = data.password || '';
            if (!lp || !lpass) { sendJson(res, { ok: false, msg: '请输入用户名和密码' }); return; }

            // 检查是否被锁定
            var lock = LOGIN_LOCK[lp];
            if (lock && lock.lockedUntil > Date.now()) {
              var remainMin = Math.ceil((lock.lockedUntil - Date.now()) / 60000);
              sendJson(res, { ok: false, msg: '登录失败次数过多，账号已锁定，请在 ' + remainMin + ' 分钟后重试' });
              return;
            }

            var db = readData();
            var loginUser = db.users.find(function(x) { return x.username === lp; });
            if (!loginUser) { sendJson(res, { ok: false, msg: '用户名或密码错误' }); return; }
            verifyPassword(lpass, loginUser.password, function(err, match) {
              if (err || !match) {
                // 记录失败次数
                if (!LOGIN_LOCK[lp]) LOGIN_LOCK[lp] = { attempts: 0, lockedUntil: 0 };
                LOGIN_LOCK[lp].attempts++;
                if (LOGIN_LOCK[lp].attempts >= MAX_LOGIN_ATTEMPTS) {
                  LOGIN_LOCK[lp].lockedUntil = Date.now() + LOCK_DURATION;
                  sendJson(res, { ok: false, msg: '登录失败次数过多，账号已锁定，请在 15 分钟后重试' });
                } else {
                  var remain = MAX_LOGIN_ATTEMPTS - LOGIN_LOCK[lp].attempts;
                  sendJson(res, { ok: false, msg: '用户名或密码错误，剩余 ' + remain + ' 次尝试机会' });
                }
                return;
              }
              // 登录成功，清除锁定
              delete LOGIN_LOCK[lp];
              // 如果是旧 SHA256 哈希，顺手升级为 scrypt
              if (!loginUser.password.startsWith('scrypt:')) {
                hashPassword(lpass, function(herr, newHash) {
                  if (!herr) {
                    var db2 = readData();
                    var uidx = db2.users.findIndex(function(u) { return u.username === lp; });
                    if (uidx >= 0) { db2.users[uidx].password = newHash; safeWrite(db2); }
                  }
                });
              }
              var token = generateToken();
              TOKENS[token] = { username: loginUser.username, name: loginUser.name, role: loginUser.role, dept: loginUser.dept, expires: Date.now() + TOKEN_TTL };
              saveTokens();
              sendJson(res, { ok: true, token: token, user: { username: loginUser.username, name: loginUser.name, role: loginUser.role, dept: loginUser.dept } });
            });
            return;
          }

          // ─── 登出 ───
          if (action === 'logout') {
            var authHeader2 = req.headers['authorization'] || '';
            if (authHeader2.startsWith('Bearer ')) {
              delete TOKENS[authHeader2.slice(7)];
              saveTokens();
            }
            sendJson(res, { ok: true });
            return;
          }

          // ─── 注册（首次初始化） ───
          if (action === 'register') {
            // 用写锁防止竞态条件
            var regDb = readData();
            if (regDb.users.length > 0 && data._role !== 'setup') {
              sendJson(res, { ok: false, msg: 'not first' }); return;
            }
            var rUser = sanitize(data.username, 50);
            var rPwd = data.password || '';
            var rName = sanitize(data.name, 50);
            if (!rUser || !rPwd || !rName) { sendJson(res, { ok: false, msg: 'missing fields' }); return; }
            if (rPwd.length < 6) { sendJson(res, { ok: false, msg: '密码至少6位' }); return; }
            if (regDb.users.find(function(u) { return u.username === rUser; })) {
              sendJson(res, { ok: false, 'msg': 'username exists' }); return;
            }
            hashPassword(rPwd, function(err, hashed) {
              if (err) { sendJson(res, { ok: false, msg: '服务器错误' }); return; }
              // 再次读取最新数据，防止并发注册
              var regDb2 = readData();
              if (regDb2.users.find(function(u) { return u.username === rUser; })) {
                sendJson(res, { ok: false, msg: 'username exists' }); return;
              }
              regDb2.users.push({ username: rUser, password: hashed, name: rName, role: data.role || 'hr', dept: sanitize(data.dept, 50) });
              addLog(regDb2, rName, 'register', rUser);
              safeWrite(regDb2);
              sendJson(res, { ok: true });
            });
            return;
          }

          // ════════ 以下均需认证 ════════
          var currentUser = authenticate(req);
          if (!currentUser) { sendJson(res, { ok: false, msg: '请先登录' }); return; }
          var isHR = currentUser.role === 'hr';

          if (action === 'addUser') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var auUser = sanitize(data.username, 50);
            var auPwd = data.password || '';
            var auName = sanitize(data.name, 50);
            if (!auUser || !auPwd || !auName) { sendJson(res, { ok: false, msg: 'missing fields' }); return; }
            if (auPwd.length < 6) { sendJson(res, { ok: false, msg: '密码至少6位' }); return; }
            var db = readData();
            if (db.users.find(function(u) { return u.username === auUser; })) {
              sendJson(res, { ok: false, msg: 'username exists' }); return;
            }
            hashPassword(auPwd, function(err, hashed) {
              if (err) { sendJson(res, { ok: false, msg: '服务器错误' }); return; }
              db.users.push({ username: auUser, password: hashed, name: auName, role: data.role || 'employee', dept: sanitize(data.dept, 50) });
              addLog(db, currentUser.name, 'addUser', auName + '(' + auUser + ')');
              safeWrite(db);
              sendJson(res, { ok: true });
            });
            return;
          }

          if (action === 'deleteUser') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var uidx = db.users.findIndex(function(u) { return u.username === data.username; });
            if (uidx < 0) { sendJson(res, { ok: false, msg: 'not found' }); return; }
            if (db.users[uidx].username === currentUser.username) { sendJson(res, { ok: false, msg: '不能删除自己' }); return; }
            db.records.forEach(function(r) { if (r['员工'] === db.users[uidx].name) r._orphaned = true; });
            db.users.splice(uidx, 1);
            addLog(db, currentUser.name, 'deleteUser', data.username);
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          if (action === 'resetPwd') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var ridx = db.users.findIndex(function(u) { return u.username === data.username; });
            if (ridx < 0) { sendJson(res, { ok: false, msg: 'not found' }); return; }
            var newPwd = data.password || '';
            if (newPwd.length < 6) { sendJson(res, { ok: false, msg: '密码至少6位' }); return; }
            hashPassword(newPwd, function(err, hashed) {
              if (err) { sendJson(res, { ok: false, msg: '服务器错误' }); return; }
              db.users[ridx].password = hashed;
              addLog(db, currentUser.name, 'resetPwd', data.username);
              safeWrite(db);
              sendJson(res, { ok: true });
            });
            return;
          }

          if (action === 'updateUser') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var uidx = db.users.findIndex(function(u) { return u.username === data.username; });
            if (uidx < 0) { sendJson(res, { ok: false, msg: 'not found' }); return; }
            var u = db.users[uidx];
            var oldName = u.name;
            if (data.name) u.name = sanitize(data.name, 50);
            if (data.dept !== undefined) u.dept = sanitize(data.dept, 50);
            if (data.role && (data.role === 'hr' || data.role === 'employee')) u.role = data.role;
            // 姓名变更时同步培训记录中的员工字段
            if (data.name && data.name !== oldName) {
              db.records.forEach(function(r) { if (r['员工'] === oldName) r['员工'] = u.name; });
            }
            addLog(db, currentUser.name, 'updateUser', u.username + ' → ' + u.name);
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          if (action === 'addRecord') {
            var r = data.data;
            if (!r || !r['培训项目'] || !r['培训日期']) { sendJson(res, { ok: false, msg: '缺少必填字段' }); return; }
            // 非 HR 只能给自己提交
            if (!isHR && r['员工'] !== currentUser.name) {
              sendJson(res, { ok: false, msg: '只能为自己提交申请' }); return;
            }
            r['员工'] = sanitize(r['员工'], 50);
            r['部门'] = sanitize(r['部门'], 50);
            r['职级'] = sanitize(r['职级'], 50);
            r['培训项目'] = sanitize(r['培训项目'], 200);
            r['培训机构'] = sanitize(r['培训机构'], 200);
            r['培训类型'] = sanitize(r['培训类型'], 50);
            r['地点'] = sanitize(r['地点'], 100);
            r['学习目标'] = sanitize(r['学习目标'], 2000);
            r['承诺产出'] = sanitize(r['承诺产出'], 2000);
            var db = readData();
            r.ID = 'R' + (db.nextId++);
            r.createdAt = new Date().toLocaleString('zh-CN');
            if (!r['状态']) r['状态'] = '待审批';
            db.records.push(r);
            addLog(db, currentUser.name, 'submit', r['培训项目'] || '');
            safeWrite(db);
            // 企业微信通知 HR
            wechat.triggerNotification('new_application', {
              employeeName: r['员工'],
              project: r['培训项目'],
              institution: r['培训机构'],
              cost: r['费用'],
              date: r['createdAt']
            });
            sendJson(res, { ok: true, id: r.ID });
            return;
          }

          if (action === 'updateRecord') {
            var db = readData();
            var uidx2 = db.records.findIndex(function(r) { return r.ID === data.id; });
            if (uidx2 < 0) { sendJson(res, { ok: false, msg: 'not found' }); return; }
            var old = Object.assign({}, db.records[uidx2]);

            // 权限检查：非 HR 只能改自己的记录，且不能改状态/HR备注/回访/评估
            if (!isHR) {
              if (old['员工'] !== currentUser.name) { sendJson(res, { ok: false, msg: '无权限' }); return; }
              // 员工只能改：总结相关字段 + 状态（仅限从 已通过 → 总结已提交）
              var allowedFields = ['总结内容', '行动计划', '可衡量指标', '培训前评分', '培训后评分', '状态', '30天自评内容', '自评提交日期', '90天自评内容', '90天自评日期'];
              for (var key in data.data) {
                if (allowedFields.indexOf(key) < 0) { sendJson(res, { ok: false, msg: '无权限修改字段：' + key }); return; }
              }
            }

            // 验证状态转换
            if (data.data['状态'] && data.data['状态'] !== old['状态']) {
              if (!canTransition(old['状态'], data.data['状态'])) {
                sendJson(res, { ok: false, msg: '不允许从「' + old['状态'] + '」改为「' + data.data['状态'] + '」' }); return;
              }
              // 员工只能：已通过/学习中 → 总结已提交
              if (!isHR) {
                var empAllowedFrom = ['已通过', '学习中'];
                var empAllowedTo = ['总结已提交'];
                if (empAllowedFrom.indexOf(old['状态']) < 0 || empAllowedTo.indexOf(data.data['状态']) < 0) {
                  sendJson(res, { ok: false, msg: '员工无权进行此状态转换' }); return;
                }
              }
            }

            // 服务端消毒关键字段
            if (data.data['员工']) data.data['员工'] = sanitize(data.data['员工'], 50);
            if (data.data['部门']) data.data['部门'] = sanitize(data.data['部门'], 50);
            if (data.data['职级']) data.data['职级'] = sanitize(data.data['职级'], 50);
            if (data.data['培训项目']) data.data['培训项目'] = sanitize(data.data['培训项目'], 200);
            if (data.data['培训机构']) data.data['培训机构'] = sanitize(data.data['培训机构'], 200);
            if (data.data['培训类型']) data.data['培训类型'] = sanitize(data.data['培训类型'], 50);
            if (data.data['地点']) data.data['地点'] = sanitize(data.data['地点'], 100);
            if (data.data['学习目标']) data.data['学习目标'] = sanitize(data.data['学习目标'], 2000);
            if (data.data['承诺产出']) data.data['承诺产出'] = sanitize(data.data['承诺产出'], 2000);
            if (data.data['评估分数']) data.data['评估分数'] = sanitize(data.data['评估分数'], 10);
            if (data.data['评估日期']) data.data['评估日期'] = sanitize(data.data['评估日期'], 20);
            if (data.data['评估意见']) data.data['评估意见'] = sanitize(data.data['评估意见'], 2000);
            if (data.data['推荐程度']) data.data['推荐程度'] = sanitize(data.data['推荐程度'], 50);
            if (data.data['总结内容']) data.data['总结内容'] = sanitize(data.data['总结内容'], 5000);
            if (data.data['行动计划']) data.data['行动计划'] = sanitize(data.data['行动计划'], 2000);
            if (data.data['可衡量指标']) data.data['可衡量指标'] = sanitize(data.data['可衡量指标'], 2000);
            if (data.data['30天自评内容']) data.data['30天自评内容'] = sanitize(data.data['30天自评内容'], 3000);
            if (data.data['自评提交日期']) data.data['自评提交日期'] = sanitize(data.data['自评提交日期'], 20);
            if (data.data['90天自评内容']) data.data['90天自评内容'] = sanitize(data.data['90天自评内容'], 3000);
            if (data.data['90天自评日期']) data.data['90天自评日期'] = sanitize(data.data['90天自评日期'], 20);
            if (data.data['回访日期']) data.data['回访日期'] = sanitize(data.data['回访日期'], 20);
            if (data.data['回访详情']) data.data['回访详情'] = sanitize(data.data['回访详情'], 2000);
            if (data.data['30天执行']) data.data['30天执行'] = sanitize(data.data['30天执行'], 50);
            if (data.data['HR备注']) data.data['HR备注'] = sanitize(data.data['HR备注'], 1000);

            Object.assign(db.records[uidx2], data.data);

            // 通知：HR 操作通知员工（无论有无备注都发，备注作为附加信息）
            if (old['状态'] !== db.records[uidx2]['状态']) {
              var notifMsg = '你的《' + db.records[uidx2]['培训项目'] + '》状态更新为：' + db.records[uidx2]['状态'];
              if (db.records[uidx2]['HR备注']) notifMsg += '。HR备注：' + db.records[uidx2]['HR备注'];
              db.notifications.unshift({
                id: 'N' + Date.now().toString(36),
                to: db.records[uidx2]['员工'] || old['员工'],
                message: notifMsg,
                time: new Date().toLocaleString('zh-CN'),
                read: false
              });
              // 企业微信通知 - 审批通过
              if (db.records[uidx2]['状态'] === '已通过') {
                wechat.triggerNotification('approved', {
                  employeeName: old['员工'],
                  project: db.records[uidx2]['培训项目'],
                  institution: db.records[uidx2]['培训机构'],
                  date: new Date().toLocaleString('zh-CN')
                });
              }
              // 企业微信通知 - 审批驳回
              if (db.records[uidx2]['状态'] === '已驳回') {
                wechat.triggerNotification('rejected', {
                  employeeName: old['员工'],
                  project: db.records[uidx2]['培训项目'],
                  reason: db.records[uidx2]['HR备注'] || '未说明原因',
                  date: new Date().toLocaleString('zh-CN')
                });
              }
            }
            // 通知：员工提交总结通知 HR
            if (old['状态'] !== db.records[uidx2]['状态'] && db.records[uidx2]['状态'] === '总结已提交') {
              db.users.forEach(function(u) {
                if (u.role === 'hr') {
                  db.notifications.unshift({
                    id: 'N' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
                    to: u.name,
                    message: db.records[uidx2]['员工'] + ' 已提交《' + db.records[uidx2]['培训项目'] + '》的学习总结，请评审',
                    time: new Date().toLocaleString('zh-CN'),
                    read: false
                  });
                }
              });
              // 企业微信通知 - 学习总结已提交（只发一次，不在循环内）
              wechat.triggerNotification('summary_submitted', {
                employeeName: db.records[uidx2]['员工'],
                project: db.records[uidx2]['培训项目'],
                date: new Date().toLocaleString('zh-CN')
              });
            }
            // 通知：HR评审通过通知员工（仅系统内通知，不发送企微）
            if (old['状态'] !== db.records[uidx2]['状态'] && db.records[uidx2]['状态'] === '待评审') {
              db.notifications.unshift({
                id: 'N' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
                to: old['员工'],
                message: '你的《' + db.records[uidx2]['培训项目'] + '》学习总结已通过评审，进入30天跟进阶段',
                time: new Date().toLocaleString('zh-CN'),
                read: false
              });
              // 企业微信通知已关闭
              // wechat.triggerNotification('summary_pending_review', { ... });
            }
            addLog(db, currentUser.name, 'update', db.records[uidx2]['培训项目'] || '');
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          if (action === 'batchUpdate') {
            console.log('[BATCH] data:', JSON.stringify(data));
            console.log('[BATCH] rawUpdates:', JSON.stringify(data.data));
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var ids = data.ids || [];
            var rawUpdates = data.data || {};
            var allowedBatch = ['状态', 'HR备注', '部门', '职级'];
            var updates = {};
            for (var bk in rawUpdates) {
              if (allowedBatch.indexOf(bk) >= 0) updates[bk] = sanitize(String(rawUpdates[bk]), bk === 'HR备注' ? 1000 : 200);
            }
            var allStatuses = Object.keys(VALID_TRANSITIONS);
            if (updates['状态'] && allStatuses.indexOf(updates['状态']) < 0) {
              sendJson(res, { ok: false, msg: '无效的状态值' }); return;
            }
            var successCount = 0, failCount = 0;
            ids.forEach(function(id) {
              var bidx = db.records.findIndex(function(r) { return r.ID === id; });
              if (bidx >= 0) {
                var oldSt = db.records[bidx]['状态'];
                if (updates['状态'] && !canTransition(oldSt, updates['状态'])) { failCount++; return; }
                Object.assign(db.records[bidx], updates);
                successCount++;
                if (oldSt !== updates['状态']) {
                  addLog(db, currentUser.name, 'batchUpdate', db.records[bidx]['培训项目'] + ' -> ' + updates['状态']);
                  db.notifications.unshift({
                    id: 'N' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
                    to: db.records[bidx]['员工'],
                    message: '你的《' + db.records[bidx]['培训项目'] + '》状态已更新为：' + updates['状态'],
                    time: new Date().toLocaleString('zh-CN'),
                    read: false
                  });
                  // 批量操作也发企微通知
                  if (updates['状态'] === '已通过') {
                    wechat.triggerNotification('approved', {
                      employeeName: db.records[bidx]['员工'],
                      project: db.records[bidx]['培训项目'],
                      institution: db.records[bidx]['培训机构'] || '-',
                      date: new Date().toLocaleString('zh-CN')
                    });
                  } else if (updates['状态'] === '已驳回') {
                    wechat.triggerNotification('rejected', {
                      employeeName: db.records[bidx]['员工'],
                      project: db.records[bidx]['培训项目'],
                      reason: updates['HR备注'] || '未说明原因',
                      date: new Date().toLocaleString('zh-CN')
                    });
                  } else if (updates['状态'] === '已完成') {
                    wechat.triggerNotification('30visit_confirmed', {
                      employeeName: db.records[bidx]['员工'],
                      project: db.records[bidx]['培训项目'],
                      result: '批量完成',
                      date: new Date().toLocaleString('zh-CN')
                    });
                  }
                }
              } else {
                failCount++;
              }
            });
            safeWrite(db);
            sendJson(res, { ok: true, success: successCount, failed: failCount });
            return;
          }

          if (action === 'deleteRecord') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var didx = db.records.findIndex(function(r) { return r.ID === data.id; });
            if (didx < 0) { sendJson(res, { ok: false, msg: 'not found' }); return; }
            var dname = db.records[didx]['培训项目'];
            db.records.splice(didx, 1);
            addLog(db, currentUser.name, 'delete', dname || '');
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          // ─── 员工撤回自己的「待审批」申请（改为状态变更，保留记录） ───
          if (action === 'withdrawRecord') {
            var db = readData();
            var widx = db.records.findIndex(function(r) { return r.ID === data.id; });
            if (widx < 0) { sendJson(res, { ok: false, msg: 'not found' }); return; }
            var wRec = db.records[widx];
            if (wRec['员工'] !== currentUser.name && !isHR) {
              sendJson(res, { ok: false, msg: '只能撤回自己的申请' }); return;
            }
            if (wRec['状态'] !== '待审批') {
              sendJson(res, { ok: false, msg: '只有「待审批」状态的申请可以撤回' }); return;
            }
            var wName = wRec['培训项目'];
            wRec['状态'] = '已撤回';
            addLog(db, currentUser.name, 'withdraw', wName || '');
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          if (action === 'markRead') {
            var db = readData();
            var ids = data.ids || [];
            for (var i = 0; i < db.notifications.length; i++) {
              if (ids.indexOf(db.notifications[i].id) >= 0 && db.notifications[i].to === currentUser.name) {
                db.notifications[i].read = true;
              }
            }
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          if (action === 'addNotification') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            db.notifications.unshift({
              id: 'N' + Date.now().toString(36),
              to: sanitize(data.data.to, 50),
              message: sanitize(data.data.message, 500),
              time: new Date().toLocaleString('zh-CN'),
              read: false
            });
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          if (action === 'backup') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            var backupFile = path.join(BACKUP_DIR, 'backup_' + ts + '.json');
            fs.writeFileSync(backupFile, JSON.stringify(db, null, 2), 'utf-8');
            addLog(db, currentUser.name, 'backup', ts);
            safeWrite(db);
            sendJson(res, { ok: true, file: 'backup_' + ts + '.json' });
            return;
          }

          // ─── 修改密码（需验证旧密码） ───
          if (action === 'changePwd') {
            var db = readData();
            var cpidx = db.users.findIndex(function(u) { return u.username === currentUser.username; });
            if (cpidx < 0) { sendJson(res, { ok: false, msg: 'user not found' }); return; }
            var oldPwd = data.oldPassword || '';
            if (!oldPwd) { sendJson(res, { ok: false, msg: '请输入当前密码' }); return; }
            verifyPassword(oldPwd, db.users[cpidx].password, function(err, match) {
              if (err || !match) { sendJson(res, { ok: false, msg: '当前密码错误' }); return; }
              var newPwd = data.password || '';
              if (newPwd.length < 6) { sendJson(res, { ok: false, msg: '新密码至少6位' }); return; }
              if (newPwd === oldPwd) { sendJson(res, { ok: false, msg: '新密码不能与当前密码相同' }); return; }
              hashPassword(newPwd, function(herr, hashed) {
                if (herr) { sendJson(res, { ok: false, msg: '服务器错误' }); return; }
                db.users[cpidx].password = hashed;
                addLog(db, currentUser.name, 'changePwd', '');
                safeWrite(db);
                sendJson(res, { ok: true });
              });
            });
            return;
          }

          // ─── 恢复备份 ───
          if (action === 'restoreBackup') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var bf = sanitize(data.filename || '', 100);
            if (!bf || !bf.startsWith('backup_') || !bf.endsWith('.json')) {
              sendJson(res, { ok: false, msg: '无效的备份文件名' }); return;
            }
            var bfPath = path.join(BACKUP_DIR, bf);
            if (path.resolve(bfPath) !== bfPath || !bfPath.startsWith(BACKUP_DIR)) {
              sendJson(res, { ok: false, msg: '非法路径' }); return;
            }
            if (!fs.existsSync(bfPath)) { sendJson(res, { ok: false, msg: '备份文件不存在' }); return; }
            try {
              var testData = JSON.parse(fs.readFileSync(bfPath, 'utf-8'));
              if (!testData.users || !testData.records) {
                sendJson(res, { ok: false, msg: '备份文件格式无效' }); return;
              }
              // 备份当前数据再恢复
              var ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
              var emergencyBackup = path.join(BACKUP_DIR, 'before_restore_' + ts + '.json');
              var currentData = readData();
              fs.writeFileSync(emergencyBackup, JSON.stringify(currentData, null, 2), 'utf-8');
              // 从JSON备份恢复到SQLite
              var restoreData = JSON.parse(fs.readFileSync(bfPath, 'utf-8'));
              if (!restoreData.nextId && restoreData.nextId !== 0) restoreData.nextId = 10;
              if (!restoreData.depts) restoreData.depts = [];
              if (!restoreData.budgets) restoreData.budgets = [];
              if (!restoreData.settings) restoreData.settings = {};
              if (!restoreData.notifications) restoreData.notifications = [];
              safeWrite(restoreData);
              addLog(readData(), currentUser.name, 'restoreBackup', bf + '（恢复前已备份为 ' + path.basename(emergencyBackup) + '）');
              sendJson(res, { ok: true, msg: '已从 ' + bf + ' 恢复（恢复前已自动备份当前数据）' });
            } catch(e) {
              sendJson(res, { ok: false, msg: '读取备份失败：' + e.message });
            }
            return;
          }

          // ─── 删除备份 ───
          if (action === 'deleteBackup') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var df = sanitize(data.filename || '', 100);
            if (!df || !df.startsWith('backup_') || !df.endsWith('.json')) {
              sendJson(res, { ok: false, msg: '无效的备份文件名' }); return;
            }
            var dfPath = path.join(BACKUP_DIR, df);
            if (path.resolve(dfPath) !== dfPath || !dfPath.startsWith(BACKUP_DIR)) {
              sendJson(res, { ok: false, msg: '非法路径' }); return;
            }
            if (!fs.existsSync(dfPath)) { sendJson(res, { ok: false, msg: '文件不存在' }); return; }
            fs.unlinkSync(dfPath);
            var dbDel = readData();
            addLog(dbDel, currentUser.name, 'deleteBackup', df);
            sendJson(res, { ok: true });
            return;
          }

          // ─── 部门管理 ───
          if (action === 'addDept') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var deptName = sanitize(data.name, 50);
            if (!deptName) { sendJson(res, { ok: false, msg: '部门名称不能为空' }); return; }
            if (db.depts.indexOf(deptName) >= 0) { sendJson(res, { ok: false, msg: '部门已存在' }); return; }
            db.depts.push(deptName);
            addLog(db, currentUser.name, 'addDept', deptName);
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          if (action === 'deleteDept') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var delDeptName = sanitize(data.name, 50);
            var delIdx = db.depts.indexOf(delDeptName);
            if (delIdx < 0) { sendJson(res, { ok: false, msg: '部门不存在' }); return; }
            db.depts.splice(delIdx, 1);
            addLog(db, currentUser.name, 'deleteDept', delDeptName);
            safeWrite(db);
            sendJson(res, { ok: true });
            return;
          }

          // ─── 触发企业微信通知（供前端调用，仅限HR） ───
          if (action === 'triggerNotify') {
            var notifyType = data.type;
            var notifyData = data.data || {};
            // 员工可触发的通知类型（系统事件通知）
            var employeeAllowedTypes = ['summary_submitted', 'self30_submitted', 'self90_submitted'];
            if (!isHR && employeeAllowedTypes.indexOf(notifyType) < 0) {
              sendJson(res, { ok: false, msg: '无权限' }); return;
            }
            wechat.triggerNotification(notifyType, notifyData).catch(function(e) { console.log('Notify error:', e); });
            sendJson(res, { ok: true });
            return;
          }

          // ─── 企业微信Webhook设置 ───
          if (action === 'saveWebhook') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var webhookUrl = (data.url || '').trim();
            var enabled = !!data.enabled;
            if (webhookUrl && !webhookUrl.startsWith('https://qyapi.weixin.qq.com/cgi-bin/webhook/send')) {
              sendJson(res, { ok: false, msg: 'Webhook地址格式不正确' }); return;
            }
            wechat.saveWebhookConfig(webhookUrl, enabled);
            addLog(readData(), currentUser.name, 'saveWebhook', enabled ? '启用' : '关闭');
            sendJson(res, { ok: true });
            return;
          }

          // ─── 测试企业微信通知 ───
          if (action === 'testWebhook') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var testContent = '### ✅ 测试消息\n\n> 凡碧诗培训系统通知测试\n\n- 状态：连接正常\n- 时间：' + new Date().toLocaleString('zh-CN') + '\n\n> 如果你看到这条消息，说明企业微信通知已成功接入！';
            wechat.sendWechatNotification(data.url, testContent).then(function(result) {
              sendJson(res, result);
            });
            return;
          }

          // ─── HR一键催缴总结 ───
          if (action === 'urgeSummary') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var db = readData();
            var recordId = data.recordId || '';
            var urgeType = data.urgeType || 'summary'; // summary | self30 | self90
            var records = db.records || [];
            var rec = records.find(function(r) { return r.ID === recordId; });
            if (!rec) { sendJson(res, { ok: false, msg: '记录不存在' }); return; }
            var st = rec['状态'] || '';
            var trainDate = new Date(rec['培训日期']);
            var now = new Date();
            var daysSince = Math.floor((now - trainDate) / 86400000);
            var daysOverdue = 0;
            var notifyType = 'urge_summary';
            var logAction = '催缴 ' + rec['员工'] + '《' + rec['培训项目'] + '》总结';

            if (urgeType === 'self30') {
              if (st !== '待评审') {
                sendJson(res, { ok: false, msg: '该记录尚未通过评审，不能催缴30天自评' }); return;
              }
              if (rec['30天自评内容']) {
                sendJson(res, { ok: false, msg: '员工已提交30天自评，无需催缴' }); return;
              }
              daysOverdue = Math.max(0, daysSince - 30);
              notifyType = 'urge_self30';
              logAction = '催缴 ' + rec['员工'] + '《' + rec['培训项目'] + '》30天自评';
            } else if (urgeType === 'self90') {
              if (st !== '30天已回访') {
                sendJson(res, { ok: false, msg: '该记录尚未30天回访，不能催缴90天复盘' }); return;
              }
              if (rec['90天自评内容']) {
                sendJson(res, { ok: false, msg: '员工已提交90天复盘，无需催缴' }); return;
              }
              daysOverdue = Math.max(0, daysSince - 90);
              notifyType = 'urge_self90';
              logAction = '催缴 ' + rec['员工'] + '《' + rec['培训项目'] + '》90天复盘';
            } else {
              if (st !== '已通过' && st !== '学习中') {
                sendJson(res, { ok: false, msg: '该记录状态不是待提交总结' }); return;
              }
              daysOverdue = Math.max(0, daysSince - 7);
            }

            wechat.triggerNotification(notifyType, {
              employeeName: rec['员工'] || '员工',
              project: rec['培训项目'] || '未命名',
              trainingDate: rec['培训日期'],
              daysOverdue: daysOverdue,
              hrName: currentUser.name
            });
            // 记录催缴日志
            if (!rec._reminders) rec._reminders = [];
            rec._reminders.push({ type: notifyType, date: now.toISOString().slice(0, 10), time: now.toLocaleString('zh-CN'), hr: currentUser.name });
            safeWrite(db);
            addLog(db, currentUser.name, 'urgeSummary', logAction);
            sendJson(res, { ok: true, msg: '催缴通知已发送' });
            return;
          }

          // ─── AI辅助生成回访备注（仅限HR）───
          if (action === 'ai-assist-return-visit') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            var self30Content = sanitize(data.self30Content || '', 3000);
            var self90Content = sanitize(data.self90Content || '', 3000);
            var employeeName = sanitize(data.employeeName || '', 50);
            var projectName = sanitize(data.projectName || '', 200);
            var executionStatus = sanitize(data.executionStatus || '', 50);

            if (!self30Content && !self90Content) {
              sendJson(res, { ok: false, msg: '请提供员工自评内容' }); return;
            }

            // 构建提示词
            var prompt = '你是凡碧诗HR，负责生成30天回访备注建议。\n\n';
            prompt += '【员工信息】\n';
            prompt += '姓名：' + employeeName + '\n';
            prompt += '培训项目：' + projectName + '\n';
            if (executionStatus) prompt += '执行情况：' + executionStatus + '\n';
            prompt += '\n【员工30天自评内容】\n' + (self30Content || '未填写') + '\n';
            if (self90Content) {
              prompt += '\n【员工90天复盘内容】\n' + self90Content + '\n';
            }
            prompt += '\n请根据以上信息，生成一段专业的回访备注，格式要求：\n';
            prompt += '1. 开头简要总结员工培训成果落地情况\n';
            prompt += '2. 中间说明执行中遇到的困难及后续跟进措施\n';
            prompt += '3. 结尾给出对员工后续发展的建议\n';
            prompt += '4. 总字数控制在150字以内，语气专业客观\n';
            prompt += '5. 不要使用emoji，直接输出纯文本';

            // 调用DeepSeek API
            var postData = JSON.stringify({
              model: 'deepseek-chat',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 500,
              temperature: 0.7
            });

            var options = {
              hostname: 'api.deepseek.com',
              port: 443,
              path: '/chat/completions',
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + (LOCAL_CONFIG.deepseek_api_key || ''),
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
              }
            };

            var aiReq = https.request(options, function(aiRes) {
              var aiBody = '';
              aiRes.on('data', function(chunk) { aiBody += chunk; });
              aiRes.on('end', function() {
                try {
                  var aiResult = JSON.parse(aiBody);
                  if (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message) {
                    var generatedText = aiResult.choices[0].message.content.trim();
                    sendJson(res, { ok: true, text: generatedText });
                  } else if (aiResult.error) {
                    sendJson(res, { ok: false, msg: 'AI生成失败：' + (aiResult.error.message || '未知错误') });
                  } else {
                    sendJson(res, { ok: false, msg: 'AI响应格式异常' });
                  }
                } catch(e) {
                  sendJson(res, { ok: false, msg: '解析AI响应失败' });
                }
              });
            });
            aiReq.on('error', function(e) {
              sendJson(res, { ok: false, msg: '调用AI服务失败：' + e.message });
            });
            aiReq.write(postData);
            aiReq.end();
            return;
          }

          // ─── 从云端拉取数据库（仅HR） ───
          if (action === 'pullFromCloud') {
            if (!isHR) { sendJson(res, { ok: false, msg: '无权限' }); return; }
            try {
              dbAdapter.close();
              var pyLines = [
                'import paramiko',
                'ssh = paramiko.SSHClient()',
                'ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())',
                'ssh.connect("47.96.158.178", port=22, username="root", password="REN01250099q", timeout=15)',
                'sftp = ssh.open_sftp()',
                'sftp.get("/root/training-system/training.db", ' + JSON.stringify(path.join(__dirname, 'training.db')) + ')',
                'sftp.close()',
                'ssh.close()',
                'print("ok")'
              ];
              var tmpFile = path.join(__dirname, '_pull_cloud.py');
              fs.writeFileSync(tmpFile, pyLines.join('\n'), 'utf8');
              const { execSync } = require('child_process');
              execSync('python ' + tmpFile, { encoding: 'utf8', timeout: 30000 });
              fs.unlinkSync(tmpFile);
              try { fs.unlinkSync(path.join(__dirname, 'training.db-wal')); } catch(e) {}
              try { fs.unlinkSync(path.join(__dirname, 'training.db-shm')); } catch(e) {}
              dbAdapter.init();
              var refreshed = dbAdapter.readData();
              sendJson(res, { ok: true, msg: '数据已从云端拉取，共 ' + refreshed.users.length + ' 个用户、' + refreshed.records.length + ' 条记录' });
            } catch(e) {
              try { dbAdapter.init(); } catch(e2) {}
              sendJson(res, { ok: false, msg: '拉取失败：' + e.message });
            }
            return;
          }

          sendJson(res, { ok: false, msg: 'unknown action' });
        } catch (e) {
          sendJson(res, { ok: false, msg: 'parse error' });
        }
      });
      return;
    }

    // ════════ GET 接口（需认证） ════════
    if (req.method === 'GET') {
      // checkFirst 不需要认证（已处理）
      if (action === 'checkFirst') return;

      var user = authenticate(req);
      if (!user) { sendJson(res, { ok: false, msg: '请先登录' }); return; }
      var db = readData();

      // 登录接口不再支持 GET
      if (action === 'login') {
        sendJson(res, { ok: false, msg: '请使用 POST 登录' });
        return;
      }

      // 企微 OAuth 后获取用户信息
      if (action === 'checkAuth') {
        sendJson(res, { ok: true, user: { username: user.username, name: user.name, role: user.role, dept: user.dept } });
        return;
      }

      if (action === 'getRecords') {
        var data = db.records;
        if (user.role !== 'hr') {
          data = data.filter(function(r) { return r['员工'] === user.name; });
        }
        sendJson(res, { ok: true, data: data });
        return;
      }

      if (action === 'getLogs') {
        if (user.role !== 'hr') { sendJson(res, { ok: false, msg: '无权限' }); return; }
        sendJson(res, { ok: true, data: db.logs });
        return;
      }

      if (action === 'getNotifications') {
        var notifs = db.notifications.filter(function(n) { return n.to === user.name; });
        sendJson(res, { ok: true, data: notifs });
        return;
      }

      // ─── 获取企业微信Webhook配置 ───
      if (action === 'getWebhook') {
        if (user.role !== 'hr') { sendJson(res, { ok: false, msg: '无权限' }); return; }
        var config = wechat.getWebhookConfig() || { url: '', enabled: false };
        sendJson(res, { ok: true, data: config });
        return;
      }

      if (action === 'getUsers') {
        if (user.role !== 'hr') { sendJson(res, { ok: false, msg: '无权限' }); return; }
        var safeUsers = db.users.map(function(u) { return { username: u.username, name: u.name, role: u.role, dept: u.dept }; });
        sendJson(res, { ok: true, data: safeUsers });
        return;
      }

      if (action === 'getDepts') {
        sendJson(res, { ok: true, data: db.depts || [] });
        return;
      }

      if (action === 'listBackups') {
        if (user.role !== 'hr') { sendJson(res, { ok: false, msg: '无权限' }); return; }
        try {
          var files = fs.readdirSync(BACKUP_DIR)
            .filter(function(f) { return f.startsWith('backup_') && f.endsWith('.json'); })
            .map(function(f) {
              var s = fs.statSync(path.join(BACKUP_DIR, f));
              return { name: f, size: s.size, time: s.mtime.toLocaleString('zh-CN') };
            })
            .sort(function(a, b) { return b.time.localeCompare(a.time); });
          sendJson(res, { ok: true, data: files });
        } catch(e) {
          sendJson(res, { ok: true, data: [] });
        }
        return;
      }

      if (action === 'getReminders') {
        var reminders = [];
        var now = new Date();
        db.records.forEach(function(r) {
          var canSee = (user.role === 'hr') || (r['员工'] === user.name);
          if (!canSee) return;

          if (r['状态'] === '已通过' && !r['总结内容']) {
            reminders.push({ type: 'summary', msg: r['员工'] + '的《' + r['培训项目'] + '》需要提交总结', recordId: r.ID });
          }
          // 待评审：HR已评审通过，等待30天到期
          if (r['状态'] === '待评审' && !r['30天执行']) {
            var d = new Date(r['培训日期']);
            if (!isNaN(d.getTime())) {
              d.setDate(d.getDate() + 30);
              if (now >= d) {
                reminders.push({ type: '30d', msg: r['员工'] + '的《' + r['培训项目'] + '》已到30天回访时间', recordId: r.ID });
              }
            }
          }
          // 总结已提交但HR尚未评审
          if (r['状态'] === '总结已提交') {
            reminders.push({ type: 'review', msg: r['员工'] + '的《' + r['培训项目'] + '》学习总结待评审', recordId: r.ID });
          }
          if (r['状态'] === '30天已回访' && !r['评估分数']) {
            var d2 = new Date(r['培训日期']);
            if (!isNaN(d2.getTime())) {
              d2.setDate(d2.getDate() + 90);
              if (now >= d2) {
                reminders.push({ type: '90d', msg: r['员工'] + '的《' + r['培训项目'] + '》已到90天评估时间', recordId: r.ID });
              }
            }
          }
        });
        sendJson(res, { ok: true, data: reminders });
        return;
      }

      sendJson(res, { ok: false, msg: 'unknown' });
      return;
    }

    return;
  }
});

// ─── 定时自动备份（每天凌晨3点） ───
function cleanOldBackups() {
  try {
    var files = fs.readdirSync(BACKUP_DIR)
      .filter(function(f) { return f.startsWith('backup_') && f.endsWith('.json'); })
      .map(function(f) { return { name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime }; })
      .sort(function(a, b) { return b.time - a.time; });
    files.slice(30).forEach(function(f) {
      fs.unlinkSync(path.join(BACKUP_DIR, f.name));
      console.log('  Auto-cleaned old backup: ' + f.name);
    });
  } catch(e) {}
}

function runAutoBackup() {
  try {
    var db = readData();
    var ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    var backupFile = path.join(BACKUP_DIR, 'backup_' + ts + '.json');
    fs.writeFileSync(backupFile, JSON.stringify(db, null, 2), 'utf-8');
    addLog(db, '系统', 'autoBackup', ts);
    safeWrite(db);
    cleanOldBackups();
    console.log('  [AutoBackup] Saved at ' + ts);
  } catch(e) { console.log('  [AutoBackup] Failed: ' + e.message); }
}

// 每天凌晨3点执行
function scheduleBackup() {
  var now = new Date();
  var next = new Date(now);
  next.setHours(3, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  var delay = next - now;
  setTimeout(function() {
    runAutoBackup();
    setInterval(runAutoBackup, 24 * 60 * 60 * 1000);
  }, delay);
}
scheduleBackup();

// ─── 定时提醒任务（每天上午9点执行） ───
function checkReminders() {
  try {
    var db = readData();
    var now = new Date();
    var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var sentCount = 0;

    (db.records || []).forEach(function(r) {
      if (!r['培训日期']) return;
      var trainDate = new Date(r['培训日期']);
      if (isNaN(trainDate)) return;
      var daysSince = Math.floor((now - trainDate) / 86400000);
      var st = r['状态'] || '';
      var empName = r['员工'] || '员工';
      var project = r['培训项目'] || '未命名';

      // 初始化提醒日志
      if (!r._reminders) r._reminders = [];
      var reminders = r._reminders;
      function hasSent(type) {
        return reminders.some(function(item) { return item.type === type && item.date === todayStr; });
      }
      function markSent(type) {
        reminders.push({ type: type, date: todayStr, time: now.toLocaleString('zh-CN') });
      }

      // ── 1. 总结提交提醒（多层级：提前3天/提前1天/到期当天/逾期） ──
      var summaryDeadline = new Date(trainDate);
      summaryDeadline.setDate(summaryDeadline.getDate() + 7);
      // 第4天：提前3天提醒
      if (daysSince === 4 && (st === '已通过' || st === '学习中')) {
        if (!hasSent('summary_due_3days')) {
          wechat.triggerNotification('summary_due_3days', {
            employeeName: empName, project: project, trainingDate: r['培训日期'],
            deadline: summaryDeadline.toISOString().slice(0, 10)
          });
          markSent('summary_due_3days'); sentCount++;
        }
      }
      // 第5天：提前2天提醒
      if (daysSince === 5 && (st === '已通过' || st === '学习中')) {
        if (!hasSent('summary_due_soon')) {
          wechat.triggerNotification('summary_due_soon', {
            employeeName: empName, project: project, trainingDate: r['培训日期'],
            deadline: summaryDeadline.toISOString().slice(0, 10), daysLeft: 2
          });
          markSent('summary_due_soon'); sentCount++;
        }
      }
      // 第6天：提前1天提醒
      if (daysSince === 6 && (st === '已通过' || st === '学习中')) {
        if (!hasSent('summary_due_1day')) {
          wechat.triggerNotification('summary_due_1day', {
            employeeName: empName, project: project, trainingDate: r['培训日期'],
            deadline: summaryDeadline.toISOString().slice(0, 10)
          });
          markSent('summary_due_1day'); sentCount++;
        }
      }
      // 第7天：到期当天提醒
      if (daysSince === 7 && (st === '已通过' || st === '学习中')) {
        if (!hasSent('summary_due_7')) {
          wechat.triggerNotification('summary_overdue', {
            employeeName: empName, project: project, trainingDate: r['培训日期'], daysOverdue: 0
          });
          markSent('summary_due_7'); sentCount++;
        }
      }
      // 第8天起：每3天提醒一次（已逾期）
      if (daysSince >= 8 && (st === '已通过' || st === '学习中')) {
        var overdueType = 'summary_overdue_' + daysSince;
        if (!hasSent(overdueType)) {
          wechat.triggerNotification('summary_overdue', {
            employeeName: empName, project: project, trainingDate: r['培训日期'], daysOverdue: daysSince - 7
          });
          markSent(overdueType); sentCount++;
        }
      }

      // ── 2. 30天自评提醒（多层级：提前3天/提前2天/提前1天/到期当天/逾期） ──
      var self30Deadline = new Date(trainDate);
      self30Deadline.setDate(self30Deadline.getDate() + 30);
      // 第27天：提前3天提醒
      if (daysSince === 27 && st === '待评审' && !r['30天自评内容']) {
        if (!hasSent('self30_due_3days')) {
          wechat.triggerNotification('self30_due_3days', {
            employeeName: empName, project: project, trainingDate: r['培训日期'],
            deadline: self30Deadline.toISOString().slice(0, 10)
          });
          markSent('self30_due_3days'); sentCount++;
        }
      }
      // 第28天：提前2天提醒
      if (daysSince === 28 && st === '待评审' && !r['30天自评内容']) {
        if (!hasSent('self30_due_soon')) {
          wechat.triggerNotification('self30_due_soon', {
            employeeName: empName, project: project, trainingDate: r['培训日期'],
            deadline: self30Deadline.toISOString().slice(0, 10), daysLeft: 2
          });
          markSent('self30_due_soon'); sentCount++;
        }
      }
      // 第29天：提前1天提醒
      if (daysSince === 29 && st === '待评审' && !r['30天自评内容']) {
        if (!hasSent('self30_due_1day')) {
          wechat.triggerNotification('self30_due_1day', {
            employeeName: empName, project: project, trainingDate: r['培训日期'],
            deadline: self30Deadline.toISOString().slice(0, 10)
          });
          markSent('self30_due_1day'); sentCount++;
        }
      }
      // 第30天：到期当天提醒
      if (daysSince === 30 && st === '待评审' && !r['30天自评内容']) {
        if (!hasSent('self30_due_30')) {
          wechat.triggerNotification('self30_overdue', {
            employeeName: empName, project: project, trainingDate: r['培训日期'], daysOverdue: 0
          });
          markSent('self30_due_30'); sentCount++;
        }
      }
      // 第31天起：每7天提醒一次（已逾期）
      if (daysSince >= 31 && st === '待评审' && !r['30天自评内容']) {
        var self30Type = 'self30_overdue_' + daysSince;
        if (!hasSent(self30Type)) {
          wechat.triggerNotification('self30_overdue', {
            employeeName: empName, project: project, trainingDate: r['培训日期'], daysOverdue: daysSince - 30
          });
          markSent(self30Type); sentCount++;
        }
      }

      // ── 3. HR评审提醒（总结已提交但未评审，每天提醒HR一次） ──
      if (st === '总结已提交') {
        if (!hasSent('review_pending_' + todayStr)) {
          wechat.triggerNotification('review_pending', {
            employeeName: empName, project: project, trainingDate: r['培训日期'],
            submittedDate: r['总结日期'] || '未记录'
          });
          markSent('review_pending_' + todayStr); sentCount++;
        }
      }

      // ── 4. 员工90天自评提醒（30天已回访后，第88天提前/第90天到期） ──
      if (st === '30天已回访' && !r['90天自评内容']) {
        var self90Deadline = new Date(trainDate);
        self90Deadline.setDate(self90Deadline.getDate() + 90);
        // 第88天：提前2天提醒员工
        if (daysSince === 88) {
          if (!hasSent('self90_due_soon')) {
            wechat.triggerNotification('eval90_due_soon', {
              employeeName: empName, project: project, trainingDate: r['培训日期'],
              deadline: self90Deadline.toISOString().slice(0, 10), daysLeft: 2
            });
            markSent('self90_due_soon'); sentCount++;
          }
        }
        // 第90天：到期当天提醒员工
        if (daysSince === 90) {
          if (!hasSent('self90_due')) {
            wechat.triggerNotification('eval90_due', {
              employeeName: empName, project: project, trainingDate: r['培训日期']
            });
            markSent('self90_due'); sentCount++;
          }
        }
        // 第91天起：每7天提醒一次（已逾期）
        if (daysSince >= 91) {
          var self90Type = 'self90_overdue_' + daysSince;
          if (!hasSent(self90Type)) {
            wechat.triggerNotification('eval90_due', {
              employeeName: empName, project: project, trainingDate: r['培训日期']
            });
            markSent(self90Type); sentCount++;
          }
        }
      }

      // ── 5. HR 90天评估提醒（员工已提交自评但HR未评估） ──
      if (st === '30天已回访' && r['90天自评内容'] && !r['评估分数']) {
        var eval90Key = 'eval90_hr_' + todayStr;
        if (!hasSent(eval90Key)) {
          wechat.triggerNotification('eval90_due', {
            employeeName: empName, project: project, trainingDate: r['培训日期']
          });
          markSent(eval90Key); sentCount++;
        }
      }
    });

    if (sentCount > 0) {
      safeWrite(db);
      console.log('  [Reminders] Sent ' + sentCount + ' notifications at ' + now.toLocaleString('zh-CN'));
    }
  } catch (e) {
    console.log('  [Reminders] Error: ' + e.message);
  }
}

function scheduleReminders() {
  var now = new Date();
  var next = new Date(now);
  next.setHours(9, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  var delay = next - now;
  console.log('  [Reminders] First check at ' + next.toLocaleString('zh-CN'));
  setTimeout(function() {
    checkReminders();
    setInterval(checkReminders, 24 * 60 * 60 * 1000);
  }, delay);
}
scheduleReminders();

// 初始化数据库（已由db-adapter自动完成）

server.listen(PORT, '0.0.0.0', function() {
  console.log('');
  console.log('  Server running');
  console.log('  Local:   http://localhost:' + PORT);
  if (LAN_IP) console.log('  Network: http://' + LAN_IP + ':' + PORT);
  var tokenCount = Object.keys(TOKENS).length;
  if (tokenCount > 0) console.log('  Tokens:  ' + tokenCount + ' active session(s) restored');
  console.log('');
});
