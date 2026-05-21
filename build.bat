@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   BillCraft Desktop - Build Script
echo ============================================
echo.

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

:: ---- Step 1: Build Spring Boot Backend ----
echo [1/5] Building Spring Boot Backend...
echo.

cd springboot-backend
call "%PROJECT_ROOT%gradlew.bat" clean bootJar -p "%PROJECT_ROOT%springboot-backend" --no-daemon
if %ERRORLEVEL% neq 0 (
    echo ERROR: Backend build failed!
    exit /b 1
)

if not exist "%PROJECT_ROOT%springboot-backend\build\libs\billcraft-backend.jar" (
    echo ERROR: billcraft-backend.jar not found after build!
    exit /b 1
)
echo Backend JAR built successfully.
echo.

cd /d "%PROJECT_ROOT%"

:: ---- Step 2: Install Renderer Dependencies ----
echo [2/5] Installing React frontend dependencies...
echo.

cd electron-app\renderer
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Frontend npm install failed!
        exit /b 1
    )
)
echo Frontend dependencies ready.
echo.

:: ---- Step 3: Build React Frontend ----
echo [3/5] Building React frontend...
echo.

call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Frontend build failed!
    exit /b 1
)
echo Frontend built successfully.
echo.

cd /d "%PROJECT_ROOT%"

:: ---- Step 4: Install Electron Dependencies ----
echo [4/5] Installing Electron dependencies...
echo.

cd electron-app
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Electron npm install failed!
        exit /b 1
    )
)
echo Electron dependencies ready.
echo.

:: ---- Step 5: Bundle JRE ----
echo [5/5] Preparing JRE bundle...
echo.

if not exist "%PROJECT_ROOT%runtime\jre" (
    echo Creating JRE bundle using jlink...
    mkdir "%PROJECT_ROOT%runtime\jre" 2>nul
    
    where jlink >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        jlink --add-modules java.base,java.logging,java.sql,java.naming,java.desktop,java.management,java.security.jgss,java.instrument,java.net.http,jdk.crypto.ec,jdk.unsupported --strip-debug --no-man-pages --no-header-files --compress=zip-6 --output "%PROJECT_ROOT%runtime\jre"
        echo JRE bundle created.
    ) else (
        echo WARNING: jlink not found. Copying JAVA_HOME instead...
        if defined JAVA_HOME (
            xcopy "%JAVA_HOME%" "%PROJECT_ROOT%runtime\jre" /E /I /Q /Y >nul
            echo Copied JAVA_HOME to runtime\jre
        ) else (
            echo ERROR: No JAVA_HOME set and jlink not available.
            echo Please manually copy a JRE to: %PROJECT_ROOT%runtime\jre
            echo Or set JAVA_HOME environment variable.
        )
    )
) else (
    echo JRE bundle already exists. Skipping.
)
echo.

echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo To run in development mode:
echo   cd electron-app ^&^& npm start
echo.
echo To create installer:
echo   cd electron-app ^&^& npm run dist-win
echo.
echo Output: installer\output\BillCraft Setup *.exe
echo ============================================

endlocal
