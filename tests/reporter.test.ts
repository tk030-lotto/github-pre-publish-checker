import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateMarkdownReport, saveMarkdownReport } from '../src/reporter/markdownReporter.js';
import { parseCLIFlags } from '../src/cli/args.js';
import type { CheckReport } from '../src/types/index.js';

const mockReport: CheckReport = {
  targetPath: '/mock/project',
  checkedAt: '2026/8/11 20:00:00',
  totalScore: 95,
  maxScore: 100,
  items: [
    {
      id: 'REQUIRED_README',
      name: 'README.md',
      category: 'REQUIRED',
      status: 'OK',
      message: '存在します',
      scoreImpact: 0,
    },
    {
      id: 'RECOMMENDED_CONTRIBUTING',
      name: 'CONTRIBUTING.md',
      category: 'RECOMMENDED',
      status: 'WARNING',
      message: '存在しません',
      scoreImpact: -5,
    },
  ],
  unwantedFilesFound: ['.env.local'],
  largeFilesFound: [{ path: 'large_data.bin', sizeBytes: 15 * 1024 * 1024 }],
  summary: {
    passedRequired: 1,
    totalRequired: 1,
    passedRecommended: 0,
    totalRecommended: 1,
    unwantedCount: 1,
  },
};

describe('Reporter & CLI Args Unit Tests', () => {
  test('generateMarkdownReport は適切なMarkdown形式の文字列を出力すべき', () => {
    const md = generateMarkdownReport(mockReport);
    assert.ok(md.includes('# 🔍 GitHub 公開前チェック レポート'));
    assert.ok(md.includes('95 / 100'));
    assert.ok(md.includes('README.md'));
    assert.ok(md.includes('.env.local'));
    assert.ok(md.includes('15.00 MB'));
  });

  test('saveMarkdownReport はファイルを正しく書き出すべき', () => {
    const tmpPath = path.resolve(process.cwd(), 'tests', 'tmp_report.md');
    try {
      saveMarkdownReport(mockReport, tmpPath);
      assert.ok(fs.existsSync(tmpPath));
      const content = fs.readFileSync(tmpPath, 'utf-8');
      assert.ok(content.includes('# 🔍 GitHub 公開前チェック レポート'));
    } finally {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  });

  test('parseCLIFlags は各引数オプションを正しくパースすべき', () => {
    const flags = parseCLIFlags(['./my-target', '-o', 'REPORT.md', '-t', '20', '--json']);
    assert.equal(flags.targetPath, './my-target');
    assert.equal(flags.outputPath, 'REPORT.md');
    assert.equal(flags.largeFileThresholdBytes, 20 * 1024 * 1024);
    assert.equal(flags.jsonOutput, true);
    assert.equal(flags.help, false);
  });

  test('parseCLIFlags は-hフラグでhelpをtrueにすべき', () => {
    const flags = parseCLIFlags(['-h']);
    assert.equal(flags.help, true);
  });
});
