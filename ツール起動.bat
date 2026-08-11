@echo off
chcp 65001 >nul
title GitHub公開前チェッカー (gh-check)

echo ========================================================
echo   🔍 GitHub公開前チェッカー (gh-check)
echo ========================================================
echo.

cd /d "%~dp0"

set /p TARGET_DIR="診断対象フォルダのパスを入力してください（Enterキーで現在のフォルダを診断）: "
if "%TARGET_DIR%"=="" set TARGET_DIR=.

echo.
echo --------------------------------------------------------
echo 診断を開始します: %TARGET_DIR%
echo --------------------------------------------------------
echo.

node dist/index.js "%TARGET_DIR%" -o CHECK_REPORT.md

echo.
echo --------------------------------------------------------
echo 📝 診断結果レポートを CHECK_REPORT.md に保存しました。
echo --------------------------------------------------------
echo.
pause
