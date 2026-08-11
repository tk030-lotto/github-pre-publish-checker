import fs from 'node:fs';
import path from 'node:path';
import type { CheckItemResult } from '../types/index.js';

const REQUIRED_FILES = [
  { name: 'README.md', key: 'readme' },
  { name: 'LICENSE', key: 'license', aliases: ['LICENSE.txt', 'LICENSE.md'] },
  { name: '.gitignore', key: 'gitignore' },
  { name: 'package.json', key: 'package_json' }
];

export function checkRequiredFiles(targetDir: string): CheckItemResult[] {
  const results: CheckItemResult[] = [];

  for (const item of REQUIRED_FILES) {
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
        id: `required-${item.key}`,
        name: `${item.name} 存在確認`,
        category: 'REQUIRED',
        status: 'OK',
        message: `検出されました (${foundName})`,
        scoreImpact: 0
      });
    } else {
      results.push({
        id: `required-${item.key}`,
        name: `${item.name} 存在確認`,
        category: 'REQUIRED',
        status: 'MISSING',
        message: `必須ファイル ${item.name} が存在しません`,
        scoreImpact: -20
      });
    }
  }

  return results;
}
