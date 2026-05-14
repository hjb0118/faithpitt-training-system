@echo off
chcp 65001 >nul
echo 正在配置开机自动启动培训系统...
echo.

powershell -Command "
try {
    $a = New-ScheduledTaskAction -Execute 'node.exe' -Argument 'server.js' -WorkingDirectory 'C:\Users\PC\Desktop\培训系统';
    $t = New-ScheduledTaskTrigger -AtLogOn;
    $s = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable;
    $p = New-ScheduledTaskPrincipal -UserId 'PC' -LogonType Interactive;
    Register-ScheduledTask TrainingSystemAuto -Action $a -Trigger $t -Settings $s -Principal $p -Force | Out-Null;
    exit 0
} catch {
    Write-Error $_.Exception.Message;
    exit 1
}
"

if %errorlevel% equ 0 (
    echo.
    echo 配置成功！重启电脑后培训系统将自动启动。
) else (
    echo.
    echo 配置失败，请以管理员身份运行此批处理文件。
    echo 右键点击文件 -^> 以管理员身份运行
)

echo.
pause
