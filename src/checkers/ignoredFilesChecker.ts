import fs from 'node:fs';
import path from 'node:path';

const UNWANTED_PATTERNS = [
  'node_modules',
  'temp',
  'cache',
  '.log',
  '.tmp',
  '.env',
  '.DS_Store',
  'Thumbs.db'
];

const DEFAULT_LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

export interface ScanFilesResult {
  unwantedFiles: string[];
  largeFiles: { path: string; sizeBytes: number }[];
}

export function scanUnwantedAndLargeFiles(
  targetDir: string,
  largeFileThresholdBytes: number = DEFAULT_LARGE_FILE_THRESHOLD
): ScanFilesResult {
  const unwantedFiles: string[] = [];
  const largeFiles: { path: string; sizeBytes: number }[] = [];

  function scan(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(targetDir, fullPath);

      // `.git` ディレクトリ内は除外
      if (entry.name === '.git') continue;

      // 不要パターンの検出
      const isUnwanted = UNWANTED_PATTERNS.some((pattern) => {
        if (pattern.startsWith('.')) {
          return entry.name.endsWith(pattern);
        }
        return entry.name.toLowerCase() === pattern.toLowerCase();
      });

      if (isUnwanted) {
        unwantedFiles.push(relativePath);
        // node_modulesなどの大容量不要フォルダは内部走査をスキップ
        if (entry.isDirectory()) continue;
      }

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size >= largeFileThresholdBytes) {
            largeFiles.push({
              path: relativePath,
              sizeBytes: stats.size
            });
          }
        } catch {
          // ファイル読み込みエラーの無視
        }
      }
    }
  }

  scan(targetDir);

  return {
    unwantedFiles,
    largeFiles
  };
}
