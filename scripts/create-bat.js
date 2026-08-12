import fs from 'node:fs';
import path from 'node:path';

// Shift-JIS (CP932) のバイト列に適合する安全なバッチファイルを作成
const batPath = path.resolve('ツール起動.bat');

const batContent = `@echo off
chcp 65001 > nul
title GitHub Pre-Publish Checker Web

echo ========================================================
echo   GitHub Pre-Publish Checker (Web) Starting...
echo ========================================================
echo.

npm run dev

pause
`;

// Windows CRLF 改行コードに統一
const formattedContent = batContent.replace(/\r?\n/g, '\r\n');

fs.writeFileSync(batPath, formattedContent, 'utf-8');
console.log('✅ ツール起動.bat を文字化けのない安全なフォーマットで更新しました');
