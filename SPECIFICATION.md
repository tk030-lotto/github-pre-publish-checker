# GitHub公開前チェッカー 仕様書

## 目的

GitHub公開前の最低限の品質確認を自動化する。

## 入力

* リポジトリフォルダ

## 出力

* チェック結果
* 警告一覧
* 評価レポート

## チェック項目

### 必須

* README.md
* LICENSE
* .gitignore
* package.json

### 推奨

* CHANGELOG
* CONTRIBUTING
* docsフォルダ

### 除外対象

* node_modules
* temp
* cache
* log
* build生成物

## 出力形式

* コンソール表示
* Markdownレポート

## 非機能要件

* ローカルのみで動作
* API不要
* 高速実行
* Windows対応
* TypeScript実装
