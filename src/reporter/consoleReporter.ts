import type { CheckReport } from '../types/index.js';

export function printConsoleReport(report: CheckReport): void {
  console.log('\n========================================');
  console.log('🔍 GitHub公開前チェック レポート');
  console.log('========================================\n');
  console.log(`対象パス: ${report.targetPath}`);
  console.log(`診断日時: ${report.checkedAt}\n`);

  console.log('--- 【基本チェック項目】 ---');
  for (const item of report.items) {
    const statusMark =
      item.status === 'OK' ? '✅ OK' : item.status === 'WARNING' ? '⚠️  WARN' : '❌ MISSING';
    console.log(`${item.name.padEnd(20)} ${statusMark.padEnd(10)} ${item.message}`);
  }

  if (report.unwantedFilesFound.length > 0) {
    console.log('\n--- ⚠️ 検出された不要ファイル/フォルダ ---');
    for (const file of report.unwantedFilesFound) {
      console.log(`  - ${file}`);
    }
  } else {
    console.log('\n--- ⚠️ 不要ファイル ---');
    console.log('  なし (クリーン)');
  }

  if (report.largeFilesFound.length > 0) {
    console.log('\n--- 🐘 検出された大容量ファイル (> 10MB) ---');
    for (const file of report.largeFilesFound) {
      const sizeMB = (file.sizeBytes / (1024 * 1024)).toFixed(2);
      console.log(`  - ${file.path} (${sizeMB} MB)`);
    }
  }

  console.log('\n========================================');
  console.log(`総合評価スコア: ${report.totalScore} / ${report.maxScore}`);
  console.log('========================================\n');
}
