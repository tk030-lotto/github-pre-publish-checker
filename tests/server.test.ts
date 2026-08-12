import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import path from 'node:path';
import { createServer } from '../src/server/index.js';

describe('Web Server API Integration Tests', () => {
  let server: http.Server;
  const PORT = 3099;
  const baseUrl = `http://localhost:${PORT}`;

  const validRepoPath = path.resolve('tests/fixtures/valid-repo');
  const invalidRepoPath = path.resolve('tests/fixtures/invalid-repo');

  before(async () => {
    server = createServer({ port: PORT });
    await new Promise<void>((resolve) => {
      server.listen(PORT, () => resolve());
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET / should serve index.html with status 200', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType?.includes('text/html'));
    const html = await res.text();
    assert.ok(html.includes('GitHub公開前チェッカー'));
  });

  it('POST /api/check should analyze valid-repo successfully', async () => {
    const res = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPath: validRepoPath,
        thresholdMB: 10
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.report);
    assert.ok(data.report.totalScore >= 80);
    assert.strictEqual(data.report.unwantedFilesFound.length, 0);
  });

  it('POST /api/check should detect issues in invalid-repo', async () => {
    const res = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPath: invalidRepoPath,
        thresholdMB: 0.001 // 超小容量閾値 (1KB) でテスト
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.report.totalScore < 80);
    assert.ok(data.report.unwantedFilesFound.length > 0);
    assert.ok(data.report.largeFilesFound.length > 0);
  });

  it('POST /api/check should return error 400 for non-existent path', async () => {
    const res = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPath: './non-existent-directory-12345'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('存在しません'));
  });

  it('POST /api/report should return markdown content', async () => {
    // 診断を実行
    const checkRes = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPath: validRepoPath })
    });
    const checkData = await checkRes.json();

    // レポート生成API呼出
    const reportRes = await fetch(`${baseUrl}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report: checkData.report })
    });

    assert.strictEqual(reportRes.status, 200);
    const contentType = reportRes.headers.get('content-type');
    assert.ok(contentType?.includes('text/markdown'));
    const markdownText = await reportRes.text();
    assert.ok(markdownText.includes('# 🔍 GitHub 公開前チェック レポート'));
  });

  it('GET directory traversal should be blocked with 403', async () => {
    // パストラバーサル攻撃のテスト (../ による親ディレクトリアクセス)
    const res = await fetch(`${baseUrl}/..%2Fpackage.json`);
    // 403 Forbidden または 404 Not Found で拒否されること
    assert.ok(res.status === 403 || res.status === 404, `Expected 403 or 404, got ${res.status}`);
    const body = await res.text();
    // 少なくとも package.json の内容が漏洩していないこと
    assert.ok(!body.includes('"name"'), 'package.json content should not be accessible');
  });
});
