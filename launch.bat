@echo off
:: BillCraft Desktop Launcher
:: This script starts the BillCraft application without needing to open a terminal manually.

set "APP_DIR=%~dp0"
set "NODE_DIR=%APP_DIR%tools\node-v20.18.0-win-x64"
set "ELECTRON_DIR=%APP_DIR%electron-app"
set "PATH=%NODE_DIR%;%PATH%"

cd /d "%ELECTRON_DIR%"
start "" "%NODE_DIR%\npx.cmd" electron .
