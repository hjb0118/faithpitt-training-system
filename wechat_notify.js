const http = require('http');
const https = require('https');
const fs = require('fs');

// ─── 企业微信Webhook通知函数 ───
function sendWechatNotification(webhook, content, msgtype = 'markdown') {
    return new Promise((resolve) => {
        if (!webhook) {
            resolve({ errcode: -1, errmsg: 'no webhook configured' });
            return;
        }
        const data = JSON.stringify({ msgtype, [msgtype]: { content } });
        const parsedUrl = new URL(webhook);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { resolve({ errcode: 0, errmsg: 'ok' }); }
            });
        });
        req.on('error', () => resolve({ errcode: -2, errmsg: 'network error' }));
        req.write(data);
        req.end();
    });
}

// ─── 构建通知消息 ───
function buildNotification(type, data) {
    const templates = {
        new_application: '### \uD83D\uDCCB \u65B0\u57F9\u8BAD\u7533\u8BF7\n\n> **' + data.employeeName + '** \u63D0\u4EA4\u4E86\u57F9\u8BAD\u7533\u8BF7\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u673A\u6784**: ' + data.institution + '\n- **\u9884\u8BA1\u8D39\u7528**: \uFFE5' + data.cost + '\n- **\u7533\u8BF7\u65F6\u95F4**: ' + data.date + '\n\n> \u7CFB\u7EDF\u63D0\u9192\uFF1A\u8BF7\u53CA\u65F6\u5BA1\u6279',

        approved: '### \u2705 \u7533\u8BF7\u5DF2\u901A\u8FC7\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u7533\u8BF7\u5DF2\u901A\u8FC7\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u673A\u6784**: ' + data.institution + '\n- **\u5BA1\u6279\u65F6\u95F4**: ' + data.date + '\n\n> \u8BF7\u6309\u8BA1\u5212\u53C2\u52A0\u57F9\u8BAD\uFF0C\u57F9\u8BAD\u7ED3\u675F\u540E\u8BB0\u5F97\u63D0\u4EA4\u5B66\u4E60\u603B\u7ED3\u54E6 \uD83D\uDCAA',

        rejected: '### \u274C \u7533\u8BF7\u5DF2\u9A7E\u56DE\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u7533\u8BF7\u5DF2\u9A7E\u56DE\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u9A7E\u56DE\u539F\u56E0**: ' + data.reason + '\n- **\u9A7E\u56DE\u65F6\u95F4**: ' + data.date + '\n\n> \u5982\u6709\u7591\u95EE\uFF0C\u8BF7\u8054\u7CFBHR\u4E86\u89E3\u8BE6\u60C5',

        summary_submitted: '### \uD83D\uDCDD \u5B66\u4E60\u603B\u7ED3\u5DF2\u63D0\u4EA4\n\n> **' + data.employeeName + '** \u63D0\u4EA4\u4E86\u5B66\u4E60\u603B\u7ED3\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u63D0\u4EA4\u65F6\u95F4**: ' + data.date + '\n\n> \u7CFB\u7EDF\u63D0\u9192\uFF1A\u8BF7\u67E5\u9605\u603B\u7ED3\u5185\u5BB9\u5E76\u8FDB\u884C\u8BC4\u5BA1',

        summary_pending_review: '### \u2705 \u5B66\u4E60\u603B\u7ED3\u5DF2\u901A\u8FC7\u8BC4\u5BA1\n\n> **' + data.employeeName + '** \u7684\u5B66\u4E60\u603B\u7ED3\u5DF2\u901A\u8FC7HR\u8BC4\u5BA1\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u8BC4\u5BA1\u65F6\u95F4**: ' + data.date + '\n\n> \u57F9\u8BAD\u8FDB\u516530\u5929\u8DDF\u8FDB\u9636\u6BB5\uFF0C\u8BF7\u6309\u8BA1\u5212\u843D\u5730\u884C\u52A8\u8BA1\u5212',

        followup_reminder: '### \u23F0 30\u5929\u8DDF\u8FDB\u63D0\u9192\n\n> **' + data.employeeName + '** \u53C2\u52A0\u57F9\u8BAD\u5DF2\u6EE130\u5929\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u627F\u8BFA\u4EA7\u51FA**: ' + data.output + '\n\n> \u8BF7\u8FDB\u884C\u57F9\u8BAD\u6548\u679C\u8DDF\u8FDB\uFF0C\u8BC4\u4F30\u627F\u8BFA\u4EA7\u51FA\u60C5\u51B5',

        deadline_reminder: '### \u26A0 \u4EA7\u51FA\u5230\u671F\u63D0\u9192\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u627F\u8BFA\u4EA7\u51FA\u5373\u5C06\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u627F\u8BFA\u4EA7\u51FA**: ' + data.output + '\n- **\u5230\u671F\u65F6\u95F4**: ' + data.deadline + '\n- **\u5269\u4F59\u5929\u6570**: ' + data.daysLeft + '\u5929\n\n> \u8BF7\u7761\u4FC3\u5458\u5DE5\u6309\u65F6\u5B8C\u6210\u627F\u8BFA\u4EA7\u51FA',

        evaluation_reminder: '### \uD83D\uDCCA 90\u5929\u6548\u679C\u8BC4\u4F30\u63D0\u9192\n\n> **' + data.employeeName + '** \u53C2\u52A0\u57F9\u8BAD\u5DF2\u6EE190\u5929\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n\n> \u8BF7\u8FDB\u884C\u57F9\u8BAD\u6548\u679C\u8BC4\u4F30\uFF0C\u8BB0\u5F55\u57F9\u8BADROI',

        self30_submitted: '### \uD83D\uDCCB \u5458\u5DE530\u5929\u81EA\u8BC4\u5DF2\u63D0\u4EA4\n\n> **' + data.employeeName + '** \u63D0\u4EA4\u4E86 30\u5929\u884C\u52A8\u81EA\u8BC4\uFF0C\u8BF7\u786E\u8BA4\u56DE\u8BBF\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u63D0\u4EA4\u65F6\u95F4**: ' + data.date + '\n\n> \u7CFB\u7EDF\u63D0\u9192\uFF1A\u8BF7\u67E5\u9605\u5458\u5DE5\u81EA\u8BC4\u5E76\u8FDB\u884C\u786E\u8BA4\u56DE\u8BBF',

        '30visit_confirmed': '### \u2705 30\u5929\u56DE\u8BBF\u5DF2\u786E\u8BA4\n\n> **' + data.employeeName + '** \u7684 30\u5929\u56DE\u8BBF\u5DF2\u5B8C\u6210\u786E\u8BA4\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u786E\u8BA4\u7ED3\u679C**: ' + data.result + '\n- **\u786E\u8BA4\u65F6\u95F4**: ' + data.date + '\n\n> \u57F9\u8BAD\u95ED\u73AF\u7BA1\u7406\u5B8C\u6210\uFF01',

        // ─── 新增：到期/逾期提醒模板 ───
        summary_due_soon: '### \u23F0 \u5B66\u4E60\u603B\u7ED3\u5373\u5C06\u5230\u671F\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u603B\u7ED3\u5373\u5C06\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u622A\u6B62\u65E5\u671F**: ' + data.deadline + '\n- **\u5269\u4F59\u5929\u6570**: ' + data.daysLeft + '\u5929\n\n> \u8BF7\u5728 **' + data.deadline + '** \u524D\u63D0\u4EA4\u5B66\u4E60\u603B\u7ED3\uFF0C\u903E\u671F\u5C06\u5F71\u54CD\u57F9\u8BAD\u95ED\u73AF\u8BB0\u5F55',

        summary_overdue: '### \u26A0\uFE0F \u5B66\u4E60\u603B\u7ED3\u5DF2\u903E\u671F\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u603B\u7ED3\u5DF2\u903E\u671F\u672A\u4EA4\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u903E\u671F\u5929\u6570**: ' + data.daysOverdue + '\u5929\n\n> \u8BF7\u5C3D\u5FEB\u767B\u5F55\u7CFB\u7EDF\u63D0\u4EA4\u5B66\u4E60\u603B\u7ED3\uFF0C\u907F\u514D\u5F71\u54CD\u4E2A\u4EBA\u57F9\u8BAD\u6863\u6848',

        self30_due_soon: '### \u23F0 30\u5929\u81EA\u8BC4\u5373\u5C06\u5230\u671F\n\n> **' + data.employeeName + '** \u768430\u5929\u884C\u52A8\u81EA\u8BC4\u5373\u5C06\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u622A\u6B62\u65E5\u671F**: ' + data.deadline + '\n- **\u5269\u4F59\u5929\u6570**: ' + data.daysLeft + '\u5929\n\n> \u8BF7\u5728 **' + data.deadline + '** \u524D\u63D0\u4EA430\u5929\u884C\u52A8\u81EA\u8BC4\uFF0C\u56DE\u987E\u884C\u52A8\u8BA1\u5212\u6267\u884C\u60C5\u51B5',

        self30_overdue: '### \u26A0\uFE0F 30\u5929\u81EA\u8BC4\u5DF2\u903E\u671F\n\n> **' + data.employeeName + '** \u768430\u5929\u884C\u52A8\u81EA\u8BC4\u5DF2\u903E\u671F\u672A\u4EA4\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u903E\u671F\u5929\u6570**: ' + data.daysOverdue + '\u5929\n\n> \u8BF7\u5C3D\u5FEB\u767B\u5F55\u7CFB\u7EDF\u63D0\u4EA430\u5929\u81EA\u8BC4\uFF0C\u5B8C\u6210\u57F9\u8BAD\u95ED\u73AF',

        urge_summary: '### \uD83D\uDCE2 \u57F9\u8BAD\u603B\u7ED3\u50AC\u7F34\u901A\u77E5\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u603B\u7ED3\u5DF2\u88ABHR\u50AC\u7F34\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u903E\u671F\u5929\u6570**: ' + data.daysOverdue + '\u5929\n- **\u50AC\u7F34\u4EBA**: ' + data.hrName + '\n\n> \u8BF7\u7ACB\u5373\u767B\u5F55\u7CFB\u7EDF\u63D0\u4EA4\u5B66\u4E60\u603B\u7ED3\uFF0C\u5982\u6709\u7279\u6B8A\u60C5\u51B5\u8BF7\u8054\u7CFBHR\u8BF4\u660E',

        urge_self30: '### \uD83D\uDCE2 30\u5929\u884C\u52A8\u81EA\u8BC4\u50AC\u7F34\u901A\u77E5\n\n> **' + data.employeeName + '** \u768430\u5929\u884C\u52A8\u81EA\u8BC4\u5DF2\u88ABHR\u50AC\u7F34\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u903E\u671F\u5929\u6570**: ' + data.daysOverdue + '\u5929\n- **\u50AC\u7F34\u4EBA**: ' + data.hrName + '\n\n> \u8BF7\u7ACB\u5373\u767B\u5F55\u7CFB\u7EDF\u63D0\u4EA430\u5929\u884C\u52A8\u81EA\u8BC4\uFF0C\u56DE\u987E\u884C\u52A8\u8BA1\u5212\u6267\u884C\u60C5\u51B5\uFF0C\u5982\u6709\u7279\u6B8A\u60C5\u51B5\u8BF7\u8054\u7CFbHR\u8BF4\u660E',

        urge_self90: '### \uD83D\uDCE2 90\u5929\u57F9\u8BAD\u590D\u76D8\u50AC\u7F34\u901A\u77E5\n\n> **' + data.employeeName + '** \u768490\u5929\u57F9\u8BAD\u590D\u76D8\u5DF2\u88ABHR\u50AC\u7F34\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u903E\u671F\u5929\u6570**: ' + data.daysOverdue + '\u5929\n- **\u50AC\u7F34\u4EBA**: ' + data.hrName + '\n\n> \u8BF7\u7ACB\u5373\u767B\u5F55\u7CFB\u7EDF\u63D0\u4EA490\u5929\u57F9\u8BAD\u590D\u76D8\uFF0C\u56DE\u987E\u57F9\u8BAD\u957F\u671F\u6548\u679C\uFF0C\u5982\u6709\u7279\u6B8A\u60C5\u51B5\u8BF7\u8054\u7CFbHR\u8BF4\u660E',

        // ─── 定时提醒引擎：提前提醒模板 ───
        summary_due_3days: '### \u23F0 \u5B66\u4E60\u603B\u7ED3\u63D0\u524D3\u5929\u63D0\u9192\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u603B\u7ED3\u622A\u6B62\u65E5\u5373\u5C06\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u622A\u6B62\u65E5\u671F**: ' + data.deadline + '\n- **\u5269\u4F59\u5929\u6570**: 3\u5929\n\n> \u8BF7\u5728 **' + data.deadline + '** \u524D\u63D0\u4EA4\u5B66\u4E60\u603B\u7ED3\uFF0C\u907F\u514D\u5F71\u54CD\u57F9\u8BAD\u8BB0\u5F55',

        summary_due_1day: '### \u23F0 \u5B66\u4E60\u603B\u7ED3\u63D0\u524D1\u5929\u63D0\u9192\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u603B\u7ED3\u622A\u6B62\u65E5\u5373\u5C06\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u622A\u6B62\u65E5\u671F**: ' + data.deadline + '\n- **\u5269\u4F59\u5929\u6570**: 1\u5929\n\n> \u660E\u5929\u662F\u6700\u540E\u671F\u9650\uFF0C\u8BF7\u5C3D\u5FEB\u63D0\u4EA4\u5B66\u4E60\u603B\u7ED3',

        self30_due_3days: '### \u23F0 30\u5929\u81EA\u8BC4\u63D0\u524D3\u5929\u63D0\u9192\n\n> **' + data.employeeName + '** \u768430\u5929\u884C\u52A8\u81EA\u8BC4\u622A\u6B62\u65E5\u5373\u5C06\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u622A\u6B62\u65E5\u671F**: ' + data.deadline + '\n- **\u5269\u4F59\u5929\u6570**: 3\u5929\n\n> \u8BF7\u5728 **' + data.deadline + '** \u524D\u63D0\u4EA430\u5929\u884C\u52A8\u81EA\u8BC4',

        self30_due_1day: '### \u23F0 30\u5929\u81EA\u8BC4\u63D0\u524D1\u5929\u63D0\u9192\n\n> **' + data.employeeName + '** \u768430\u5929\u884C\u52A8\u81EA\u8BC4\u622A\u6B62\u65E5\u5373\u5C06\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u622A\u6B62\u65E5\u671F**: ' + data.deadline + '\n- **\u5269\u4F59\u5929\u6570**: 1\u5929\n\n> \u660E\u5929\u662F\u6700\u540E\u671F\u9650\uFF0C\u8BF7\u5C3D\u5FEB\u63D0\u4EA430\u5929\u81EA\u8BC4',

        review_pending: '### \uD83D\uDD0D HR\u8BC4\u5BA1\u5F85\u5904\u7406\u63D0\u9192\n\n> **' + data.employeeName + '** \u7684\u5B66\u4E60\u603B\u7ED3\u5F85\u8BC4\u5BA1\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u63D0\u4EA4\u65F6\u95F4**: ' + data.submittedDate + '\n\n> \u8BF7\u767B\u5F55\u7CFB\u7EDF\u67E5\u9605\u5E76\u8FDB\u884C\u8BC4\u5BA1',

        eval90_due_soon: '### \uD83D\uDCCA 90\u5929\u590D\u76D8\u63D0\u524D\u63D0\u9192\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD\u5DF2\u63A5\u8FD190\u5929\uFF0C90\u5929\u590D\u76D8\u5373\u5C06\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n- **\u590D\u76D8\u622A\u6B62\u65E5\u671F**: ' + data.deadline + '\n- **\u5269\u4F59\u5929\u6570**: ' + data.daysLeft + '\u5929\n\n> \u8BF7\u5728\u622A\u6B62\u65E5\u524D\u767B\u5F55\u7CFB\u7EDF\u63D0\u4EA490\u5929\u57F9\u8BAD\u590D\u76D8',

        eval90_due: '### \uD83D\uDCCA 90\u5929\u590D\u76D8\u5230\u671F\u63D0\u9192\n\n> **' + data.employeeName + '** \u7684\u57F9\u8BAD90\u5929\u590D\u76D8\u5DF2\u5230\u671F\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u57F9\u8BAD\u65E5\u671F**: ' + data.trainingDate + '\n\n> \u8BF7\u767B\u5F55\u7CFB\u7EDF\u63D0\u4EA490\u5929\u57F9\u8BAD\u590D\u76D8\uFF0C\u56DE\u987E\u57F9\u8BAD\u957F\u671F\u6548\u679C',

        self90_submitted: '### \uD83D\uDCCB \u5458\u5DE590\u5929\u590D\u76D8\u5DF2\u63D0\u4EA4\n\n> **' + data.employeeName + '** \u63D0\u4EA4\u4E86 90\u5929\u57F9\u8BAD\u590D\u76D8\uFF0C\u8BF7\u67E5\u9605\u5E76\u8FDB\u884C\u6548\u679C\u8BC4\u4F30\n\n- **\u57F9\u8BAD\u9879\u76EE**: ' + data.project + '\n- **\u63D0\u4EA4\u65F6\u95F4**: ' + data.date + '\n\n> \u7CFB\u7EDF\u63D0\u9192\uFF1A\u8BF7\u67E5\u9605\u5458\u5DE5\u590D\u76D8\u5185\u5BB9\u5E76\u5B8C\u621090\u5929\u6548\u679C\u8BC4\u4F30'
    };
    return templates[type] || '### \u51E1\u78A7\u8BD7\u57F9\u8BAD\u901A\u77E5\n\n' + JSON.stringify(data);
}

