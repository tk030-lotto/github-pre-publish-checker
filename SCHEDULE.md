# 📅 開発計画・工程管理 (SCHEDULE.md) - GitHub公開前チェッカー

**作成日時**: 2026-08-11
**最終更新**: 2026-08-11 (Phase 1 確定 & 詳細ブレイクダウン完了)

---

## 📊 全体進捗サマリー

- **全体進捗率**: **`25%`** (1 / 4 フェーズ完了)
- **現在のステータス**: Phase 1 完了 / Phase 2 (コア機能・レポート出力強化) 着手準備中

---

## 🚀 フェーズ別開発計画

| フェーズ | 目標・主要作業 | ステータス | 完了基準 (DoD) |
|---|---|---|---|
| **Phase 1** | 詳細設計・要件ブレイクダウン & TS骨格構築 | **完了** | ARCHITECTURE.md, SCHEDULE.md, DATA_MODEL.md 確定 & TS骨格実装 |
| **Phase 2** | Markdownレポート出力機能 & CLIオプション拡充 | 進行中 | Markdownレポートファイル生成 & CLIオプション解析動作確認 |
| **Phase 3** | 単体テスト自動化 & エッジケース検証 | 未着手 | 全チェック項目の自動テスト実装 & 全テスト PASS |
| **Phase 4** | 総合検証・品質監査・ビルド検証 | 未着手 | コンテキスト健全性スコア 95% 以上 & tsupビルド動作確認 |

---

## 📝 詳細タスク一覧

### Phase 1: 詳細設計 & 基盤準備 (完了)
- [x] 要件定義書からの 4大設計ドキュメント自動生成
- [x] コンテキスト健全性スコア測定 (初期スコア: 96%)
- [x] TypeScript / Node.js 開発基盤構築 (`package.json`, `tsconfig.json`)
- [x] コアチェッカー骨格実装 (`requiredFilesChecker`, `recommendedFilesChecker`, `ignoredFilesChecker`, `consoleReporter`)
- [x] 4大ドキュメントおよびタスクリストの詳細ブレイクダウン・確定

### Phase 2: コア機能・レポート出力機能の拡張 (進行中)
- [ ] Markdownレポート生成機能 (`src/reporter/markdownReporter.ts`) の実装
- [ ] CLI 引数解析の拡張 (`--output`, `--threshold`, `--json`, `--help`)
- [ ] 不要・大容量ファイル除外の精度向上 (`.gitignore` パターン参照機能の検討)
- [ ] 動作結果のコンソール・ファイル双方出力の統合

### Phase 3: 単体テスト自動化 & エッジケース検証 (未着手)
- [ ] 単体テスト環境構築 (Node test runner または Vitest)
- [ ] チェッカー別単体テストコード作成 (`tests/checkers.test.ts`)
- [ ] エッジケース検証 (大容量ファイル境界値、特殊ファイル名、深層ディレクトリ)
- [ ] テスト自動実行スクリプトの整備 (`npm test`)

### Phase 4: 総合検証 & ドキュメント永続化 (未着手)
- [ ] リリースビルド検証 (`npm run build` による `tsup` 成果物確認)
- [ ] 最終コンテキスト健全性診断 (`check_context_integrity`) の実施
- [ ] 開発記録 (`RECORD.md`) の更新および `Projects` ディレクトリへの同期保存

---

## ⚠️ 未確定事項・TBD (Undetermined / TBD Items)
- **TBD 1**: `CHECK_REPORT.md` の標準出力先デフォルト（カレントディレクトリ直下か、`reports/` フォルダか）
