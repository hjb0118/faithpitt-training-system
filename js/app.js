(function() {
  var API = window.location.origin + '/api';
  var ME = null;
  var TOKEN = localStorage.getItem('tvt_token') || '';
  var ALL_DATA = [];
  var ALL_LOGS = [];
  var ALL_NOTIFS = [];
  var ALL_USERS = [];

  var SELECTED = {};
  var ALL_DEPTS = [];
  var CAL_DATE = new Date();

  // ─── Lucide 图标图鉴 ───
  var ICONS = {
    chart:      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    clipboard:  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
    edit:      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    star:       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    calendar:   '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    check:      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    user:       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    bell:       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    users:      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    scroll:     '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    settings:   '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    book:       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    'book-open': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    // ─── 以下为内容区 emoji 替换 SVG（inline）───
    bookmark:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    lightbulb:  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
    target:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    triangle:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    xcircle:    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    party:      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.5-3 3 3-1 3"/><path d="M11.3 5.8 22 2l-3 10.5-3 3-3-1z"/><path d="M22 2 14.5 9.5"/><path d="M18.5 2 10 10.5"/></svg>',
    search:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    mail:       '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    trendingup: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    yen:        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    plus:       '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    megaphone:  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
    clock:      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    zap:        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    link:       '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    gift:       '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
    folder:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    database:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    handshake:  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17a4 4 0 0 0 5-5l-5 5z"/><path d="M7 17a4 4 0 0 1 5-5l-5 5z"/><path d="M18 7l-3 3"/><path d="M6 7l3 3"/><path d="M18 12l-6 6"/><path d="M6 12l6 6"/></svg>',
    // ─── 补充内容区 emoji 替换 ───
    upload:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    lock:       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    paperclip:  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    archive:    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
    tag:        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    building:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    graduation: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    clock2:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    wave:       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    hourglass:  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>'
  };

  var CURRENT_PAGE = '';

  function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  // ─── 计算培训记录的逾期状态 ───
  function getOverdueInfo(r) {
    var now = new Date();
    var trainDate = r['培训日期'] ? new Date(r['培训日期']) : null;
    if (!trainDate || isNaN(trainDate)) return null;
    var daysSince = Math.floor((now - trainDate) / 86400000);
    var st = r['状态'] || '';

    // 总结逾期
    if ((st === '已通过' || st === '学习中') && daysSince > 7) {
      return { type: 'summary', days: daysSince - 7, label: '总结逾期' + (daysSince - 7) + '天', color: '#D9534F' };
    }
    // 30天自评逾期（仅对已评审通过的记录）
    if (st === '待评审' && !r['30天自评内容'] && daysSince > 30) {
      return { type: 'self30', days: daysSince - 30, label: '30天逾期' + (daysSince - 30) + '天', color: '#D9534F' };
    }
    // 总结即将到期（还剩1-2天）
    if ((st === '已通过' || st === '学习中') && daysSince >= 5 && daysSince <= 7) {
      return { type: 'summary_soon', days: 7 - daysSince, label: '剩' + (7 - daysSince) + '天', color: '#C4B800' };
    }
    // 30天即将到期（还剩1-2天，仅对已评审通过的记录）
    if (st === '待评审' && !r['30天自评内容'] && daysSince >= 28 && daysSince <= 30) {
      return { type: 'self30_soon', days: 30 - daysSince, label: '剩' + (30 - daysSince) + '天', color: '#C4B800' };
    }
    // 90天复盘逾期（30天已回访 + 未提交90天自评）
    if (st === '30天已回访' && !r['90天自评内容'] && daysSince > 90) {
      return { type: 'self90', days: daysSince - 90, label: '复盘逾期' + (daysSince - 90) + '天', color: '#D9534F' };
    }
    // 90天即将到期（还剩1-2天）
    if (st === '30天已回访' && !r['90天自评内容'] && daysSince >= 88 && daysSince <= 90) {
      return { type: 'self90_soon', days: 90 - daysSince, label: '复盘剩' + (90 - daysSince) + '天', color: '#C4B800' };
    }
    return null;
  }

  // ─── 移动端侧边栏切换 ───
  window.toggleSidebar = function() {
    var sidebar = document.getElementById('mainSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      overlay.style.display = 'none';
    } else {
      sidebar.classList.add('open');
      overlay.style.display = 'block';
    }
  };
  function fmt(n) { return (parseFloat(n)||0).toLocaleString('zh-CN'); }

  function authHeaders() {
    var h = {};
    if (TOKEN) h['Authorization'] = 'Bearer ' + TOKEN;
    return h;
  }

  function handleAuthError(r) {
    if (r.status === 401 || (r.ok === false && r.msg === '请先登录')) {
      TOKEN = ''; localStorage.removeItem('tvt_token'); localStorage.removeItem('tvt_user'); ME = null;
      document.getElementById('appLayout').classList.remove('on');
      document.getElementById('loginPage').style.display = 'flex';
      toast('登录已过期，请重新登录');
      return true;
    }
    return false;
  }

  function apiGet(action, params) {
    var url = API + '?action=' + encodeURIComponent(action);
    if (params) {
      for (var k in params) {
        url = url + '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }
    }
    return fetch(url, { headers: authHeaders() }).then(function(r) { return r.json().then(function(j) { j._status = r.status; if (handleAuthError(j)) throw 'auth'; return j; }); }).catch(function(e) { if (e === 'auth') return { ok: false }; toast('网络错误，请检查连接'); return { ok: false }; });
  }

  function apiPost(action, data) {
    var body = { action: action };
    if (data) {
      for (var k in data) {
        body[k] = data[k];
      }
    }
    return fetch(API, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify(body)
    }).then(function(r) { return r.json().then(function(j) { j._status = r.status; if (handleAuthError(j)) throw 'auth'; return j; }); }).catch(function(e) { if (e === 'auth') return { ok: false }; toast('网络错误，请检查连接'); return { ok: false }; });
  }

  // 文件上传专用（不设 Content-Type，让浏览器自动生成 boundary）
  function apiUpload(fd) {
    return fetch(API, {
      method: 'POST',
      headers: authHeaders(),
      body: fd
    }).then(function(r) { return r.json().then(function(j) { j._status = r.status; if (handleAuthError(j)) throw 'auth'; return j; }); }).catch(function(e) { if (e === 'auth') return { ok: false }; toast('网络错误，请检查连接'); return { ok: false }; });
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('sh');
    setTimeout(function() { t.classList.remove('sh'); }, 2500);
  }

  // ─── 附件预览 ───
  window.previewFile = function(url, name) {
    var overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    var isPdf = /\.pdf$/i.test(name || '');
    var isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(name || '');
    var html = '<button class="preview-close" onclick="this.parentElement.remove()">✕</button>';
    if (isImg) {
      html += '<img src="' + url + '" alt="' + (name || '') + '">';
    } else if (isPdf) {
      html += '<iframe src="' + url + '" title="' + (name || '') + '"></iframe>';
    } else {
      html += '<div style="color:#fff;font-size:16px">无法预览此文件类型</div>';
    }
    html += '<div class="preview-toolbar"><a href="' + url + '" target="_blank">📥 下载</a><a href="' + url + '" download="' + (name || '') + '">💾 另存为</a></div>';
    overlay.innerHTML = html;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  };

    function refreshData() {
    var p1 = apiGet('getRecords', { user: ME.name, role: ME.role });
    var p2 = apiGet('getLogs');
    var p3 = apiGet('getNotifications', { user: ME.name });
    var p4 = ME.role === 'hr' ? apiGet('getUsers') : Promise.resolve({ ok: true, data: [] });
    var p5 = apiGet('getDepts');
    return Promise.all([p1, p2, p3, p4, p5]).then(function(r) {
      if (r[0].ok) ALL_DATA = r[0].data || [];
      if (r[1].ok) ALL_LOGS = r[1].data || [];
      if (r[2].ok) ALL_NOTIFS = r[2].data || [];
      if (r[3].ok) ALL_USERS = r[3].data || [];
      if (r[4].ok) ALL_DEPTS = r[4].data || [];
      updateDatalist();
    });
  }


  function checkReminders() {
    // 本地计算提醒，无需额外接口
    checkRemindersEnhanced();
  }

  // Check if first time
  apiGet('checkFirst').then(function(r) {
    if (r.ok && r.isFirst) {
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('registerForm').style.display = 'block';
      var si = document.getElementById('serverInfo');
      si.innerHTML = '首次使用，请创建管理员账号';
      si.style.display = 'block';
      return;
    }
    // ─── 企业微信 OAuth 免登录 ───
    var urlParams = new URLSearchParams(window.location.search);
    var wecomToken = urlParams.get('wecom_token');
    if (wecomToken) {
      // 清除 URL 中的 token 参数（安全考虑）
      window.history.replaceState({}, '', window.location.pathname);
      TOKEN = wecomToken;
      localStorage.setItem('tvt_token', TOKEN);
      // 用 token 获取用户信息并进入系统
      apiGet('getRecords').then(function(r2) {
        if (r2.ok) {
          // 获取当前用户信息（通过 checkAuth）
          apiGet('checkAuth').then(function(authR) {
            if (authR.ok && authR.user) {
              localStorage.setItem('tvt_user', JSON.stringify(authR.user));
              ME = authR.user;
              enterApp();
            } else {
              TOKEN = ''; localStorage.removeItem('tvt_token');
              toast('企微登录失败，请手动登录');
            }
          });
        } else {
          TOKEN = ''; localStorage.removeItem('tvt_token');
          toast('企微登录失败，请手动登录');
        }
      });
      return;
    }
    // 尝试自动登录（token + user 信息都在 localStorage）
    if (TOKEN) {
      var storedUser = localStorage.getItem('tvt_user');
      if (storedUser) {
        try {
          ME = JSON.parse(storedUser);
          // 验证 token 是否仍然有效
          apiGet('getRecords').then(function(r2) {
            if (r2.ok) {
              enterApp();
            } else {
              // Token 过期，清除并要求手动登录
              TOKEN = ''; localStorage.removeItem('tvt_token'); localStorage.removeItem('tvt_user');
            }
          });
        } catch(e) {
          localStorage.removeItem('tvt_user');
        }
      }
    }
  });
  document.getElementById('loginBtn').addEventListener('click', function() {
    var u = document.getElementById('loginUser').value.trim();
    var p = document.getElementById('loginPwd').value;
    if (!u || !p) { toast('请输入用户名和密码'); return; }
    apiPost('login', { username: u, password: p }).then(function(r) {
      if (!r.ok) { toast(r.msg || '登录失败'); return; }
      TOKEN = r.token;
      localStorage.setItem('tvt_token', TOKEN);
      localStorage.setItem('tvt_user', JSON.stringify(r.user));
      ME = r.user;
      enterApp();
    });
  });

  document.getElementById('regBtn').addEventListener('click', function() {
    var u = document.getElementById('regUser').value.trim();
    var p = document.getElementById('regPwd').value;
    var n = document.getElementById('regName').value.trim();
    var d = document.getElementById('regDept').value.trim();
    if (!u || !p || !n) { toast('请填写必填项'); return; }
    apiPost('register', { username: u, password: p, name: n, role: 'hr', dept: d, _role: 'setup' }).then(function(r) {
      if (r.ok) { toast('账号创建成功，请登录'); document.getElementById('registerForm').style.display = 'none'; document.getElementById('loginForm').style.display = 'block'; document.getElementById('loginUser').value = u; }
      else toast(r.msg || '创建失败');
    });
  });

  document.getElementById('backLogin').addEventListener('click', function() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  });

  function doLogout() {
    apiPost('logout', {});
    TOKEN = ''; localStorage.removeItem('tvt_token'); localStorage.removeItem('tvt_user');
    ME = null; SELECTED = {};
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
    document.getElementById('appLayout').classList.remove('on');
    document.getElementById('loginPage').style.display = 'flex';
  }

  var _refreshTimer = null;
  function enterApp() {
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appLayout').classList.add('on');
    buildNav();
    document.getElementById('userInfo').textContent = ME.name + ' (' + (ME.role === 'hr' ? 'HR管理员' : '员工') + ')';
    // 品牌化欢迎语
    var hr = new Date().getHours();
    var greet = hr < 12 ? '上午好' : hr < 14 ? '中午好' : hr < 18 ? '下午好' : '晚上好';
    var wm = document.getElementById('welcomeMsg');
    if (wm) wm.textContent = greet + '，' + ME.name;
    refreshData().then(function() {
      if (ME.role === 'hr') go('dash');
      else go('my');
      checkReminders();
      showGuide();
      // 员工登录后主动展示待办摘要
      if (ME.role !== 'hr') {
        showEmployeeLoginTips();
      }
      // 首次登录提示改密码
      if (!localStorage.getItem('pwd_changed_' + ME.username)) {
        setTimeout(function() {
          var h = '<div style="font-size:14px;color:#555;line-height:1.8;margin-bottom:12px">';
          h += '当前密码为系统初始密码，建议立即修改为专属密码，保护账号安全。';
          h += '</div>';
          h += '<div class="fa" style="padding-top:10px;border-top:1px solid #f0eeeb">';
          h += '<button class="bt" id="pwd-skip">稍后再说</button>';
          h += '<button class="bt btp" id="pwd-goto">立即修改</button>';
          h += '</div>';
          openM('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> 建议修改密码', h);
          document.getElementById('pwd-skip').addEventListener('click', function() {
            localStorage.setItem('pwd_changed_' + ME.username, '1');
            closeM();
          });
          document.getElementById('pwd-goto').addEventListener('click', function() {
            localStorage.setItem('pwd_changed_' + ME.username, '1');
            closeM();
            go('set');
          });
        }, 1000);
      }
    });
    _refreshTimer = setInterval(function() { if (ME) refreshData().then(function() { buildNav(); }); }, 20000);
  }

  function showGuide() {
    if (localStorage.getItem('guide_done')) return;
    var h = '<div class="guide-overlay" id="guideOv"><div class="guide-card">';
    h += '<h2>欢迎使用培训价值追踪系统</h2>';
    h += '<p>';
    h += '<div class="step"><div class="step-num">1</div><div>HR创建员工账号（系统设置 > 用户管理）</div></div>';
    h += '<div class="step"><div class="step-num">2</div><div>员工登录后提交培训申请</div></div>';
    h += '<div class="step"><div class="step-num">3</div><div>HR在"所有记录"中审批</div></div>';
    h += '<div class="step"><div class="step-num">4</div><div>培训结束后员工提交学习总结</div></div>';
    h += '<div class="step"><div class="step-num">5</div><div>30天后HR回访执行情况</div></div>';
    h += '<div class="step"><div class="step-num">6</div><div>90天后HR评估培训效果</div></div>';
    h += '</p>';
    h += '<button class="bp" id="closeGuide" style="max-width:200px;margin:0 auto">开始使用</button>';
    h += '</div></div>';
    document.body.insertAdjacentHTML('beforeend', h);
    document.getElementById('closeGuide').addEventListener('click', function() {
      document.getElementById('guideOv').remove();
      localStorage.setItem('guide_done', '1');
    });
  }

  document.getElementById('logoutBtn').addEventListener('click', doLogout);
  document.getElementById('dismissReminder').addEventListener('click', function() { document.getElementById('reminderBar').classList.remove('show'); });

  function buildNav() {
    var nav = document.getElementById('sideNav');
    var h = '';
    function ni(iconName, label, page, extra) {
      return '<div class="ni' + (extra || '') + '" data-p="' + page + '"><span class="ni-icon">' + (ICONS[iconName] || iconName) + '</span><span class="ni-label"> ' + label + '</span></div>';
    }
    function group(id, label, items) {
      var collapsed = localStorage.getItem('nav_' + id) === '1';
      var g = '<div class="sb-group" data-g="' + id + '">';
      g += '<div class="sb-group-header' + (collapsed ? ' collapsed' : '') + '">' + label + ' <span class="arrow">▾</span></div>';
      g += '<div class="sb-group-items' + (collapsed ? ' collapsed' : '') + '" style="' + (collapsed ? 'max-height:0' : '') + '">';
      g += items;
      g += '</div></div>';
      return g;
    }
    if (ME.role === 'hr') {
      var mgItems = '';
      mgItems += ni('chart', '数据看板', 'dash', CURRENT_PAGE === 'dash' ? ' on' : '');
      mgItems += ni('clipboard', '所有记录', 'all', CURRENT_PAGE === 'all' ? ' on' : '');
      mgItems += ni('calendar', '培训日历', 'cal', CURRENT_PAGE === 'cal' ? ' on' : '');
      mgItems += ni('check', '本周待办', 'todos', CURRENT_PAGE === 'todos' ? ' on' : '');
      mgItems += ni('user', '成长档案', 'profile', CURRENT_PAGE === 'profile' ? ' on' : '');
      var sysItems = '';
      sysItems += ni('bell', '通知设置', 'notifset', CURRENT_PAGE === 'notifset' ? ' on' : '');
      sysItems += ni('users', '用户管理', 'users', CURRENT_PAGE === 'users' ? ' on' : '');
      sysItems += ni('scroll', '操作日志', 'log', CURRENT_PAGE === 'log' ? ' on' : '');
      sysItems += ni('settings', '系统设置', 'set', CURRENT_PAGE === 'set' ? ' on' : '');
      h = group('mgmt', '管理功能', mgItems);
      h += group('sys', '系统', sysItems);
      h += '<div class="ns">帮助</div>';
      h += ni('book', '使用指南', 'guide', CURRENT_PAGE === 'guide' ? ' on' : '');
    } else {
      var unread = 0;
      for (var i = 0; i < ALL_NOTIFS.length; i++) { if (!ALL_NOTIFS[i].read) unread++; }
      var myItems = '';
      myItems += ni('clipboard', '我的记录', 'my', CURRENT_PAGE === 'my' ? ' on' : '');
      myItems += ni('edit', '提交申请', 'apply', CURRENT_PAGE === 'apply' ? ' on' : '');
      myItems += ni('calendar', '培训日历', 'cal', CURRENT_PAGE === 'cal' ? ' on' : '');
      myItems += ni('check', '本周待办', 'todos', CURRENT_PAGE === 'todos' ? ' on' : '');
      myItems += ni('bell', '消息' + (unread > 0 ? ' (' + unread + ')' : ''), 'notif', CURRENT_PAGE === 'notif' ? ' on' : '');
      myItems += ni('settings', '系统设置', 'set', CURRENT_PAGE === 'set' ? ' on' : '');
      h = group('my', '我的功能', myItems);
      h += '<div class="ns">帮助</div>';
      h += ni('book', '使用指南', 'guide', CURRENT_PAGE === 'guide' ? ' on' : '');
    }
    nav.innerHTML = h;
    // 绑定折叠
    var headers = nav.querySelectorAll('.sb-group-header');
    for (var gh = 0; gh < headers.length; gh++) {
      headers[gh].addEventListener('click', function() {
        var group = this.parentElement;
        var items = group.querySelector('.sb-group-items');
        var isCollapsed = this.classList.toggle('collapsed');
        if (isCollapsed) { items.classList.add('collapsed'); items.style.maxHeight = '0'; }
        else { items.classList.remove('collapsed'); items.style.maxHeight = items.scrollHeight + 'px'; }
        localStorage.setItem('nav_' + group.getAttribute('data-g'), isCollapsed ? '1' : '0');
      });
      // 初始化展开动画
      var g = headers[gh].parentElement;
      var its = g.querySelector('.sb-group-items');
      if (!headers[gh].classList.contains('collapsed')) { its.style.maxHeight = its.scrollHeight + 'px'; }
    }
    var items = nav.querySelectorAll('.ni');
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click', function() {
        var all = nav.querySelectorAll('.ni');
        for (var m = 0; m < all.length; m++) all[m].classList.remove('on');
        this.classList.add('on');
        go(this.getAttribute('data-p'));
      });
    }
  }

  function go(page) {
    CURRENT_PAGE = page;
    var pages = document.querySelectorAll('.pg');
    for (var i = 0; i < pages.length; i++) pages[i].classList.remove('on');
    var el = document.getElementById('p-' + page);
    if (el) el.classList.add('on');
    var navItems = document.querySelectorAll('.ni');
    for (var j = 0; j < navItems.length; j++) {
      if (navItems[j].getAttribute('data-p') === page) navItems[j].classList.add('on');
      else navItems[j].classList.remove('on');
    }
    if (page === 'my') {
      // 同步Tab样式
      var pendingTab = document.getElementById('myTabPending');
      var doneTab = document.getElementById('myTabDone');
      if (MY_TAB === 'pending') {
        pendingTab.style.background = 'var(--primary-dark)'; pendingTab.style.color = '#0D1A08';
        doneTab.style.background = '#fff'; doneTab.style.color = '#666';
      } else {
        doneTab.style.background = 'var(--primary-dark)'; doneTab.style.color = '#0D1A08';
        pendingTab.style.background = '#fff'; pendingTab.style.color = '#666';
      }
      renderMy();
      setTimeout(injectCertButtons, 50);
    }
    if (page === 'dash') renderDash();
    if (page === 'all') renderAll();
    if (page === 'log') renderLog();
    if (page === 'notif') renderNotif();
    if (page === 'notifset') loadWebhookConfig();
    if (page === 'users') { renderUsers(); renderDept(); }
    if (page === 'cal') renderCal();
    if (page === 'apply') {
      // 稍作延迟，等 DOM 完全渲染
      setTimeout(function() {
        updateDatalist();
        loadDraft();
        bindDraftListeners();
      }, 0);
    }
    if (page === 'todos') renderTodos();
    if (page === 'profile') renderProfile();
    if (page === 'summary') {
      // 显示/隐藏30天自评区域
      var sid = document.getElementById('s-id').value;
      var self30Section = document.getElementById('self30-section');
      var sumSubmitBtn = document.getElementById('sumSubmit');
      var self30SubmitBtn = document.getElementById('self30Submit');
      if (sid && self30Section) {
        var sr = findRecord(sid);
        if (sr && sr['状态'] === '待评审' && !sr['30天自评内容']) {
          self30Section.style.display = 'block';
          sumSubmitBtn.style.display = 'none';
          self30SubmitBtn.style.display = 'inline-block';
        } else {
          self30Section.style.display = 'none';
          sumSubmitBtn.style.display = 'inline-block';
          self30SubmitBtn.style.display = 'none';
        }
      }
    }
    if (page === 'set') {
      var isHR = ME.role === 'hr';
      // 角色权限：员工只显示修改密码
      document.getElementById('set-backup').style.display = isHR ? '' : 'none';
      document.getElementById('set-autostart').style.display = isHR ? '' : 'none';
      document.getElementById('set-report').style.display = isHR ? '' : 'none';
      document.getElementById('set-status').style.display = isHR ? '' : 'none';
      // 副标题也按角色调整
      var setPage = document.getElementById('p-set');
      var setSubtitle = setPage.querySelector('.pd');
      if (setSubtitle) setSubtitle.textContent = isHR ? '修改密码、数据备份等' : '修改您的登录密码';
      document.getElementById('serverUrl').textContent = API;
      document.getElementById('connStatus').textContent = '检查中...';
      document.getElementById('connStatus').style.color = '#999';
      apiGet('getRecords', { user: ME.name, role: ME.role }).then(function(r) {
        var el2 = document.getElementById('connStatus');
        if (r.ok) { el2.textContent = '已连接'; el2.style.color = 'var(--success)'; }
        else { el2.textContent = '连接失败'; el2.style.color = 'var(--danger)'; }
      });
      // HR：加载备份列表
      if (isHR) {
        loadBackupList();
      }
    }
  }

  function findRecord(id) {
    for (var i = 0; i < ALL_DATA.length; i++) { if (ALL_DATA[i].ID == id) return ALL_DATA[i]; }
    return null;
  }

  var MY_TAB = 'pending'; // pending | done

  function renderMy() {
    var data = ALL_DATA;
    var tb = document.getElementById('myTb');

    // 根据Tab过滤
    var pendingSt = ['待审批','已通过','学习中','总结已提交','待评审','30天已回访'];
    var doneSt = ['已驳回','已完成'];
    var filtered = data.filter(function(r) {
      if (MY_TAB === 'pending') return pendingSt.indexOf(r['状态']) >= 0;
      return doneSt.indexOf(r['状态']) >= 0;
    });

    // 排序：待处理按紧迫程度
    if (MY_TAB === 'pending') {
      filtered.sort(function(a, b) {
        var order = { '已通过': 0, '待审批': 1, '学习中': 2, '总结已提交': 3, '待评审': 4, '30天已回访': 5 };
        return (order[a['状态']] || 6) - (order[b['状态']] || 6);
      });
    } else {
      filtered.sort(function(a, b) {
        return (b['培训日期'] || '').localeCompare(a['培训日期'] || '');
      });
    }

    if (filtered.length === 0) {
      if (MY_TAB === 'pending') {
        tb.innerHTML = '<tr><td colspan="6"><div class="em"><img src="/uploads/3.png" alt="" style="width:60px;height:60px;margin-bottom:10px" onerror="this.style.display=\'none\'"><p>暂无待处理培训</p><small>提交培训申请后会在这里显示</small><br><span class="es-btn" onclick="go(\'apply\')" style="margin-top:16px;display:inline-block;padding:8px 20px;background:var(--primary-dark);color:#0D1A08;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600">立即申请</span></div></td></tr>';
      } else {
        tb.innerHTML = '<tr><td colspan="6"><div class="em"><img src="/uploads/1 (13).png" alt="" style="width:56px;height:56px;margin-bottom:10px;opacity:0.85" onerror="this.style.display=\'none\'"><p>暂无已完成记录</p><small>完成培训后会显示在这里</small></div></td></tr>';
      }
      return;
    }
    var sc = { '待审批':'bdo','已通过':'bdg','已驳回':'bdr','学习中':'bdb','总结已提交':'bdb','待评审':'bdp','30天已回访':'bdp','已完成':'bdg','已撤回':'bdy' };
    var si = { '待审批':'⏳','已通过':'✅','已驳回':'❌','学习中':'📖','总结已提交':'📝','待评审':'👁️','30天已回访':'🔄','已完成':'🎯','已撤回':'↩️' };
    var h = '';
    var now = new Date();
    for (var k = 0; k < filtered.length; k++) {
      var r = filtered[k];
      var act = '';
      if (r['状态'] === '已通过') act += '<button class="bt bts" data-a="sum" data-id="' + r.ID + '">提交总结</button> ';
      if (r['状态'] === '待审批') act += '<button class="bt bts" data-a="edit" data-id="' + r.ID + '">编辑</button> <button class="bt bts" data-a="withdraw" data-id="' + r.ID + '" style="color:var(--warning);border-color:var(--warning)">撤回</button> ';
      if (r['状态'] === '已撤回') act += '<button class="bt bts btp" data-a="resubmit" data-id="' + r.ID + '" style="font-weight:600">重新提交</button> ';
      if (r['状态'] === '待评审') {
        var d30 = new Date(r['培训日期']);
        if (!isNaN(d30.getTime())) {
          d30.setDate(d30.getDate() + 30);
          if (now >= d30 && !r['30天自评内容']) {
            act += '<button class="bt bts" data-a="self30" data-id="' + r.ID + '" style="background:var(--success);color:#fff;border-color:var(--success)">提交30天自评</button> ';
          }
        }
      }
      // 90天复盘按钮：30天已回访 + 培训日期+90天已到 + 未提交90天自评
      if (r['状态'] === '30天已回访') {
        var d90emp = new Date(r['培训日期']);
        if (!isNaN(d90emp.getTime())) {
          d90emp.setDate(d90emp.getDate() + 90);
          if (now >= d90emp && !r['90天自评内容']) {
            act += '<button class="bt bts" data-a="self90" data-id="' + r.ID + '" style="background:var(--success);color:#fff;border-color:var(--success)">提交90天复盘</button> ';
          }
        }
      }
      act += '<button class="bt bts" data-a="det" data-id="' + r.ID + '">详情</button>';

      // 倒计时/逾期显示
      var extraInfo = '';
      var overdueInfo = getOverdueInfo(r);
      if (overdueInfo) {
        extraInfo = '<div style="font-size:11px;color:' + overdueInfo.color + ';margin-top:2px;font-weight:600">' + overdueInfo.label + '</div>';
      } else if (r['状态'] === '已通过' && !r['总结内容']) {
        var d = new Date(r['培训日期']);
        if (!isNaN(d.getTime())) {
          var daysSince = Math.floor((now - d) / 86400000);
          var remain = 7 - daysSince;
          if (remain > 0) {
            extraInfo = '<div style="font-size:11px;color:' + (remain <= 2 ? 'var(--danger)' : 'var(--warning)') + ';margin-top:2px">距提交总结还剩 <b>' + remain + '</b> 天</div>';
          }
        }
      }
      if (r['状态'] === '待评审') {
        var d2 = new Date(r['培训日期']);
        if (!isNaN(d2.getTime())) {
          d2.setDate(d2.getDate() + 30);
          var diff = Math.floor((d2 - now) / 86400000);
          if (diff > 0) {
            extraInfo = '<div style="font-size:11px;color:var(--info);margin-top:2px">约 ' + diff + ' 天后需回访</div>';
          } else if (diff >= -3) {
            extraInfo = '<div style="font-size:11px;color:var(--warning);margin-top:2px">回访期将至（还剩 ' + Math.abs(diff) + ' 天）</div>';
          } else if (!r['30天自评内容']) {
            extraInfo = '<div style="font-size:11px;color:var(--danger);margin-top:2px">已逾期 ' + Math.abs(diff) + ' 天，请尽快提交30天自评</div>';
          }
        }
      }
      // 90天复盘倒计时（30天已回访状态）
      if (r['状态'] === '30天已回访' && !r['90天自评内容']) {
        var d90count = new Date(r['培训日期']);
        if (!isNaN(d90count.getTime())) {
          d90count.setDate(d90count.getDate() + 90);
          var diff90emp = Math.floor((d90count - now) / 86400000);
          if (diff90emp > 0 && diff90emp <= 7) {
            extraInfo = '<div style="font-size:11px;color:var(--warning);margin-top:2px">距90天复盘还剩 <b>' + diff90emp + '</b> 天</div>';
          } else if (diff90emp <= 0) {
            extraInfo = '<div style="font-size:11px;color:var(--danger);margin-top:2px">90天复盘已逾期 ' + Math.abs(diff90emp) + ' 天，请尽快提交</div>';
          }
        }
      }

      var statusBadge = '<span class="bd ' + (sc[r['状态']] || 'bdy') + '"><span class="bd-icon">' + (si[r['状态']] || '') + '</span>' + esc(r['状态']) + '</span>';
      // 员工端：驳回时显示驳回原因
      if (r['状态'] === '已驳回' && r['HR备注']) {
        statusBadge += '<div style="font-size:11px;color:var(--danger);margin-top:3px;max-width:120px;white-space:normal">原因：' + esc(r['HR备注']) + '</div>';
      }
      // 员工端：已提交总结后可查看自己的总结
      if (r['状态'] !== '待审批' && r['状态'] !== '已通过' && r['总结内容']) {
        act += ' <button class="bt bts" data-a="viewmysum" data-id="' + r.ID + '" style="color:var(--info);border-color:var(--info)">查看总结</button>';
      }
      // 员工端：已提交自评但HR未确认时显示状态
      if (r['状态'] === '待评审' && r['30天自评内容'] && !r['30天执行']) {
        act = '<span class="bd bdp" style="font-size:12px">自评已提交</span> ' + act;
      }
      // 员工端：已提交90天复盘但HR未评估时显示状态
      if (r['状态'] === '30天已回访' && r['90天自评内容'] && !r['评估分数']) {
        act = '<span class="bd bdp" style="font-size:12px">复盘已提交</span> ' + act;
      }
      h += '<tr><td data-label="项目"><div>' + esc(r['培训项目']) + '</div>' + extraInfo + '</td><td data-label="类型">' + esc(r['培训类型'] || '-') + '</td><td data-label="日期">' + esc(r['培训日期']) + '</td><td data-label="费用">¥' + fmt(r['费用'] || 0) + '</td>';
      h += '<td data-label="状态">' + statusBadge + '</td><td data-label="操作">' + act + '</td></tr>';
    }
    tb.innerHTML = h;
    bindTableBtns(tb);
  }

  // Tab切换事件（在 IIFE 末尾初始化）
  document.getElementById('myTabPending').addEventListener('click', function() {
    MY_TAB = 'pending';
    this.style.background = 'var(--primary-dark)'; this.style.color = '#0D1A08';
    document.getElementById('myTabDone').style.background = '#fff'; document.getElementById('myTabDone').style.color = '#666';
    renderMy();
  });
  document.getElementById('myTabDone').addEventListener('click', function() {
    MY_TAB = 'done';
    this.style.background = 'var(--primary-dark)'; this.style.color = '#0D1A08';
    document.getElementById('myTabPending').style.background = '#fff'; document.getElementById('myTabPending').style.color = '#666';
    renderMy();
  });

  function bindTableBtns(tb) {
    var btns = tb.querySelectorAll('button[data-a]');
    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener('click', function() {
        var a = this.getAttribute('data-a');
        var id = this.getAttribute('data-id');
        if (a === 'sum') openSumPage(id);
        if (a === 'det' || a === 'detail') viewDetail(id);
        if (a === 'viewsum') viewSummary(id);
        if (a === 'viewmysum') viewMySummary(id);
        if (a === 'view30') viewVisit30(id);
        if (a === 'self30') openSelf30Modal(id);
        if (a === 'self90') openSelf90Modal(id);
        if (a === 'edit') openEdit(id);
        if (a === 'del') delRec(id);
        if (a === 'withdraw') withdrawApply(id);
        if (a === 'resubmit') resubmitApply(id);
        if (a === 'approve') quickApprove(id, '已通过');
        if (a === 'reject') openRejectModal(id);
        if (a === 'visit30') openVisit30Modal(id);
        if (a === 'archive') doArchive(id);
        if (a === 'urge') urgeSummary(id);
        if (a === 'review') openReviewModal(id);
        if (a === 'eval90') openEval90Modal(id);
      });
    }
  }

  function doArchive(id) {
    var r = findRecord(id);
    if (!r) return;
    var isArchived = !!r._archived;
    if (!confirm(isArchived ? '确定取消归档《' + r['培训项目'] + '》？' : '确定归档《' + r['培训项目'] + '》？\n\n归档后可随时在筛选栏勾选「归档」查看和恢复。')) return;
    apiPost('updateRecord', { id: id, data: { _archived: !isArchived } }).then(function(res) {
      if (res.ok) {
        toast((isArchived ? '已取消归档 ✓' : '已归档 ✓'));
        refreshData().then(function() { renderAll(); });
      } else toast('操作失败');
    });
  }

  function urgeSummary(id) {
    var r = findRecord(id);
    if (!r) return;
    var odi = getOverdueInfo(r);
    var isSelf30 = odi && odi.type === 'self30';
    var isSelf90 = odi && odi.type === 'self90';
    var trainDate = new Date(r['培训日期']);
    var now = new Date();
    var daysSince = Math.floor((now - trainDate) / 86400000);
    var daysOverdue = isSelf30 ? Math.max(0, daysSince - 30) : isSelf90 ? Math.max(0, daysSince - 90) : Math.max(0, daysSince - 7);
    var urgeType = isSelf30 ? 'self30' : isSelf90 ? 'self90' : 'summary';
    var typeName = isSelf30 ? '30天行动自评' : isSelf90 ? '90天培训复盘' : '学习总结';
    var title = '确认催缴《' + r['培训项目'] + '》的' + typeName + '？';
    var detail = '员工：' + r['员工'] + '\n培训日期：' + r['培训日期'] + '\n已逾期：' + daysOverdue + '天\n\n催缴通知将发送到企业微信群。';
    openConfirmModal(title, detail, function() {
      apiPost('urgeSummary', { recordId: id, urgeType: urgeType }).then(function(res) {
        if (res.ok) {
          toast('催缴通知已发送 ✓');
          refreshData().then(function() { renderAll(); });
        } else {
          toast('催缴失败：' + (res.msg || ''));
        }
      });
    });
  }

  function viewDetail(id) {
    var r = findRecord(id);
    if (!r) return;
    var isHRViewer = ME.role === 'hr';
    var h = '<div style="font-size:14px;line-height:2">';
    h += '<div>状态：' + esc(r['状态']) + '</div>';
    h += '<div>类型：' + esc(r['培训类型'] || '-') + '  日期：' + esc(r['培训日期']) + '  费用：' + esc(r['费用'] || 0) + '</div>';
    h += '<div>目标：' + esc(r['学习目标'] || '-') + '</div>';
    h += '<div>产出：' + esc(r['承诺产出'] || '-') + '</div>';
    if (r['总结内容']) h += '<hr style="margin:10px 0;border:none;border-top:1px solid #eee"><div>学习总结：</div><div style="white-space:pre-wrap">' + esc(r['总结内容']) + '</div>';
    if (r['行动计划']) h += '<div>行动计划：</div><div style="white-space:pre-wrap">' + esc(r['行动计划']) + '</div>';
    if (r['培训前评分'] && r['培训后评分']) {
      var gain = parseInt(r['培训后评分']) - parseInt(r['培训前评分']);
      h += '<div style="margin-top:8px;padding:8px 12px;background:#e8f2ec;border-radius:6px;font-size:13px">能力提升：培训前 ' + esc(r['培训前评分']) + '/5 → 培训后 ' + esc(r['培训后评分']) + '/5（<b>+' + gain + '</b>）</div>';
    }
    if (r['30天自评内容']) h += '<hr style="margin:10px 0;border:none;border-top:1px solid #eee"><div style="font-weight:600;color:#059669;margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 30天自评</div><div style="white-space:pre-wrap;line-height:1.6">' + esc(r['30天自评内容']) + '</div>';
    if (r['30天执行']) {
      h += '<hr style="margin:10px 0;border:none;border-top:1px solid #eee"><div style="font-weight:600;color:#8B6BA8;margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> HR确认回访</div><div>确认结果：' + esc(r['30天执行']) + '</div>';
      if (isHRViewer) h += '<div>' + esc(r['回访详情'] || '') + '</div>';
    }
    // 90天复盘（员工自评）
    if (r['90天自评内容']) {
      h += '<hr style="margin:10px 0;border:none;border-top:1px solid #eee"><div style="font-weight:600;color:#1D4ED8;margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 90天复盘</div>';
      h += '<div style="white-space:pre-wrap;line-height:1.6">' + esc(r['90天自评内容']) + '</div>';
      if (r['90天自评日期']) h += '<div style="font-size:12px;color:#999;margin-top:4px">提交于 ' + esc(r['90天自评日期']) + '</div>';
    }
    if (r['评估分数']) {
      h += '<hr style="margin:10px 0;border:none;border-top:1px solid #eee"><div style="font-weight:600;color:#D4A017;margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 90天效果评估</div>';
      h += '<div>评估日期：' + esc(r['评估日期'] || '-') + '　评分：<b>' + esc(r['评估分数']) + '/5</b>　推荐：' + esc(r['推荐程度'] || '-') + '</div>';
      if (isHRViewer && r['评估意见']) h += '<div style="margin-top:4px;white-space:pre-wrap">' + esc(r['评估意见']) + '</div>';
    }

    if (isHRViewer && r['HR备注']) h += '<hr style="margin:10px 0;border:none;border-top:1px solid #eee"><div>HR备注：' + esc(r['HR备注']) + '</div>';
    if (r._files && r._files.length) {
      h += '<hr style="margin:10px 0;border:none;border-top:1px solid #eee"><div style="font-weight:600;margin-bottom:6px">附件（' + r._files.length + '个）：</div>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
      for (var fi = 0; fi < r._files.length; fi++) {
        var fitem = r._files[fi];
        var isImg2 = /\.(png|jpg|jpeg|gif|webp)$/i.test(fitem.name);
        var fileUrl2 = '/uploads/' + fitem.saved + '?token=' + encodeURIComponent(TOKEN);
        if (isImg2) {
          h += '<div style="border:1px solid #e5e3df;border-radius:6px;overflow:hidden;width:100px;text-align:center">';
          h += '<a href="javascript:void(0)" onclick="previewFile(\'' + fileUrl2.replace(/'/g,"\\'") + '\',\'' + esc(fitem.name).replace(/'/g,"\\'") + '\')" style="cursor:pointer"><img src="' + fileUrl2 + '" style="width:100px;height:80px;object-fit:cover;display:block"></a>';
          h += '<div style="font-size:11px;padding:3px 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#555">' + esc(fitem.name) + '</div>';
          h += '</div>';
        } else {
          var ext2 = (fitem.name || '').split('.').pop().toUpperCase();
          var sizeTxt = fitem.size ? (fitem.size > 1048576 ? (fitem.size/1048576).toFixed(1)+'MB' : Math.round(fitem.size/1024)+'KB') : '';
          var canPreview = /\.(pdf)$/i.test(fitem.name);
          h += '<div style="border:1px solid #e5e3df;border-radius:6px;padding:8px 10px;min-width:100px;text-align:center">';
          h += '<div style="font-size:20px;margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>';
          h += '<div style="font-size:11px;font-weight:600;color:#555">' + ext2 + '</div>';
          if (canPreview) {
            h += '<a href="javascript:void(0)" onclick="previewFile(\'' + fileUrl2.replace(/'/g,"\\'") + '\',\'' + esc(fitem.name).replace(/'/g,"\\'") + '\')" style="font-size:11px;color:var(--primary);text-decoration:none;display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer">' + esc(fitem.name) + '</a>';
          } else {
            h += '<a href="' + fileUrl2 + '" target="_blank" style="font-size:11px;color:var(--primary);text-decoration:none;display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(fitem.name) + '</a>';
          }
          if (sizeTxt) h += '<div style="font-size:10px;color:#999">' + sizeTxt + '</div>';
          h += '</div>';
        }
      }
      h += '</div>';
    }
    h += '</div>';
    openM(r['培训项目'] + ' - 详情', h);
  }

  // 员工查看自己提交的总结（精简版，无HR评分等敏感信息）
  function viewMySummary(id) {
    var r = findRecord(id);
    if (!r || !r['总结内容']) { toast('暂无总结内容'); return; }
    var h = '<div style="font-size:14px;line-height:1.8">';
    h += '<div style="background:#f5f8f5;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px">';
    h += '<div><span style="color:#999">培训日期：</span>' + esc(r['培训日期'] || '-') + '</div>';
    h += '<div><span style="color:#999">提交状态：</span><span class="bd bdb">总结已提交</span></div>';
    h += '</div>';
    if (r['学习目标']) {
      h += '<div style="margin-bottom:12px"><div style="font-weight:600;color:#333;margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> 当初的学习目标</div>';
      h += '<div style="background:#fff;border:1px solid #e5e3df;border-radius:6px;padding:10px 14px;white-space:pre-wrap;color:#666">' + esc(r['学习目标']) + '</div></div>';
    }
    var rawSum = r['总结内容'] || '';
    function extractSec(text, label) {
      var re = new RegExp('[【\\[]' + label + '[】\\]][\\s\\S]*?\\n([\\s\\S]*?)(?=[【\\[]|$)');
      var m = text.match(re);
      return m ? m[1].trim() : '';
    }
    var sec1 = extractSec(rawSum, '核心收获');
    var sec2 = extractSec(rawSum, '与目标对比');
    var sec3 = extractSec(rawSum, '30天行动计划');
    var secMet = extractSec(rawSum, '可衡量指标');
    var secVerify = extractSec(rawSum, '30天后怎么验证');
    var secSupport = extractSec(rawSum, '需要的支持');
    var hasSecs = sec1 || sec2 || sec3 || secMet || secVerify || secSupport;
    if (hasSecs) {
      var secs = [
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>', title: '核心收获', content: sec1 },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', title: '与目标对比', content: sec2 },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>', title: '30天行动计划', content: sec3 || r['行动计划'] },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="M15 5l4 4"/><path d="M12.672 8.672 16 12"/></svg>', title: '可衡量指标', content: secMet || r['可衡量指标'] },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', title: '30天后如何验证', content: secVerify },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="4" r="2"/><path d="M12 6v4"/><path d="M9.11 11.11 6.5 8.5"/><path d="M14.89 11.11 17.5 8.5"/><path d="M6 8.5c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4 0-1.62-1.01-3.02-2.44-3.57"/><path d="M8 19l-1 3"/><path d="M16 19l1 3"/><path d="M12 14v7"/></svg>', title: '需要的支持', content: secSupport }
      ];
      for (var si = 0; si < secs.length; si++) {
        var s = secs[si];
        if (!s.content) continue;
        h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:13px">' + s.icon + ' ' + s.title + '</div>';
        h += '<div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;white-space:pre-wrap;color:#444;line-height:1.7">' + esc(s.content) + '</div></div>';
      }
    } else {
      h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 学习总结</div>';
      h += '<div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;white-space:pre-wrap;color:#444;line-height:1.7">' + esc(rawSum) + '</div></div>';
      if (r['行动计划']) {
        h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 行动计划</div>';
        h += '<div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;white-space:pre-wrap;color:#444;line-height:1.7">' + esc(r['行动计划']) + '</div></div>';
      }
    }
    // 30天回访（如已回访，仅显示执行情况，不显示HR详细备注）
    if (r['30天执行']) {
      h += '<hr style="margin:14px 0;border:none;border-top:2px dashed var(--border)">';
      h += '<div style="background:linear-gradient(135deg,#F3EFF9,#EEE6F5);border:1px solid #d7bef7;border-radius:var(--radius-md);padding:10px 14px;color:#555">';
      h += '<div style="font-weight:700;color:#8B6BA8;margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 30天回访结果</div>';
      h += '<div><span style="color:#999">执行情况：</span><b>' + esc(r['30天执行']) + '</b></div>';
      if (r['回访日期']) h += '<div><span style="color:#999">回访日期：</span>' + esc(r['回访日期']) + '</div>';
      h += '</div>';
    }
    // 30天自评内容（员工自己查看）
    if (r['30天自评内容']) {
      h += '<hr style="margin:14px 0;border:none;border-top:2px dashed var(--border)">';
      h += '<div style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border:1px solid #6EE7B7;border-radius:var(--radius-md);padding:12px 16px">';
      h += '<div style="font-weight:700;color:#047857;margin-bottom:8px;font-size:14px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 我的30天自评</div>';
      h += '<div style="white-space:pre-wrap;line-height:1.7;color:#374151;font-size:13px">' + esc(r['30天自评内容']) + '</div>';
      if (r['自评提交日期']) h += '<div style="margin-top:8px;font-size:12px;color:#6B7280">提交于 ' + esc(r['自评提交日期']) + '</div>';
      h += '</div>';
    }
    // HR确认结果（如果已确认）
    if (r['30天执行']) {
      h += '<hr style="margin:14px 0;border:none;border-top:2px dashed var(--border)">';
      h += '<div style="background:linear-gradient(135deg,#F3EFF9,#EEE6F5);border:1px solid #d7bef7;border-radius:var(--radius-md);padding:10px 14px">';
      h += '<div style="font-weight:700;color:#8B6BA8;margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> HR确认回访</div>';
      h += '<div><span style="color:#999">确认结果：</span><b>' + esc(r['30天执行']) + '</b></div>';
      if (r['回访日期']) h += '<div><span style="color:#999">回访日期：</span>' + esc(r['回访日期']) + '</div>';
      h += '</div>';
    }
    // 90天复盘（员工自己查看）
    if (r['90天自评内容']) {
      h += '<hr style="margin:14px 0;border:none;border-top:2px dashed var(--border)">';
      h += '<div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #93C5FD;border-radius:var(--radius-md);padding:12px 16px">';
      h += '<div style="font-weight:700;color:#1D4ED8;margin-bottom:8px;font-size:14px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 我的90天复盘</div>';
      h += '<div style="white-space:pre-wrap;line-height:1.7;color:#374151;font-size:13px">' + esc(r['90天自评内容']) + '</div>';
      if (r['90天自评日期']) h += '<div style="margin-top:8px;font-size:12px;color:#6B7280">提交于 ' + esc(r['90天自评日期']) + '</div>';
      h += '</div>';
    }
    // HR最终评估结果（如果已完成）
    if (r['评估分数']) {
      h += '<hr style="margin:14px 0;border:none;border-top:2px dashed var(--border)">';
      h += '<div style="background:linear-gradient(135deg,#FEFCE8,#FEF9C3);border:1px solid #FDE047;border-radius:var(--radius-md);padding:12px 16px">';
      h += '<div style="font-weight:700;color:#A16207;margin-bottom:8px;font-size:14px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> HR最终评估</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">';
      h += '<div><span style="color:#999">评分：</span><b>' + esc(r['评估分数']) + '/5</b></div>';
      h += '<div><span style="color:#999">推荐程度：</span><b>' + esc(r['推荐程度'] || '-') + '</b></div>';
      if (r['评估日期']) h += '<div><span style="color:#999">评估日期：</span>' + esc(r['评估日期']) + '</div>';
      h += '</div>';
      h += '</div>';
    }
    h += '</div>';
    openM('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 我的学习总结 — ' + esc(r['培训项目']), h, '660px');
  }

