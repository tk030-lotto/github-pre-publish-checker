@echo off
chcp 65001 >nul
title GitHub公開前チェッカー (gh-check)

echo ===================================================
echo   GitHub公開前チェッカーを起動しています...
echo ===================================================
echo.
cd /d "%~dp0"
if "%~1"=="" (
    node dist/index.js . -o CHECK_REPORT.md
) else (
    node dist/index.js "%~1" -o CHECK_REPORT.md
)
echo.
pause