// ─── 数据文件路径（使用绝对路径，避免工作目录问题） ───
const DATA_PATH = require('path').join(__dirname, 'data.json');

// ─── 获取Webhook配置 ───
function getWebhookConfig() {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        return data.settings && data.settings.webhook ? data.settings.webhook : null;
    } catch { return null; }
}

// ─── 写锁（防止与 server.js 的 safeWrite 并发写入冲突） ───
let wechatWriteLock = Promise.resolve();

// ─── 保存Webhook配置 ───
function saveWebhookConfig(webhook, enabled) {
    wechatWriteLock = wechatWriteLock.then(() => {
        return new Promise((resolve) => {
            const tmp = DATA_PATH + '.tmp';
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
            if (!data.settings) data.settings = {};
            data.settings.webhook = { url: webhook, enabled: enabled };
            fs.writeFile(tmp, JSON.stringify(data, null, 2), (err) => {
                if (err) { resolve(); return; }
                fs.rename(tmp, DATA_PATH, () => resolve());
            });
        });
    });
    return wechatWriteLock;
}

// ─── 触发通知（供其他地方调用） ───
async function triggerNotification(type, data) {
    const config = getWebhookConfig();
    if (!config || !config.enabled || !config.url) return;
    const content = buildNotification(type, data);
    const result = await sendWechatNotification(config.url, content);
    console.log('[WechatNotify] ' + type + ' sent, result:', JSON.stringify(result));
    return result;
}

module.exports = { triggerNotification, getWebhookConfig, saveWebhookConfig, sendWechatNotification, buildNotification };
