# -*- coding: utf-8 -*-
"""
培训系统 → 阿里云服务器 一键同步脚本
只上传有变化的文件，上传完自动重启服务
"""

import paramiko
import os
import posixpath
import time

# ========== 配置 ==========
HOST = '47.96.158.178'
PORT = 22
USER = 'root'
PASS = 'REN01250099q'
REMOTE_DIR = '/root/training-system'
PM2_APP = 'training-system'

# 本地项目目录（脚本所在目录）
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

# 需要同步的文件/目录
SYNC_FILES = ['server.js', 'index.html', 'tokens.json', 'wechat_notify.js', 'db.js', 'db-adapter.js', 'package.json']
SYNC_DIRS = ['css', 'js', 'uploads']

# 排除的文件（不上传）
EXCLUDE_EXTENSIONS = {'.bak', '.tmp', '.log'}
EXCLUDE_PATTERNS = {'.bak.'}  # 匹配 .bak.20260514 这类文件
EXCLUDE_FILES = {'node_modules', '.git', 'backups'}


def get_ssh():
    """创建SSH连接"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
        return ssh
    except Exception as e:
        print(f'[错误] SSH连接失败: {e}')
        return None


def should_sync(filepath):
    """判断文件是否需要同步"""
    basename = os.path.basename(filepath)
    # 排除备份和临时文件
    if any(basename.endswith(ext) for ext in EXCLUDE_EXTENSIONS):
        return False
    if any(pattern in basename for pattern in EXCLUDE_PATTERNS):
        return False
    # 排除特定目录
    parts = filepath.replace('/', '\\').split('\\')
    for part in parts:
        if part in EXCLUDE_FILES:
            return False
    return True


def collect_local_files():
    """收集本地需要同步的文件列表"""
    files = []
    for f in SYNC_FILES:
        local_path = os.path.join(LOCAL_DIR, f)
        if os.path.isfile(local_path):
            files.append((f, local_path))
    for d in SYNC_DIRS:
        dir_path = os.path.join(LOCAL_DIR, d)
        if os.path.isdir(dir_path):
            for root, dirs, filenames in os.walk(dir_path):
                for fn in filenames:
                    full_path = os.path.join(root, fn)
                    rel_path = os.path.relpath(full_path, LOCAL_DIR).replace('\\', '/')
                    if should_sync(full_path):
                        files.append((rel_path, full_path))
    return files


def compare_file(sftp, rel_path, local_path):
    """比较本地和远程文件，判断是否需要上传"""
    remote_path = posixpath.join(REMOTE_DIR, rel_path)
    try:
        remote_stat = sftp.stat(remote_path)
        local_stat = os.stat(local_path)
        # 文件大小或修改时间不同才上传
        if remote_stat.st_size == local_stat.st_size:
            # 比较修改时间（允许60秒误差）
            remote_mtime = remote_stat.st_mtime
            local_mtime = local_stat.st_mtime
            if abs(remote_mtime - local_mtime) < 60:
                return False, 'same'
        return True, 'changed'
    except FileNotFoundError:
        return True, 'new'
    except Exception as e:
        return True, f'error: {e}'


def upload_file(sftp, rel_path, local_path):
    """上传单个文件到服务器"""
    remote_path = posixpath.join(REMOTE_DIR, rel_path)
    try:
        # 确保远程目录存在
        remote_dir = posixpath.dirname(remote_path)
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            # 递归创建目录
            parts = remote_dir.split('/')
            for i in range(1, len(parts) + 1):
                d = '/'.join(parts[:i])
                try:
                    sftp.stat(d)
                except FileNotFoundError:
                    sftp.mkdir(d)

        with open(local_path, 'rb') as f:
            content = f.read()
        with sftp.file(remote_path, 'wb') as rf:
            rf.write(content)
        return True
    except Exception as e:
        print(f'  [错误] 上传失败 {rel_path}: {e}')
        return False


def main():
    print('=' * 50)
    print('  培训系统 → 云服务器 同步工具')
    print('=' * 50)
    print()

    # 1. 连接服务器
    print('[1/3] 连接服务器...')
    ssh = get_ssh()
    if not ssh:
        print('按任意键退出...')
        input()
        return
    print(f'  已连接 {HOST}')
    print()

    # 2. 收集本地文件
    print('[2/3] 扫描本地文件...')
    local_files = collect_local_files()
    print(f'  共 {len(local_files)} 个文件')
    print()

    # 3. 对比并上传
    print('[3/3] 对比并上传...')
    sftp = ssh.open_sftp()

    uploaded = 0
    skipped = 0
    failed = 0

    for rel_path, local_path in local_files:
        need_upload, reason = compare_file(sftp, rel_path, local_path)
        if need_upload:
            size_kb = os.path.getsize(local_path) / 1024
            if upload_file(sftp, rel_path, local_path):
                print(f'  [上传] {rel_path} ({size_kb:.1f}KB) - {reason}')
                uploaded += 1
            else:
                failed += 1
        else:
            skipped += 1

    sftp.close()

    # 4. 如果有文件上传，重启服务
    if uploaded > 0:
        print()
        print(f'  重启服务 ({PM2_APP})...')
        stdin, stdout, stderr = ssh.exec_command(f'pm2 restart {PM2_APP}')
        exit_code = stdout.channel.recv_exit_status()
        if exit_code == 0:
            print(f'  服务已重启')
        else:
            err = stderr.read().decode()
            print(f'  [警告] 重启失败: {err}')
    else:
        print()

    ssh.close()

    # 结果汇总
    print()
    print('=' * 50)
    print(f'  上传: {uploaded} | 跳过: {skipped} | 失败: {failed}')
    if uploaded > 0:
        print(f'  访问: http://{HOST}:3000')
    else:
        print('  所有文件已是最新，无需更新')
    print('=' * 50)
    print()
    print('按任意键退出...')
    input()


if __name__ == '__main__':
    main()
