@echo off
chcp 65001 > nul
title GitHub公開前チェッカー Web

echo ========================================================
echo   🔍 GitHub公開前チェッカー (Web版) を起動しています...
echo ========================================================
echo.

npm run dev

pause
