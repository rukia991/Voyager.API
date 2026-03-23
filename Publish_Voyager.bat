@echo off
echo =======================================
echo   Voyager System Update Automation
echo =======================================

echo.
echo [1/3] Building React Frontend...
cd voyager-client
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [2/3] Syncing Frontend to Backend wwwroot...
REM Delete old frontend files first
if exist "wwwroot" (
    del /Q "wwwroot\*.*"
    for /D %%p in ("wwwroot\*") do rmdir "%%p" /S /Q
)

REM Copy new build
xcopy /E /I /Y voyager-client\dist\* wwwroot\

echo.
echo [3/3] Publishing .NET Backend...
call dotnet publish -c Release -o bin\Release\net8.0\publish

if %errorlevel% neq 0 (
    echo Backend publish failed!
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================
echo   SUCCESS! Package is ready for upload.
echo   Location: bin\Release\net8.0\publish
echo =======================================
echo.
echo Next steps:
echo 1. Go to: bin\Release\net8.0\publish
echo 2. Select all files
echo 3. Upload to MonsterASP.NET via WebFTP
echo 4. Restart your site
echo =======================================
pause
