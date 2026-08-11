# 🔍 GitHub公開前チェッカー (gh-check)

GitHubへ公開する前に、リポジトリの品質・必須ファイル・不要ファイル・セキュリティ上の懸念事項を自動チェックするローカルツールです。

---

## 🌟 概要

GitHubでOSSや個人プロジェクトを公開する際、以下のようなミスが発生しがちです：

- **必須ドキュメントの欠落**: `README.md` や `LICENSE` が入っていない
- **不要ファイル・環境変数のコミット**: `.env`, `.DS_Store`, `node_modules/` が含まれている
- **大容量ファイルの混入**: Gitで管理すべきでない大容量バイナリが含まれている

本ツールは、公開前にローカル環境でこれらを自動スキャンし、**総合評価スコア（0〜100点）** と **Markdown形式のチェックレポート** を高速生成します。

---

## ✨ 特徴

- 🔒 **完全ローカル完結**: 外部API通信ゼロ。機密情報やコードが外部に送信されません。
- ⚡ **Zero-Dependency**: 実行時の外部依存パッケージなし（Node.js 標準機能のみで動作）。
- 🖥️ **ディレクトリスキャン**: ローカルの任意のプロジェクトフォルダをパス指定で一括チェック。
- 📊 **ボックス罫線UI**: ディレクトリ構造可視化ツールに準拠した視認性の高いコンソール表示。
- 📝 **Markdownレポート出力**: 診断結果を `CHECK_REPORT.md` 等のファイルへ自動出力可能。

---

## 🚀 使い方

### 1. `ツール起動.bat` での起動 (Windows)

プロジェクトルートにある **`ツール起動.bat`** をダブルクリックするだけで起動できます。

1. `ツール起動.bat` をダブルクリック
2. 診断したいフォルダのパスを入力（そのままEnterでカレントディレクトリを診断）
3. コンソールに診断結果が表示され、`CHECK_REPORT.md` が保存されます。

---

### 2. CLI コマンドでの実行 (npx / node)

```bash
# カレントディレクトリを診断
npx gh-check .

# 指定のプロジェクトフォルダを診断し、Markdownレポートを出力
npx gh-check ./my-project -o ./CHECK_REPORT.md

# 大容量ファイルの閾値を 5MB に変更して JSON 形式で出力
npx gh-check ./my-project -t 5 --json
```

#### CLI オプション一覧

| オプション | 短縮 | 説明 | デフォルト |
|---|---|---|---|
| `[targetDir]` | - | 診断対象のフォルダパス | `.` (カレントディレクトリ) |
| `-o, --output <path>` | `-o` | Markdown レポートを指定のファイルパスに保存 | なし (出力なし) |
| `-t, --threshold <mb>` | `-t` | 大容量ファイルとして検出する閾値 (MB単位) | `10` MB |
| `--json` | - | 診断結果を JSON フォーマットで標準出力に出力 | `false` |
| `-h, --help` | `-h` | ヘルプメッセージを表示 | - |

---

## 📋 チェック項目一覧

### 必須ファイル (Required)
- `README.md` (または `README.txt`, `README`)
- `LICENSE` (または `LICENSE.txt`, `LICENSE.md`)
- `.gitignore`
- `package.json`

### 推奨ファイル (Recommended)
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `docs/` フォルダ

### 不要ファイル / フォルダの検出 (Forbidden / Unwanted)
- `.env`, `.env.local` 等の環境変数ファイル
- `node_modules/` フォルダの誤コミット
- `.DS_Store`, `Thumbs.db` 等のOSシステムファイル
- `temp/`, `cache/`, `*.log`, `*.tmp`

### 大容量ファイルの検出 (Large Files)
- 指定の閾値（デフォルト 10MB）を超えるファイルの検出

---

## 💻 コンソール表示例 (ディレクトリ構造可視化ツール準拠)

```text
┌────────────────────────────────────────────────────────┐
│  🔍  GitHub 公開前チェッカー (gh-check)                │
└────────────────────────────────────────────────────────┘

 📂 診断対象: C:\Users\user\Desktop\my-project
 🕒 診断日時: 2026/8/11 21:00:00

┌────────────────────────────────────────────────────────┐
│ 📋 基本チェック項目                                     │
├──────────────────────────────┬──────────┬──────────────┤
│ 項目名                       │ 状態     │ メッセージ   │
├──────────────────────────────┼──────────┼──────────────┤
│ README.md 存在確認           │ ✅ OK    │ 検出されました (README.md)
│ LICENSE 存在確認             │ ✅ OK    │ 検出されました (LICENSE)
│ .gitignore 存在確認          │ ✅ OK    │ 検出されました (.gitignore)
│ package.json 存在確認        │ ✅ OK    │ 検出されました (package.json)
└──────────────────────────────┴──────────┴──────────────┘

┌────────────────────────────────────────────────────────┐
│ ⚠️  検出された不要ファイル / フォルダ                    │
└────────────────────────────────────────────────────────┘
  ✨ なし (クリーン)

┌────────────────────────────────────────────────────────┐
│ 🐘 検出された大容量ファイル (> 10  MB)                      │
└────────────────────────────────────────────────────────┘
  ✨ なし (適正サイズ)

================================================────────
 📊 総合評価スコア : [ ████████████████████ ] 100 / 100 (✅ 健全)
================================================────────
```

---

## 🛠️ 開発者向けコマンド

```bash
# TypeScript ビルド (dist/index.js の生成)
npm run build

# 単体テスト & E2E テストの実行
npm test

# 開発用実行
npm run dev
```

---

## 📄 ライセンス (License)

本プロジェクトは **MIT License** の下で公開されています。

```text
MIT License

Copyright (c) 2026 tk030

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
