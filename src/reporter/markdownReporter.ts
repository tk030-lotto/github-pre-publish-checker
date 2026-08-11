import fs from 'node:fs';
import path from 'node:path';
import type { CheckReport } from '../types/index.js';

/**
 * CheckReport オブジェクトから Markdown 形式のレポート文字列を生成
 */
export function generateMarkdownReport(report: CheckReport): string {
  const lines: string[] = [];

  lines.push('# 🔍 GitHub 公開前チェック レポート');
  lines.push('');
  lines.push(`- **診断対象パス**: \`${report.targetPath}\``);
  lines.push(`- **診断日時**: ${report.checkedAt}`);
  lines.push(`- **総合評価スコア**: **${report.totalScore} / ${report.maxScore}**`);
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## 📋 基本チェック項目');
  lines.push('');
  lines.push('| 状態 | 項目名 | メッセージ | スコア影響 |');
  lines.push('| :--- | :--- | :--- | :--- |');

  for (const item of report.items) {
    const statusIcon =
      item.status === 'OK'
        ? '✅ OK'
        : item.status === 'WARNING'
        ? '⚠️ WARN'
        : '❌ MISSING';
    const impact = item.scoreImpact > 0 ? `+${item.scoreImpact}` : `${item.scoreImpact}`;
    lines.push(`| ${statusIcon} | ${item.name} | ${item.message} | ${impact} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## ⚠️ 検出された不要ファイル / フォルダ');
  lines.push('');

  if (report.unwantedFilesFound.length > 0) {
    lines.push('以下の不要なファイルまたはフォルダが検出されました。公開前に削除または `.gitignore` への追加を推奨します。');
    lines.push('');
    for (const file of report.unwantedFilesFound) {
      lines.push(`- \`${file}\``);
    }
  } else {
    lines.push('検出された不要ファイルはありません。（クリーン）');
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 🐘 検出された大容量ファイル');
  lines.push('');

  if (report.largeFilesFound.length > 0) {
    lines.push('以下の大容量ファイルが検出されました。Git LFS の使用やリポジトリ外での管理を検討してください。');
    lines.push('');
    for (const file of report.largeFilesFound) {
      const sizeMB = (file.sizeBytes / (1024 * 1024)).toFixed(2);
      lines.push(`- \`${file.path}\` (${sizeMB} MB)`);
    }
  } else {
    lines.push('検出された大容量ファイルはありません。');
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 📊 サマリー');
  lines.push('');
  lines.push(`- 必須ファイル合格率: ${report.summary.passedRequired} / ${report.summary.totalRequired}`);
  lines.push(`- 推奨ファイルクリア数: ${report.summary.passedRecommended} / ${report.summary.totalRecommended}`);
  lines.push(`- 不要ファイル検出数: ${report.summary.unwantedCount}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Markdown レポートをファイルとして保存
 */
export function saveMarkdownReport(report: CheckReport, outputPath: string): void {
  const content = generateMarkdownReport(report);
  const resolvedPath = path.resolve(outputPath);
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(resolvedPath, content, 'utf-8');
}
