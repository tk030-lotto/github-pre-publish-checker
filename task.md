# 📋 タスク実行リスト (task.md) - GitHub公開前チェッカー

## 📌 進行中タスク (In Progress)
- [/] Phase 3: テスト自動化 & CLI配布・ビルド成果物検証

## 🟩 未着手タスク (Todo)

### Phase 3: テスト自動化 & 自律検証
- [ ] テスト用フィクスチャ（ダミープロジェクト）の追加と境界値テスト
- [ ] CLI 実行の E2E テスト

### Phase 4: 品質監査 & 開発記録保存
- [ ] `npx tsup` によるビルド成果物 (`dist/index.js`) の検証
- [ ] プロジェクトコンテキスト健全性スキャンの再実行
- [ ] `RECORD.md` の更新および Projects ディレクトリへの永続コピー

## ✅ 完了済みタスク (Completed)
- [x] 要件定義書 (`SPECIFICATION.md` / `README.md`) の解析と4大ドキュメント自動生成
- [x] 初期健全性スコア測定 (96% Healthy)
- [x] Node.js / TypeScript 開発基盤構築 (`package.json`, `tsconfig.json`)
- [x] コアチェックモジュール (`requiredFilesChecker`, `recommendedFilesChecker`, `ignoredFilesChecker`) の実装
- [x] コンソールレポート出力モジュール (`consoleReporter`) の実装
- [x] Phase 1 完了と4大ドキュメント (SCHEDULE, task, ARCHITECTURE, DATA_MODEL) の詳細ブレイクダウン・確定
- [x] Markdownレポート生成機能 (`src/reporter/markdownReporter.ts`) の実装
- [x] CLI オプションパーサー (`src/cli/args.ts` - `--output`, `--threshold`, `--json`, `--help`) の実装
- [x] 単体テスト環境構築 (`node:test`, `tsx --test`) およびテストコード作成 (`tests/`)
- [x] `npm test`, `npm run build` による全テスト通過・ビルド検証
- [x] MCPツール側バックログへの機能フィードバック記録 (RECORD.md 同期)

---

## ⚠️ 未確定事項・TBD (Undetermined / TBD Items)
- レポートファイル生成時の既存ファイル上書き防止（`--overwrite` フラグ等）の要否
