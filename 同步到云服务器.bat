@echo off
chcp 65001 >nul 2>&1
title 同步培训系统到云服务器
cd /d "%~dp0"
python sync_to_server.py
