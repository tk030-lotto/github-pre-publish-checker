import fs from 'node:fs';
import path from 'node:path';
import type { CheckItemResult } from '../types/index.js';

const RECOMMENDED_ITEMS = [
  { name: 'CHANGELOG.md', key: 'changelog', aliases: ['CHANGELOG', 'CHANGELOG.txt'] },
  { name: 'CONTRIBUTING.md', key: 'contributing', aliases: ['CONTRIBUTING', 'CONTRIBUTING.txt'] },
  { name: 'docs フォルダ', key: 'docs', isDir: true, pathName: 'docs' }
];

export function checkRecommendedFiles(targetDir: string): CheckItemResult[] {
  const results: CheckItemResult[] = [];

  for (const item of RECOMMENDED_ITEMS) {
    if (item.isDir) {
      const dirPath = path.join(targetDir, item.pathName);
      const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
      if (exists) {
        results.push({
          id: `recommended-${item.key}`,
          name: `${item.name} 存在確認`,
          category: 'RECOMMENDED',
          status: 'OK',
          message: `検出されました (${item.pathName}/)`,
          scoreImpact: 0
        });
      } else {
        results.push({
          id: `recommended-${item.key}`,
          name: `${item.name} 存在確認`,
          category: 'RECOMMENDED',
          status: 'WARNING',
          message: `推奨 ${item.name} がありません（任意）`,
          scoreImpact: -5
        });
      }
    } else {
      const mainPath = path.join(targetDir, item.name);
      let found = fs.existsSync(mainPath);
      let foundName = item.name;

      if (!found && item.aliases) {
        for (const alias of item.aliases) {
          if (fs.existsSync(path.join(targetDir, alias))) {
            found = true;
            foundName = alias;
            break;
          }
        }
      }

      if (found) {
        results.push({
          id: `recommended-${item.key}`,
          name: `${item.name} 存在確認`,
          category: 'RECOMMENDED',
          status: 'OK',
          message: `検出されました (${foundName})`,
          scoreImpact: 0
        });
      } else {
        results.push({
          id: `recommended-${item.key}`,
          name: `${item.name} 存在確認`,
          category: 'RECOMMENDED',
          status: 'WARNING',
          message: `推奨ファイル ${item.name} がありません（任意）`,
          scoreImpact: -5
        });
      }
    }
  }

  return results;
}
