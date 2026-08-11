import path from 'node:path';
import { checkRequiredFiles } from './checkers/requiredFilesChecker.js';
import { checkRecommendedFiles } from './checkers/recommendedFilesChecker.js';
import { scanUnwantedAndLargeFiles } from './checkers/ignoredFilesChecker.js';
import { printConsoleReport } from './reporter/consoleReporter.js';
import { saveMarkdownReport } from './reporter/markdownReporter.js';
import { parseCLIFlags, printHelp } from './cli/args.js';
import type { CheckReport, CheckerOptions } from './types/index.js';

export function runChecker(options: CheckerOptions): CheckReport {
  const targetDir = path.resolve(options.targetPath);

  const requiredResults = checkRequiredFiles(targetDir);
  const recommendedResults = checkRecommendedFiles(targetDir);
  const { unwantedFiles, largeFiles } = scanUnwantedAndLargeFiles(
    targetDir,
    options.largeFileThresholdBytes
  );

  const allItems = [...requiredResults, ...recommendedResults];

  let totalScore = 100;
  for (const item of allItems) {
    totalScore += item.scoreImpact;
  }

  // 不要ファイルが検出された場合の減点（1件につき-5点、最大-20点）
  if (unwantedFiles.length > 0) {
    totalScore -= Math.min(unwantedFiles.length * 5, 20);
  }

  // 大容量ファイルが検出された場合の減点（1件につき-10点、最大-30点）
  if (largeFiles.length > 0) {
    totalScore -= Math.min(largeFiles.length * 10, 30);
  }

  totalScore = Math.max(0, totalScore);

  const report: CheckReport = {
    targetPath: targetDir,
    checkedAt: new Date().toLocaleString('ja-JP'),
    totalScore,
    maxScore: 100,
    items: allItems,
    unwantedFilesFound: unwantedFiles,
    largeFilesFound: largeFiles,
    summary: {
      passedRequired: requiredResults.filter((r) => r.status === 'OK').length,
      totalRequired: requiredResults.length,
      passedRecommended: recommendedResults.filter((r) => r.status === 'OK').length,
      totalRecommended: recommendedResults.length,
      unwantedCount: unwantedFiles.length
    }
  };

  return report;
}

// CLI実行時（直接実行された場合）
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const cliOptions = parseCLIFlags();

  if (cliOptions.help) {
    printHelp();
  } else {
    const report = runChecker({
      targetPath: cliOptions.targetPath,
      largeFileThresholdBytes: cliOptions.largeFileThresholdBytes,
    });

    if (cliOptions.jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printConsoleReport(report);
    }

    if (cliOptions.outputPath) {
      saveMarkdownReport(report, cliOptions.outputPath);
      console.log(`📝 Markdown レポートを保存しました: ${cliOptions.outputPath}\n`);
    }
  }
}

