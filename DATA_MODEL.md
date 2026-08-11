# 🗃️ データモデル・スキーマ定義書 (DATA_MODEL.md) - GitHub公開前チェッカー

**作成日時**: 2026-08-11
**最終更新**: 2026-08-11 (型定義コード完全確定)

---

## 1. 概要 & データ設計方針

本システム **GitHub公開前チェッカー** で扱う判定結果、個別の判定項目、スコアリングサマリー、およびオプション指定の TypeScript 型構造です。
`src/types/index.ts` に実装されています。

---

## 2. 主要型定義 (TypeScript Type Definitions)

```typescript
/**
 * 判定ステータス
 */
export type CheckStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'MISSING';

/**
 * チェック項目単体の結果構造
 */
export interface CheckItemResult {
  id: string;                                          // 一意識別子 (例: required-readme)
  name: string;                                        // 表示用項目名
  category: 'REQUIRED' | 'RECOMMENDED' | 'FORBIDDEN' | 'LARGE_FILE'; // 分類
  status: CheckStatus;                                 // 判定ステータス
  message: string;                                     // 判定メッセージ
  scoreImpact: number;                                 // スコアへの減点・加点 (-20, -5 等)
  details?: string[];                                  // 詳細リスト
}

/**
 * 総合判定レポートデータ
 */
export interface CheckReport {
  targetPath: string;                                  // 対象リポジトリパス
  checkedAt: string;                                   // 診断実行日時
  totalScore: number;                                  // 算定された総合スコア (0-100)
  maxScore: number;                                    // 最高スコア (100)
  items: CheckItemResult[];                            // 個別チェック結果一覧
  unwantedFilesFound: string[];                        // 検出された不要ファイル相対パス一覧
  largeFilesFound: { path: string; sizeBytes: number }[]; // 検出された大容量ファイル一覧
  summary: {
    passedRequired: number;                            // 必須項目パス数
    totalRequired: number;                             // 必須項目総数
    passedRecommended: number;                         // 推奨項目パス数
    totalRecommended: number;                          // 推奨項目総数
    unwantedCount: number;                             // 不要ファイル検出件数
  };
}

/**
 * チェッカー実行オプション
 */
export interface CheckerOptions {
  targetPath: string;                                  // 対象ディレクトリパス
  largeFileThresholdBytes?: number;                    // 大容量ファイルの閾値バイト数 (規定: 10MB)
  generateMarkdownReport?: boolean;                    // Markdownレポート保存フラグ
  outputPath?: string;                                 // レポート保存先ファイルパス
}
```

---

## 3. 状態遷移・データフロー

```
[ 入力: CheckerOptions ]
         │
         ▼
[ 1. checkRequiredFiles() ]    ──► CheckItemResult[] (必須項目)
[ 2. checkRecommendedFiles() ] ──► CheckItemResult[] (推奨項目)
[ 3. scanUnwantedAndLargeFiles() ] ──► unwantedFiles & largeFiles
         │
         ▼
[ 集計: runChecker() ]         ──► CheckReport (スコア算定 & サマリー構築)
         │
         ├──► consoleReporter.ts  ──► コンソール標準出力
         └──► markdownReporter.ts ──► CHECK_REPORT.md 生成
```
