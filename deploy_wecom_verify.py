# -*- coding: utf-8 -*-
import paramiko, time

HOST = '47.96.158.178'
USER = 'root'
PASS = 'REN01250099q'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print(f'已连接 {HOST}')

sftp = ssh.open_sftp()

# 上传
print('上传 wecom_verify.py ...')
local = r'C:\Users\PC\Desktop\培训系统\wecom_verify.py'
remote = '/root/training-system/wecom_verify.py'
with open(local, 'rb') as f:
    content = f.read()
with sftp.file(remote, 'wb') as rf:
    rf.write(content)
print('上传完成')

# 安装pycryptodome
print('安装 pycryptodome ...')
stdin, stdout, stderr = ssh.exec_command('pip3 install pycryptodome 2>&1')
out = stdout.read().decode()
if 'Successfully installed' in out:
    print('pycryptodome 安装成功')
else:
    print(out[-200:])

# 重启验证服务
print('重启验证服务 ...')
ssh.exec_command('pkill -f wecom_verify.py 2>/dev/null')
time.sleep(1)
ssh.exec_command('cd /root/training-system && nohup python3 wecom_verify.py > /tmp/wecom_verify.log 2>&1 &')
time.sleep(2)

# 检查
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:8888/wecom_hook -w "\\nHTTP %{http_code}"')
print('本地测试:', stdout.read().decode().strip())

# 检查外网8888端口是否通了
stdin, stdout, stderr = ssh.exec_command('ss -tlnp | grep 8888')
print('端口监听:', stdout.read().decode().strip())

sftp.close()
ssh.close()
print('完成! 现在可以去企微后台验证URL了')
