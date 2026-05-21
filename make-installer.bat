@echo off
echo ============================================
echo   BillCraft Desktop - Create Installer
echo ============================================
echo.

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

:: First run the full build
call "%PROJECT_ROOT%build.bat"
if %ERRORLEVEL% neq 0 (
    echo Build failed. Cannot create installer.
    exit /b 1
)

:: Check JRE exists
if not exist "%PROJECT_ROOT%runtime\jre\bin\java.exe" (
    echo ERROR: JRE bundle not found at runtime\jre
    echo Please run build.bat first or manually copy a JRE.
    exit /b 1
)

:: Create the installer
echo.
echo Creating Windows Installer...
echo.

cd electron-app
call npm run dist-win
if %ERRORLEVEL% neq 0 (
    echo ERROR: Installer creation failed!
    exit /b 1
)

echo.
echo ============================================
echo   Installer Created Successfully!
echo ============================================
echo.
echo Location: %PROJECT_ROOT%installer\output\
dir /b "%PROJECT_ROOT%installer\output\*.exe" 2>nul
echo.