function viewSummary(id) {
    var r = findRecord(id);
    if (!r) return;
    var isHRUser = ME.role === 'hr';
    var h = '<div style="font-size:14px;line-height:1.8">';
    // 头部信息栏
    h += '<div style="background:#f5f8f5;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;font-size:13px">';
    h += '<div><span style="color:#999">员工：</span><b>' + esc(r['员工']) + '</b></div>';
    h += '<div><span style="color:#999">部门：</span>' + esc(r['部门'] || '-') + '</div>';
    h += '<div><span style="color:#999">培训日期：</span>' + esc(r['培训日期'] || '-') + '</div>';
    h += '<div><span style="color:#999">状态：</span><span class="bd ' + ({'总结已提交':'bdb','30天已回访':'bdp','已完成':'bdg'}[r['状态']] || 'bdy') + '">' + esc(r['状态']) + '</span></div>';
    if (r['培训前评分'] && r['培训后评分']) {
      var gain = parseInt(r['培训后评分']) - parseInt(r['培训前评分']);
      var gainColor = gain > 0 ? 'var(--success)' : gain === 0 ? 'var(--warning)' : 'var(--danger)';
      h += '<div style="grid-column:1/-1"><span style="color:#999">能力评分：</span>培训前 <b>' + esc(r['培训前评分']) + '</b>/5 → 培训后 <b>' + esc(r['培训后评分']) + '</b>/5（<b style="color:' + gainColor + '">' + (gain >= 0 ? '+' : '') + gain + '</b>）</div>';
    }
    h += '</div>';
    // 学习目标与承诺产出
    if (r['学习目标']) {
      h += '<div style="margin-bottom:12px"><div style="font-weight:600;color:#333;margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> 本次培训目标</div>';
      h += '<div style="background:#fff;border:1px solid #e5e3df;border-radius:6px;padding:10px 14px;white-space:pre-wrap;color:#555">' + esc(r['学习目标']) + '</div></div>';
    }
    // 总结内容（解析多字段）
    var rawSum = r['总结内容'] || '';
    // 尝试提取各章节
    function extractSection(text, label) {
      var re = new RegExp('[【\\[]' + label + '[】\\]][\\s\\S]*?\\n([\\s\\S]*?)(?=[【\\[]|$)');
      var m = text.match(re);
      return m ? m[1].trim() : '';
    }
    var sec1 = extractSection(rawSum, '核心收获');
    var sec2 = extractSection(rawSum, '与目标对比');
    var sec3 = extractSection(rawSum, '30天行动计划');
    var secMet = extractSection(rawSum, '可衡量指标');
    var secVerify = extractSection(rawSum, '30天后怎么验证');
    var secSupport = extractSection(rawSum, '需要的支持');
    var hasSections = sec1 || sec2 || sec3 || secMet || secVerify || secSupport;
    if (hasSections) {
      var sections = [
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>', title: '核心收获', content: sec1 },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', title: '与目标对比', content: sec2 },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>', title: '30天行动计划', content: sec3 || r['行动计划'] },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="M15 5l4 4"/><path d="M12.672 8.672 16 12"/></svg>', title: '可衡量指标', content: secMet || r['可衡量指标'] },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', title: '30天后如何验证', content: secVerify },
        { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="4" r="2"/><path d="M12 6v4"/><path d="M9.11 11.11 6.5 8.5"/><path d="M14.89 11.11 17.5 8.5"/><path d="M6 8.5c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4 0-1.62-1.01-3.02-2.44-3.57"/><path d="M8 19l-1 3"/><path d="M16 19l1 3"/><path d="M12 14v7"/></svg>', title: '需要的支持', content: secSupport }
      ];
      for (var si = 0; si < sections.length; si++) {
        var s = sections[si];
        if (!s.content) continue;
        h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:13px">' + s.icon + ' ' + s.title + '</div>';
        h += '<div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;white-space:pre-wrap;color:#444;line-height:1.7">' + esc(s.content) + '</div></div>';
      }
    } else {
      // 没有结构化内容，直接展示原文
      h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 学习总结</div>';
      h += '<div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;white-space:pre-wrap;color:#444;line-height:1.7">' + esc(rawSum) + '</div></div>';
      if (r['行动计划']) {
        h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 行动计划</div>';
        h += '<div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;white-space:pre-wrap;color:#444;line-height:1.7">' + esc(r['行动计划']) + '</div></div>';
      }
      if (r['可衡量指标']) {
        h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="M15 5l4 4"/><path d="M12.672 8.672 16 12"/></svg> 可衡量指标</div>';
        h += '<div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;white-space:pre-wrap;color:#444;line-height:1.7">' + esc(r['可衡量指标']) + '</div></div>';
      }
    }
    // 30天自评内容（HR查看）
    if (r['30天自评内容']) {
      h += '<hr style="margin:14px 0;border:none;border-top:2px dashed var(--border)">';
      h += '<div style="margin-bottom:8px"><div style="font-weight:700;color:#059669;margin-bottom:8px;font-size:14px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 员工30天自评</div>';
      h += '<div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:var(--radius-md);padding:12px 16px;margin-bottom:8px">';
      h += '<div style="white-space:pre-wrap;line-height:1.7;color:#374151;font-size:13px">' + esc(r['30天自评内容']) + '</div>';
      if (r['自评提交日期']) h += '<div style="margin-top:8px;font-size:12px;color:#6B7280">员工自评于 ' + esc(r['自评提交日期']) + '</div>';
      h += '</div>';
    }
    // HR确认回访（员工已自评但HR未确认）
    if (r['30天自评内容'] && !r['30天执行'] && !r._isEmployee) {
      h += '<div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:var(--radius-md);padding:12px 16px;margin-bottom:8px">';
      h += '<div style="font-weight:600;color:#B45309;margin-bottom:8px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> HR确认回访</div>';
      h += '<div class="fg fl" style="margin-bottom:12px"><label style="font-size:13px">确认结果 *</label>';
      h += '<select id="hr30-confirm-result" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px"><option value="">请选择</option><option>已执行</option><option>部分执行</option><option>未执行</option></select></div>';
      h += '<div class="fg fl" style="margin-bottom:12px"><label style="font-size:13px">HR备注</label>';
      h += '<textarea id="hr30-confirm-note" rows="2" placeholder="补充说明或建议" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px"></textarea></div>';
      h += '<button class="bt btp" onclick="doConfirm30Visit(\'' + r.ID + '\')" style="font-size:13px;padding:8px 20px">确认回访</button>';
      h += '</div>';
    }
    // 30天回访结果（已确认）
    if (r['30天执行']) {
      h += '<hr style="margin:14px 0;border:none;border-top:2px dashed var(--border)">';
      h += '<div style="margin-bottom:8px"><div style="font-weight:700;color:#8B6BA8;margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 30天确认回访</div>';
      h += '<div style="background:linear-gradient(135deg,#F3EFF9,#EEE6F5);border:1px solid #d7bef7;border-radius:var(--radius-md);padding:10px 14px;color:#555">';
      h += '<div><span style="color:var(--text-muted)">确认结果：</span><b>' + esc(r['30天执行']) + '</b></div>';
      if (r['回访日期']) h += '<div><span style="color:var(--text-muted)">确认日期：</span>' + esc(r['回访日期']) + '</div>';
      if (r['回访详情']) h += '<div style="margin-top:6px;white-space:pre-wrap;line-height:1.7">' + esc(r['回访详情']) + '</div>';
      h += '</div></div>';
    }

    // 附件
    if (r._files && r._files.length) {
      h += '<hr style="margin:14px 0;border:none;border-top:2px dashed var(--border)">';
      h += '<div style="font-weight:700;color:var(--text);margin-bottom:8px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> 附件（' + r._files.length + '个）</div>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:10px">';
      for (var fi = 0; fi < r._files.length; fi++) {
        var fitem = r._files[fi];
        var isImg2 = /\.(png|jpg|jpeg|gif|webp)$/i.test(fitem.name);
        var sizeTxt = fitem.size ? (fitem.size > 1048576 ? (fitem.size/1048576).toFixed(1)+'MB' : Math.round(fitem.size/1024)+'KB') : '';
        if (isImg2) {
          h += '<div style="border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;max-width:130px;text-align:center;background:#fff">';
          h += '<a href="/uploads/' + fitem.saved + '?token=' + encodeURIComponent(TOKEN) + '" target="_blank" title="' + esc(fitem.name) + '"><img src="/uploads/' + fitem.saved + '?token=' + encodeURIComponent(TOKEN) + '" style="width:130px;height:100px;object-fit:cover;display:block"></a>';
          h += '<div style="font-size:11px;padding:5px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);font-weight:500" title="' + esc(fitem.name) + '">' + esc(fitem.name) + '</div>';
          if (sizeTxt || fitem.time) h += '<div style="font-size:10px;color:var(--text-muted);padding:0 6px 5px">' + sizeTxt + (sizeTxt && fitem.time ? ' · ' : '') + (fitem.time ? fitem.time.slice(0,10) : '') + '</div>';
          h += '</div>';
        } else {
          var ext2 = (fitem.name || '').split('.').pop().toUpperCase();
          h += '<div style="border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px;min-width:110px;max-width:160px;text-align:center;background:#fff">';
          h += '<div style="font-size:22px;margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>';
          h += '<div style="font-size:11px;font-weight:700;color:var(--text)">' + ext2 + '</div>';
          h += '<a href="/uploads/' + fitem.saved + '?token=' + encodeURIComponent(TOKEN) + '" target="_blank" style="font-size:11px;color:var(--primary);text-decoration:none;display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px" title="' + esc(fitem.name) + '">' + esc(fitem.name) + '</a>';
          if (sizeTxt || fitem.time) h += '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">' + sizeTxt + (sizeTxt && fitem.time ? ' · ' : '') + (fitem.time ? fitem.time.slice(0,10) : '') + '</div>';
          h += '</div>';
        }
      }
      h += '</div>';
    }
    h += '</div>';
    openM('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> ' + esc(r['培训项目']) + ' — 学习总结', h, '840px');
  }

  // ─── 申请表单质量实时检查 ───
  function checkApplyQuality() {
    var proj = document.getElementById('a-proj').value.trim();
    var date = document.getElementById('a-date').value;
    var cost = document.getElementById('a-cost').value;
    var goal = document.getElementById('a-goal').value.trim();
    var scene = document.getElementById('a-scene').value.trim();
    var out = document.getElementById('a-out').value.trim();
    function setChk(id, ok) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = (ok ? '●' : '○') + ' ' + el.innerHTML.slice(el.innerHTML.indexOf(' ')+1);
      if (el) el.style.color = ok ? 'var(--success)' : '#999';
    }
    setChk('chk-proj', !!proj);
    setChk('chk-date', !!date);
    setChk('chk-cost', !!cost);
    setChk('chk-goal', goal.length >= 20);
    setChk('chk-scene', !!scene);
    setChk('chk-out', out.split(/[\n,，]/).filter(function(s) { return s.trim().length >= 5; }).length >= 2);
    return { proj: proj, date: date, cost: cost, goal: goal, scene: scene, out: out };
  }
  // 绑定实时检查
  ['a-proj','a-date','a-cost','a-goal','a-scene','a-out'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', checkApplyQuality);
  });

  function submitApply() {
    var q = checkApplyQuality();
    if (!q.proj || !q.date || !q.cost || !q.goal || !q.scene || !q.out) { toast('请填写所有必填项'); return; }
    if (q.goal.length < 20) { toast('学习目标请详细描述，不少于20字'); return; }
    var outItems = q.out.split(/[\n,，]/).filter(function(s) { return s.trim().length >= 5; });
    if (outItems.length < 2) { toast('承诺产出请至少填写2项具体内容'); return; }
    var applyBtn = document.getElementById('applySubmit');
    if (applyBtn.disabled) return;
    applyBtn.disabled = true; applyBtn.textContent = '提交中...';
    var record = {
      '员工': ME.name, '部门': ME.dept, '职级': '',
      '培训项目': q.proj, '培训机构': document.getElementById('a-org').value.trim(),
      '培训类型': document.getElementById('a-type').value,
      '培训日期': q.date, '费用': parseFloat(q.cost) || 0,
      '地点': document.getElementById('a-loc').value.trim(),
      '学习目标': q.goal, '应用场景': q.scene, '承诺产出': q.out, '状态': '待审批',
      'HR备注': '', '总结内容': '', '行动计划': '', '可衡量指标': '',
      '30天执行': '', '回访日期': '', '回访详情': '',
      '评估分数': '', '评估日期': '', '评估意见': '', '推荐程度': ''
    };
    apiPost('addRecord', { data: record }).then(function(res) {
      if (res.ok) {
        toast('申请已提交 ✓');
        ['a-proj','a-org','a-date','a-cost','a-loc','a-goal','a-scene','a-out'].forEach(function(id) { document.getElementById(id).value = ''; });
        document.getElementById('a-type').value = '';
        clearDraft();
        refreshData().then(function() { go('my'); });
      } else {
        toast('提交失败：' + (res.msg || ''));
      }
      applyBtn.disabled = false; applyBtn.textContent = '提交申请';
    });
  }

  document.getElementById('applySubmit').addEventListener('click', submitApply);
  document.getElementById('applyCancel').addEventListener('click', function() { go('my'); });

  // ─── 30天自评弹窗 ───
  function openSelf30Modal(id) {
    var r = findRecord(id);
    if (!r) return;

    // 提取原始总结中的行动计划（支持多种标题格式）
    var rawSum = r['总结内容'] || '';
    var planMatch = rawSum.match(/【30天行动计划】[\s\S]*?\n([\s\S]*?)(?=\【|$)/)
      || rawSum.match(/【怎么用到工作中】[\s\S]*?\n([\s\S]*?)(?=\【|$)/)
      || rawSum.match(/【行动计划】[\s\S]*?\n([\s\S]*?)(?=\【|$)/);
    var originalPlan = planMatch ? planMatch[1].trim() : (r['行动计划'] || '（未填写）');

    var h = '<div style="font-size:14px;line-height:1.8">';

    // 原始行动计划提示
    h += '<div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px 16px;margin-bottom:16px">';
    h += '<div style="font-weight:600;color:#C2410C;margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> 当初承诺的行动计划</div>';
    h += '<div style="color:#7C2D12;white-space:pre-wrap;font-size:13px">' + esc(originalPlan) + '</div>';
    h += '</div>';

    h += '<div class="fg fl"><label>① 行动计划完成情况 *</label><textarea id="m30-plan-status" rows="3" placeholder="逐项说明完成情况"></textarea></div>';
    h += '<div class="fg fl"><label>② 实际应用案例 *</label><textarea id="m30-practice" rows="3" placeholder="举1-2个具体案例"></textarea></div>';
    h += '<div class="fg fl"><label>③ 遇到的困难</label><textarea id="m30-difficulty" rows="2" placeholder="如实描述"></textarea></div>';
    h += '<div class="fg fl"><label>④ 需要什么支持</label><textarea id="m30-need" rows="2" placeholder="时间、工具、协作等"></textarea></div>';
    h += '<div class="fg fl"><label>⑤ 总体评价</label><select id="m30-rating"><option value="">请选择</option><option>非常满意</option><option>比较满意</option><option>一般</option><option>不太满意</option><option>很不满意</option></select></div>';
    h += '<div class="fg fl"><label>⑥ 其他想说的</label><textarea id="m30-comment" rows="2" placeholder=""></textarea></div>';
    h += '<div class="fa" style="margin-top:20px"><button class="bt" id="m30-cancel">取消</button><button class="bt btp" id="m30-submit">提交自评</button></div>';
    h += '</div>';
    openM('30天行动自评 — ' + esc(r['培训项目']), h, '580px');
    // 绑定取消和提交按钮事件（innerHTML不会执行script，所以用事件监听器）
    document.getElementById('m30-cancel').addEventListener('click', closeM);
    document.getElementById('m30-submit').addEventListener('click', function() { doSubmitSelf30(id); });
  }

  function doSubmitSelf30(id) {
    var planStatus = document.getElementById('m30-plan-status').value.trim();
    var practice = document.getElementById('m30-practice').value.trim();
    if (!planStatus || !practice) { toast('请填写完成情况和应用案例'); return; }

    var difficulty = document.getElementById('m30-difficulty').value.trim();
    var need = document.getElementById('m30-need').value.trim();
    var rating = document.getElementById('m30-rating').value;
    var comment = document.getElementById('m30-comment').value.trim();

    // 组合自评内容
    var self30Content = '【行动计划完成情况】\n' + planStatus;
    if (difficulty) self30Content += '\n\n【遇到的困难】\n' + difficulty;
    if (need) self30Content += '\n\n【需要支持】\n' + need;
    if (rating) self30Content += '\n\n【总体评价】\n' + rating;
    if (comment) self30Content += '\n\n【其他】\n' + comment;

    toast('提交中...');
    apiPost('updateRecord', {
      id: id,
      data: {
        '30天自评内容': self30Content,
        '自评提交日期': new Date().toLocaleDateString('zh-CN')
      }
    }).then(function(res) {
      if (res.ok) {
        toast('自评已提交，等待HR确认 ✓');
        closeM();
        refreshData().then(function() { renderMy(); });
        // 通知HR有新自评待确认
        apiPost('triggerNotify', {
          type: 'self30_submitted',
          data: {
            employeeName: ME.name,
            project: findRecord(id)['培训项目'],
            date: new Date().toLocaleDateString('zh-CN')
          }
        });
      } else {
        toast('提交失败');
      }
    });
  }

  // ─── 90天复盘弹窗（员工提交） ───
  function openSelf90Modal(id) {
    var r = findRecord(id);
    if (!r) return;

    // 提取原始学习目标供参考
    var origGoal = r['学习目标'] || '（未填写）';

    var h = '<div style="font-size:14px;line-height:1.8">';

    // 原始学习目标提示
    h += '<div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px 16px;margin-bottom:16px">';
    h += '<div style="font-weight:600;color:#C2410C;margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> 当初的学习目标</div>';
    h += '<div style="color:#7C2D12;white-space:pre-wrap;font-size:13px">' + esc(origGoal) + '</div>';
    h += '</div>';

    h += '<div class="fg fl"><label>① 培训内容在实际工作中的应用效果 *</label><textarea id="m90-effect" rows="3" placeholder="描述培训知识如何应用到实际工作中"></textarea></div>';
    h += '<div class="fg fl"><label>② 培训带来的具体成果（数据/案例） *</label><textarea id="m90-result" rows="3" placeholder="请用具体数据或案例说明，如：效率提升X%、新增X个客户等"></textarea></div>';
    h += '<div class="fg fl"><label>③ 哪些目标达成了，哪些没达成</label><textarea id="m90-goal" rows="3" placeholder="对照当初的学习目标逐项说明"></textarea></div>';
    h += '<div class="fg fl"><label>④ 对培训的长期价值评价</label><select id="m90-value"><option value="">请选择</option><option>非常有价值</option><option>有价值</option><option>一般</option><option>没价值</option></select></div>';
    h += '<div class="fg fl"><label>⑤ 其他建议或反馈</label><textarea id="m90-comment" rows="2" placeholder="如：是否值得推荐给其他同事、改进建议等"></textarea></div>';
    h += '<div class="fa" style="margin-top:20px"><button class="bt" id="m90-cancel">取消</button><button class="bt btp" id="m90-submit" style="background:var(--success);color:#fff;border-color:var(--success)">提交90天复盘</button></div>';
    h += '</div>';
    openM('90天培训复盘 — ' + esc(r['培训项目']), h, '580px');
    document.getElementById('m90-cancel').addEventListener('click', closeM);
    document.getElementById('m90-submit').addEventListener('click', function() { doSubmitSelf90(id); });
  }

  function doSubmitSelf90(id) {
    var effect = document.getElementById('m90-effect').value.trim();
    var result = document.getElementById('m90-result').value.trim();
    if (!effect || !result) { toast('请填写应用效果和具体成果'); return; }

    var goal = document.getElementById('m90-goal').value.trim();
    var value = document.getElementById('m90-value').value;
    var comment = document.getElementById('m90-comment').value.trim();

    // 组合自评内容
    var self90Content = '【应用效果】\n' + effect;
    self90Content += '\n\n【具体成果】\n' + result;
    if (goal) self90Content += '\n\n【目标达成情况】\n' + goal;
    if (value) self90Content += '\n\n【长期价值评价】\n' + value;
    if (comment) self90Content += '\n\n【其他建议】\n' + comment;

    toast('提交中...');
    apiPost('updateRecord', {
      id: id,
      data: {
        '90天自评内容': self90Content,
        '90天自评日期': new Date().toLocaleDateString('zh-CN')
      }
    }).then(function(res) {
      if (res.ok) {
        toast('90天复盘已提交，等待HR评估 ✓');
        closeM();
        refreshData().then(function() { renderMy(); });
        // 通知HR有新的90天复盘待评估
        apiPost('triggerNotify', {
          type: 'self90_submitted',
          data: {
            employeeName: ME.name,
            project: findRecord(id)['培训项目'],
            date: new Date().toLocaleDateString('zh-CN')
          }
        });
      } else {
        toast('提交失败');
      }
    });
  }

  // HR确认30天回访
  function doConfirm30Visit(id) {
    var result = document.getElementById('hr30-confirm-result').value;
    var note = document.getElementById('hr30-confirm-note').value.trim();
    if (!result) { toast('请选择确认结果'); return; }

    var updateData = {
      '30天执行': result,
      '回访日期': new Date().toLocaleDateString('zh-CN'),
      '状态': '30天已回访'
    };
    if (note) updateData['回访详情'] = note;

    apiPost('updateRecord', { id: id, data: updateData }).then(function(res) {
      if (res.ok) {
        toast('回访已确认 ✓');
        closeM();
        refreshData().then(function() { renderAll(); });
        var r = findRecord(id);
        if (r) {
          apiPost('triggerNotify', {
            type: '30visit_confirmed',
            data: {
              employeeName: r['员工'],
              project: r['培训项目'],
              result: result,
              date: updateData['回访日期']
            }
          });
        }
      } else {
        toast('操作失败');
      }
    });
  }

  function openSumPage(id) {
    var r = findRecord(id);
    if (!r) return;
    document.getElementById('s-id').value = id;
    document.getElementById('s-proj').textContent = r['培训项目'];
    // 显示原始学习目标和承诺产出
    var goalEl = document.getElementById('s-orig-goal');
    var outEl = document.getElementById('s-orig-out');
    if (goalEl) goalEl.textContent = r['学习目标'] || '（未填写）';
    if (outEl) outEl.textContent = r['承诺产出'] || '（未填写）';
    document.getElementById('s-gain').value = '';
    document.getElementById('s-before').value = '';
    document.getElementById('s-after').value = '';
    document.getElementById('s-plan').value = '';
    document.getElementById('s-met').value = '';
    document.getElementById('s-support').value = '';
    document.getElementById('s-files').innerHTML = '';
    go('summary');
  }

  document.getElementById('s-file').addEventListener('change', function() {
    var files = this.files;
    var html = '';
    var hasOversize = false;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var sizeMB = (f.size / 1024 / 1024).toFixed(1);
      var oversize = f.size > 10 * 1024 * 1024;
      if (oversize) hasOversize = true;
      var isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name);
      html += '<div class="file-item" style="' + (oversize ? 'color:var(--danger)' : '') + '">';
      if (isImg) {
        // 图片预览缩略图
        var url = URL.createObjectURL(f);
        html += '<img src="' + url + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid #ddd;flex-shrink:0">';
      } else {
        // 非图片显示文件类型图标
        var ext = f.name.split('.').pop().toUpperCase();
        html += '<span style="width:40px;height:40px;background:#f0eeea;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#999;flex-shrink:0">' + ext + '</span>';
      }
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + f.name + '</div>';
      html += '<div style="font-size:11px;color:' + (oversize ? 'var(--danger)' : 'var(--text-muted)') + '">' + sizeMB + ' MB' + (oversize ? ' <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> 超过10MB限制' : '') + '</div>';
      html += '</div></div>';
    }
    if (hasOversize) {
      html += '<div style="font-size:12px;color:var(--danger);margin-top:4px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> 部分文件超过 10MB，提交时将被服务器拒绝</div>';
    }
    document.getElementById('s-files').innerHTML = html;
  });

  function uploadFiles(recordId) {
    var files = document.getElementById('s-file').files;
    if (!files.length) return Promise.resolve();
    var promises = [];
    for (var i = 0; i < files.length; i++) {
      var fd = new FormData();
      fd.append('recordId', recordId);
      fd.append('_operator', ME.name);
      fd.append('file', files[i]);
      promises.push(apiUpload(fd));
    }
    return Promise.all(promises);
  }

  // ─── 总结表单质量实时检查 ───
  function checkSummaryQuality() {
    var gain = document.getElementById('s-gain').value.trim();
    var before = document.getElementById('s-before').value;
    var after = document.getElementById('s-after').value;
    var plan = document.getElementById('s-plan').value.trim();
    var met = document.getElementById('s-met').value.trim();
    var ok = gain.length >= 30 && before && after && plan.length >= 20 && met.length >= 10;
    var btn = document.getElementById('sumSubmit');
    if (btn) btn.style.opacity = ok ? '1' : '0.6';
    return { gain: gain, before: before, after: after, plan: plan, met: met, ok: ok };
  }
  ['s-gain','s-before','s-after','s-plan','s-met'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', checkSummaryQuality);
  });

  document.getElementById('sumSubmit').addEventListener('click', function() {
    var id = document.getElementById('s-id').value;
    var q = checkSummaryQuality();
    if (!q.gain || !q.before || !q.after || !q.plan) { toast('请填写所有必填项'); return; }
    if (q.gain.length < 30) { toast('收获请详细描述，不少于30字'); return; }
    if (q.plan.length < 20) { toast('应用计划请详细描述，不少于20字'); return; }
    if (q.met.length < 10) { toast('请填写可衡量指标（不少于10字），便于30天后验证'); return; }
    var sumBtn = document.getElementById('sumSubmit');
    if (sumBtn.disabled) return;
    sumBtn.disabled = true; sumBtn.textContent = '提交中...';
    var sumText = '【最大收获】\n' + q.gain + '\n\n【培训前了解程度】' + q.before + '/5\n【培训后提升程度】' + q.after + '/5\n\n【怎么用到工作中】\n' + q.plan;
    if (document.getElementById('s-support').value.trim()) {
      sumText += '\n\n【需要的支持】\n' + document.getElementById('s-support').value.trim();
    }
    apiPost('updateRecord', {
      id: id, _operator: ME.name,
      data: {
        '总结内容': sumText,
        '行动计划': q.plan,
        '可衡量指标': q.met,
        '培训前评分': q.before,
        '培训后评分': q.after,
        '状态': '总结已提交'
      }
    }).then(function(res) {
      if (res.ok) {
        var empName = ME.name, projName = document.getElementById('s-proj') ? document.getElementById('s-proj').textContent : '';
        uploadFiles(id).then(function() {
          toast('总结已提交');
          refreshData().then(function() { go('my'); });
          apiPost('triggerNotify', {
            type: 'summary_submitted',
            data: {
              employeeName: empName,
              project: projName || '培训',
              date: new Date().toLocaleDateString('zh-CN')
            }
          });
        });
      } else toast('提交失败');
      sumBtn.disabled = false; sumBtn.textContent = '提交总结';
    });
  });
  document.getElementById('sumCancel').addEventListener('click', function() { go('my'); });

  function renderNotif() {
    var el = document.getElementById('notifList');
    if (ALL_NOTIFS.length === 0) { el.innerHTML = '<div class="em"><p>暂无通知</p></div>'; return; }
    var unreadIds = [];
    for (var u = 0; u < ALL_NOTIFS.length; u++) { if (!ALL_NOTIFS[u].read) unreadIds.push(ALL_NOTIFS[u].id); }
    if (unreadIds.length > 0) {
      apiPost('markRead', { ids: unreadIds }).then(function() { buildNav(); });
    }
    var h = '';
    for (var i = 0; i < ALL_NOTIFS.length; i++) {
      var n = ALL_NOTIFS[i];
      // Try to extract project name from message for click-to-view
      var projMatch = n.message.match(/《([^》]+)》/);
      var recordId = '';
      if (projMatch) {
        for (var ri = 0; ri < ALL_DATA.length; ri++) {
          if (ALL_DATA[ri]['培训项目'] === projMatch[1]) { recordId = ALL_DATA[ri].ID; break; }
        }
      }
      h += '<div class="cd" style="border-left:3px solid ' + (!n.read ? 'var(--primary)' : 'var(--border)') + ';' + (recordId ? 'cursor:pointer' : '') + '"' + (recordId ? ' data-notif-id="' + recordId + '"' : '') + ' data-nid="' + esc(n.id) + '">';
      h += '<div style="font-size:12px;color:#999;margin-bottom:4px">' + esc(n.time) + '</div>';
      h += '<div style="font-size:14px;line-height:1.6">' + esc(n.message) + (recordId ? ' <span style="color:var(--info);font-size:12px;font-weight:600">点击查看 →</span>' : '') + '</div></div>';
    }
    el.innerHTML = h;
    // Bind click handlers - 点击即标记已读
    var cards = el.querySelectorAll('[data-notif-id]');
    for (var ci = 0; ci < cards.length; ci++) {
      cards[ci].addEventListener('click', function() {
        var nid = this.getAttribute('data-nid');
        if (nid) {
          apiPost('markRead', { ids: [nid] });
          var found = ALL_NOTIFS.find(function(x) { return x.id === nid; });
          if (found) found.read = true;
        }
        viewDetail(this.getAttribute('data-notif-id'));
      });
    }
  }

  function renderBarChart(containerId, items, color) {
    var el = document.getElementById(containerId);
    if (!items.length) { el.innerHTML = '<div style="font-size:13px;color:#999;padding:20px;text-align:center">暂无数据</div>'; return; }
    var max = 0;
    for (var i = 0; i < items.length; i++) { if (items[i].value > max) max = items[i].value; }
    if (max === 0) max = 1;
    var h = '';
    for (var j = 0; j < items.length; j++) {
      var pct = Math.round(items[j].value / max * 120);
      if (pct < 6 && items[j].value > 0) pct = 6;
      h += '<div class="bar-item">';
      h += '<div class="bar-v" style="font-weight:600">' + items[j].label2 + '</div>';
      h += '<div class="bar" style="height:' + pct + 'px;background:' + color + '"></div>';
      h += '<div class="bar-l">' + items[j].label + '</div>';
      h += '</div>';
    }
    el.innerHTML = h;
  }

  function renderDash() {
    var total = ALL_DATA.length;
    var cost = 0;
    var pending = 0, sumDone = 0, actDone = 0, actTotal = 0;
    var todoCount = 0;
    var nowDash = new Date();
    var weekEndDash = new Date(nowDash);
    weekEndDash.setDate(weekEndDash.getDate() + 7);
    for (var i = 0; i < ALL_DATA.length; i++) {
      var r = ALL_DATA[i];
      cost += (parseFloat(r['费用']) || 0);
      if (r['状态'] === '待审批') pending++;
      if (r['总结内容']) sumDone++;
      if (r['30天执行']) { actTotal++; if (r['30天执行'] !== '未执行') actDone++; }

      // Count todos (aligned with renderTodos)
      if (r['状态'] === '已通过' && !r['总结内容']) todoCount++;
      if (r['状态'] === '待评审' && !r['30天执行'] && r['30天自评内容']) {
        var dd = new Date(r['培训日期']);
        if (!isNaN(dd.getTime())) { dd.setDate(dd.getDate() + 30); if (dd <= weekEndDash) todoCount++; }
      }
      // 90天待办计数
      if (r['状态'] === '30天已回访' && !r['评估分数'] && r['90天自评内容']) {
        var dd90 = new Date(r['培训日期']);
        if (!isNaN(dd90.getTime())) { dd90.setDate(dd90.getDate() + 90); if (dd90 <= weekEndDash) todoCount++; }
      }

    }
    var sh = '';
    sh += '<div class="st"><div class="st-l">培训总支出（元）</div><div class="st-v g">¥' + fmt(cost) + '</div></div>';
    sh += '<div class="st"><div class="st-l">培训次数</div><div class="st-v">' + total + '</div></div>';
    sh += '<div class="st" style="cursor:pointer" id="dashTodoCard"><div class="st-l">待处理事项</div><div class="st-v ' + (todoCount > 0 ? 'r' : 'g') + '">' + todoCount + '</div></div>';
    sh += '<div class="st"><div class="st-l">待审批</div><div class="st-v o">' + pending + '</div></div>';
    document.getElementById('statsRow').innerHTML = sh;
    var todoCard = document.getElementById('dashTodoCard');
    if (todoCard) todoCard.addEventListener('click', function() { go('todos'); });

    // HR专属：待处理快捷卡片
    var pendingCardsEl = document.getElementById('dashPendingCards');
    var pendingApprovals = 0, pendingSummaries = 0, pendingReviews = 0, pending30 = 0, pending90 = 0;
    var now = new Date();
    for (var pi = 0; pi < ALL_DATA.length; pi++) {
      var pr = ALL_DATA[pi];
      if (pr['状态'] === '待审批') pendingApprovals++;
      if (pr['状态'] === '已通过' && !pr['总结内容']) pendingSummaries++;
      if (pr['状态'] === '总结已提交') pendingReviews++;
      if (pr['状态'] === '待评审' && !pr['30天执行'] && pr['30天自评内容']) pending30++;
      if (pr['状态'] === '30天已回访' && !pr['评估分数'] && pr['90天自评内容']) {
        var d90 = new Date(pr['培训日期']);
        if (!isNaN(d90.getTime())) {
          d90.setDate(d90.getDate() + 90);
          if (d90 <= new Date(now.getTime() + 7 * 86400000)) pending90++;
        }
      }
    }
    var totalPending = pendingApprovals + pendingSummaries + pendingReviews + pending30 + pending90;
    if (ME.role === 'hr' && totalPending > 0) {
      pendingCardsEl.style.display = 'block';
      var ph = '<div style="display:flex;gap:10px;flex-wrap:wrap">';
      if (pendingApprovals > 0) ph += '<div class="st" style="cursor:pointer;flex:1;min-width:120px" data-filter="待审批"><div class="st-l">待审批</div><div class="st-v o">' + pendingApprovals + '条</div></div>';
      if (pendingSummaries > 0) ph += '<div class="st" style="cursor:pointer;flex:1;min-width:120px" data-filter="sum"><div class="st-l">待提交总结</div><div class="st-v o">' + pendingSummaries + '条</div></div>';
      if (pendingReviews > 0) ph += '<div class="st" style="cursor:pointer;flex:1;min-width:120px" data-filter="review"><div class="st-l">待评审</div><div class="st-v r">' + pendingReviews + '条</div></div>';
      if (pending30 > 0) ph += '<div class="st" style="cursor:pointer;flex:1;min-width:120px" data-filter="30"><div class="st-l">待30天回访</div><div class="st-v r">' + pending30 + '条</div></div>';
      if (pending90 > 0) ph += '<div class="st" style="cursor:pointer;flex:1;min-width:120px" data-filter="90"><div class="st-l">待90天评估</div><div class="st-v r">' + pending90 + '条</div></div>';
      ph += '</div>';
      pendingCardsEl.innerHTML = ph;
      // 绑定点击事件
      var cardItems = pendingCardsEl.querySelectorAll('[data-filter]');
      for (var ci = 0; ci < cardItems.length; ci++) {
        cardItems[ci].addEventListener('click', (function(filter) {
          return function() {
            if (filter === 'sum') {
              go('all');
              var sel = document.getElementById('f-st');
              if (sel) { sel.value = '已通过'; sel.dispatchEvent(new Event('change')); }
            } else if (filter === 'review') {
              go('all');
              var selR = document.getElementById('f-st');
              if (selR) { selR.value = '总结已提交'; selR.dispatchEvent(new Event('change')); }
            } else if (filter === '30') {
              go('all');
              var sel2 = document.getElementById('f-st');
              if (sel2) { sel2.value = '待评审'; sel2.dispatchEvent(new Event('change')); }
            } else if (filter === '90') {
              go('all');
              var sel90 = document.getElementById('f-st');
              if (sel90) { sel90.value = '30天已回访'; sel90.dispatchEvent(new Event('change')); }
            } else {
              go('all');
              var sel4 = document.getElementById('f-st');
              if (sel4) { sel4.value = filter; sel4.dispatchEvent(new Event('change')); }
            }
          };
        })(cardItems[ci].getAttribute('data-filter')));
      }
    } else {
      pendingCardsEl.style.display = 'none';
    }

    // Secondary metrics (compact)
    var metricsEl = document.getElementById('metricsRow');
    var metricsCard = document.getElementById('metricsCard');
    var mh = '';
    mh += '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">总结提交率</div><div style="font-size:18px;font-weight:700">' + (total ? Math.round(sumDone / total * 100) : 0) + '%</div></div>';
    mh += '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">行动执行率</div><div style="font-size:18px;font-weight:700;color:var(--warning)">' + (actTotal ? Math.round(actDone / actTotal * 100) : 0) + '%</div></div>';
    mh += '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">人均费用(元)</div><div style="font-size:18px;font-weight:700">¥' + fmt(total > 0 ? Math.round(cost / total) : 0) + '</div></div>';
    metricsEl.innerHTML = mh;
    metricsCard.style.display = total > 0 ? 'block' : 'none';

    // Monthly chart
    var monthMap = {};
    var now = new Date();
    for (var mi = 5; mi >= 0; mi--) {
      var d = new Date(now.getFullYear(), now.getMonth() - mi, 1);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      monthMap[key] = 0;
    }
    ALL_DATA.forEach(function(r) {
      var m = (r['培训日期'] || '').slice(0, 7);
      if (monthMap.hasOwnProperty(m)) monthMap[m] += (parseFloat(r['费用']) || 0);
    });
    var monthItems = Object.keys(monthMap).map(function(k) { return { label: k.slice(5) + '月', label2: monthMap[k], value: monthMap[k] }; });
    renderBarChart('monthChart', monthItems, 'var(--primary)');

    // 同比图：只有去年真的有数据才显示切换按钮
    var lastYearHasData = ALL_DATA.some(function(r) {
      return (r['培训日期'] || '').startsWith(String(now.getFullYear() - 1));
    });
    var toggleBtn = document.getElementById('toggleYear');
    var newToggle = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggle, toggleBtn);
    if (!lastYearHasData) {
      newToggle.style.display = 'none';
      document.getElementById('yearChartCard').style.display = 'none';
    } else {
      newToggle.style.display = '';
    }
    newToggle.addEventListener('click', function() {
      var card = document.getElementById('yearChartCard');
      var show = card.style.display === 'none';
      card.style.display = show ? 'block' : 'none';
      if (show) {
        var thisYear = now.getFullYear();
        var lastYear = thisYear - 1;
        var ym = {};
        for (var mi2 = 0; mi2 < 12; mi2++) {
          ym[mi2] = { thisY: 0, lastY: 0 };
        }
        ALL_DATA.forEach(function(r) {
          var dateStr = r['培训日期'] || '';
          var yr = parseInt(dateStr.slice(0, 4));
          var mo = parseInt(dateStr.slice(5, 7)) - 1;
          if (!isNaN(mo) && mo >= 0 && mo < 12) {
            if (yr === thisYear) ym[mo].thisY += (parseFloat(r['费用']) || 0);
            if (yr === lastYear) ym[mo].lastY += (parseFloat(r['费用']) || 0);
          }
        });
        var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
        var maxVal = 0;
        for (var mi3 = 0; mi3 < 12; mi3++) {
          if (ym[mi3].thisY > maxVal) maxVal = ym[mi3].thisY;
          if (ym[mi3].lastY > maxVal) maxVal = ym[mi3].lastY;
        }
        if (maxVal === 0) maxVal = 1;
        var yh = '';
        for (var mi4 = 0; mi4 < 12; mi4++) {
          var pctThis = Math.round(ym[mi4].thisY / maxVal * 120);
          var pctLast = Math.round(ym[mi4].lastY / maxVal * 120);
          if (pctThis < 4 && ym[mi4].thisY > 0) pctThis = 4;
          if (pctLast < 4 && ym[mi4].lastY > 0) pctLast = 4;
          yh += '<div class="bar-item">';
          yh += '<div class="bar-v" style="font-weight:600">' + ym[mi4].thisY + '</div>';
          yh += '<div style="display:flex;gap:2px;align-items:flex-end;height:120px;width:100%">';
          yh += '<div class="bar" style="height:' + pctLast + 'px;background:var(--border-strong);flex:1;border-radius:3px 3px 0 0"></div>';
          yh += '<div class="bar" style="height:' + pctThis + 'px;background:var(--primary);flex:1;border-radius:3px 3px 0 0"></div>';
          yh += '</div>';
          yh += '<div class="bar-l">' + monthNames[mi4] + '</div>';
          yh += '</div>';
        }
        yh += '<div style="font-size:11px;color:var(--text-muted);margin-top:10px;text-align:center"><span style="display:inline-block;width:10px;height:10px;background:var(--border-strong);border-radius:2px;vertical-align:middle;margin-right:4px"></span>' + lastYear + '年 <span style="display:inline-block;width:10px;height:10px;background:var(--primary);border-radius:2px;vertical-align:middle;margin:0 4px 0 12px"></span>' + thisYear + '年</div>';
        document.getElementById('yearChart').innerHTML = yh;
      }
    });

    // ROI Analysis
    var roiEl = document.getElementById('roiContent');
    // Only count records that have been approved or later
    var roiRecords = ALL_DATA.filter(function(r) {
      return ['已通过','学习中','总结已提交','30天已回访','已完成'].indexOf(r['状态']) >= 0;
    });
    // By department
    var roiDept = {};
    var roiType = {};
    roiRecords.forEach(function(r) {
      var dept = r['部门'] || '未设置';
      var type = r['培训类型'] || '未分类';
      if (!roiDept[dept]) roiDept[dept] = { cost: 0, count: 0, execCount: 0, execTotal: 0, scoreSum: 0, scoreCount: 0, recCount: 0 };
      if (!roiType[type]) roiType[type] = { cost: 0, count: 0, execCount: 0, execTotal: 0, scoreSum: 0, scoreCount: 0, recCount: 0 };
      var cost = parseFloat(r['费用']) || 0;
      roiDept[dept].cost += cost; roiDept[dept].count++;
      roiType[type].cost += cost; roiType[type].count++;
      if (r['30天执行']) { roiDept[dept].execTotal++; roiType[type].execTotal++; if (r['30天执行'] !== '未执行') { roiDept[dept].execCount++; roiType[type].execCount++; } }
      if (r['评估分数']) {
        roiDept[dept].scoreSum += parseInt(r['评估分数']); roiDept[dept].scoreCount++;
        roiType[type].scoreSum += parseInt(r['评估分数']); roiType[type].scoreCount++;
        if (r['推荐程度'] === '强烈推荐' || r['推荐程度'] === '推荐') { roiDept[dept].recCount++; roiType[type].recCount++; }
      }
    });

    function renderRoiTable(data, label) {
      var h = '<div class="roi-section"><h4>' + label + '</h4>';
      h += '<div class="tw"><table><thead><tr><th>名称</th><th>次数</th><th>总费用</th><th>平均费用</th><th>执行率</th><th>平均评分</th><th>推荐率</th></tr></thead><tbody>';
      var keys = Object.keys(data).sort(function(a, b) { return data[b].cost - data[a].cost; });
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i], d = data[k];
        var avgCost = d.count > 0 ? Math.round(d.cost / d.count) : 0;
        var execRate = d.execTotal > 0 ? Math.round(d.execCount / d.execTotal * 100) + '%' : '-';
        var avgSc = d.scoreCount > 0 ? (d.scoreSum / d.scoreCount).toFixed(1) : '-';
        var recRate = d.recCount > 0 ? Math.round(d.recCount / d.scoreCount * 100) + '%' : '-';
        h += '<tr><td>' + k + '</td><td>' + d.count + '</td><td>¥' + fmt(d.cost) + '</td><td>¥' + fmt(avgCost) + '</td><td>' + execRate + '</td><td>' + avgSc + '</td><td>' + recRate + '</td></tr>';
      }
      h += '</tbody></table></div></div>';
      return h;
    }

    var roiHtml = '';
    if (Object.keys(roiDept).length > 0) roiHtml += renderRoiTable(roiDept, '按部门');
    if (Object.keys(roiType).length > 0) roiHtml += renderRoiTable(roiType, '按培训类型');
    roiEl.innerHTML = roiHtml || '<div style="color:#999;font-size:13px;padding:20px;text-align:center">暂无数据</div>';

    // Dept chart
    var deptMap = {};
    ALL_DATA.forEach(function(r) {
      var dept = r['部门'] || '未设置';
      if (!deptMap[dept]) deptMap[dept] = 0;
      deptMap[dept] += (parseFloat(r['费用']) || 0);
    });
    var deptItems = Object.keys(deptMap).map(function(k) { return { label: k, label2: deptMap[k], value: deptMap[k] }; });
    renderBarChart('deptChart', deptItems, 'var(--info)');

    // Type chart
    var typeMap = {};
    ALL_DATA.forEach(function(r) {
      var t = r['培训类型'] || '未分类';
      if (!typeMap[t]) typeMap[t] = 0;
      typeMap[t]++;
    });
    var typeItems = Object.keys(typeMap).map(function(k) { return { label: k, label2: typeMap[k], value: typeMap[k] }; });
    renderBarChart('typeChart', typeItems, 'var(--warning)');

    // Pipeline table
    var dh = '';
    for (var j = 0; j < ALL_DATA.length; j++) {
      var r2 = ALL_DATA[j];
      var closed = r2['状态'] === '已完成';
      dh += '<tr><td>' + esc(r2['员工']) + '</td><td>' + esc(r2['部门']) + '</td><td>' + esc(r2['培训项目']) + '</td>';
      dh += '<td>¥' + fmt(r2['费用'] || 0) + '</td>';
      dh += '<td><span class="bd ' + (r2['状态'] === '待审批' ? 'bdo' : 'bdg') + '">' + esc(r2['状态']) + '</span></td>';
      dh += '<td><span class="bd ' + (r2['总结内容'] ? 'bdg' : 'bdy') + '">' + (r2['总结内容'] ? '已提交' : '未提交') + '</span></td>';
      dh += '<td><span class="bd ' + (r2['30天执行'] ? 'bdb' : 'bdy') + '">' + esc(r2['30天执行'] || '未回访') + '</span></td>';
      dh += '<td><span class="bd ' + (r2['评估分数'] ? 'bdg' : 'bdy') + '">' + (r2['评估分数'] ? r2['评估分数'] + '分' : '未评估') + '</span></td>';
      dh += '<td><span class="bd ' + (closed ? 'bdg' : 'bdo') + '">' + (closed ? '完成' : '进行中') + '</span></td></tr>';
    }
    document.getElementById('dashTb').innerHTML = dh;

    // ─── 各部门完成率统计 ───
    var thisYear = new Date().getFullYear();
    var deptStats = {};
    for (var di = 0; di < ALL_DATA.length; di++) {
      var dr = ALL_DATA[di];
      if (!dr['培训日期']) continue;
      var dYear = parseInt(dr['培训日期'].split('-')[0]);
      if (dYear !== thisYear) continue;
      var dept = dr['部门'] || '未分配';
      if (!deptStats[dept]) deptStats[dept] = { total: 0, done: 0, ongoing: 0 };
      deptStats[dept].total++;
      if (dr['状态'] === '已完成') deptStats[dept].done++;
      else if (['待审批','已驳回'].indexOf(dr['状态']) < 0) deptStats[dept].ongoing++;
    }
    var dKeys = Object.keys(deptStats).sort();
    var dRateH = '';
    if (dKeys.length === 0) {
      dRateH = '<tr><td colspan="4" class="em"><p>暂无今年数据</p></td></tr>';
    } else {
      for (var dk = 0; dk < dKeys.length; dk++) {
        var dk2 = dKeys[dk];
        var ds2 = deptStats[dk2];
        var rate = ds2.total > 0 ? Math.round(ds2.done / ds2.total * 100) : 0;
        var rateColor = rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)';
        dRateH += '<tr><td>' + esc(dk2) + '</td><td>' + ds2.total + '</td><td>' + ds2.done + '</td><td>' + ds2.ongoing + '</td><td><span style="font-weight:700;color:' + rateColor + '">' + rate + '%</span></td></tr>';
      }
    }
    document.getElementById('deptRateTb').innerHTML = dRateH;
  }

    function renderAll() {
    SELECTED = {};
    var data = ALL_DATA.slice();
    var deptSet = {};
    for (var di = 0; di < data.length; di++) { if (data[di]['部门']) deptSet[data[di]['部门']] = true; }
    var depts = Object.keys(deptSet).sort();
    var sel = document.getElementById('f-dept');
    var cur = sel.value;
    var selH = '<option value="">全部部门</option>';
    for (var si = 0; si < depts.length; si++) selH += '<option ' + (depts[si] === cur ? 'selected' : '') + '>' + esc(depts[si]) + '</option>';
    sel.innerHTML = selH;

    var q = document.getElementById('f-q').value.toLowerCase();
    var df = sel.value;
    var sf = document.getElementById('f-st').value;
    var from = document.getElementById('f-from').value;
    var to = document.getElementById('f-to').value;
    var showArchived = document.getElementById('f-archived').checked;

    // 默认隐藏归档记录，除非勾选显示
    if (!showArchived) data = data.filter(function(r) { return !r._archived; });

    if (q) data = data.filter(function(r) { return (r['员工'] + r['部门'] + r['培训项目'] + (r['培训类型']||'')).toLowerCase().indexOf(q) >= 0; });
    if (df) data = data.filter(function(r) { return r['部门'] === df; });
    if (sf) data = data.filter(function(r) { return r['状态'] === sf; });
    if (from) data = data.filter(function(r) { return r['培训日期'] && r['培训日期'] >= from; });
    if (to) data = data.filter(function(r) { return r['培训日期'] && r['培训日期'] <= to; });

    var sc = { '待审批':'bdo','已通过':'bdg','已驳回':'bdr','学习中':'bdb','总结已提交':'bdb','待评审':'bdp','30天已回访':'bdp','已完成':'bdg','已撤回':'bdy' };
    var si = { '待审批':'⏳','已通过':'✅','已驳回':'❌','学习中':'📖','总结已提交':'📝','待评审':'👁️','30天已回访':'🔄','已完成':'🎯','已撤回':'↩️' };
    var tb = document.getElementById('allTb');
    if (data.length === 0) { tb.innerHTML = '<tr><td colspan="10"><div class="em"><img src="/uploads/1 (13).png" alt="" style="width:56px;height:56px;margin-bottom:10px;opacity:0.85" onerror="this.style.display=\'none\'"><p>暂无培训记录</p><small>员工提交培训申请后会在此显示</small></div></td></tr>'; return; }
    var isHRUser = ME.role === 'hr';
    var h = '';
    for (var ri = 0; ri < data.length; ri++) {
      var r = data[ri];
      h += '<tr' + (r._archived ? ' style="opacity:0.55"' : '') + '><td><input type="checkbox" class="chk row-chk" data-id="' + r.ID + '"></td>';
      h += '<td data-label="ID" style="font-size:11px;color:#999">' + esc((r.ID || '').slice(-5)) + (r._archived ? ' <span style="background:#eee;color:#999;font-size:10px;padding:1px 4px;border-radius:3px">归档</span>' : '') + '</td>';
      h += '<td data-label="姓名"><span class="emp-link" data-emp="' + esc(r['员工']) + '" style="cursor:pointer;color:var(--primary);text-decoration:underline;text-underline-offset:2px;font-weight:600" title="查看成长档案">' + esc(r['员工']) + '</span></td><td data-label="部门">' + esc(r['部门']) + '</td><td data-label="项目">' + esc(r['培训项目']) + '</td>';
      h += '<td data-label="类型">' + esc(r['培训类型'] || '-') + '</td>';
      h += '<td data-label="日期">' + esc(r['培训日期']) + '</td><td data-label="费用">¥' + fmt(r['费用'] || 0) + '</td>';
      var overdueBadge = '';
      var odi = getOverdueInfo(r);
      if (odi) {
        overdueBadge = ' <span style="display:inline-block;font-size:10px;padding:1px 5px;border-radius:3px;background:' + odi.color + ';color:#fff;margin-left:3px;font-weight:600">' + odi.label + '</span>';
      }
      h += '<td data-label="状态"><span class="bd ' + (sc[r['状态']] || 'bdy') + '"><span class="bd-icon">' + (si[r['状态']] || '') + '</span>' + esc(r['状态']) + '</span>' + overdueBadge + '</td>';
      h += '<td data-label="操作" style="white-space:nowrap">';
      // 快捷审批按钮（归档记录不显示）
      if (isHRUser && !r._archived) {
        // 一键催缴：总结逾期、30天自评逾期、90天复盘逾期
        if (odi && (odi.type === 'summary' || odi.type === 'self30' || odi.type === 'self90')) {
          h += '<button class="bt bts" data-a="urge" data-id="' + r.ID + '" style="margin-right:3px;color:#D9534F;border-color:#D9534F;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>催缴</button>';
        }
        if (r['状态'] === '待审批') {
          h += '<button class="bt bts btp" data-a="approve" data-id="' + r.ID + '" style="margin-right:3px">✓ 通过</button>';
          h += '<button class="bt bts btd" data-a="reject" data-id="' + r.ID + '" style="margin-right:3px">✗ 驳回</button>';
        }
        // 评审：总结已提交 → 显示评审按钮
        if (r['状态'] === '总结已提交') {
          h += '<button class="bt bts btp" data-a="review" data-id="' + r.ID + '" style="margin-right:3px;background:var(--accent);color:#fff;border-color:var(--accent)">评审</button>';
        }
        // 30天回访：待评审 + 员工已提交自评 → 显示"确认回访"
        if (r['状态'] === '待评审' && !r['30天执行'] && r['30天自评内容']) {
          h += '<button class="bt bts btp" data-a="visit30" data-id="' + r.ID + '" style="margin-right:3px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 确认回访</button>';
        }

        if (r['总结内容']) {
          h += '<button class="bt bts btg" data-a="viewsum" data-id="' + r.ID + '" style="margin-right:3px"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 查看总结</button>';
        }
        if (r['30天执行']) {
          h += '<button class="bt bts" data-a="view30" data-id="' + r.ID + '" style="margin-right:3px;color:#8B6BA8;border-color:#8B6BA8"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 回访详情</button>';
        }
        // 90天评估：30天已回访 + 员工已提交90天自评 + 未评估 → 显示评估按钮
        if (r['状态'] === '30天已回访' && !r['评估分数']) {
          if (r['90天自评内容']) {
            h += '<button class="bt bts btp" data-a="eval90" data-id="' + r.ID + '" style="margin-right:3px;background:var(--success);color:#fff;border-color:var(--success)">90天评估</button>';
          } else {
            h += '<span style="font-size:11px;color:#999;margin-right:5px">⏳ 等待员工复盘</span>';
          }
        }
        h += '<button class="bt bts" data-a="edit" data-id="' + r.ID + '">编辑</button>';
        h += '<button class="bt bts" data-a="archive" data-id="' + r.ID + '" style="margin-left:3px;color:#888;border-color:#ccc" title="归档"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> 归档</button>';
        h += '<button class="bt bts btd" data-a="del" data-id="' + r.ID + '" style="margin-left:3px">删除</button>';
      } else if (!isHRUser) {
        h += '<button class="bt bts" data-a="detail" data-id="' + r.ID + '">详情</button>';
      }
      h += '</td></tr>';
    }
    tb.innerHTML = h;
    bindTableBtns(tb);

    // 员工名点击跳转成长档案
    var empLinks = tb.querySelectorAll('.emp-link');
    for (var ei = 0; ei < empLinks.length; ei++) {
      empLinks[ei].addEventListener('click', function() {
        var empName = this.getAttribute('data-emp');
        // 跳转到成长档案并自动搜索该员工
        go('profile');
        setTimeout(function() {
          var gq = document.getElementById('g-q');
          if (gq) { gq.value = empName; renderProfile(); }
        }, 100);
      });
    }

    var rowChks = tb.querySelectorAll('.row-chk');
    for (var ci = 0; ci < rowChks.length; ci++) {
      rowChks[ci].addEventListener('change', updateBatch);
    }
    document.getElementById('chkAll').checked = false;
    document.getElementById('chkAll').onchange = function() {
      var chks = document.querySelectorAll('.row-chk');
      for (var i = 0; i < chks.length; i++) chks[i].checked = this.checked;
      updateBatch();
    };
    updateBatch();
  }

  function updateBatch() {
    SELECTED = {};
    var chks = document.querySelectorAll('.row-chk:checked');
    for (var i = 0; i < chks.length; i++) SELECTED[chks[i].getAttribute('data-id')] = true;
    var count = Object.keys(SELECTED).length;
    document.getElementById('batchCount').textContent = '已选 ' + count + ' 条';
    document.getElementById('batchBar').classList.toggle('show', count > 0);
  }

  document.getElementById('batchCancel').addEventListener('click', function() {
    var chks = document.querySelectorAll('.row-chk');
    for (var i = 0; i < chks.length; i++) chks[i].checked = false;
    updateBatch();
  });

  var batchBtns = document.querySelectorAll('[data-batch]');
  for (var bi = 0; bi < batchBtns.length; bi++) {
    batchBtns[bi].addEventListener('click', function() {
      var status = this.getAttribute('data-batch');
      var ids = Object.keys(SELECTED);
      if (!ids.length) return;
      apiPost('batchUpdate', { ids: ids, data: { '状态': status }, _operator: ME.name }).then(function(r) {
        if (r.ok) { toast('批量操作成功'); refreshData().then(function() { renderAll(); renderDash(); }); }
        else toast('操作失败');
      });
    });
  }

  // ─── 快捷通过 ───
  function quickApprove(id, status) {
    var r = findRecord(id);
    if (!r) return;
    // 计算该员工的历史数据
    var empName = r['员工'];
    var empRecs = ALL_DATA.filter(function(x) { return x['员工'] === empName && x.ID !== id; });
    var empTotal = empRecs.length;
    var empDone = empRecs.filter(function(x) { return x['状态'] === '已完成'; }).length;
    var empSumDone = empRecs.filter(function(x) { return x['总结内容']; }).length;
    var historyHtml = '';
    if (empTotal > 0) {
      var rate = Math.round(empDone / empTotal * 100);
      var rateColor = rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)';
      historyHtml = '<div style="margin-top:10px;padding:12px 16px;background:var(--primary-bg);border:1px solid var(--primary-light);border-radius:var(--radius-md);font-size:13px;line-height:1.8">';
      historyHtml += '<div style="font-weight:700;color:var(--primary);margin-bottom:6px"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> ' + esc(empName) + ' 的历史记录</div>';
      historyHtml += '<div style="color:var(--text-secondary)">共 <b>' + empTotal + '</b> 次申请 · 已完成 <b>' + empDone + '</b> 次 · 提交总结 <b>' + empSumDone + '</b> 次 · 完成率 <b style="color:' + rateColor + '">' + rate + '%</b></div>';
      historyHtml += '</div>';
    }
    openConfirmModal(
      '确认审批通过',
      '将《' + esc(r['培训项目']) + '》（' + esc(r['员工']) + '）标记为"已通过"？' + historyHtml,
      function(note) {
        apiPost('updateRecord', { id: id, data: { '状态': status, 'HR备注': note || '' }, _operator: ME.name }).then(function(res) {
          if (res.ok) {
            toast('已通过 ✓');
            refreshData().then(function() { renderAll(); renderDash(); });
            apiPost('triggerNotify', {
              type: 'approved',
              data: {
                employeeName: r['员工'],
                project: r['培训项目'],
                institution: r['培训机构'] || '-',
                date: new Date().toLocaleDateString('zh-CN')
              }
            });
          } else toast('操作失败：' + (res.msg || ''));
        });
      },
      true // 带备注输入框
    );
  }

  // ─── HR查看30天回访详情 ───
  function viewVisit30(id) {
    var r = findRecord(id);
    if (!r) return;
    var h = '<div style="font-size:14px;line-height:1.8">';
    h += '<div style="background:#f9f4fd;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;font-size:13px">';
    h += '<div><span style="color:#999">员工：</span><b>' + esc(r['员工']) + '</b></div>';
    h += '<div><span style="color:#999">部门：</span>' + esc(r['部门'] || '-') + '</div>';
    h += '<div><span style="color:#999">培训日期：</span>' + esc(r['培训日期'] || '-') + '</div>';
    h += '<div><span style="color:#999">回访日期：</span>' + esc(r['回访日期'] || '-') + '</div>';
    h += '</div>';
    // 执行情况
    var actionColor = { '已完全执行': 'var(--success)', '部分执行': 'var(--warning)', '未执行': 'var(--danger)' }[r['30天执行']] || 'var(--text)';
    h += '<div style="margin-bottom:16px;padding:14px 18px;background:#fff;border:2px solid ' + actionColor + ';border-radius:var(--radius-lg);text-align:center;box-shadow:var(--shadow-sm)">';
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:500">30天执行情况</div>';
    h += '<div style="font-size:20px;font-weight:700;color:' + actionColor + '">' + esc(r['30天执行']) + '</div>';
    h += '</div>';
    // 回访详情
    if (r['回访详情']) {
      h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:#8B6BA8;margin-bottom:6px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 回访详情记录</div>';
      h += '<div style="background:linear-gradient(135deg,#F3EFF9,#EEE6F5);border:1px solid #d7bef7;border-radius:var(--radius-md);padding:12px 16px;white-space:pre-wrap;color:#444;line-height:1.8">' + esc(r['回访详情']) + '</div></div>';
    }
    // 若有总结内容，展示承诺产出对比
    if (r['承诺产出']) {
      h += '<div style="margin-bottom:12px"><div style="font-weight:700;color:var(--text);margin-bottom:4px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> 当初承诺产出（对照）</div>';
      h += '<div style="background:var(--primary-bg);border:1px solid var(--primary-light);border-radius:var(--radius-md);padding:10px 14px;white-space:pre-wrap;color:var(--text-secondary);line-height:1.7">' + esc(r['承诺产出']) + '</div></div>';
    }

    h += '</div>';
    openM('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 30天回访详情 — ' + esc(r['培训项目']), h, '580px');
  }

  // ─── 驳回弹窗 ───
  function openRejectModal(id) {
    var r = findRecord(id);
    if (!r) return;
    var empName = r['员工'];
    var empRecs = ALL_DATA.filter(function(x) { return x['员工'] === empName && x.ID !== id; });
    var empTotal = empRecs.length;
    var empDone = empRecs.filter(function(x) { return x['状态'] === '已完成'; }).length;
    var historyHtml = '';
    if (empTotal > 0) {
      var rate = Math.round(empDone / empTotal * 100);
      var rateColor = rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)';
      historyHtml = '<div style="margin-top:10px;padding:12px 16px;background:var(--primary-bg);border:1px solid var(--border);border-radius:var(--radius-md);font-size:13px;line-height:1.8">';
      historyHtml += '<div style="font-weight:700;color:var(--danger);margin-bottom:6px"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> ' + esc(empName) + ' 的历史记录</div>';
      historyHtml += '<div style="color:var(--text-secondary)">共 <b>' + empTotal + '</b> 次申请 · 已完成 <b>' + empDone + '</b> 次 · 完成率 <b style="color:' + rateColor + '">' + rate + '%</b></div>';
      historyHtml += '</div>';
    }
    openConfirmModal(
      '驳回申请',
      '将《' + esc(r['培训项目']) + '》（' + esc(r['员工']) + '）标记为"已驳回"？' + historyHtml,
      function(note) {
        apiPost('updateRecord', { id: id, data: { '状态': '已驳回', 'HR备注': note || '' }, _operator: ME.name }).then(function(res) {
          if (res.ok) {
            toast('已驳回');
            refreshData().then(function() { renderAll(); });
            apiPost('triggerNotify', {
              type: 'rejected',
              data: {
                employeeName: r['员工'],
                project: r['培训项目'],
                reason: note || '未说明原因',
                date: new Date().toLocaleDateString('zh-CN')
              }
            });
          } else toast('操作失败：' + (res.msg || ''));
        });
      },
      true
    );
  }

  // ─── 通用确认弹窗（带可选备注输入） ───
  function openConfirmModal(title, desc, onConfirm, withNote) {
    var noteHtml = withNote ? '<div class="fg" style="margin-top:12px"><label>HR备注（可选）</label><textarea id="cm-note" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;min-height:60px;font-size:13px" placeholder="填写原因或说明..."></textarea></div>' : '';
    var h = '<div style="font-size:14px;color:#555;margin-bottom:8px">' + esc(desc) + '</div>' + noteHtml;
    h += '<div class="fa" style="padding-top:10px;border-top:1px solid #f0eeeb;margin-top:8px"><button class="bt" id="cm-cancel">取消</button><button class="bt btp" id="cm-ok">确认</button></div>';
    openM(title, h);
    document.getElementById('cm-cancel').addEventListener('click', closeM);
    document.getElementById('cm-ok').addEventListener('click', function() {
      var note = withNote ? (document.getElementById('cm-note').value.trim()) : '';
      closeM();
      onConfirm(note);
    });
  }

  // ─── 30天回访专属弹窗 ───
  function openVisit30Modal(id) {
    var r = findRecord(id);
    if (!r) return;
    var h = '<div style="background:#f8f8f6;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px">';
    h += '<div style="font-weight:600;margin-bottom:4px">培训项目：' + esc(r['培训项目']) + '</div>';
    h += '<div style="color:#666">员工：' + esc(r['员工']) + '&nbsp;&nbsp;|&nbsp;&nbsp;培训日期：' + esc(r['培训日期']) + '</div>';
    // 员工30天自评（如果有）
    if (r['30天自评内容']) {
      h += '<div style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border:1px solid #6EE7B7;border-radius:8px;padding:12px 14px;margin-bottom:12px">';
      h += '<div style="font-weight:600;color:#047857;margin-bottom:6px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 员工30天自评 <span style="font-weight:400;color:#6B7280;font-size:11px">（' + esc(r['自评提交日期'] || '') + ' 提交）</span></div>';
      h += '<div style="white-space:pre-wrap;line-height:1.7;color:#374151;font-size:13px">' + esc(r['30天自评内容']) + '</div></div>';
    }
    if (r['行动计划']) h += '<div style="margin-top:8px;color:#555"><b>当初行动计划：</b><br><span style="white-space:pre-wrap">' + esc(r['行动计划']) + '</span></div>';
    h += '</div>';
    h += '<div class="fgd">';
    h += '<div class="fg fl"><label>执行情况 *</label><select id="v30-action"><option value="">请选择</option><option>全部执行</option><option>部分执行</option><option>未执行</option></select></div>';
    h += '<div class="fg"><label>回访日期 *</label><input id="v30-date" type="date" value="' + new Date().toISOString().slice(0,10) + '"></div>';
    h += '<div class="fg fl"><label>回访详情 *</label><textarea id="v30-detail" rows="4" placeholder="描述执行情况、效果、遇到的问题..."></textarea></div>';
    h += '<div style="margin:6px 0 12px 0"><button class="bt bts" id="v30-ai" style="font-size:12px;padding:6px 12px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>AI辅助生成</button><span id="v30-ai-loading" style="display:none;color:#8B6BA8;margin-left:8px;font-size:12px">生成中...</span></div>';
    h += '<div class="fa"><button class="bt" id="v30-cancel">取消</button><button class="bt btp" id="v30-save">保存回访</button></div>';
    h += '</div>';
    openM('30天行动回访 — ' + r['培训项目'], h);
    document.getElementById('v30-cancel').addEventListener('click', closeM);
    // AI辅助按钮事件
    document.getElementById('v30-ai').addEventListener('click', function() {
      var self30Content = r['30天自评内容'] || '';
      if (!self30Content) { toast('该员工尚未提交30天自评，无法生成备注'); return; }
      var btn = document.getElementById('v30-ai');
      var loading = document.getElementById('v30-ai-loading');
      btn.disabled = true;
      loading.style.display = 'inline';
      apiPost('ai-assist-return-visit', {
        self30Content: self30Content,
        employeeName: r['员工'],
        projectName: r['培训项目'],
        executionStatus: r['30天执行'] || ''
      }).then(function(res) {
        btn.disabled = false;
        loading.style.display = 'none';
        if (res.ok && res.text) {
          document.getElementById('v30-detail').value = res.text;
          toast('AI备注已生成 ✓');
        } else {
          toast('AI生成失败：' + (res.msg || '未知错误'));
        }
      }).catch(function() {
        btn.disabled = false;
        loading.style.display = 'none';
        toast('网络错误，请重试');
      });
    });
    document.getElementById('v30-save').addEventListener('click', function() {
      var action = document.getElementById('v30-action').value;
      var date = document.getElementById('v30-date').value;
      var detail = document.getElementById('v30-detail').value.trim();
      if (!action || !date || !detail) { toast('请填写所有必填项'); return; }
      toast('保存中...');
      apiPost('updateRecord', { id: id, _operator: ME.name, data: {
        '30天执行': action, '回访日期': date, '回访详情': detail, '状态': '30天已回访'
      }}).then(function(res) {
        if (res.ok) { toast('30天回访已记录 ✓'); closeM(); refreshData().then(function() { renderAll(); renderTodos(); renderDash(); }); }
        else toast('保存失败：' + (res.msg || ''));
      });
    });
  }

  // ─── 90天评估弹窗 ───
  function openEval90Modal(id) {
    var r = findRecord(id);
    if (!r) return;
    var h = '<div style="background:#f8f8f6;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px">';
    h += '<div style="font-weight:600;margin-bottom:4px">培训项目：' + esc(r['培训项目']) + '</div>';
    h += '<div style="color:#666">员工：' + esc(r['员工']) + '&nbsp;&nbsp;|&nbsp;&nbsp;培训日期：' + esc(r['培训日期']) + '</div>';
    h += '</div>';
    // 30天回访回顾
    if (r['30天执行']) {
      h += '<div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:16px">';
      h += '<div style="font-weight:600;color:var(--primary-deeper);margin-bottom:8px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 30天回访记录</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:#555;margin-bottom:8px">';
      h += '<div><b>执行情况：</b>' + esc(r['30天执行']) + '</div>';
      h += '<div><b>回访日期：</b>' + esc(r['回访日期']) + '</div>';
      h += '</div>';
      if (r['回访详情']) h += '<div style="white-space:pre-wrap;line-height:1.6;color:#555;font-size:12px"><b>回访详情：</b><br>' + esc(r['回访详情']) + '</div>';
      h += '</div>';
    }
    // 90天员工复盘展示
    if (r['90天自评内容']) {
      h += '<div style="background:#fff;border:1px solid #6EE7B7;border-radius:8px;padding:14px;margin-bottom:16px">';
      h += '<div style="font-weight:600;color:#047857;margin-bottom:8px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 员工90天复盘（' + esc(r['90天自评日期'] || '未记录日期') + '）</div>';
      h += '<div style="white-space:pre-wrap;line-height:1.7;color:#374151;font-size:13px">' + esc(r['90天自评内容']) + '</div>';
      h += '</div>';
    }
    // 评估表单
    var scores = ['','1','2','3','4','5'];
    var recs = ['','强烈推荐','推荐','一般','不推荐'];
    h += '<div class="fgd">';
    h += '<div class="fg"><label>评估评分（1-5分）*</label><select id="e90-score"><option value="">请选择</option><option value="5">5 - 优秀</option><option value="4">4 - 良好</option><option value="3">3 - 合格</option><option value="2">2 - 需改进</option><option value="1">1 - 不合格</option></select></div>';
    h += '<div class="fg"><label>评估日期 *</label><input id="e90-date" type="date" value="' + new Date().toISOString().slice(0,10) + '"></div>';
    h += '<div class="fg fl"><label>评估意见 *</label><textarea id="e90-note" rows="4" placeholder="评价培训效果、ROI、员工成长、是否值得复训..."></textarea></div>';
    h += '<div style="margin:6px 0 12px 0"><button class="bt bts" id="e90-ai" style="font-size:12px;padding:6px 12px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>AI辅助生成</button><span id="e90-ai-loading" style="display:none;color:#8B6BA8;margin-left:8px;font-size:12px">生成中...</span></div>';
    h += '<div class="fg"><label>推荐程度 *</label><select id="e90-rec"><option value="">请选择</option><option>强烈推荐</option><option>推荐</option><option>一般</option><option>不推荐</option></select></div>';
    h += '<div class="fa" style="gap:10px">';
    h += '<button class="bt" id="e90-cancel">取消</button>';
    h += '<button class="bt btp" id="e90-save" style="background:var(--success);color:#fff;border-color:var(--success)">保存评估</button>';
    h += '</div></div>';
    openM('90天培训效果评估 — ' + r['培训项目'], h);
    document.getElementById('e90-cancel').addEventListener('click', closeM);
    // AI辅助按钮事件
    document.getElementById('e90-ai').addEventListener('click', function() {
      var self90Content = r['90天自评内容'] || '';
      var self30Content = r['30天自评内容'] || '';
      if (!self90Content && !self30Content) { toast('该员工尚未提交30天/90天自评，无法生成评估意见'); return; }
      var btn = document.getElementById('e90-ai');
      var loading = document.getElementById('e90-ai-loading');
      btn.disabled = true;
      loading.style.display = 'inline';
      apiPost('ai-assist-return-visit', {
        self30Content: self30Content,
        self90Content: self90Content,
        employeeName: r['员工'],
        projectName: r['培训项目'],
        executionStatus: r['30天执行'] || ''
      }).then(function(res) {
        btn.disabled = false;
        loading.style.display = 'none';
        if (res.ok && res.text) {
          document.getElementById('e90-note').value = res.text;
          toast('AI评估意见已生成 ✓');
        } else {
          toast('AI生成失败：' + (res.msg || '未知错误'));
        }
      }).catch(function() {
        btn.disabled = false;
        loading.style.display = 'none';
        toast('网络错误，请重试');
      });
    });
    document.getElementById('e90-save').addEventListener('click', function() {
      var score = document.getElementById('e90-score').value;
      var date = document.getElementById('e90-date').value;
      var note = document.getElementById('e90-note').value.trim();
      var rec = document.getElementById('e90-rec').value;
      if (!score || !date || !note || !rec) { toast('请填写所有必填项'); return; }
      toast('保存中...');
      apiPost('updateRecord', { id: id, _operator: ME.name, data: {
        '评估分数': score, '评估日期': date, '评估意见': note, '推荐程度': rec, '状态': '已完成'
      }}).then(function(res) {
        if (res.ok) { toast('90天评估已保存 ✓'); closeM(); refreshData().then(function() { renderAll(); renderTodos(); renderDash(); }); }
        else toast('保存失败：' + (res.msg || ''));
      });
    });
  }

  // ─── 评审弹窗 ───
  function openReviewModal(id) {
    var r = findRecord(id);
    if (!r) return;
    var h = '<div style="background:#f8f8f6;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px">';
    h += '<div style="font-weight:600;margin-bottom:4px">培训项目：' + esc(r['培训项目']) + '</div>';
    h += '<div style="color:#666">员工：' + esc(r['员工']) + '&nbsp;&nbsp;|&nbsp;&nbsp;培训日期：' + esc(r['培训日期']) + '</div>';
    h += '</div>';
    // 总结内容展示
    h += '<div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:16px;max-height:240px;overflow-y:auto">';
    h += '<div style="font-weight:600;color:var(--primary-deeper);margin-bottom:8px;font-size:13px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 学习总结</div>';
    if (r['总结内容']) {
      h += '<div style="white-space:pre-wrap;line-height:1.7;color:#374151;font-size:13px">' + esc(r['总结内容']) + '</div>';
    } else {
      h += '<div style="color:#999;font-size:13px">暂无总结内容</div>';
    }
    if (r['行动计划']) {
      h += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)"><div style="font-weight:600;font-size:12px;color:var(--text-secondary);margin-bottom:4px">行动计划</div><div style="white-space:pre-wrap;line-height:1.6;color:#555;font-size:12px">' + esc(r['行动计划']) + '</div></div>';
    }
    if (r['可衡量指标']) {
      h += '<div style="margin-top:8px"><div style="font-weight:600;font-size:12px;color:var(--text-secondary);margin-bottom:4px">可衡量指标</div><div style="white-space:pre-wrap;line-height:1.6;color:#555;font-size:12px">' + esc(r['可衡量指标']) + '</div></div>';
    }
    h += '</div>';
    // 操作按钮
    h += '<div class="fa" style="gap:10px;margin-top:16px">';
    h += '<button class="bt" id="rev-cancel">取消</button>';
    h += '<button class="bt btd" id="rev-reject" style="background:var(--danger);color:#fff;border-color:var(--danger)">退回修改</button>';
    h += '<button class="bt btp" id="rev-pass" style="background:var(--success);color:#fff;border-color:var(--success)">评审通过</button>';
    h += '</div>';
    openM('评审学习总结 — ' + r['培训项目'], h);
    document.getElementById('rev-cancel').addEventListener('click', closeM);
    // 评审通过
    document.getElementById('rev-pass').addEventListener('click', function() {
      toast('保存中...');
      apiPost('updateRecord', { id: id, _operator: ME.name, data: {
        '评审日期': new Date().toISOString().slice(0,10), '评审人': ME.name, '状态': '待评审'
      }}).then(function(res) {
        if (res.ok) { toast('评审通过 ✓'); closeM(); refreshData().then(function() { renderAll(); renderTodos(); renderDash(); }); }
        else toast('保存失败：' + (res.msg || ''));
      });
    });
    // 退回修改
    document.getElementById('rev-reject').addEventListener('click', function() {
      var reason = prompt('请填写退回原因（员工可见）：', '');
      if (!reason || !reason.trim()) return;
      openConfirmModal('确认退回', '退回原因：' + reason.trim() + '\n\n退回后员工需重新修改总结，确定退回？', function() {
        toast('保存中...');
        apiPost('updateRecord', { id: id, _operator: ME.name, data: {
          '评审意见': reason.trim(), '评审日期': new Date().toISOString().slice(0,10), '评审人': ME.name, '状态': '学习中', 'HR备注': reason.trim()
        }}).then(function(res) {
          if (res.ok) { toast('已退回修改'); closeM(); refreshData().then(function() { renderAll(); renderTodos(); renderDash(); }); }
          else toast('保存失败：' + (res.msg || ''));
        });
      }, false);
    });
  }

  function delRec(id) {
    var r = findRecord(id);
    var name = r ? r['培训项目'] : 'ID:' + id;
    openConfirmModal(
      '确认删除',
      '删除《' + esc(name) + '》记录？此操作不可恢复。',
      function() {
        apiPost('deleteRecord', { id: id, _operator: ME.name }).then(function(res) {
          if (res.ok) { toast('已删除'); refreshData().then(function() { renderAll(); renderDash(); }); }
          else toast('删除失败');
        });
      },
      false
    );
  }

  document.getElementById('addBtn').addEventListener('click', function() { openM('新增培训记录', buildForm(null, true)); });

  function openEdit(id) {
    var r = findRecord(id);
    if (!r) return;
    var isHR = ME.role === 'hr';
    openM('编辑 - ' + r['培训项目'], buildForm(r, isHR));
  }

  function buildForm(r, isHR) {
    function v(k) { return r ? (r[k] || '') : ''; }
    function opt(arr, val) {
      var h = '';
      for (var i = 0; i < arr.length; i++) h += '<option ' + (val === arr[i] ? 'selected' : '') + '>' + arr[i] + '</option>';
      return h;
    }
    var statuses = ['待审批','已通过','已驳回','学习中','总结已提交','待评审','30天已回访','已完成'];
    var types = ['','内部培训','外部课程','在线学习','行业峰会','工作坊','认证考试','其他'];
    var actions = ['','全部执行','部分执行','未执行'];
    var scores = ['','5','4','3','2','1'];
    var recs = ['','强烈推荐','推荐','一般','不推荐'];

    var h = '<div class="fgd">';
    h += '<input type="hidden" id="e-id" value="' + esc(r ? r.ID : '') + '">';
    h += '<div class="fg"><label>姓名 *</label><input id="e-emp" value="' + esc(v('员工') || ME.name) + '"' + (isHR ? '' : ' readonly style="background:#f5f5f3"') + '></div>';
    h += '<div class="fg"><label>部门</label><input id="e-dept" value="' + esc(v('部门')) + '"' + (isHR ? '' : ' readonly style="background:#f5f5f3"') + '></div>';
    h += '<div class="fg"><label>职级</label><input id="e-level" value="' + esc(v('职级')) + '"' + (isHR ? '' : ' readonly style="background:#f5f5f3"') + '></div>';
    h += '<div class="fg"><label>培训项目 *</label><input id="e-proj" value="' + esc(v('培训项目')) + '"></div>';
    h += '<div class="fg"><label>培训机构</label><input id="e-org" value="' + esc(v('培训机构')) + '"></div>';
    h += '<div class="fg"><label>培训类型</label><select id="e-type">' + opt(types, v('培训类型')) + '</select></div>';
    h += '<div class="fg"><label>日期 *</label><input id="e-date" type="date" value="' + esc(v('培训日期')) + '"></div>';
    h += '<div class="fg"><label>费用</label><input id="e-cost" type="number" value="' + esc(v('费用')) + '"></div>';
    h += '<div class="fg"><label>地点</label><input id="e-loc" value="' + esc(v('地点')) + '"></div>';
    h += '<div class="fg fl"><label>学习目标</label><textarea id="e-goal">' + esc(v('学习目标')) + '</textarea></div>';
    h += '<div class="fg fl"><label>承诺产出</label><textarea id="e-out">' + esc(v('承诺产出')) + '</textarea></div>';
    if (isHR) {
      h += '<div class="fg fl"><label>状态</label><select id="e-st">' + opt(statuses, v('状态')) + '</select></div>';
      h += '<div class="fg fl"><label>HR备注</label><textarea id="e-hrnote">' + esc(v('HR备注')) + '</textarea></div>';
    } else {
      h += '<input type="hidden" id="e-st" value="' + esc(v('状态')) + '">';
      h += '<input type="hidden" id="e-hrnote" value="">';
    }
    if (isHR) {
      h += '<hr style="grid-column:1/-1;border:none;border-top:1px solid #eee">';
      h += '<div style="grid-column:1/-1;font-size:12px;color:#999">学习总结</div>';
      h += '<div class="fg"><label>培训前评分</label><select id="e-before">' + opt(['','1','2','3','4','5'], v('培训前评分')) + '</select></div>';
      h += '<div class="fg"><label>培训后评分</label><select id="e-after">' + opt(['','1','2','3','4','5'], v('培训后评分')) + '</select></div>';
      h += '<div class="fg fl"><label>总结内容</label><textarea id="e-sum">' + esc(v('总结内容')) + '</textarea></div>';
      h += '<div class="fg fl"><label>行动计划</label><textarea id="e-plan">' + esc(v('行动计划')) + '</textarea></div>';
      h += '<hr style="grid-column:1/-1;border:none;border-top:1px solid #eee">';
      h += '<div style="grid-column:1/-1;font-size:12px;color:#999">30天回访</div>';
      h += '<div class="fg"><label>执行情况</label><select id="e-fa">' + opt(actions, v('30天执行')) + '</select></div>';
      h += '<div class="fg"><label>回访日期</label><input id="e-fd" type="date" value="' + esc(v('回访日期')) + '"></div>';
      h += '<div class="fg fl"><label>执行详情</label><textarea id="e-fn">' + esc(v('回访详情')) + '</textarea></div>';
      h += '<hr style="grid-column:1/-1;border:none;border-top:1px solid #eee">';
      // 90天员工复盘（只读展示）
      if (v('90天自评内容')) {
        h += '<div style="grid-column:1/-1;background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:10px 14px;font-size:12px;line-height:1.7">';
        h += '<div style="font-weight:600;color:#047857;margin-bottom:6px">员工90天复盘（' + esc(v('90天自评日期') || '未记录') + '）</div>';
        h += '<div style="white-space:pre-wrap;color:#374151">' + esc(v('90天自评内容')) + '</div>';
        h += '</div>';
      }
      h += '<div style="grid-column:1/-1;font-size:12px;color:#999">90天评估</div>';
      h += '<div class="fg"><label>评分</label><select id="e-es">' + opt(scores, v('评估分数')) + '</select></div>';
      h += '<div class="fg"><label>评估日期</label><input id="e-ed" type="date" value="' + esc(v('评估日期')) + '"></div>';
      h += '<div class="fg fl"><label>评估意见</label><textarea id="e-en">' + esc(v('评估意见')) + '</textarea></div>';
      h += '<div class="fg"><label>推荐程度</label><select id="e-er">' + opt(recs, v('推荐程度')) + '</select></div>';
    } else {
      // Preserve existing values as hidden fields for non-HR
      h += '<input type="hidden" id="e-before" value="' + esc(v('培训前评分')) + '">';
      h += '<input type="hidden" id="e-after" value="' + esc(v('培训后评分')) + '">';
      h += '<input type="hidden" id="e-sum" value="' + esc(v('总结内容')) + '">';
      h += '<input type="hidden" id="e-plan" value="' + esc(v('行动计划')) + '">';
      h += '<input type="hidden" id="e-fa" value="' + esc(v('30天执行')) + '">';
      h += '<input type="hidden" id="e-fd" value="' + esc(v('回访日期')) + '">';
      h += '<input type="hidden" id="e-fn" value="' + esc(v('回访详情')) + '">';
      h += '<input type="hidden" id="e-es" value="' + esc(v('评估分数')) + '">';
      h += '<input type="hidden" id="e-ed" value="' + esc(v('评估日期')) + '">';
      h += '<input type="hidden" id="e-en" value="' + esc(v('评估意见')) + '">';
      h += '<input type="hidden" id="e-er" value="' + esc(v('推荐程度')) + '">';
    }
    h += '<div class="fa"><button class="bt" id="editCancel">取消</button><button class="bt btp" id="editSave">保存</button></div>';
    h += '</div>';
    return h;
  }

  function saveForm() {
    var id = document.getElementById('e-id').value;
    var emp = document.getElementById('e-emp').value.trim();
    var proj = document.getElementById('e-proj').value.trim();
    var date = document.getElementById('e-date').value;
    if (!emp || !proj || !date) { toast('请填写必填项'); return; }
    var data = {
      '员工': emp, '部门': document.getElementById('e-dept').value.trim(),
      '职级': document.getElementById('e-level').value.trim(),
      '培训项目': proj, '培训机构': document.getElementById('e-org').value.trim(),
      '培训类型': document.getElementById('e-type').value,
      '培训日期': date, '费用': parseFloat(document.getElementById('e-cost').value) || 0,
      '地点': document.getElementById('e-loc').value.trim(),
      '学习目标': document.getElementById('e-goal').value.trim(),
      '承诺产出': document.getElementById('e-out').value.trim(),
      '状态': document.getElementById('e-st').value,
      'HR备注': document.getElementById('e-hrnote').value.trim(),
      '总结内容': document.getElementById('e-sum').value.trim(),
      '行动计划': document.getElementById('e-plan').value.trim(),
      '培训前评分': document.getElementById('e-before').value,
      '培训后评分': document.getElementById('e-after').value,
      '30天执行': document.getElementById('e-fa').value,
      '回访日期': document.getElementById('e-fd').value,
      '回访详情': document.getElementById('e-fn').value.trim(),
      '评估分数': document.getElementById('e-es').value,
      '评估日期': document.getElementById('e-ed').value,
      '评估意见': document.getElementById('e-en').value.trim(),
      '推荐程度': document.getElementById('e-er').value
    };
    toast('保存中...');
    var isHRSave = ME.role === 'hr';
    // 员工只允许发申请基本字段，避免触发服务端权限拦截
    var sendData = isHRSave ? data : {
      '培训项目': data['培训项目'],
      '培训机构': data['培训机构'],
      '培训类型': data['培训类型'],
      '培训日期': data['培训日期'],
      '费用': data['费用'],
      '地点': data['地点'],
      '学习目标': data['学习目标'],
      '承诺产出': data['承诺产出']
    };
    if (id) {
      // 已撤回的记录保存时恢复为待审批
      var oldRec = findRecord(id);
      if (oldRec && oldRec['状态'] === '已撤回') sendData['状态'] = '待审批';
      apiPost('updateRecord', { id: id, _operator: ME.name, data: sendData }).then(function(res) {
        if (res.ok) {
          toast('已保存'); closeM(); refreshData().then(function() { renderAll(); if (ME.role === 'hr') renderDash(); });
        } else toast('保存失败：' + (res.msg || ''));
      });
    } else {
      sendData['员工'] = data['员工'];
      sendData['部门'] = data['部门'];
      sendData['职级'] = data['职级'];
      sendData['状态'] = '待审批';
      sendData['HR备注'] = '';
      sendData['总结内容'] = '';
      sendData['行动计划'] = '';
      sendData['可衡量指标'] = '';
      sendData['30天执行'] = '';
      sendData['回访日期'] = '';
      sendData['回访详情'] = '';
      sendData['评估分数'] = '';
      sendData['评估日期'] = '';
      sendData['评估意见'] = '';
      sendData['推荐程度'] = '';
      if (isHRSave) {
        // HR 新增时可以直接设状态
        sendData['状态'] = data['状态'] || '待审批';
        sendData['HR备注'] = data['HR备注'] || '';
      }
      apiPost('addRecord', { data: sendData }).then(function(res) {
        if (res.ok) { toast('已保存'); closeM(); refreshData().then(function() { renderAll(); renderDash(); }); }
        else toast('保存失败：' + (res.msg || ''));
      });
    }
  }

  document.getElementById('exportBtn').addEventListener('click', function() {
    // 根据当前筛选条件导出，而不是全量
    var data = ALL_DATA.slice();
    var q = document.getElementById('f-q').value.toLowerCase();
    var df = document.getElementById('f-dept').value;
    var sf = document.getElementById('f-st').value;
    var from = document.getElementById('f-from').value;
    var to = document.getElementById('f-to').value;
    if (q) data = data.filter(function(r) { return (r['员工'] + r['部门'] + r['培训项目'] + (r['培训类型']||'')).toLowerCase().indexOf(q) >= 0; });
    if (df) data = data.filter(function(r) { return r['部门'] === df; });
    if (sf) data = data.filter(function(r) { return r['状态'] === sf; });
    if (from) data = data.filter(function(r) { return r['培训日期'] && r['培训日期'] >= from; });
    if (to) data = data.filter(function(r) { return r['培训日期'] && r['培训日期'] <= to; });

    // 优先用 SheetJS 导出 Excel
    if (typeof XLSX !== 'undefined') {
      var header = ['ID','姓名','部门','培训项目','培训机构','培训类型','培训日期','费用','地点','学习目标','承诺产出','状态','总结内容','行动计划','可衡量指标','培训前评分','培训后评分','30天执行','回访日期','回访详情','30天自评','自评日期','90天自评','90天自评日期','评估分数','评估日期','评估意见','推荐程度','HR备注'];
      var rows = data.map(function(r) {
        return [r.ID,r['员工'],r['部门'],r['培训项目'],r['培训机构'],r['培训类型'],r['培训日期'],r['费用'],r['地点'],r['学习目标'],r['承诺产出'],r['状态'],r['总结内容'],r['行动计划'],r['可衡量指标'],r['培训前评分'],r['培训后评分'],r['30天执行'],r['回访日期'],r['回访详情'],r['30天自评内容'],r['自评提交日期'],r['90天自评内容'],r['90天自评日期'],r['评估分数'],r['评估日期'],r['评估意见'],r['推荐程度'],r['HR备注']];
      });
      var wsData = [header].concat(rows);
      var ws = XLSX.utils.aoa_to_sheet(wsData);
      // 设置列宽
      ws['!cols'] = [{wch:8},{wch:8},{wch:12},{wch:25},{wch:15},{wch:10},{wch:12},{wch:10},{wch:10},{wch:30},{wch:30},{wch:10},{wch:40},{wch:20},{wch:15},{wch:10},{wch:10},{wch:10},{wch:12},{wch:20},{wch:30},{wch:12},{wch:30},{wch:12},{wch:10},{wch:12},{wch:20},{wch:10},{wch:15}];
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '培训记录');
      var suffix = (sf || df) ? ('_' + (sf || df)) : '';
      XLSX.writeFile(wb, '培训记录' + suffix + '_' + new Date().toISOString().slice(0,10) + '.xlsx');
      toast('已导出 ' + data.length + ' 条记录（Excel）');
      return;
    }

    // 降级为 CSV
    var csvEsc = function(v) {
      v = (v === null || v === undefined) ? '' : String(v);
      if (v.indexOf(',') >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0) {
        v = '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    };
    var header = ['ID','姓名','部门','培训项目','培训机构','培训类型','培训日期','费用','地点','学习目标','承诺产出','状态','总结内容','行动计划','可衡量指标','培训前评分','培训后评分','30天执行','回访日期','回访详情','30天自评','自评日期','90天自评','90天自评日期','评估分数','评估日期','评估意见','推荐程度','HR备注'];
    var csv = '\uFEFF' + header.join(',') + '\n';
    data.forEach(function(r) {
      var row = [r.ID,r['员工'],r['部门'],r['培训项目'],r['培训机构'],r['培训类型'],r['培训日期'],r['费用'],r['地点'],r['学习目标'],r['承诺产出'],r['状态'],r['总结内容'],r['行动计划'],r['可衡量指标'],r['培训前评分'],r['培训后评分'],r['30天执行'],r['回访日期'],r['回访详情'],r['30天自评内容'],r['自评提交日期'],r['90天自评内容'],r['90天自评日期'],r['评估分数'],r['评估日期'],r['评估意见'],r['推荐程度'],r['HR备注']];
      csv += row.map(csvEsc).join(',') + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var objUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = objUrl;
    var suffix = (sf || df) ? ('_' + (sf || df)) : '';
    a.download = 'training_records' + suffix + '_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objUrl);
    toast('已导出 ' + data.length + ' 条记录');
  });

  var debounceTimer;
  function debounceRender() { clearTimeout(debounceTimer); debounceTimer = setTimeout(renderAll, 300); }
  ['f-q','f-from','f-to'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', debounceRender);
  });
  ['f-dept','f-st'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', renderAll);
  });
  document.getElementById('f-archived').addEventListener('change', renderAll);

  function renderTodos() {
    var el = document.getElementById('todoList');
    var now = new Date();
    var weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    var todos = [];

    ALL_DATA.forEach(function(r) {
      var canSee = (ME.role === 'hr') || (r['员工'] === ME.name);
      if (!canSee) return;

      // 已通过但未提交总结
      if (r['状态'] === '已通过' && !r['总结内容']) {
        todos.push({ type: 'summary', msg: '《' + r['培训项目'] + '》— ' + r['员工'] + ' 需要提交学习总结', recordId: r.ID, priority: 1 });
      }

      // 待评审但未做30天回访
      if (r['状态'] === '待评审' && !r['30天执行']) {
        var d = new Date(r['培训日期']);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 30);
          var isSelf = r['员工'] === ME.name;
          var hasSelf30 = !!r['30天自评内容'];
          // 员工自己：到时间就显示提交自评待办
          // HR：只有员工已自评才显示确认回访待办
          if (isSelf || hasSelf30) {
            if (now >= d) {
              todos.push({ type: '30d', msg: '《' + r['培训项目'] + '》— ' + r['员工'] + ' 已到30天回访时间', recordId: r.ID, priority: 2 });
            } else if (d <= weekEnd) {
              var days = Math.ceil((d - now) / 86400000);
              todos.push({ type: '30d', msg: '《' + r['培训项目'] + '》— ' + r['员工'] + ' 的30天回访还剩' + days + '天', recordId: r.ID, priority: 3 });
            }
          }
        }
      }

      // 30天已回访但未做90天评估
      if (r['状态'] === '30天已回访' && !r['评估分数']) {
        var d2 = new Date(r['培训日期']);
        if (!isNaN(d2.getTime())) {
          d2.setDate(d2.getDate() + 90);
          var isSelf90 = r['员工'] === ME.name;
          var hasSelf90 = !!r['90天自评内容'];
          // 员工自己：到时间就显示提交复盘待办
          // HR：只有员工已复盘才显示填写评估待办
          if (isSelf90 || hasSelf90) {
            if (now >= d2) {
              todos.push({ type: '90d', msg: '《' + r['培训项目'] + '》— ' + r['员工'] + (isSelf90 && !hasSelf90 ? ' 需要提交90天复盘' : ' 已到90天评估时间'), recordId: r.ID, priority: 2, hasSelf90: hasSelf90 });
            } else if (d2 <= weekEnd) {
              var days2 = Math.ceil((d2 - now) / 86400000);
              todos.push({ type: '90d', msg: '《' + r['培训项目'] + '》— ' + r['员工'] + (isSelf90 && !hasSelf90 ? ' 的90天复盘还剩' + days2 + '天' : ' 的90天评估还剩' + days2 + '天'), recordId: r.ID, priority: 3, hasSelf90: hasSelf90 });
            }
          }
        }
      }
    });

    todos.sort(function(a, b) { return a.priority - b.priority; });

    if (todos.length === 0) {
      el.innerHTML = '<div class="em"><p><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.5-3 3 3-1 3"/><path d="M11.3 5.8 22 2l-3 10.5-3 3-3-1z"/><path d="M22 2 14.5 9.5"/><path d="M18.5 2 10 10.5"/></svg> 本周没有待办事项</p></div>';
      return;
    }

    var typeLabels = { summary: '待总结', '30d': '30天回访', '90d': '90天评估' };
    var h = '';
    for (var i = 0; i < todos.length; i++) {
      var t = todos[i];
      var actionBtn = '';
      var isOwner = (ME.role !== 'hr');
      if (t.type === 'summary') {
        if (isOwner) {
          actionBtn = '<button class="bt bts btp" data-a="sum" data-id="' + t.recordId + '">立即提交总结</button>';
        } else {
          actionBtn = '<button class="bt bts" data-a="det" data-id="' + t.recordId + '">查看详情</button>';
        }
      } else if (t.type === '30d') {
        if (!isOwner) {
          // 检查是否有员工30天自评，有自评才显示确认回访按钮
          var rec30 = findRecord(t.recordId);
          if (rec30 && rec30['30天自评内容']) {
            actionBtn = '<button class="bt bts btp" data-a="visit30" data-id="' + t.recordId + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 确认回访</button>';
          }
        } else {
          actionBtn = '<button class="bt bts" data-a="det" data-id="' + t.recordId + '">查看详情</button>';
        }
      } else if (t.type === '90d') {
        if (!isOwner) {
          if (t.hasSelf90) {
            actionBtn = '<button class="bt bts" data-a="eval90" data-id="' + t.recordId + '" style="color:var(--danger);border-color:var(--danger)">填写评估</button>';
          } else {
            actionBtn = '<span style="font-size:12px;color:#999">等待员工复盘</span>';
          }
        } else {
          if (!t.hasSelf90) {
            actionBtn = '<button class="bt bts btp" data-a="self90" data-id="' + t.recordId + '" style="background:var(--success);color:#fff;border-color:var(--success)">立即复盘</button>';
          } else {
            actionBtn = '<button class="bt bts" data-a="det" data-id="' + t.recordId + '">查看详情</button>';
          }
        }
      }
      h += '<div class="todo-item">';
      h += '<span class="todo-type ' + t.type + '">' + typeLabels[t.type] + '</span>';
      h += '<span class="todo-msg">' + esc(t.msg) + '</span>';
      h += '<span class="todo-action">' + actionBtn + '</span>';
      h += '</div>';
    }
    el.innerHTML = h;
    bindTableBtns(el);
  }

  function renderProfile() {
    var sel = document.getElementById('pf-emp');
    var nameSet = {};
    ALL_DATA.forEach(function(r) { if (r['员工']) nameSet[r['员工']] = true; });
    ALL_USERS.forEach(function(u) { nameSet[u.name] = true; });
    var names = Object.keys(nameSet).sort();
    var cur = sel.value;
      var selH = '<option value="">选择员工</option>';
      for (var si = 0; si < names.length; si++) selH += '<option ' + (names[si] === cur ? 'selected' : '') + '>' + esc(names[si]) + '</option>';
      sel.innerHTML = selH;

    var content = document.getElementById('profileContent');
    var exportBtn = document.getElementById('hrExportReportBtn');
    if (!cur) {
      content.innerHTML = '<div class="em"><p>请选择一位员工查看成长档案</p></div>';
      if (exportBtn) exportBtn.style.display = 'none';
      return;
    }
    if (exportBtn) exportBtn.style.display = (ME.role === 'hr' ? '' : 'none');

    var records = ALL_DATA.filter(function(r) { return r['员工'] === cur; });
    var totalCost = 0, totalTrainings = records.length, avgScore = 0, scoreCount = 0;
    var statusMap = {}, typeMap = {}, yearMap = {};

    records.forEach(function(r) {
      totalCost += (parseFloat(r['费用']) || 0);
      var st = r['状态'] || '未知';
      statusMap[st] = (statusMap[st] || 0) + 1;
      var tp = r['培训类型'] || '未分类';
      typeMap[tp] = (typeMap[tp] || 0) + 1;
      var yr = (r['培训日期'] || '').slice(0, 4);
      if (yr) yearMap[yr] = (yearMap[yr] || 0) + 1;
      if (r['评估分数']) { avgScore += parseInt(r['评估分数']); scoreCount++; }
    });

    var empInfo = ALL_USERS.find(function(u) { return u.name === cur; });
    var dept = empInfo ? empInfo.dept : (records[0] ? records[0]['部门'] : '-');

    var h = '<div class="profile-card">';
    h += '<div class="profile-name">' + esc(cur) + '</div>';
    h += '<div class="profile-meta">部门：' + esc(dept) + ' | 累计培训 ' + totalTrainings + ' 次</div>';
    h += '<div class="profile-stats">';
    h += '<div class="st"><div class="st-l">累计费用</div><div class="st-v g">¥' + fmt(totalCost) + '</div></div>';
    h += '<div class="st"><div class="st-l">平均评估分</div><div class="st-v">' + (scoreCount > 0 ? (avgScore / scoreCount).toFixed(1) : '-') + '</div></div>';
    h += '<div class="st"><div class="st-l">培训类型数</div><div class="st-v">' + Object.keys(typeMap).length + '</div></div>';
    h += '<div class="st"><div class="st-l">已完成</div><div class="st-v g">' + (statusMap['已完成'] || 0) + '</div></div>';
    h += '</div>';

    // Status breakdown
    h += '<div style="font-size:13px;color:#666;margin-bottom:8px">状态分布：</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">';
    var sc2 = { '待审批':'bdo','已通过':'bdg','已驳回':'bdr','学习中':'bdb','总结已提交':'bdb','待评审':'bdp','30天已回访':'bdp','已完成':'bdg' };
    for (var st in statusMap) {
      h += '<span class="bd ' + (sc2[st] || 'bdy') + '">' + st + ' ' + statusMap[st] + '</span>';
    }
    h += '</div>';

    // Type breakdown
    h += '<div style="font-size:13px;color:#666;margin-bottom:8px">类型分布：</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">';
    for (var tp in typeMap) {
      h += '<span class="bd bdb">' + tp + ' ' + typeMap[tp] + '</span>';
    }
    h += '</div>';

    // Year breakdown
    if (Object.keys(yearMap).length > 0) {
      h += '<div style="font-size:13px;color:#666;margin-bottom:8px">年度趋势：</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">';
      var yrs = Object.keys(yearMap).sort();
      for (var yi = 0; yi < yrs.length; yi++) {
        h += '<span class="bd bdg">' + yrs[yi] + '年 ' + yearMap[yrs[yi]] + '次</span>';
      }
      h += '</div>';
    }

    // Records table
    if (records.length > 0) {
      h += '<div class="profile-records"><div style="font-size:13px;color:#666;margin-bottom:8px">培训记录明细：</div>';
      h += '<div class="tw"><table><thead><tr><th>项目</th><th>日期</th><th>费用</th><th>状态</th></tr></thead><tbody>';
      for (var ri = 0; ri < records.length; ri++) {
        var r = records[ri];
        h += '<tr><td>' + esc(r['培训项目']) + '</td><td>' + esc(r['培训日期'] || '-') + '</td><td>¥' + fmt(r['费用'] || 0) + '</td>';
        h += '<td><span class="bd ' + (sc2[r['状态']] || 'bdy') + '">' + esc(r['状态']) + '</span></td></tr>';
      }
      h += '</tbody></table></div></div>';
    }

    h += '</div>';
    content.innerHTML = h;
  }

  document.getElementById('pf-emp') && document.getElementById('pf-emp').addEventListener('change', renderProfile);

  // ─── HR导出个人培训报告 ───
  function hrExportReport() {
    var sel = document.getElementById('pf-emp');
    var empName = sel.value;
    if (!empName) { toast('请先选择员工'); return; }
    var records = ALL_DATA.filter(function(r) { return r['员工'] === empName; });
    if (records.length === 0) { toast('该员工暂无培训记录'); return; }
    var empInfo = ALL_USERS.find(function(u) { return u.name === empName; });
    var dept = empInfo ? empInfo.dept : (records[0] ? records[0]['部门'] : '-');
    generateReport(empName, dept, records, true);
  }
  function openMyReport() {
    var empName = ME.name;
    var isHR = ME.role === 'hr';
    var records = ALL_DATA.filter(function(r) { return r['员工'] === empName; });
    if (records.length === 0) {
      if (isHR) {
        toast('你还没有个人培训记录');
      } else {
        toast('暂无培训记录');
      }
      return;
    }
    var dept = (ALL_USERS.find(function(u) { return u.name === empName; }) || {}).dept || '-';
    generateReport(empName, dept, records, false);
  }

  function generateReport(empName, dept, records, forHR) {
    // ═══════════════════════════════════════════════════════
    //  一、数据统计层
    // ═══════════════════════════════════════════════════════
    var totalCost = 0, completedCount = 0, avgScore = 0, scoreCount = 0;
    var statusMap = {}, typeMap = {}, yearMap = {};
    var commitmentFulfilled = 0, commitmentTotal = 0;
    var self30Done = 0, self30Total = 0;
    var tagsAll = [], commentsAll = [];
    // 诊断数据
    var diagList = [];          // 问题清单 {type, severity, title, detail, record}
    var summaryOverdue = [];    // 总结逾期
    var goalVague = [];         // 目标模糊
    var noShare = [];           // 缺少分享
    var followUpMissing = [];   // 30天回访缺失
    var actionPending = [];     // 行动计划悬空

    var now = new Date();
    var fuzzyWords = /开阔眼界|提升能力|解决认知|学习同行|增长见识|提高水平|加强学习|增强意识/i;

    records.forEach(function(r) {
      totalCost += parseFloat(r['费用']) || 0;
      var st = r['状态'] || '未知';
      statusMap[st] = (statusMap[st] || 0) + 1;
      if (st === '已完成') completedCount++;
      var tp = r['培训类型'] || '未分类';
      typeMap[tp] = (typeMap[tp] || 0) + 1;
      var yr = (r['培训日期'] || '').slice(0, 4);
      if (yr) yearMap[yr] = (yearMap[yr] || 0) + 1;
      if (r['评估分数']) { avgScore += parseInt(r['评估分数']); scoreCount++; }
      if (r['30天自评内容']) { self30Total++; self30Done++; }
      else if (st === '总结已提交' || st === '30天已回访' || st === '已完成') { self30Total++; }
      if (r['行动计划'] && (r['状态'] === '已完成' || r['30天执行'])) commitmentFulfilled++;
      if (r['行动计划']) commitmentTotal++;
      if (r['评价标签']) r['评价标签'].split(',').forEach(function(t) { if (t.trim()) tagsAll.push(t.trim()); });
      if (r['评价内容']) commentsAll.push({ text: r['评价内容'], score: r['评估分数'], proj: r['培训项目'] });

      // ── 诊断分析 ──
      var trainDate = r['培训日期'] ? new Date(r['培训日期']) : null;
      var daysSinceTrain = trainDate ? Math.floor((now - trainDate) / 86400000) : -1;

      // 1. 总结逾期：培训后超过7天，状态仍停留在"学习中"或"已通过"
      if (daysSinceTrain > 7 && (st === '学习中' || st === '已通过')) {
        summaryOverdue.push(r);
        diagList.push({ type: 'summaryOverdue', severity: 'high', title: '总结逾期未提交', detail: esc(r['培训项目']) + '（' + r['培训日期'] + '，已超' + (daysSinceTrain - 7) + '天）', record: r });
      }

      // 2. 目标模糊：学习目标包含虚词
      var goal = r['学习目标'] || r['培训目标'] || '';
      if (goal && fuzzyWords.test(goal)) {
        goalVague.push(r);
        diagList.push({ type: 'goalVague', severity: 'medium', title: '学习目标不够具体', detail: esc(r['培训项目']) + '："' + esc(goal.slice(0, 40)) + (goal.length > 40 ? '...' : '') + '"', record: r });
      }

      // 3. 缺少分享：总结内容或附件中未提及"分享"
      var summary = r['学习总结'] || '';
      var hasShare = /分享|内部分享|部门分享|团队分享|转训/i.test(summary);
      if ((st === '总结已提交' || st === '30天已回访' || st === '已完成') && !hasShare) {
        noShare.push(r);
        diagList.push({ type: 'noShare', severity: 'medium', title: '未记录内部分享', detail: esc(r['培训项目']) + '：总结中未体现分享动作', record: r });
      }

      // 4. 30天回访缺失：状态到"总结已提交"但没有自评内容
      if (st === '总结已提交' && !r['30天自评内容']) {
        followUpMissing.push(r);
        diagList.push({ type: 'followUpMissing', severity: 'high', title: '30天回访待启动', detail: esc(r['培训项目']) + '：员工尚未提交30天自评', record: r });
      }

      // 5. 行动计划悬空：有行动计划但30天未确认执行
      if (r['行动计划'] && st !== '已完成' && !r['30天执行']) {
        actionPending.push(r);
        diagList.push({ type: 'actionPending', severity: 'medium', title: '行动计划未确认落地', detail: esc(r['培训项目']) + '：已提交行动计划，但30天回访未确认执行结果', record: r });
      }
    });

    var avgScoreVal = scoreCount > 0 ? (avgScore / scoreCount).toFixed(1) : '-';
    var completionRate = records.length > 0 ? Math.round(completedCount / records.length * 100) : 0;
    var self30Rate = self30Total > 0 ? Math.round(self30Done / self30Total * 100) : 0;
    var commitmentRate = commitmentTotal > 0 ? Math.round(commitmentFulfilled / commitmentTotal * 100) : 0;

    // 找出最常用标签 Top3
    var tagCount = {};
    tagsAll.forEach(function(t) { tagCount[t] = (tagCount[t] || 0) + 1; });
    var topTags = Object.keys(tagCount).sort(function(a, b) { return tagCount[b] - tagCount[a]; }).slice(0, 3);

    // ═══════════════════════════════════════════════════════
    //  二、闭环健康度评分
    // ═══════════════════════════════════════════════════════
    // 四个维度：申请审批(100%) → 学习总结 → 30天跟进 → 90天评估
    var applyRate = 100; // 有记录就是100
    var summaryRate = records.length > 0 ? Math.round((records.length - summaryOverdue.length) / records.length * 100) : 0;
    var followRate = self30Total > 0 ? self30Rate : 0;
    var eval90Rate = records.length > 0 ? Math.round(completedCount / records.length * 100) : 0;
    var healthScore = Math.round((applyRate + summaryRate + followRate + eval90Rate) / 4);
    var healthLabel = healthScore >= 80 ? '良好' : healthScore >= 60 ? '待改进' : '需关注';
    var healthColor = healthScore >= 80 ? '#4E9936' : healthScore >= 60 ? '#C4B800' : '#D9534F';
    var healthBg = healthScore >= 80 ? '#E8F5E9' : healthScore >= 60 ? '#FFFDE7' : '#FFEBEE';

    // ═══════════════════════════════════════════════════════
    //  三、生成报告 HTML
    // ═══════════════════════════════════════════════════════
    var reportDate = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0');
    var reportTitle = forHR ? empName + ' 培训报告' : '我的培训报告';
    var h = '<div id="reportWrap" style="font-family:Microsoft YaHei,PingFang SC,sans-serif;max-width:900px;margin:0 auto;padding:20px;color:#333">';

    // 打印样式
    h += '<style>@media print{.no-print{display:none!important}#reportWrap{padding:0!important}}#reportWrap h1,#reportWrap h2,#reportWrap h3{margin:0}#reportWrap table{border-collapse:collapse;width:100%}#reportWrap td,#reportWrap th{border:1px solid #ddd;padding:8px 10px;font-size:13px}#reportWrap th{background:#f5f5f5;font-weight:600}</style>';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LAYER 1: 报告标题 + 基础信息
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    h += '<div style="text-align:center;margin-bottom:28px">';
    h += '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:6px">';
    h += '<img src="/uploads/logo.png" alt="LOGO" style="height:36px" onerror="this.style.display=\'none\'">';
    h += '<h1 style="font-size:22px;color:#4E9936;font-weight:700">' + reportTitle + '</h1>';
    h += '</div>';
    h += '<div style="font-size:12px;color:#999">生成日期：' + reportDate + (forHR ? '　|　导出人：' + esc(ME.name) : '') + '</div>';
    h += '</div>';

    // 基础信息卡
    h += '<div style="background:#F4FCE3;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">';
    h += '<div style="text-align:center"><div style="font-size:12px;color:#999;margin-bottom:4px">姓名</div><div style="font-size:16px;font-weight:700">' + esc(empName) + '</div></div>';
    h += '<div style="text-align:center"><div style="font-size:12px;color:#999;margin-bottom:4px">部门</div><div style="font-size:16px;font-weight:700">' + esc(dept) + '</div></div>';
    h += '<div style="text-align:center"><div style="font-size:12px;color:#999;margin-bottom:4px">累计培训</div><div style="font-size:16px;font-weight:700;color:#4E9936">' + records.length + ' <span style="font-size:12px;font-weight:400;color:#999">次</span></div></div>';
    h += '<div style="text-align:center"><div style="font-size:12px;color:#999;margin-bottom:4px">累计费用</div><div style="font-size:16px;font-weight:700">¥' + fmt(totalCost) + '</div></div>';
    h += '</div>';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LAYER 2: 闭环健康诊断（红绿灯）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    h += '<div style="background:' + healthBg + ';border-radius:12px;padding:16px 20px;margin-bottom:20px;border-left:4px solid ' + healthColor + '">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
    h += '<h3 style="font-size:15px;color:#333;font-weight:700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;color:' + healthColor + '"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>培训闭环健康度：' + healthLabel + '（' + healthScore + '分）</h3>';
    h += '<span style="font-size:12px;color:#999">共发现 ' + diagList.length + ' 项待改进</span>';
    h += '</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
    var loopItems = [
      { label: '申请审批', rate: applyRate, color: '#4E9936', icon: 'check' },
      { label: '学习总结', rate: summaryRate, color: summaryRate >= 80 ? '#4E9936' : summaryRate >= 60 ? '#C4B800' : '#D9534F', icon: 'file' },
      { label: '30天跟进', rate: followRate, color: followRate >= 80 ? '#4E9936' : followRate >= 60 ? '#C4B800' : '#D9534F', icon: 'clock' },
      { label: '90天评估', rate: eval90Rate, color: eval90Rate >= 80 ? '#4E9936' : eval90Rate >= 60 ? '#C4B800' : '#D9534F', icon: 'award' }
    ];
    loopItems.forEach(function(li) {
      h += '<div style="background:#fff;border-radius:8px;padding:10px;text-align:center">';
      h += '<div style="font-size:11px;color:#999;margin-bottom:4px">' + li.label + '</div>';
      h += '<div style="font-size:20px;font-weight:700;color:' + li.color + '">' + li.rate + '%</div>';
      h += '<div style="width:100%;height:4px;background:#eee;border-radius:2px;margin-top:6px;overflow:hidden">';
      h += '<div style="width:' + li.rate + '%;height:100%;background:' + li.color + ';border-radius:2px"></div>';
      h += '</div></div>';
    });
    h += '</div></div>';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LAYER 3: 核心指标（保留原有）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    h += '<div style="background:#F4FCE3;border-radius:12px;padding:16px 20px;margin-bottom:20px">';
    h += '<h3 style="font-size:14px;color:#666;margin-bottom:14px"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> 培训成效概览</h3>';
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">';
    h += metricCard('完成率', completionRate + '%', '#4E9936', completedCount + '/' + records.length + '次完成');
    h += metricCard('平均评分', avgScoreVal + '分', '#6BBF4E', scoreCount + '条评分');
    h += metricCard('承诺落地', commitmentRate + '%', '#3AAFA5', commitmentFulfilled + '/' + commitmentTotal + '项落地');
    h += metricCard('30天跟进', self30Rate + '%', '#9A9000', self30Done + '/' + self30Total + '已完成');
    h += '</div></div>';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LAYER 4: 问题诊断清单（新增）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (diagList.length > 0) {
      h += '<div style="background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:20px;border:1px solid #f0e6e6">';
      h += '<h3 style="font-size:15px;color:#333;font-weight:700;margin-bottom:14px"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;color:#D9534F"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>问题诊断清单</h3>';
      h += '<div style="display:flex;flex-direction:column;gap:8px">';
      diagList.forEach(function(d, i) {
        var badgeColor = d.severity === 'high' ? '#D9534F' : '#C4B800';
        var badgeBg = d.severity === 'high' ? '#FFEBEE' : '#FFFDE7';
        h += '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#fafafa;border-radius:8px;border-left:3px solid ' + badgeColor + '">';
        h += '<span style="flex-shrink:0;font-size:11px;padding:2px 8px;border-radius:4px;background:' + badgeBg + ';color:' + badgeColor + ';font-weight:600">' + (d.severity === 'high' ? '高风险' : '待改进') + '</span>';
        h += '<div style="flex:1">';
        h += '<div style="font-size:13px;font-weight:600;color:#333;margin-bottom:2px">' + d.title + '</div>';
        h += '<div style="font-size:12px;color:#666">' + d.detail + '</div>';
        h += '</div></div>';
      });
      h += '</div></div>';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LAYER 5: 标签印象 & 年度趋势（保留原有）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';
    h += '<div style="background:#F4FCE3;border-radius:12px;padding:16px 20px">';
    h += '<h3 style="font-size:14px;color:#666;margin-bottom:12px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> 培训标签印象</h3>';
    if (topTags.length > 0) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
      topTags.forEach(function(t) { h += '<span style="background:#EEF9E8;color:#4E9936;padding:4px 10px;border-radius:16px;font-size:12px;font-weight:600">' + esc(t) + ' ×' + tagCount[t] + '</span>'; });
      h += '</div>';
    } else { h += '<div style="color:#999;font-size:13px">暂无标签数据</div>'; }
    h += '</div>';
    h += '<div style="background:#F4FCE3;border-radius:12px;padding:16px 20px">';
    h += '<h3 style="font-size:14px;color:#666;margin-bottom:12px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>年度培训趋势</h3>';
    var years = Object.keys(yearMap).sort();
    if (years.length > 0) {
      var maxY = Math.max.apply(null, years.map(function(y) { return yearMap[y]; }));
      h += '<div style="display:flex;align-items:flex-end;gap:8px;height:60px">';
      years.forEach(function(y) {
        var barH = Math.round(yearMap[y] / maxY * 56);
        h += '<div style="flex:1;text-align:center">';
        h += '<div style="background:#CCEF7F;border-radius:4px 4px 0 0;width:100%;height:' + barH + 'px;margin-bottom:4px"></div>';
        h += '<div style="font-size:11px;color:#666">' + y + '</div>';
        h += '<div style="font-size:11px;color:#4E9936;font-weight:600">' + yearMap[y] + '次</div>';
        h += '</div>';
      });
      h += '</div>';
    } else { h += '<div style="color:#999;font-size:13px">暂无年度数据</div>'; }
    h += '</div></div>';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LAYER 6: 培训明细表（增强版，带问题标记）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    h += '<div style="background:#faf8f7;border-radius:12px;padding:16px 20px;margin-bottom:20px">';
    h += '<h3 style="font-size:14px;color:#666;margin-bottom:14px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 培训明细</h3>';
    h += '<div style="overflow-x:auto">';
    h += '<table><thead><tr><th>序号</th><th>培训项目</th><th>类型</th><th>日期</th><th>费用</th><th>状态</th><th>闭环</th></tr></thead><tbody>';
    records.forEach(function(r, i) {
      // 检查该记录是否有诊断问题
      var recIssues = diagList.filter(function(d) { return d.record === r; });
      var issueTags = recIssues.map(function(d) {
        var color = d.severity === 'high' ? '#D9534F' : '#C4B800';
        return '<span style="display:inline-block;font-size:10px;padding:1px 5px;border-radius:3px;background:' + color + ';color:#fff;margin-left:3px">' + d.title.slice(0, 4) + '</span>';
      }).join('');

      var loopStatus = '─';
      var loopColor = '#999';
      var st = r['状态'] || '未知';
      if (st === '已完成') { loopStatus = '已完成'; loopColor = '#4E9936'; }
      else if (st === '30天已回访') { loopStatus = '待评估'; loopColor = '#3AAFA5'; }
      else if (st === '总结已提交') { loopStatus = '待跟进'; loopColor = '#C4B800'; }
      else if (st === '学习中' || st === '已通过') { loopStatus = '待总结'; loopColor = '#D9534F'; }

      h += '<tr>';
      h += '<td>' + (i + 1) + '</td>';
      h += '<td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + esc(r['培训项目']) + '">' + esc(r['培训项目']) + issueTags + '</td>';
      h += '<td>' + esc(r['培训类型'] || '-') + '</td>';
      h += '<td>' + esc(r['培训日期'] || '-') + '</td>';
      h += '<td>¥' + fmt(r['费用'] || 0) + '</td>';
      h += '<td>' + esc(st) + '</td>';
      h += '<td><span style="color:' + loopColor + ';font-weight:600;font-size:12px">' + loopStatus + '</span></td>';
      h += '</tr>';
    });
    h += '</tbody></table></div></div>';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LAYER 7: 改进建议（新增）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (forHR && diagList.length > 0) {
      h += '<div style="background:#E3F2FD;border-radius:12px;padding:16px 20px;margin-bottom:20px;border-left:4px solid #2196F3">';
      h += '<h3 style="font-size:15px;color:#333;font-weight:700;margin-bottom:12px"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;color:#2196F3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>改进建议</h3>';
      h += '<div style="font-size:13px;color:#444;line-height:1.8">';
      var suggestions = [];
      if (summaryOverdue.length > 0) suggestions.push('• <b>追缴逾期总结</b>：' + summaryOverdue.length + ' 场培训总结逾期未交，建议限期追缴（' + summaryOverdue.map(function(r) { return esc(r['培训项目']); }).join('、') + '）');
      if (goalVague.length > 0) suggestions.push('• <b>审批把关目标质量</b>：该员工 ' + goalVague.length + ' 条记录的学习目标偏虚，下次审批时要求补充可衡量指标');
      if (noShare.length > 0) suggestions.push('• <b>落实内部分享机制</b>：' + noShare.length + ' 场培训未记录分享动作，建议要求在部门周会中做15分钟转训');
      if (followUpMissing.length > 0) suggestions.push('• <b>启动30天回访</b>：' + followUpMissing.length + ' 条记录已到回访节点，请催促员工提交30天自评');
      if (actionPending.length > 0) suggestions.push('• <b>确认行动计划落地</b>：' + actionPending.length + ' 项行动计划待回访确认，建议安排HR面谈核实');
      if (healthScore < 60) suggestions.push('• <b>整体关注</b>：该员工培训闭环健康度仅 ' + healthScore + ' 分，建议主管重点关注其培训成果转化情况');
      suggestions.forEach(function(s) { h += '<div style="margin-bottom:6px">' + s + '</div>'; });
      h += '</div></div>';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LAYER 8: 精选评语（保留原有）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (commentsAll.length > 0) {
      h += '<div style="background:#faf8f7;border-radius:12px;padding:16px 20px;margin-bottom:20px">';
      h += '<h3 style="font-size:14px;color:#666;margin-bottom:12px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 培训评语精选</h3>';
      commentsAll.slice(0, 3).forEach(function(c, i) {
        h += '<div style="background:#fff;border-radius:8px;padding:10px 14px;margin-bottom:' + (i < 2 ? '8px' : '0') + ';border-left:3px solid #CCEF7F">';
        h += '<div style="font-size:11px;color:#999;margin-bottom:4px">' + esc(c.proj) + (c.score ? ' · ' + c.score + '分' : '') + '</div>';
        h += '<div style="font-size:13px;color:#555;line-height:1.6">"' + esc(c.text) + '"</div>';
        h += '</div>';
      });
      h += '</div>';
    }

    // 底部打印按钮
    h += '<div style="text-align:center;margin-top:8px" class="no-print">';
    h += '<button class="bt" onclick="window.print()" style="margin-right:10px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>️ 打印报告</button>';
    h += '<button class="bt bts" onclick="closeM()">关闭</button>';
    h += '</div>';
    h += '</div>';

    openM('个人培训报告', h, '90%');
  }

  function metricCard(label, value, color, sub) {
    return '<div style="text-align:center;background:#fff;border-radius:10px;padding:12px 8px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">' +
           '<div style="font-size:11px;color:#999;margin-bottom:4px">' + label + '</div>' +
           '<div style="font-size:24px;font-weight:700;color:' + color + ';line-height:1.2">' + value + '</div>' +
           '<div style="font-size:11px;color:#bbb;margin-top:2px">' + sub + '</div></div>';
  }

  var LOG_PAGE = 1, LOG_SIZE = 20, LOG_TOTAL = 0, ALL_LOG_FILTERED = [];

  function renderLog() {
    var logs = ALL_LOGS.slice();
    var q = document.getElementById('l-q').value.toLowerCase();
    if (q) logs = logs.filter(function(l) { return (l.operator + l.action + l.detail).toLowerCase().indexOf(q) >= 0; });
    var fromDate = document.getElementById('l-from').value;
    var toDate = document.getElementById('l-to').value;
    if (fromDate || toDate) {
      logs = logs.filter(function(l) {
        var lt = l.time.split(' ')[0]; // 'YYYY/MM/DD HH:mm:ss' -> 'YYYY/MM/DD'
        if (fromDate && lt < fromDate.replace(/\//g, '-')) return false;
        if (toDate && lt > toDate.replace(/\//g, '-')) return false;
        return true;
      });
    }
    ALL_LOG_FILTERED = logs;
    LOG_PAGE = 1;
    renderLogPage();
  }

  function renderLogPage() {
    var tb = document.getElementById('logTb');
    var total = ALL_LOG_FILTERED.length;
    var totalPages = Math.max(1, Math.ceil(total / LOG_SIZE));
    if (LOG_PAGE > totalPages) LOG_PAGE = totalPages;
    var start = (LOG_PAGE - 1) * LOG_SIZE;
    var page = ALL_LOG_FILTERED.slice(start, start + LOG_SIZE);
    if (total === 0) {
      tb.innerHTML = '<tr><td colspan="4"><div class="em"><p>暂无日志</p></div></td></tr>';
    } else {
      var h = '';
      for (var i = 0; i < page.length; i++) {
        var l = page[i];
        h += '<tr><td style="white-space:nowrap">' + esc(l.time) + '</td><td>' + esc(l.operator) + '</td><td>' + esc(l.action) + '</td><td>' + esc(l.detail) + '</td></tr>';
      }
      tb.innerHTML = h;
    }
    document.getElementById('logPageInfo').textContent = '第 ' + LOG_PAGE + ' / ' + totalPages + ' 页，共 ' + total + ' 条';
    document.getElementById('logPrev').disabled = LOG_PAGE <= 1;
    document.getElementById('logNext').disabled = LOG_PAGE >= totalPages;
  }

  document.getElementById('l-q').addEventListener('input', renderLog);
  document.getElementById('l-from').addEventListener('change', renderLog);
  document.getElementById('l-to').addEventListener('change', renderLog);
  document.getElementById('logPrev').addEventListener('click', function() { if (LOG_PAGE > 1) { LOG_PAGE--; renderLogPage(); } });
  document.getElementById('logNext').addEventListener('click', function() { var totalPages = Math.max(1, Math.ceil(ALL_LOG_FILTERED.length / LOG_SIZE)); if (LOG_PAGE < totalPages) { LOG_PAGE++; renderLogPage(); } });

  // ─── 通知设置 ───
  function loadWebhookConfig() {
    apiGet('getWebhook').then(function(res) {
      if (res.ok && res.data) {
        document.getElementById('webhook-url').value = res.data.url || '';
        document.getElementById('webhook-enabled').checked = res.data.enabled;
      }
    });
  }
  document.getElementById('webhook-save').addEventListener('click', function() {
    var url = document.getElementById('webhook-url').value.trim();
    var enabled = document.getElementById('webhook-enabled').checked;
    apiPost('saveWebhook', { url: url, enabled: enabled }).then(function(res) {
      var msg = document.getElementById('webhook-msg');
      msg.style.display = 'block';
      if (res.ok) {
        msg.style.background = '#e8f5e9';
        msg.style.color = '#2e7d32';
        msg.textContent = '✓ 设置已保存';
      } else {
        msg.style.background = '#ffebee';
        msg.style.color = '#c62828';
        msg.textContent = '✗ 保存失败：' + res.msg;
      }
      setTimeout(function() { msg.style.display = 'none'; }, 3000);
    });
  });
  document.getElementById('webhook-test').addEventListener('click', function() {
    var url = document.getElementById('webhook-url').value.trim();
    if (!url) { toast('请先输入Webhook地址'); return; }
    var btn = document.getElementById('webhook-test');
    btn.disabled = true;
    btn.textContent = '发送中...';
    apiPost('testWebhook', { url: url }).then(function(res) {
      btn.disabled = false;
      btn.textContent = '发送测试';
      var msg = document.getElementById('webhook-msg');
      msg.style.display = 'block';
      if (res.errcode === 0) {
        msg.style.background = '#e8f5e9';
        msg.style.color = '#2e7d32';
        msg.textContent = '✓ 测试消息发送成功！请查看企业微信群';
      } else {
        msg.style.background = '#ffebee';
        msg.style.color = '#c62828';
        msg.textContent = '✗ 发送失败：' + (res.errmsg || '请检查Webhook地址是否正确');
      }
      setTimeout(function() { msg.style.display = 'none'; }, 5000);
    });
  });

  function renderUsers() {
    var tb = document.getElementById('userTb');
    if (ALL_USERS.length === 0) { tb.innerHTML = '<tr><td colspan="5"><div class="em"><p>暂无用户</p></div></td></tr>'; return; }
    var h = '';
    for (var i = 0; i < ALL_USERS.length; i++) {
      var u = ALL_USERS[i];
      var roleLabel = u.role === 'hr' ? 'HR管理员' : '员工';
      h += '<tr><td>' + esc(u.username) + '</td><td>' + esc(u.name) + '</td><td>' + roleLabel + '</td><td>' + esc(u.dept || '-') + '</td>';
      h += '<td><button class="bt bts" data-action="editUser" data-user="' + esc(u.username) + '">编辑</button> <button class="bt bts" data-action="resetPwd" data-user="' + esc(u.username) + '">重置密码</button> ';
      if (u.username !== ME.username) h += '<button class="bt bts btd" data-action="delUser" data-user="' + esc(u.username) + '">删除</button>';
      h += '</td></tr>';
    }
    tb.innerHTML = h;
    var btns = tb.querySelectorAll('button[data-action]');
    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener('click', function() {
        var act = this.getAttribute('data-action');
        var uname = this.getAttribute('data-user');
        if (act === 'delUser') {
          var targetUsername = uname;
          openConfirmModal(
            '删除用户',
            '确定删除用户"' + uname + '"？其培训记录不会被删除。',
            function() {
              apiPost('deleteUser', { username: targetUsername, _operator: ME.name }).then(function(r) {
                if (r.ok) { toast('已删除'); refreshData().then(function() { renderUsers(); }); }
                else toast('删除失败：' + (r.msg || ''));
              });
            },
            false
          );
        }
        if (act === 'editUser') {
          var targetEdit = uname;
          var editUser = ALL_USERS.find(function(x) { return x.username === targetEdit; }) || {};
          var deptOpts = ALL_DEPTS.map(function(d) { return '<option value="' + esc(d) + '"' + (d === editUser.dept ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('');
          var h = '<div class="fgd">';
          h += '<div class="fg fl"><label>用户名</label><input value="' + esc(editUser.username || '') + '" disabled style="background:#f5f5f3;color:#999"></div>';
          h += '<div class="fg fl"><label>姓名 *</label><input id="eu-name" value="' + esc(editUser.name || '') + '"></div>';
          h += '<div class="fg fl"><label>部门</label><select id="eu-dept"><option value="">-- 无部门 --</option>' + deptOpts + '</select></div>';
          h += '<div class="fg fl"><label>角色</label><select id="eu-role"><option value="employee"' + (editUser.role !== 'hr' ? ' selected' : '') + '>员工</option><option value="hr"' + (editUser.role === 'hr' ? ' selected' : '') + '>HR管理员</option></select></div>';
          h += '<div class="fa"><button class="bt" id="eu-cancel">取消</button><button class="bt btp" id="eu-save">保存</button></div></div>';
          openM('编辑用户 · ' + esc(editUser.name || targetEdit), h);
          document.getElementById('eu-cancel').addEventListener('click', closeM);
          document.getElementById('eu-save').addEventListener('click', function() {
            var newName = document.getElementById('eu-name').value.trim();
            if (!newName) { toast('姓名不能为空'); return; }
            var newDept = document.getElementById('eu-dept').value;
            var newRole = document.getElementById('eu-role').value;
            apiPost('updateUser', { username: targetEdit, name: newName, dept: newDept, role: newRole, _operator: ME.name }).then(function(r) {
              if (r.ok) {
                toast('已保存 ✓');
                closeM();
                refreshData().then(function() { renderUsers(); renderDept(); });
              } else toast('保存失败：' + (r.msg || ''));
            });
          });
        }
        if (act === 'resetPwd') {
          var targetUser2 = uname;
          var h = '<div class="fgd">';
          h += '<div class="fg fl"><label>为 <b>' + esc(uname) + '</b> 设置新密码</label><input id="rp-pwd" type="password" placeholder="至少6位"></div>';
          h += '<div class="fa"><button class="bt" id="rp-cancel">取消</button><button class="bt btp" id="rp-save">确认重置</button></div></div>';
          openM('重置密码', h);
          document.getElementById('rp-cancel').addEventListener('click', closeM);
          document.getElementById('rp-save').addEventListener('click', function() {
            var newP = document.getElementById('rp-pwd').value;
            if (!newP || newP.length < 6) { toast('密码至少6位'); return; }
            closeM();
            apiPost('resetPwd', { username: targetUser2, password: newP, _operator: ME.name }).then(function(r) {
              if (r.ok) toast('密码已重置 ✓');
              else toast('重置失败：' + (r.msg || ''));
            });
          });
        }
      });
    }
  }

  document.getElementById('importUsersBtn').addEventListener('click', openImportUsersModal);
  document.getElementById('downloadTplBtn').addEventListener('click', function(e) {
    e.preventDefault();
    downloadUserTemplate();
  });

  document.getElementById('addUserBtn').addEventListener('click', function() {
    var h = '<div class="fgd">';
    h += '<div class="fg"><label>用户名 *</label><input id="nu-user"></div>';
    h += '<div class="fg"><label>密码 *</label><input id="nu-pwd" type="password"></div>';
    h += '<div class="fg"><label>姓名 *</label><input id="nu-name"></div>';
    h += '<div class="fg"><label>部门</label><input id="nu-dept"></div>';
    h += '<div class="fg fl"><label>角色</label><select id="nu-role"><option value="employee">员工</option><option value="hr">HR管理员</option></select></div>';
    h += '<div class="fa"><button class="bt" id="nuCancel">取消</button><button class="bt btp" id="nuSave">创建</button></div></div>';
    openM('新增用户', h);
    document.getElementById('nuCancel').addEventListener('click', closeM);
    document.getElementById('nuSave').addEventListener('click', function() {
      var u = document.getElementById('nu-user').value.trim();
      var p = document.getElementById('nu-pwd').value;
      var n = document.getElementById('nu-name').value.trim();
      if (!u || !p || !n) { toast('请填写必填项'); return; }
      apiPost('addUser', { username: u, password: p, name: n, role: document.getElementById('nu-role').value, dept: document.getElementById('nu-dept').value.trim(), _operator: ME.name }).then(function(r) {
        if (r.ok) { toast('用户已创建'); closeM(); refreshData().then(function() { renderUsers(); }); }
        else toast(r.msg || '创建失败');
      });
    });
  });

  // ─── 申请表草稿自动保存 ───
  var DRAFT_KEY = 'tvt_apply_draft_';
  var applyFields = ['a-proj','a-org','a-date','a-cost','a-loc','a-goal','a-out'];
  var applySelects = ['a-type'];

  function saveDraft() {
    if (!ME) return;
    var d = {};
    applyFields.forEach(function(id) { var el = document.getElementById(id); if (el) d[id] = el.value; });
    applySelects.forEach(function(id) { var el = document.getElementById(id); if (el) d[id] = el.value; });
    var hasContent = applyFields.some(function(id) { return d[id] && d[id].trim(); });
    if (hasContent) {
      localStorage.setItem(DRAFT_KEY + ME.username, JSON.stringify(d));
    }
  }

  function loadDraft() {
    if (!ME) return;
    var raw = localStorage.getItem(DRAFT_KEY + ME.username);
    if (!raw) return;
    try {
      var d = JSON.parse(raw);
      var hasContent = false;
      applyFields.forEach(function(id) { var el = document.getElementById(id); if (el && d[id]) { el.value = d[id]; hasContent = true; } });
      applySelects.forEach(function(id) { var el = document.getElementById(id); if (el && d[id]) el.value = d[id]; });
      if (hasContent) {
        var bar = document.getElementById('applyDraftBar');
        if (bar) { bar.style.display = 'flex'; }
      }
    } catch(e) {}
  }

  function clearDraft() {
    if (!ME) return;
    localStorage.removeItem(DRAFT_KEY + ME.username);
    var bar = document.getElementById('applyDraftBar');
    if (bar) bar.style.display = 'none';
  }

  function bindDraftListeners() {
    applyFields.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', saveDraft);
    });
    applySelects.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', saveDraft);
    });
    var clearBtn = document.getElementById('clearDraftBtn');
    if (clearBtn) clearBtn.addEventListener('click', function() {
      clearDraft();
      applyFields.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
      applySelects.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
      toast('草稿已清空');
    });
  }

  // ─── datalist 历史补全（从已有记录里提取） ───
  function updateDatalist() {
    var orgs = {}, locs = {};
    ALL_DATA.forEach(function(r) {
      if (r['培训机构']) orgs[r['培训机构']] = true;
      if (r['地点']) locs[r['地点']] = true;
    });
    var dlOrg = document.getElementById('dl-org');
    var dlLoc = document.getElementById('dl-loc');
    if (dlOrg) {
      dlOrg.innerHTML = Object.keys(orgs).map(function(v) { return '<option value="' + esc(v) + '">'; }).join('');
    }
    if (dlLoc) {
      dlLoc.innerHTML = Object.keys(locs).map(function(v) { return '<option value="' + esc(v) + '">'; }).join('');
    }
  }

  // ─── 员工撤回「待审批」申请 ───
  function withdrawApply(id) {
    var r = findRecord(id);
    if (!r || r['状态'] !== '待审批') return;
    openConfirmModal(
      '撤回申请',
      '撤回《' + esc(r['培训项目']) + '》申请？撤回后可随时修改后重新提交。',
      function() {
        apiPost('withdrawRecord', { id: id, _operator: ME.name }).then(function(res) {
          if (res.ok) { toast('已撤回，可在"我的记录"中重新提交'); refreshData().then(function() { renderMy(); }); }
          else toast('撤回失败：' + (res.msg || ''));
        });
      },
      false
    );
  }

  // ─── 员工重新提交已撤回的申请 ───
  function resubmitApply(id) {
    var r = findRecord(id);
    if (!r || r['状态'] !== '已撤回') return;
    openConfirmModal(
      '重新提交申请',
      '将《' + esc(r['培训项目']) + '》重新提交审批？你可以在提交前修改申请内容。',
      function() {
        openEdit(id);
      },
      false
    );
  }

  // ─── HR批量导入用户（CSV） ───
  function downloadUserTemplate() {
    var csv = '\uFEFF用户名,密码,姓名,部门,角色\n';
    csv += 'zhangsan,123456,张三,销售部,员工\n';
    csv += 'lisi,123456,李四,技术部,员工\n';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = '用户导入模板.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function openImportUsersModal() {
    var h = '<div style="font-size:13px;color:#666;margin-bottom:12px">CSV格式：<code style="background:#f5f5f3;padding:2px 6px;border-radius:4px">用户名,密码,姓名,部门,角色</code>，角色填"员工"或"HR管理员"</div>';
    h += '<div class="fg"><label>选择CSV文件</label><input type="file" id="import-csv" accept=".csv"></div>';
    h += '<div id="import-preview" style="margin-top:8px;font-size:13px"></div>';
    h += '<div class="fa"><button class="bt" id="import-cancel">取消</button><button class="bt btp" id="import-confirm" disabled>导入</button></div>';
    openM('批量导入用户', h);
    document.getElementById('import-cancel').addEventListener('click', closeM);

    var parsedRows = [];
    document.getElementById('import-csv').addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        var text = e.target.result;
        // 去掉BOM
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        var lines = text.split(/\r?\n/).filter(function(l) { return l.trim(); });
        parsedRows = [];
        var errors = [];
        var existUsers = {};
        ALL_USERS.forEach(function(u) { existUsers[u.username] = true; });
        for (var i = 1; i < lines.length; i++) {
          var cols = lines[i].split(',');
          if (cols.length < 3) { errors.push('第' + (i+1) + '行格式错误'); continue; }
          var uname = cols[0].trim(), pwd = cols[1].trim(), name = cols[2].trim();
          var dept = (cols[3] || '').trim(), role = (cols[4] || '').trim();
          if (!uname || !pwd || !name) { errors.push('第' + (i+1) + '行缺少必填字段'); continue; }
          if (pwd.length < 6) { errors.push('第' + (i+1) + '行密码不足6位'); continue; }
          if (existUsers[uname]) { errors.push('第' + (i+1) + '行用户名"' + uname + '"已存在'); continue; }
          var roleVal = (role === 'HR管理员' || role === 'hr') ? 'hr' : 'employee';
          parsedRows.push({ username: uname, password: pwd, name: name, dept: dept, role: roleVal });
          existUsers[uname] = true; // 防止同文件内重复
        }
        var preview = '';
        if (errors.length > 0) {
          preview += '<div style="color:var(--danger);margin-bottom:6px;font-weight:600">' + errors.map(esc).join('<br>') + '</div>';
        }
        if (parsedRows.length > 0) {
          preview += '<div style="color:var(--success);margin-bottom:6px;font-weight:600">将导入 <b>' + parsedRows.length + '</b> 个用户：' + parsedRows.map(function(r) { return esc(r.name) + '(' + esc(r.username) + ')'; }).join('、') + '</div>';
        }
        document.getElementById('import-preview').innerHTML = preview || '<div style="color:var(--text-muted)">未识别到有效数据</div>';
        document.getElementById('import-confirm').disabled = parsedRows.length === 0;
      };
      reader.readAsText(file, 'UTF-8');
    });

    document.getElementById('import-confirm').addEventListener('click', function() {
      if (!parsedRows.length) return;
      toast('导入中...');
      var promises = parsedRows.map(function(row) {
        return apiPost('addUser', { username: row.username, password: row.password, name: row.name, dept: row.dept, role: row.role, _operator: ME.name });
      });
      Promise.all(promises).then(function(results) {
        var ok = results.filter(function(r) { return r.ok; }).length;
        var fail = results.length - ok;
        closeM();
        toast('导入完成：成功 ' + ok + ' 个' + (fail > 0 ? '，失败 ' + fail + ' 个' : ''));
        refreshData().then(function() { renderUsers(); });
        var tipsEl = document.getElementById('importTips');
        if (tipsEl) {
          tipsEl.style.display = 'block';
          tipsEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 批量导入完成：成功 <b>' + ok + '</b> 个' + (fail > 0 ? '，失败 <b>' + fail + '</b> 个（用户名重复或格式错误）' : '');
        }
      });
    });
  }



  // ─── 修改密码 ───
  document.getElementById('changePwdBtn').addEventListener('click', function() {
    var oldPwd = document.getElementById('oldPwd').value;
    var p1 = document.getElementById('newPwd').value;
    var p2 = document.getElementById('newPwd2').value;
    if (!oldPwd) { toast('请输入当前密码'); return; }
    if (!p1) { toast('请输入新密码'); return; }
    if (p1 !== p2) { toast('两次密码不一致'); return; }
    if (p1.length < 6) { toast('密码至少6位'); return; }
    apiPost('changePwd', { oldPassword: oldPwd, password: p1 }).then(function(r) {
      if (r.ok) {
        toast('密码已修改 ✓');
        document.getElementById('oldPwd').value = '';
        document.getElementById('newPwd').value = '';
        document.getElementById('newPwd2').value = '';
      } else toast(r.msg || '修改失败');
    });
  });

  // ─── 备份列表 ───
  function loadBackupList() {
    apiGet('listBackups').then(function(r) {
      if (!r.ok) return;
      var items = r.data || [];
      var el = document.getElementById('backupItems');
      var container = document.getElementById('backupList');
      if (items.length === 0) { container.style.display = 'none'; return; }
      container.style.display = 'block';
      var html = '';
      items.forEach(function(f) {
        var sizeStr = f.size > 1048576 ? (f.size/1048576).toFixed(1)+'MB' : Math.round(f.size/1024)+'KB';
        html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0eeeb;font-size:13px">';
        html += '<div style="flex:1;min-width:0">';
        html += '<div style="font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(f.name) + '">' + esc(f.name) + '</div>';
        html += '<div style="font-size:11px;color:var(--text-muted)">' + f.time + '  ' + sizeStr + '</div>';
        html += '</div>';
        html += '<button class="bt bts btg" onclick="restoreBackup(\'' + esc(f.name) + '\')" style="flex-shrink:0">恢复</button>';
        html += '<button class="bt bts btd" onclick="deleteBackup(\'' + esc(f.name) + '\')" style="flex-shrink:0">删除</button>';
        html += '</div>';
      });
      el.innerHTML = html;
    });
  }

  window.restoreBackup = function(fname) {
    if (!confirm('确定要从以下备份恢复数据？\n\n' + fname + '\n\n注意：恢复前系统会自动备份当前数据！')) return;
    apiPost('restoreBackup', { filename: fname }).then(function(r) {
      if (r.ok) { toast('恢复成功 ✓ ' + r.msg); loadBackupList(); refreshData(); }
      else toast(r.msg || '恢复失败');
    });
  };

  window.deleteBackup = function(fname) {
    if (!confirm('确定删除备份？\n' + fname)) return;
    apiPost('deleteBackup', { filename: fname }).then(function(r) {
      if (r.ok) { toast('已删除'); loadBackupList(); }
      else toast(r.msg || '删除失败');
    });
  };

  document.getElementById('backupBtn').addEventListener('click', function() {
    apiPost('backup', {}).then(function(r) {
      if (r.ok) { toast('备份成功 ✓'); document.getElementById('backupResult').textContent = '已保存：' + r.file; loadBackupList(); }
      else toast('备份失败');
    });
  });

  document.getElementById('refreshBackupsBtn').addEventListener('click', loadBackupList);

  // ─── 培训报告 ───
  document.getElementById('exportReportBtn').addEventListener('click', function() {
    var now = new Date();
    var year = now.getFullYear();
    var today = now.toLocaleDateString('zh-CN');
    var thisYearRecs = ALL_DATA.filter(function(r) {
      var d = new Date(r['培训日期'] || r['createdAt'] || '');
      return d.getFullYear() === year;
    });
    var totalCost = 0, sumCount = 0, doneCount = 0;
    var deptMap = {};
    thisYearRecs.forEach(function(r) {
      totalCost += parseFloat(r['费用']) || 0;
      if (r['总结内容']) sumCount++;
      if (r['状态'] === '已完成') doneCount++;
      var dept = r['部门'] || '未知';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, done: 0, cost: 0 };
      deptMap[dept].total++;
      if (r['状态'] === '已完成') deptMap[dept].done++;
      deptMap[dept].cost += parseFloat(r['费用']) || 0;
    });
    var stMap = { '待审批':'badge-o', '已通过':'badge-b', '已驳回':'badge-r', '学习中':'badge-b', '总结已提交':'badge-b', '待评审':'badge-b', '30天已回访':'badge-g', '已完成':'badge-g' };
    var rateAll = thisYearRecs.length ? Math.round(doneCount/thisYearRecs.length*100) : 0;
    var reportHtml = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>培训报告 '+year+'</title><style>' +
      'body{font-family:-apple-system,"Microsoft YaHei",sans-serif;padding:40px;color:#333;font-size:14px;line-height:1.8;max-width:900px;margin:0 auto}' +
      'h1{text-align:center;color:#4E9936;border-bottom:3px solid #A8D94A;padding-bottom:12px;margin-bottom:6px;font-size:22px}' +
      '.sub{text-align:center;color:#93A88A;font-size:13px;margin-bottom:32px}' +
      '.cards{text-align:center;margin-bottom:28px}' +
      '.card{display:inline-block;background:#F4FCE3;border:1px solid #E2E8DC;border-radius:8px;padding:16px 24px;margin:5px;text-align:center;min-width:120px}' +
      '.card.v{font-size:28px;font-weight:700}.card.l{font-size:12px;color:#93A88A;margin-top:4px}' +
      '.g{color:#4E9936}.b{color:#3AAFA5}.o{color:#9A9000}.r{color:#E05C5C}' +
      '.section{margin:28px 0}.section h2{font-size:16px;border-left:4px solid #CCEF7F;padding-left:10px;margin-bottom:12px}' +
      'table{width:100%;border-collapse:collapse;font-size:13px}' +
      'th{background:#F6F8F4;padding:10px 12px;text-align:left;border-bottom:2px solid #E2E8DC;font-weight:600}' +
      'td{padding:9px 12px;border-bottom:1px solid #EEE}' +
      '.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}' +
      '.badge-o{background:#FAFBE5;color:#9A9000}.badge-g{background:#EEF9E8;color:#4E9936}.badge-b{background:#E5F7F6;color:#3AAFA5}.badge-r{background:#FEEEEE;color:#E05C5C}' +
      '.ft{text-align:center;margin-top:32px;font-size:12px;color:#bbb;border-top:1px solid #eee;padding-top:16px}' +
      '@media print{body{padding:20px}.np{display:none!important}}' +
      '.btn{background:#A8D94A;color:#0D1A08;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:14px;margin-bottom:20px}' +
      '.btn:hover{background:#A8D94A}' +
      '</style></head><body>' +
      '<button class="btn np" onclick="window.print()"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> 打印 / 另存为 PDF</button>' +
      '<h1>培训价值追踪报告</h1>' +
      '<div class="sub">' + year + '年度 · 生成日期：' + today + ' · 生成人：' + esc(ME ? ME.name : '') + '</div>' +
      '<div class="cards">' +
      '<div class="card"><div class="v g">' + thisYearRecs.length + '</div><div class="l">培训申请（今年）</div></div>' +
      '<div class="card"><div class="v b">¥' + totalCost.toLocaleString() + '</div><div class="l">总投入</div></div>' +
      '<div class="card"><div class="v o">' + sumCount + '</div><div class="l">已提交总结</div></div>' +
      '<div class="card"><div class="v g">' + doneCount + '</div><div class="l">已完成闭环</div></div>' +
      '<div class="card"><div class="v ' + (rateAll >= 80 ? 'g' : rateAll >= 50 ? 'o' : 'r') + '">' + rateAll + '%</div><div class="l">完成率</div></div>' +
      '</div>';
    if (Object.keys(deptMap).length) {
      reportHtml += '<div class="section"><h2><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> 部门培训统计</h2><table><thead><tr><th>部门</th><th>申请数</th><th>已完成</th><th>完成率</th><th>总费用</th></tr></thead><tbody>';
      Object.keys(deptMap).sort().forEach(function(dept) {
        var d = deptMap[dept];
        var rate = d.total ? Math.round(d.done/d.total*100) : 0;
        var rc = rate >= 80 ? 'badge-g' : rate >= 50 ? 'badge-o' : 'badge-r';
        reportHtml += '<tr><td>' + esc(dept) + '</td><td>' + d.total + '</td><td>' + d.done + '</td><td><span class="badge ' + rc + '">' + rate + '%</span></td><td>¥' + d.cost.toLocaleString() + '</td></tr>';
      });
      reportHtml += '</tbody></table></div>';
    }
    var todoHR = thisYearRecs.filter(function(r) { return ['待审批','已通过'].indexOf(r['状态']) >= 0; });
    var todo30 = thisYearRecs.filter(function(r) { return r['状态'] === '待评审' && !r['30天执行']; });
    var todo90 = thisYearRecs.filter(function(r) { return r['状态'] === '30天已回访' && !r['评估分数']; });
    if (todoHR.length || todo30.length || todo90.length) {
      reportHtml += '<div class="section"><h2><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 待处理事项</h2><table><thead><tr><th>类型</th><th>员工</th><th>培训项目</th><th>状态</th></tr></thead><tbody>';
      todoHR.forEach(function(r) { reportHtml += '<tr><td>待处理</td><td>' + esc(r['员工']) + '</td><td>' + esc(r['培训项目']) + '</td><td><span class="badge badge-o">' + esc(r['状态']) + '</span></td></tr>'; });
      todo30.forEach(function(r) { reportHtml += '<tr><td>待30天回访</td><td>' + esc(r['员工']) + '</td><td>' + esc(r['培训项目']) + '</td><td><span class="badge badge-b">待回访</span></td></tr>'; });
      todo90.forEach(function(r) { var label90 = r['90天自评内容'] ? '待HR评估' : '待员工复盘'; reportHtml += '<tr><td>待90天评估</td><td>' + esc(r['员工']) + '</td><td>' + esc(r['培训项目']) + '</td><td><span class="badge badge-r">' + label90 + '</span></td></tr>'; });
      reportHtml += '</tbody></table></div>';
    }
    var recent = ALL_DATA.slice().sort(function(a, b) { return new Date(b['createdAt']||0) - new Date(a['createdAt']||0); }).slice(0, 30);
    if (recent.length) {
      reportHtml += '<div class="section"><h2><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 培训记录（最近30条 / 共' + ALL_DATA.length + '条）</h2><table><thead><tr><th>员工</th><th>部门</th><th>项目</th><th>费用</th><th>日期</th><th>状态</th></tr></thead><tbody>';
      recent.forEach(function(r) {
        var st = r['状态'] || '';
        reportHtml += '<tr><td>' + esc(r['员工']) + '</td><td>' + esc(r['部门']||'-') + '</td><td>' + esc(r['培训项目']) + '</td><td>¥' + (parseFloat(r['费用'])||0).toLocaleString() + '</td><td>' + esc(r['培训日期']||'-') + '</td><td><span class="badge ' + (stMap[st]||'') + '">' + esc(st) + '</span></td></tr>';
      });
      reportHtml += '</tbody></table></div>';
    }
    reportHtml += '<div class="ft">由培训价值追踪系统生成 · ' + today + '</div></body></html>';
    var win = window.open('', '_blank');
    win.document.write(reportHtml);
    win.document.close();
  });

  function openM(title, html, maxWidth) {
    document.getElementById('mTitle').innerHTML = title;
    document.getElementById('mBody').innerHTML = html;
    var md = document.querySelector('.md');
    if (md) md.style.maxWidth = maxWidth || '660px';
    document.getElementById('modalBg').classList.add('sh');
    var cb = document.getElementById('editCancel');
    var sb = document.getElementById('editSave');
    if (cb) { var cb2 = cb.cloneNode(true); cb.parentNode.replaceChild(cb2, cb); cb2.addEventListener('click', closeM); }
    if (sb) { var sb2 = sb.cloneNode(true); sb.parentNode.replaceChild(sb2, sb); sb2.addEventListener('click', saveForm); }
  }

  function closeM() { document.getElementById('modalBg').classList.remove('sh'); }
  
  // ESC键关闭弹窗
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('modalBg');
      if (modal && modal.classList.contains('sh')) closeM();
    }
  });

  // ════════════════════════════════════════════════════
  // 功能1：培训日历视图
  // ════════════════════════════════════════════════════
  function renderCal() {
    var yr = CAL_DATE.getFullYear();
    var mo = CAL_DATE.getMonth();
    document.getElementById('calTitle').textContent = yr + '年' + (mo + 1) + '月';

    var firstDay = new Date(yr, mo, 1);
    var lastDay = new Date(yr, mo + 1, 0);
    var startWd = firstDay.getDay(); // 周日=0
    var today = new Date();

    // 构建日期到记录的映射
    var dateMap = {};
    var visibleData = ME.role === 'hr' ? ALL_DATA : ALL_DATA.filter(function(r) { return r['员工'] === ME.name; });
    visibleData.forEach(function(r) {
      var d = r['培训日期'];
      if (!d) return;
      if (!dateMap[d]) dateMap[d] = [];
      dateMap[d].push(r);
    });

    var evClass = {
      '待审批': 'ev-pending', '已通过': 'ev-approved', '已驳回': 'ev-rejected',
      '学习中': 'ev-learning', '总结已提交': 'ev-approved', '待评审': 'ev-learning',
      '30天已回访': 'ev-approved', '已完成': 'ev-done'
    };

    var grid = document.getElementById('calGrid');
    var cells = '';

    // 前补空格
    for (var pre = 0; pre < startWd; pre++) {
      var prevDate = new Date(yr, mo, -(startWd - pre - 1));
      cells += '<div class="cal-day other-month"><div class="cal-day-num">' + prevDate.getDate() + '</div></div>';
    }

    for (var day = 1; day <= lastDay.getDate(); day++) {
      var dateStr = yr + '-' + String(mo + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var isToday = (today.getFullYear() === yr && today.getMonth() === mo && today.getDate() === day);
      var recs = dateMap[dateStr] || [];
      var evHtml = '';
      // 最多显示3个，超出省略
      var show = recs.slice(0, 3);
      show.forEach(function(r) {
        var cls = evClass[r['状态']] || 'ev-pending';
        var name = r['培训项目'].length > 8 ? r['培训项目'].slice(0, 8) + '…' : r['培训项目'];
        evHtml += '<div class="cal-event ' + cls + '" title="' + esc(r['培训项目']) + ' — ' + esc(r['员工']) + '" onclick="(function(){window._calClickId=\'' + r.ID + '\';document.getElementById(\'_calTrigger\').click();})()">' + esc(name) + '</div>';
      });
      if (recs.length > 3) evHtml += '<div class="cal-event ev-pending">+' + (recs.length - 3) + ' 更多</div>';
      cells += '<div class="cal-day' + (isToday ? ' today' : '') + '"><div class="cal-day-num">' + day + '</div>' + evHtml + '</div>';
    }

    // 后补空格
    var totalCells = startWd + lastDay.getDate();
    var remain = (7 - (totalCells % 7)) % 7;
    for (var post = 1; post <= remain; post++) {
      cells += '<div class="cal-day other-month"><div class="cal-day-num">' + post + '</div></div>';
    }

    grid.innerHTML = cells;

    // 隐藏触发器用于事件委托
    var trig = document.getElementById('_calTrigger');
    if (!trig) {
      trig = document.createElement('button');
      trig.id = '_calTrigger';
      trig.style.display = 'none';
      document.body.appendChild(trig);
    }
    trig.onclick = function() {
      if (window._calClickId) viewDetail(window._calClickId);
    };
  }

  document.getElementById('calPrev').addEventListener('click', function() {
    CAL_DATE = new Date(CAL_DATE.getFullYear(), CAL_DATE.getMonth() - 1, 1);
    renderCal();
  });
  document.getElementById('calNext').addEventListener('click', function() {
    CAL_DATE = new Date(CAL_DATE.getFullYear(), CAL_DATE.getMonth() + 1, 1);
    renderCal();
  });

  // ════════════════════════════════════════════════════
  // 功能2：部门管理
  // ════════════════════════════════════════════════════
  function renderDept() {
    var el = document.getElementById('deptList');
    if (ALL_DEPTS.length === 0) {
      el.innerHTML = '<div class="em"><p>暂无部门，请先添加</p></div>';
    } else {
      var usedDepts = {};
      ALL_DATA.forEach(function(r) { if (r['部门']) usedDepts[r['部门']] = (usedDepts[r['部门']] || 0) + 1; });
      ALL_USERS.forEach(function(u) { if (u.dept) usedDepts[u.dept] = (usedDepts[u.dept] || 0); });
      var h = '';
      ALL_DEPTS.forEach(function(d, idx) {
        var count = usedDepts[d] || 0;
        h += '<div class="dept-item">';
        h += '<div class="dept-name">' + esc(d) + '</div>';
        h += '<div class="dept-count">使用 ' + count + ' 次</div>';
        if (ME.role === 'hr') h += '<button class="bt bts btd dept-del" data-idx="' + idx + '">删除</button>';
        h += '</div>';
      });
      el.innerHTML = h;
      if (ME.role === 'hr') {
        el.querySelectorAll('.dept-del').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-idx'));
            var dName = ALL_DEPTS[idx];
            openConfirmModal('删除部门', '删除部门"' + esc(dName) + '"？已关联的记录不受影响。', function() {
              apiPost('deleteDept', { name: dName }).then(function(r) {
                if (r.ok) { toast('已删除'); refreshData().then(renderDept); }
                else toast('删除失败：' + (r.msg || ''));
              });
            }, false);
          });
        });
      }
    }
    // 更新申请表单的部门datalist
    var dlDept = document.getElementById('dl-dept');
    if (dlDept) {
      dlDept.innerHTML = ALL_DEPTS.map(function(d) { return '<option value="' + esc(d) + '">'; }).join('');
    }
  }

  document.getElementById('deptAddBtn').addEventListener('click', function() {
    var name = document.getElementById('dept-input').value.trim();
    if (!name) { toast('请输入部门名称'); return; }
    if (ALL_DEPTS.indexOf(name) >= 0) { toast('该部门已存在'); return; }
    apiPost('addDept', { name: name }).then(function(r) {
      if (r.ok) {
        toast('部门已添加');
        document.getElementById('dept-input').value = '';
        refreshData().then(renderDept);
      } else toast('添加失败：' + (r.msg || ''));
    });
  });
  document.getElementById('dept-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('deptAddBtn').click();
  });

  // 把部门datalist插入申请表单（动态，不破坏现有）
  (function() {
    var applyForm = document.getElementById('a-goal');
    if (applyForm) {
      var dlDept = document.createElement('datalist');
      dlDept.id = 'dl-dept';
      applyForm.closest('.fgd').insertBefore(dlDept, applyForm.closest('.fgd').firstChild);
    }
  })();

  // ════════════════════════════════════════════════════
  // 功能4：培训完成凭证生成（打印/下载）
  // ════════════════════════════════════════════════════
  function showCert(id) {
    var r = findRecord(id);
    if (!r) return;
    var h = '<div class="cert-preview" id="certBox">';
    h += '<div class="cert-title"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> 培训完成证明</div>';
    h += '<div class="cert-sub">Training Completion Certificate</div>';
    h += '<div style="font-size:13px;color:#888;margin-bottom:16px">兹证明以下人员已完成培训</div>';
    h += '<div class="cert-name">' + esc(r['员工']) + '</div>';
    h += '<div style="font-size:14px;color:#888;margin-bottom:12px">部门：' + esc(r['部门'] || '-') + '</div>';
    h += '<div style="border-top:1px dashed var(--primary);border-bottom:1px dashed var(--primary);padding:12px;margin:0 20px 16px">';
    h += '<div class="cert-course">' + esc(r['培训项目']) + '</div>';
    h += '</div>';
    h += '<div class="cert-meta">';
    h += '<div>培训机构：' + esc(r['培训机构'] || '-') + '</div>';
    h += '<div>培训日期：' + esc(r['培训日期'] || '-') + '</div>';
    h += '<div>培训费用：¥' + fmt(r['费用'] || 0) + '</div>';
    if (r['培训前评分'] && r['培训后评分']) {
      h += '<div>能力提升：' + esc(r['培训前评分']) + '/5 → ' + esc(r['培训后评分']) + '/5</div>';
    }
    if (r['评估分数']) h += '<div>综合评估：' + esc(r['评估分数']) + '/5 分</div>';
    h += '</div>';
    h += '<div class="cert-seal">✓</div>';
    h += '<div style="font-size:11px;color:#aaa;margin-top:16px">培训价值追踪系统 · ' + new Date().toLocaleDateString('zh-CN') + '</div>';
    h += '</div>';
    h += '<div class="fa" style="margin-top:16px"><button class="bt" id="cert-close">关闭</button><button class="bt btp" id="cert-print"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> 打印 / 保存PDF</button></div>';
    openM('培训完成凭证', h);
    document.getElementById('cert-close').addEventListener('click', closeM);
    document.getElementById('cert-print').addEventListener('click', function() {
      var certHtml = document.getElementById('certBox').outerHTML;
      var win = window.open('', '_blank');
      win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>培训凭证</title><style>body{font-family:-apple-system,"Microsoft YaHei",sans-serif;display:flex;justify-content:center;padding:40px;background:#F6F8F4}' +
        '.cert-preview{border:2px solid #A8D94A;border-radius:12px;padding:32px;text-align:center;background:linear-gradient(135deg,#F4FCE3,#EDF7E0);max-width:520px;width:100%}' +
        '.cert-title{font-size:22px;font-weight:700;color:#4E9936;margin-bottom:6px}' +
        '.cert-sub{font-size:13px;color:#93A88A;margin-bottom:24px}' +
        '.cert-name{font-size:28px;font-weight:700;margin-bottom:8px}' +
        '.cert-course{font-size:16px;color:#555;margin-bottom:0}' +
        '.cert-meta{font-size:13px;color:#93A88A;line-height:2}' +
        '.cert-seal{width:70px;height:70px;border-radius:50%;background:#A8D94A;color:#0D1A08;display:flex;align-items:center;justify-content:center;font-size:22px;margin:20px auto 0}' +
        '@media print{body{padding:0}}</style></head><body>' + certHtml + '</body></html>');
      win.document.close();
      setTimeout(function() { win.print(); }, 300);
    });
  }

  // （showCert 已定义，可通过凭证按钮调用）

  // ════════════════════════════════════════════════════
  // 功能5：到期自动提醒（升级版 checkReminders）
  // ════════════════════════════════════════════════════
  function checkRemindersEnhanced() {
    var now = new Date();
    var msgs = [];
    var visibleData = ME.role === 'hr' ? ALL_DATA : ALL_DATA.filter(function(r) { return r['员工'] === ME.name; });

    visibleData.forEach(function(r) {
      // 已通过但超过7天没提交总结
      if (r['状态'] === '已通过' && !r['总结内容']) {
        var approveDate = new Date(r['培训日期']);
        if (!isNaN(approveDate.getTime())) {
          var daysPast = Math.floor((now - approveDate) / 86400000);
          if (daysPast >= 7) {
            msgs.push((ME.role === 'hr' ? r['员工'] + '的' : '') + '《' + r['培训项目'] + '》已超' + daysPast + '天未提交总结');
          }
        }
      }
      // 30天回访逾期
      if (r['状态'] === '待评审' && !r['30天执行']) {
        var d = new Date(r['培训日期']);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 30);
          var diff30 = Math.floor((now - d) / 86400000);
          if (diff30 >= 0) {
            msgs.push((ME.role === 'hr' ? r['员工'] + '的' : '') + '《' + r['培训项目'] + '》30天回访已逾期' + diff30 + '天');
          } else if (diff30 >= -3) {
            msgs.push((ME.role === 'hr' ? r['员工'] + '的' : '') + '《' + r['培训项目'] + '》30天回访还剩' + Math.abs(diff30) + '天');
          }
        }
      }
      // 90天复盘/评估
      if (r['状态'] === '30天已回访' && !r['评估分数']) {
        var d2 = new Date(r['培训日期']);
        if (!isNaN(d2.getTime())) {
          d2.setDate(d2.getDate() + 90);
          var diff90 = Math.floor((now - d2) / 86400000);
          var isSelfRole90 = r['员工'] === ME.name;
          var needSelf90 = isSelfRole90 && !r['90天自评内容'];
          var needEval90 = ME.role === 'hr' && r['90天自评内容'];
          if (diff90 >= 0) {
            if (needSelf90) {
              msgs.push('你的《' + r['培训项目'] + '》90天复盘已逾期' + diff90 + '天，请尽快提交');
            } else if (needEval90) {
              msgs.push(r['员工'] + '的《' + r['培训项目'] + '》90天评估已逾期' + diff90 + '天');
            } else if (ME.role === 'hr') {
              msgs.push(r['员工'] + '的《' + r['培训项目'] + '》90天复盘已逾期' + diff90 + '天');
            }
          } else if (diff90 >= -3) {
            if (needSelf90) {
              msgs.push('你的《' + r['培训项目'] + '》距90天复盘还剩' + Math.abs(diff90) + '天');
            } else if (needEval90) {
              msgs.push(r['员工'] + '的《' + r['培训项目'] + '》90天评估还剩' + Math.abs(diff90) + '天');
            }
          }
        }
      }
    });

    var bar = document.getElementById('reminderBar');
    if (msgs.length > 0) {
      document.getElementById('reminderText').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' + msgs[0] + (msgs.length > 1 ? '（共' + msgs.length + '条提醒）' : '');
      bar.classList.add('show');
    } else {
      bar.classList.remove('show');
    }
  }

  // 替换旧的 checkReminders
  function checkReminders() {
    checkRemindersEnhanced();
  }

  // ════════════════════════════════════════════════════
  // 员工登录后主动提示
  // ════════════════════════════════════════════════════
  function showEmployeeLoginTips() {
    var myRecs = ALL_DATA.filter(function(r) { return r['员工'] === ME.name; });
    var needsSummary = myRecs.filter(function(r) { return r['状态'] === '已通过' && !r['总结内容']; });
    var needsWithdraw = myRecs.filter(function(r) { return r['状态'] === '待审批'; });
    var pendingApprovals = myRecs.filter(function(r) { return r['状态'] === '待审批'; });

    if (needsSummary.length === 0 && pendingApprovals.length === 0) return;

    var tipsHtml = '<div id="empLoginTips" style="background:linear-gradient(135deg,var(--success-bg),#fff);border:1px solid rgba(123,158,135,0.3);border-radius:var(--radius-xl);padding:18px 20px;margin-bottom:16px;animation:fadeIn .4s ease">';
    tipsHtml += '<div style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--success)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> 欢迎回来，这是你需要处理的事项：</div>';

    if (needsSummary.length > 0) {
      needsSummary.forEach(function(r) {
        var daysSince = Math.floor((Date.now() - new Date(r['培训日期'])) / 86400000);
        var remain = 7 - daysSince;
        tipsHtml += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">';
        tipsHtml += '<span style="font-size:18px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span>';
        tipsHtml += '<span style="flex:1;color:var(--text)"><b>' + esc(r['培训项目']) + '</b> 已通过，<b style="color:' + (remain <= 2 ? 'var(--danger)' : 'var(--warning)') + '">' + (remain > 0 ? '距提交总结还剩 <b>' + remain + '</b> 天' : '已超期 <b style="color:var(--danger)">' + Math.abs(remain) + '</b> 天') + '</b></span>';
        tipsHtml += '<button class="bt bts btp" onclick="document.querySelector(\'[data-a=sum][data-id=' + esc(r.ID) + ']\').click()" style="flex-shrink:0">去提交</button>';
        tipsHtml += '</div>';
      });
    }

    if (pendingApprovals.length > 0 && needsSummary.length === 0) {
      pendingApprovals.forEach(function(r) {
        tipsHtml += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(26,92,58,.1);font-size:13px">';
        tipsHtml += '<span style="font-size:18px"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg></span>';
        tipsHtml += '<span style="flex:1;color:#555"><b>' + esc(r['培训项目']) + '</b> 等待HR审批中</span>';
        tipsHtml += '<button class="bt bts" onclick="document.querySelector(\'[data-a=det][data-id=' + esc(r.ID) + ']\').click()" style="flex-shrink:0">查看</button>';
        tipsHtml += '</div>';
      });
    }

    tipsHtml += '</div>';
    var mainDiv = document.querySelector('.mn');
    if (mainDiv) mainDiv.insertAdjacentHTML('afterbegin', tipsHtml);

    // 3秒后自动淡出（如果用户没有点击）
    setTimeout(function() {
      var tipEl = document.getElementById('empLoginTips');
      if (tipEl) {
        tipEl.style.transition = 'opacity .5s';
        tipEl.style.opacity = '0';
        setTimeout(function() { if (tipEl.parentNode) tipEl.remove(); }, 500);
      }
    }, 8000);
  }

  // ════════════════════════════════════════════════════
  // 功能7：我的记录 - 完成状态显示凭证按钮（在 go('my') 后注入）
  // ════════════════════════════════════════════════════
  function injectCertButtons() {
    var tb = document.getElementById('myTb');
    if (!tb) return;
    var rows = tb.querySelectorAll('tr');
    rows.forEach(function(row) {
      // 找行内状态 badge span
      var badge = row.querySelector('.bd');
      if (!badge) return;
      var stText = badge.textContent.trim();
      if (stText !== '已完成') return;
      // 找行内已有的带 data-id 按钮（操作列）
      var btn0 = row.querySelector('button[data-id]');
      if (!btn0) return;
      // 找按钮所在的 td（操作列）
      var actTd = btn0.closest('td');
      if (!actTd) return;
      // 避免重复注入
      if (actTd.querySelector('[data-a="cert"]')) return;
      var certBtn = document.createElement('button');
      certBtn.className = 'bt bts';
      certBtn.setAttribute('data-a', 'cert');
      certBtn.setAttribute('data-id', btn0.getAttribute('data-id'));
      certBtn.textContent = '凭证';
      certBtn.style.cssText = 'color:var(--primary);border-color:var(--primary);margin-left:4px';
      certBtn.addEventListener('click', function() {
        showCert(this.getAttribute('data-id'));
      });
      actTd.appendChild(certBtn);
    });
  }

  document.getElementById('modalClose').addEventListener('click', closeM);
  document.getElementById('modalBg').addEventListener('click', function(e) { if (e.target === this) closeM(); });

  // ─── 报告按钮事件监听 ───
  document.getElementById('quickReportBtn').addEventListener('click', function() { if (typeof openMyReport === 'function') openMyReport(); });
  document.getElementById('hrExportReportBtn').addEventListener('click', function() { if (typeof hrExportReport === 'function') hrExportReport(); });

})();
