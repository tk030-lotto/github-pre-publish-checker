import type { CheckReport } from '../types/index.js';

export function printConsoleReport(report: CheckReport, largeFileThresholdBytes?: number): void {
  const thresholdMB = largeFileThresholdBytes
    ? (largeFileThresholdBytes / (1024 * 1024)).toFixed(0)
    : '10';

  console.log('');
  console.log('┌────────────────────────────────────────────────────────┐');
  console.log('│  🔍  GitHub 公開前チェッカー (gh-check)                │');
  console.log('└────────────────────────────────────────────────────────┘');
  console.log('');
  console.log(` 📂 診断対象: ${report.targetPath}`);
  console.log(` 🕒 診断日時: ${report.checkedAt}`);
  console.log('');

  console.log('┌────────────────────────────────────────────────────────┐');
  console.log('│ 📋 基本チェック項目                                     │');
  console.log('├──────────────────────────────┬──────────┬──────────────┤');
  console.log('│ 項目名                       │ 状態     │ メッセージ   │');
  console.log('├──────────────────────────────┼──────────┼──────────────┤');

  for (const item of report.items) {
    const statusMark =
      item.status === 'OK'
        ? '✅ OK   '
        : item.status === 'WARNING'
        ? '⚠️  WARN '
        : '❌ MISS ';
    const namePadded = padRight(item.name, 28);
    console.log(`│ ${namePadded} │ ${statusMark} │ ${item.message}`);
  }
  console.log('└──────────────────────────────┴──────────┴──────────────┘');
  console.log('');

  // 不要ファイル
  console.log('┌────────────────────────────────────────────────────────┐');
  console.log('│ ⚠️  検出された不要ファイル / フォルダ                    │');
  console.log('└────────────────────────────────────────────────────────┘');
  if (report.unwantedFilesFound.length > 0) {
    for (const file of report.unwantedFilesFound) {
      console.log(`  - ❌ ${file}`);
    }
  } else {
    console.log('  ✨ なし (クリーン)');
  }
  console.log('');

  // 大容量ファイル
  console.log('┌────────────────────────────────────────────────────────┐');
  console.log(`│ 🐘 検出された大容量ファイル (> ${thresholdMB.padEnd(3)} MB)                      │`);
  console.log('└────────────────────────────────────────────────────────┘');
  if (report.largeFilesFound.length > 0) {
    for (const file of report.largeFilesFound) {
      const sizeMB = (file.sizeBytes / (1024 * 1024)).toFixed(2);
      console.log(`  - ⚠️  ${file.path} (${sizeMB} MB)`);
    }
  } else {
    console.log('  ✨ なし (適正サイズ)');
  }
  console.log('');

  // 総合スコア
  const scoreBar = generateProgressBar(report.totalScore, report.maxScore);
  const scoreColor = report.totalScore >= 80 ? '✅ 健全' : report.totalScore >= 50 ? '⚠️ 要注意' : '❌ 要修正';

  console.log('================================================────────');
  console.log(` 📊 総合評価スコア : [ ${scoreBar} ] ${report.totalScore} / ${report.maxScore} (${scoreColor})`);
  console.log('================================================────────\n');
}

function padRight(str: string, length: number): string {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    width += (code >= 0x3000 && code <= 0x9fff) || (code >= 0xff01 && code <= 0xff60) ? 2 : 1;
  }
  const padding = Math.max(0, length - width);
  return str + ' '.repeat(padding);
}

function generateProgressBar(score: number, max: number): string {
  const totalBlocks = 20;
  const filledBlocks = Math.round((score / max) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}
