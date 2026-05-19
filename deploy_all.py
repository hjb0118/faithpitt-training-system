# -*- coding: utf-8 -*-
"""
培训系统 一键部署脚本
功能：Git commit + push 到 GitHub → 同步到云服务器 → 重启服务
用法：双击 运行部署.bat 或 python deploy_all.py
"""

import subprocess
import os
import sys
import json
import paramiko
import posixpath
from datetime import datetime

# ========== 加载本地配置 ==========
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(LOCAL_DIR, 'config.local.json')

def load_config():
    """加载本地配置文件"""
    config = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except Exception as e:
            print(f'  [警告] 配置文件读取失败: {e}')
    return config

_config = load_config()

# ========== 配置 ==========
# GitHub
GITHUB_REPO = 'https://github.com/hjb0118/faithpitt-training-system.git'
GITHUB_TOKEN = _config.get('github_token', '')  # 从配置文件读取

# 云服务器
HOST = '47.96.158.178'
PORT = 22
USER = 'root'
PASS = _config.get('server_pass', 'REN01250099q')  # 从配置文件读取
REMOTE_DIR = '/root/training-system'
PM2_APP = 'training-system'

# 需要同步的文件/目录（云服务器用）
SYNC_FILES = ['server.js', 'index.html', 'data.json', 'tokens.json', 'wechat_notify.js']
SYNC_DIRS = ['css', 'js', 'uploads']

# 排除的文件（不上传到云服务器）
EXCLUDE_EXTENSIONS = {'.bak', '.tmp', '.log'}
EXCLUDE_PATTERNS = {'.bak.'}
EXCLUDE_FILES = {'node_modules', '.git', 'backups'}


def run_cmd(cmd, cwd=None):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(
            cmd, shell=True, cwd=cwd or LOCAL_DIR,
            capture_output=True, text=True, timeout=60
        )
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, '', '命令超时'
    except Exception as e:
        return False, '', str(e)


def git_deploy():
    """Git add → commit → push"""
    print('=' * 50)
    print('  步骤 1/2：Git 部署到 GitHub')
    print('=' * 50)
    print()

    # 检查是否有改动
    ok, out, err = run_cmd('git status --porcelain')
    if not ok:
        print(f'  [错误] git status 失败: {err}')
        return False

    if not out.strip():
        print('  没有文件改动，跳过 Git 提交')
        return True

    # 显示改动文件
    changed_files = [line.strip() for line in out.split('\n') if line.strip()]
    print(f'  发现 {len(changed_files)} 个文件有改动:')
    for f in changed_files[:10]:  # 最多显示10个
        print(f'    {f}')
    if len(changed_files) > 10:
        print(f'    ... 还有 {len(changed_files) - 10} 个文件')
    print()

    # git add
    print('  [1/3] 添加文件...')
    ok, out, err = run_cmd('git add -A')
    if not ok:
        print(f'  [错误] git add 失败: {err}')
        return False
    print('  完成')
    print()

    # git commit
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    commit_msg = f'auto: 部署更新 {timestamp}'
    print(f'  [2/3] 提交: {commit_msg}')
    ok, out, err = run_cmd(f'git commit -m "{commit_msg}"')
    if not ok:
        if 'nothing to commit' in out or 'nothing to commit' in err:
            print('  没有需要提交的改动')
            return True
        print(f'  [错误] git commit 失败: {err}')
        return False
    print('  完成')
    print()

    # git push
    print('  [3/3] 推送到 GitHub...')
    # 如果配置了 token，临时设置到 URL
    if GITHUB_TOKEN:
        run_cmd(f'git remote set-url origin https://hjb0118:{GITHUB_TOKEN}@github.com/hjb0118/faithpitt-training-system.git')

    ok, out, err = run_cmd('git push origin main')
    if not ok:
        print(f'  [错误] git push 失败: {err}')
        if 'timeout' in err.lower() or 'connect' in err.lower():
            print('  提示：网络问题，GitHub 连接超时')
        return False

    print('  推送成功')
    print()

    # 清理 URL 中的 token
    if GITHUB_TOKEN:
        run_cmd('git remote set-url origin ' + GITHUB_REPO)

    return True


def should_sync(filepath):
    """判断文件是否需要同步到云服务器"""
    basename = os.path.basename(filepath)
    if any(basename.endswith(ext) for ext in EXCLUDE_EXTENSIONS):
        return False
    if any(pattern in basename for pattern in EXCLUDE_PATTERNS):
        return False
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
    """比较本地和远程文件"""
    remote_path = posixpath.join(REMOTE_DIR, rel_path)
    try:
        remote_stat = sftp.stat(remote_path)
        local_stat = os.stat(local_path)
        if remote_stat.st_size == local_stat.st_size:
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
        remote_dir = posixpath.dirname(remote_path)
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
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
        print(f'    [错误] 上传失败 {rel_path}: {e}')
        return False


def server_deploy():
    """同步到云服务器"""
    print('=' * 50)
    print('  步骤 2/2：同步到云服务器')
    print('=' * 50)
    print()

    # 连接服务器
    print('  [1/3] 连接服务器...')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
        print(f'  已连接 {HOST}')
    except Exception as e:
        print(f'  [错误] SSH连接失败: {e}')
        return False
    print()

    # 收集文件
    print('  [2/3] 扫描本地文件...')
    local_files = collect_local_files()
    print(f'  共 {len(local_files)} 个文件')
    print()

    # 对比并上传
    print('  [3/3] 对比并上传...')
    sftp = ssh.open_sftp()

    uploaded = 0
    skipped = 0
    failed = 0

    for rel_path, local_path in local_files:
        need_upload, reason = compare_file(sftp, rel_path, local_path)
        if need_upload:
            size_kb = os.path.getsize(local_path) / 1024
            if upload_file(sftp, rel_path, local_path):
                print(f'    [上传] {rel_path} ({size_kb:.1f}KB) - {reason}')
                uploaded += 1
            else:
                failed += 1
        else:
            skipped += 1

    sftp.close()

    # 重启服务
    if uploaded > 0:
        print()
        print(f'  重启服务 ({PM2_APP})...')
        stdin, stdout, stderr = ssh.exec_command(f'pm2 restart {PM2_APP}')
        exit_code = stdout.channel.recv_exit_status()
        if exit_code == 0:
            print('  服务已重启')
        else:
            err = stderr.read().decode()
            print(f'  [警告] 重启失败: {err}')

    ssh.close()

    # 结果
    print()
    print(f'  上传: {uploaded} | 跳过: {skipped} | 失败: {failed}')
    if uploaded > 0:
        print(f'  访问: http://{HOST}:3000')

    return failed == 0


def main():
    print()
    print('╔' + '═' * 48 + '╗')
    print('║' + '  培训系统 一键部署工具'.center(42) + '║')
    print('║' + '  GitHub + 云服务器'.center(42) + '║')
    print('╚' + '═' * 48 + '╝')
    print()

    git_ok = git_deploy()
    print()
    server_ok = server_deploy()

    # 最终结果
    print()
    print('╔' + '═' * 48 + '╗')
    if git_ok and server_ok:
        print('║' + '  ✅ 部署完成！'.center(42) + '║')
    elif git_ok:
        print('║' + '  ⚠️  Git成功，云服务器部分失败'.center(38) + '║')
    elif server_ok:
        print('║' + '  ⚠️  云服务器成功，Git失败'.center(38) + '║')
    else:
        print('║' + '  ❌ 部署失败'.center(42) + '║')
    print('╚' + '═' * 48 + '╝')
    print()

    print('按任意键退出...')
    input()


if __name__ == '__main__':
    main()
