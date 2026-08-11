import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { checkRequiredFiles } from '../src/checkers/requiredFilesChecker.js';
import { checkRecommendedFiles } from '../src/checkers/recommendedFilesChecker.js';
import { scanUnwantedAndLargeFiles } from '../src/checkers/ignoredFilesChecker.js';
import { runChecker } from '../src/index.js';

const rootDir = path.resolve(process.cwd());

describe('Checkers Unit Tests', () => {
  test('checkRequiredFiles はプロジェクトルートで README と LICENSE を検出できるべき', () => {
    const results = checkRequiredFiles(rootDir);
    assert.ok(results.length >= 2);

    const readmeResult = results.find((r) => r.id === 'required-readme');
    assert.ok(readmeResult);
    assert.equal(readmeResult.status, 'OK');

    const licenseResult = results.find((r) => r.id === 'required-license');
    assert.ok(licenseResult);
    assert.equal(typeof licenseResult.status, 'string');
  });

  test('checkRecommendedFiles は推奨ファイルを適切にチェックできるべき', () => {
    const results = checkRecommendedFiles(rootDir);
    assert.ok(results.length >= 3);

    const changelogResult = results.find((r) => r.id === 'recommended-changelog');
    assert.ok(changelogResult);
  });

  test('scanUnwantedAndLargeFiles は正常にフォルダをスキャンできるべき', () => {
    const { unwantedFiles, largeFiles } = scanUnwantedAndLargeFiles(rootDir, 10 * 1024 * 1024);
    assert.ok(Array.isArray(unwantedFiles));
    assert.ok(Array.isArray(largeFiles));
  });

  test('runChecker 総合スコア計算が 0〜100 の範囲内に収まるべき', () => {
    const report = runChecker({ targetPath: rootDir });
    assert.ok(report.totalScore >= 0 && report.totalScore <= 100);
    assert.equal(report.maxScore, 100);
    assert.ok(report.items.length > 0);
  });
});
