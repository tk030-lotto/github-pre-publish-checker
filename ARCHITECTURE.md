# 🏗️ アーキテクチャ設計書 (ARCHITECTURE.md) - GitHub公開前チェッカー

**作成日時**: 2026-08-11
**最終更新**: 2026-08-11 (詳細化・モジュール設計確定)

---

## 1. システム概要 & 目的

本システム **GitHub公開前チェッカー** は、GitHubへリポジトリを公開する前に品質（必須ファイル・推奨ファイル・不要ファイル・大容量ファイル等）を自動判定・評価するローカルCLIツールです。
完全ローカル動作・API不要・高速実行を設計原則とします。

---

## 2. 技術スタック (Tech Stack)

- **言語・環境**: Node.js (>= 18), TypeScript (>= 5.3)
- **ビルドツール**: `tsup` (ESM モジュール生成・d.ts 判定)
- **実行環境**: `tsx` (開発時・CLI直接実行)
- **標準ライブラリ**: Node.js `fs`, `path`, `process` (Zero-Dependency 志向)

---

## 3. モジュール構成 (Component Architecture)

```
[ CLI エントリーポイント (src/index.ts) ]
         │
         ├──► [ 各種チェッカーモジュール (src/checkers/) ]
         │      ├── requiredFilesChecker.ts     (必須: README, LICENSE, .gitignore, package.json)
         │      ├── recommendedFilesChecker.ts  (推奨: CHANGELOG, CONTRIBUTING, docs/)
         │      └── ignoredFilesChecker.ts      (不要/大容量: node_modules, temp, 10MB超ファイル)
         │
         └──► [ レポーターモジュール (src/reporter/) ]
                ├── consoleReporter.ts          (コンソール表形式出力)
                └── markdownReporter.ts         (Markdown形式レポート生成)
```

---

## 4. 主要モジュール・機能設計

### 4.1. CLI Runner (`src/index.ts`)
- コマンドライン引数 (`process.argv`) のパース。
- 対象リポジトリパスの解決・存在チェック。
- 各種チェッカーの呼び出しとスコア集計（100点満点ベース、違反項目に応じた減点算定）。
- 指定された出力フォーマット（Console / Markdown）への委譲。

### 4.2. Checkers (`src/checkers/`)
- **RequiredFilesChecker**: リポジトリ直下の必須ファイルを判定。エイリアス（`LICENSE.txt` 等）に対応。
- **RecommendedFilesChecker**: 推奨ファイルおよび `docs/` ディレクトリを判定。
- **IgnoredFilesChecker**: ディレクトリ再帰走査による `node_modules`, `temp`, `.log`, `.env` 検出、および指定閾値（標準 10MB）を超えるファイルの抽出。

### 4.3. Reporters (`src/reporter/`)
- **ConsoleReporter**: 絵文字と状態マーク（OK / WARN / MISSING）を用いた見やすい対話型表示。
- **MarkdownReporter**: CI環境やログ保存用の構造化された Markdown レポートを出力。

---

## 5. スコアリングアルゴリズム

- **基本スコア**: `100点`
- **必須ファイル欠落**: 1件につき `-20点`
- **推奨ファイル欠落**: 1件につき `-5点`
- **不要ファイル混入**: 1件につき `-5点`（最大 `-20点`）
- **大容量ファイル混入**: 1件につき `-10点`（最大 `-30点`）
- **下限**: `0点`

---

## 6. 品質方針・セキュリティ
- **完全ローカル処理**: 外部ネットワーク通信を一切行わない。
- **読み取り専用操作**: スキャン対象リポジトリのファイルを一切改変しない（安全設計）。
