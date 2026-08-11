# 📋 タスク実行リスト (task.md) - GitHub公開前チェッカー

## 📌 進行中タスク (In Progress)
- [/] Phase 2: Markdownレポート生成機能 (`src/reporter/markdownReporter.ts`) の実装

## 🟩 未着手タスク (Todo)

### Phase 2: 機能拡張 & レポート出力
- [ ] Markdownレポートファイル出力処理の実装 (`--output` オプション)
- [ ] CLI オプションパーサー (`--threshold`, `--json`, `--help`) の導入
- [ ] スコア算定ロジックの調整と重み付け設定の整理
- [ ] 動作確認コマンド (`npm run check`) での Markdown 生成検証

### Phase 3: テスト自動化 & 自律検証
- [ ] テストランナー構築とテスト用フィクスチャ（ダミープロジェクト）の作成
- [ ] 必須ファイル検出テスト (RequiredFilesChecker)
- [ ] 推奨ファイル検出テスト (RecommendedFilesChecker)
- [ ] 不要・大容量ファイル検出テスト (IgnoredFilesChecker)
- [ ] CLI 実行テスト (`npm test`)

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
- [x] MCPツール側バックログへの機能フィードバック記録 (RECORD.md 同期)

---

## ⚠️ 未確定事項・TBD (Undetermined / TBD Items)
- レポートファイル生成時の既存ファイル上書き防止（`--overwrite` フラグ等）の要否
