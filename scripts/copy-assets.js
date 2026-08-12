import fs from 'node:fs';
import path from 'node:path';

const srcDir = path.resolve('src/server/public');
const distDir = path.resolve('dist/server/public');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  fs.cpSync(srcDir, distDir, { recursive: true });
  console.log('✅ Web UI アセットを dist/server/public へ正常にコピーしました');
}
