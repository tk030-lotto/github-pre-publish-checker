@echo off
chcp 65001 > nul
title GitHub Pre-Publish Checker Web

echo ========================================================
echo   GitHub Pre-Publish Checker (Web) Starting...
echo ========================================================
echo.

npm run dev

pause
