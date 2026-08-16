import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { runChecker } from '../index.js';
import { generateMarkdownReport } from '../reporter/markdownReporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静的ファイルの公開ディレクトリ (開発モード src/server/public と ビルド後 dist/ の両方に対応)
function getPublicDir(): string {
  const srcPublic = path.resolve(__dirname, 'public');
  if (fs.existsSync(srcPublic)) {
    return srcPublic;
  }
  const distPublic = path.resolve(__dirname, '..');
  if (fs.existsSync(path.join(distPublic, 'index.html'))) {
    return distPublic;
  }
  return srcPublic;
}

const PUBLIC_DIR = getPublicDir();

export interface ServerOptions {
  port?: number;
  openBrowser?: boolean;
}

/**
 * MIMEタイプの判定
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

/**
 * ローカルWebサーバーを作成・起動
 */
export function createServer(options: ServerOptions = {}): http.Server {
  const port = options.port ?? 3000;

  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url ?? '/', `http://localhost:${port}`);
    const pathname = reqUrl.pathname;

    // CORSヘッダー (localhost 限定。外部オリジンからの呼び出しを拒否)
    const origin = req.headers.origin ?? '';
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      res.setHeader('Access-Control-Allow-Origin', origin || `http://localhost:${port}`);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // API エンドポイント: ヘルスチェック
    if (req.method === 'GET' && pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok', local: true }));
      return;
    }

    // API エンドポイント: チェック実行
    if (req.method === 'POST' && pathname === '/api/check') {
      let body = '';
      let bodySize = 0;
      const BODY_LIMIT = 1 * 1024 * 1024; // 1MB 上限
      req.on('data', (chunk) => {
        bodySize += chunk.length;
        if (bodySize > BODY_LIMIT) {
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'リクエストボディが大きすぎます。' }));
          req.destroy();
          return;
        }
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const targetPath = payload.targetPath;
          const thresholdMB = Number(payload.thresholdMB || payload.largeFileThresholdMB) || 10;
          const largeFileThresholdBytes = thresholdMB * 1024 * 1024;

          if (!targetPath || typeof targetPath !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: '⚠️ チェック対象のプロジェクトを選択してください。' }));
            return;
          }

          const resolvedTarget = path.resolve(targetPath);

          if (!fs.existsSync(resolvedTarget)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: false,
              error: `❌ 指定されたフォルダが存在しません: ${resolvedTarget}`
            }));
            return;
          }

          const stat = fs.statSync(resolvedTarget);
          if (!stat.isDirectory()) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: false,
              error: `❌ 指定されたパスはディレクトリではありません: ${resolvedTarget}`
            }));
            return;
          }

          // チェックエンジン実行
          const report = runChecker({
            targetPath: resolvedTarget,
            largeFileThresholdBytes
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, report }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            error: `❌ スキャン中にエラーが発生しました。\n詳細: ${err?.message || String(err)}`
          }));
        }
      });
      return;
    }

    // API エンドポイント: Markdown レポート生成
    if (req.method === 'POST' && pathname === '/api/report') {
      let body = '';
      let bodySize = 0;
      const BODY_LIMIT = 2 * 1024 * 1024; // 2MB 上限 (レポートデータ分)
      req.on('data', (chunk) => {
        bodySize += chunk.length;
        if (bodySize > BODY_LIMIT) {
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'リクエストボディが大きすぎます。' }));
          req.destroy();
          return;
        }
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          if (!payload.report) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: 'レポートデータが必要です。' }));
            return;
          }

          const markdownContent = generateMarkdownReport(payload.report);
          res.writeHead(200, {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': 'attachment; filename="CHECK_REPORT.md"'
          });
          res.end(markdownContent);
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: err?.message || 'レポート作成エラー' }));
        }
      });
      return;
    }

    // 静的ファイル配信 (GET)
    if (req.method === 'GET') {
      let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
      // path.resolve で正規化して Directory Traversal を確実に防ぐ
      const filePath = path.resolve(PUBLIC_DIR, relativePath);
      const resolvedPublicDir = path.resolve(PUBLIC_DIR);

      // Directory Traversal 対策 (正規化済みパスで比較)
      if (!filePath.startsWith(resolvedPublicDir + path.sep) && filePath !== resolvedPublicDir) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
          return;
        }

        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 'Content-Type': mimeType });
        fs.createReadStream(filePath).pipe(res);
      });
      return;
    }

    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed');
  });

  return server;
}

/**
 * ブラウザを自動で開く
 */
export function openBrowserInOS(url: string): void {
  const platform = process.platform;
  let command = '';

  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  exec(command, (err) => {
    if (err) {
      console.log(`[INFO] ブラウザを自動で開けませんでした。ブラウザで ${url} にアクセスしてください。`);
    }
  });
}

/**
 * 直接実行された場合 (Webサーバー起動エントリポイント)
 */
function isDirectRunServer(): boolean {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    return path.resolve(currentFile) === path.resolve(process.argv[1] ?? '');
  } catch {
    return process.argv[1]?.includes('server') ?? false;
  }
}

if (isDirectRunServer()) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const server = createServer({ port: PORT });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n========================================================`);
    console.log(`[SERVER] GitHub公開前チェッカー Webサーバーが起動しました!`);
    console.log(`[URL]    ${url}`);
    console.log(`========================================================\n`);
    openBrowserInOS(url);
  });
}
