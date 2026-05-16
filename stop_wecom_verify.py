# -*- coding: utf-8 -*-
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.96.158.178', username='root', password='REN01250099q', timeout=15)
ssh.exec_command('pkill -f wecom_verify.py 2>/dev/null')
print('验证服务已关闭')
ssh.close()
