import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('E2E CLI Integration Tests', () => {
  const cliPath = path.resolve('src/index.ts');
  const validRepoPath = path.resolve('tests/fixtures/valid-repo');
  const invalidRepoPath = path.resolve('tests/fixtures/invalid-repo');
  const outputReportPath = path.resolve('tests/fixtures/temp-report.md');

  it('should display help message when --help flag is used', () => {
    const stdout = execSync(`npx tsx ${cliPath} --help`, { encoding: 'utf-8' });
    assert.match(stdout, /使用方法:/);
    assert.match(stdout, /--output/);
    assert.match(stdout, /--threshold/);
    assert.match(stdout, /--json/);
  });

  it('should analyze valid-repo and produce JSON output', () => {
    const stdout = execSync(`npx tsx ${cliPath} ${validRepoPath} --json`, { encoding: 'utf-8' });
    const result = JSON.parse(stdout);
    
    assert.strictEqual(typeof result.totalScore, 'number');
    assert.ok(result.totalScore >= 80, `Expected score >= 80, got ${result.totalScore}`);
    assert.strictEqual(result.unwantedFilesFound.length, 0);
  });

  it('should analyze invalid-repo and detect violations in JSON output', () => {
    const stdout = execSync(`npx tsx ${cliPath} ${invalidRepoPath} --json -t 1`, { encoding: 'utf-8' });
    const result = JSON.parse(stdout);

    assert.strictEqual(typeof result.totalScore, 'number');
    assert.ok(result.totalScore < 80, `Expected score < 80, got ${result.totalScore}`);

    // Verify ignored files detected (.env, .DS_Store)
    const unwantedItems = result.unwantedFilesFound;
    assert.ok(unwantedItems.some((p: string) => p.includes('.env')));
    assert.ok(unwantedItems.some((p: string) => p.includes('.DS_Store')));

    // Verify large file detected (dummy-large.bin)
    const largeItems = result.largeFilesFound.map((i: any) => i.path);
    assert.ok(largeItems.some((p: string) => p.includes('dummy-large.bin')));
  });

  it('should generate Markdown report file when -o option is used', () => {
    if (fs.existsSync(outputReportPath)) {
      fs.unlinkSync(outputReportPath);
    }

    execSync(`npx tsx ${cliPath} ${validRepoPath} -o ${outputReportPath}`, { encoding: 'utf-8' });
    assert.ok(fs.existsSync(outputReportPath), 'Report file should exist');

    const content = fs.readFileSync(outputReportPath, 'utf-8');
    assert.match(content, /# 🔍 GitHub 公開前チェック レポート/);

    // Clean up
    fs.unlinkSync(outputReportPath);
  });
});
