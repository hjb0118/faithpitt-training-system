@echo off
chcp 65001 >nul
echo 正在关闭开机自动启动...
echo.

powershell -Command "Unregister-ScheduledTask -TaskName TrainingSystemAuto -Confirm:$false"

if %errorlevel% equ 0 (
    echo.
    echo 已关闭开机自动启动。
) else (
    echo.
    echo 操作失败，请以管理员身份运行此批处理文件。
    echo 右键点击文件 -> 以管理员身份运行
)

echo.
pause
