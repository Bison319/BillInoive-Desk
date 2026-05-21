@echo off
:: Creates a Desktop shortcut for BillCraft
:: Run this ONCE to place the BillCraft icon on your Desktop.

set "APP_DIR=%~dp0"
set "ICON_PATH=%APP_DIR%electron-app\assets\BIcon.ico"
set "VBS_PATH=%APP_DIR%BillCraft.vbs"

echo Creating BillCraft desktop shortcut...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktopPath = [Environment]::GetFolderPath('Desktop'); $shortcutPath = Join-Path $desktopPath 'BillCraft.lnk'; $ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut($shortcutPath); $sc.TargetPath = 'wscript.exe'; $sc.Arguments = '\"d:\BillWood\billcraft-desktop\BillCraft.vbs\"'; $sc.WorkingDirectory = 'd:\BillWood\billcraft-desktop'; $sc.IconLocation = 'd:\BillWood\billcraft-desktop\electron-app\assets\BIcon.ico,0'; $sc.Description = 'BillCraft - Billing and Payment Platform'; $sc.Save(); Write-Host \"Shortcut created at: $shortcutPath\""

echo.
echo Done! Look for "BillCraft" on your Desktop.
pause
