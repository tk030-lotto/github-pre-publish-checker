# GitHub公開前チェッカー

GitHubへ公開する前に、リポジトリの品質を自動チェックするローカルツールです。

## 概要

GitHubへOSSを公開する際、READMEやLICENSEの不足、不要ファイルの混入などが原因で完成度が下がることがあります。

本ツールは公開前に基本項目を自動チェックし、チェックレポートを生成します。

## 主な機能

* README.md存在確認
* LICENSE存在確認
* .gitignore確認
* package.json確認
* Topics設定確認（任意）
* About欄入力確認（任意）
* 不要ファイル検出
* 大容量ファイル検出
* node_modules混入検出
* dist/buildファイル確認
* レポート出力

## 利用例

公開前に実行すると、以下のような結果を表示します。

```
README.md      OK
LICENSE        OK
.gitignore     OK
package.json   OK

不要ファイル
temp.txt

評価
95 / 100
```

## 特徴

* ローカル動作
* インストール不要
* GitHub API不要
* シンプルな単機能ツール

## 対象

* OSS開発者
* 個人開発者
* AI開発者
* GitHub初心者

## ライセンス

MIT License
