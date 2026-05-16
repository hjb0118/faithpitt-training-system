# -*- coding: utf-8 -*-
"""
企业微信 接收消息服务器URL 验证脚本
使用官方加解密库处理 echostr 解密
"""

from flask import Flask, request, make_response
import hashlib
import base64
import socket
import struct
import time
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

app = Flask(__name__)

# ====== 企微后台参数 ======
TOKEN = 'TkxCajrk2zBUNdHtVZK28rjLC9q1N'
ENCODING_AES_KEY = 'C3qQWcbJZsWTL315gqjIN4bQlKTX22OjpR2oOuXTvU4'
CORP_ID = 'ww7133ea1ef30964de'
PORT = 8888
# =========================


class WXBizMsgCrypt:
    """企微消息加解密（简化版，只实现验证需要的部分）"""

    def __init__(self, token, encoding_aes_key, corp_id):
        self.token = token
        self.key = base64.b64decode(encoding_aes_key + '=')
        self.corp_id = corp_id

    def verify_url(self, msg_signature, timestamp, nonce, echostr):
        """验证URL有效性，解密echostr"""
        # 1. 签名校验
        sha1 = self._sha1(self.token, timestamp, nonce, echostr)
        if sha1 != msg_signature:
            log.error(f'签名不匹配: 计算={sha1}, 收到={msg_signature}')
            return (None, 'signature not match')

        # 2. AES解密echostr
        try:
            plaintext = self._decrypt(echostr)
            # 3. 解析内容: 随机16字节 + 消息长度(4字节网络序) + 消息 + corp_id
            content = plaintext[16:]
            msg_len = struct.unpack('!I', content[:4])[0]
            msg = content[4:4 + msg_len]
            from_corp_id = content[4 + msg_len:]

            if from_corp_id.decode('utf-8') != self.corp_id:
                log.error(f'CorpID不匹配: {from_corp_id} != {self.corp_id}')
                return (None, 'corp id not match')

            log.info('URL验证成功!')
            return (msg.decode('utf-8'), None)
        except Exception as e:
            log.error(f'解密失败: {e}')
            return (None, str(e))

    def _sha1(self, *args):
        sort_list = sorted([a for a in args if a])
        return hashlib.sha1(''.join(sort_list).encode('utf-8')).hexdigest()

    def _decrypt(self, encrypted):
        """AES-256-CBC解密"""
        from Crypto.Cipher import AES
        cipher = AES.new(self.key, AES.MODE_CBC, self.key[:16])
        decrypted = cipher.decrypt(encrypted)
        # PKCS7去填充
        pad = decrypted[-1]
        if pad < 1 or pad > 32:
            pad = 0
        return decrypted[:-pad] if pad else decrypted


wxcpt = WXBizMsgCrypt(TOKEN, ENCODING_AES_KEY, CORP_ID)


@app.route('/wecom_hook', methods=['GET', 'POST'])
def wecom_hook():
    if request.method == 'GET':
        msg_signature = request.args.get('msg_signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        echostr = request.args.get('echostr', '')

        log.info(f'[GET] 验证请求: timestamp={timestamp}')

        ret, err = wxcpt.verify_url(msg_signature, timestamp, nonce, echostr)
        if ret is not None:
            resp = make_response(ret)
            resp.headers['Content-Type'] = 'text/plain'
            return resp
        else:
            return f'verify failed: {err}', 403

    elif request.method == 'POST':
        log.info('[POST] 收到消息回调')
        return 'ok'


if __name__ == '__main__':
    print('=' * 50)
    print('  企微消息验证服务')
    print(f'  CorpID: {CORP_ID}')
    print(f'  Token: {TOKEN[:6]}...')
    print(f'  端口: {PORT}')
    print(f'  验证URL: http://47.96.158.178:{PORT}/wecom_hook')
    print('=' * 50)
    app.run(host='0.0.0.0', port=PORT)
