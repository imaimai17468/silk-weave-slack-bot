# Silk Weave

## 目次

- [紹介](#紹介)
- [特徴](#特徴)
- [アーキテクチャ](#アーキテクチャ)
- [インストール](#インストール)
- [設定](#設定)
- [使い方](#使い方)
- [デモ](#デモ)
- [技術スタック](#技術スタック)
- [貢献](#貢献)
- [ライセンス](#ライセンス)
- [連絡先](#連絡先)

## 紹介

**Silk Weave** は、Slack上のスレッドを自動的に監視し、その内容を分析・要約してNotionに整理・保存する強力なツールです。OpenAIのGPTモデルを活用し、スレッドの要約、関連タグ、重要な箇条書きポイント、結論、そして次に取るべきアクションを自動生成します。これにより、チームのディスカッションを効率的に管理し、Notionでの情報共有をスムーズに行えます。

## 特徴

- **自動スレッド監視**: 特定のイベント（例：メンション）を検知し、関連するスレッドを自動的に取得。
- **AIによる要約生成**: OpenAIのGPT-4を利用して、短い要約と詳細な要約を生成。
- **タグ抽出**: スレッド内容から関連するタグを自動的に抽出。
- **箇条書きポイント & 結論**: 重要なポイントを箇条書きで表示し、結論を提供。
- **Next Action提案**: スレッドに基づいた次に取るべきアクションを提案。必要ない場合はその旨を表示。
- **Notion連携**: 生成された情報をNotionに保存し、カスタムプロパティとフォーマット済みブロックで整理。
- **エラーハンドリング & ロギング**: 詳細なエラーログと堅牢なエラーハンドリングで信頼性を確保。

## アーキテクチャ

Silk Weaveは以下の技術を使用して構築されています：

- **Slack API**: スレッドコンテンツの監視と取得。
- **OpenAI API**: 要約、タグ、箇条書きポイント、結論、Next Actionの生成。
- **Notion API**: 処理された情報の保存と整理。
- **Cloudflare Workers**: サーバーレス環境でのホスティングと実行。
- **Hono**: 軽量で高速なウェブフレームワークを使用して、Cloudflare Workers上で効率的なAPIエンドポイントを提供。
- **TypeScript**: 型安全性とメンテナンス性の高いコードベース。

## インストール

### 必要条件

- **Node.js**: Node.jsがインストールされていること（推奨バージョン：v14以上）。
- **Slackアプリ**: 必要な権限を持つSlackアプリのセットアップ。
- **Notion連携**: Notion統合の作成とAPIトークンの取得。
- **OpenAI APIキー**: OpenAIにサインアップし、APIキーを取得。
- **Cloudflareアカウント**: サーバーレス関数をデプロイするためのCloudflareアカウント。
- **Wrangler CLI**: Cloudflare Workers用のCLIツール。

### 手順

1. **リポジトリのクローン**

   ```bash
   git clone git@github.com:imaimai17468/silk-weave-slack-bot.git
   cd silk-weave-slack-bot
   ```

2. **依存関係のインストール**

   ```bash
   npm install
   ```

3. **環境変数の設定**

   workerのsecret以下の環境変数を追加してください

   ```env
   SLACK_BOT_TOKEN=your-slack-bot-token
   SLACK_SIGNING_SECRET=your-slack-signing-secret
   NOTION_TOKEN=your-notion-api-token
   NOTION_DATABASE_ID=your-notion-database-id
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Cloudflare Workersへのデプロイ**

   Cloudflare CLI (`wrangler`) をインストールし、設定します。

   ```bash
   npm install -g wrangler
   wrangler login
   wrangler deploy
   ```

## 設定

### 環境変数

- `SLACK_BOT_TOKEN`: Slack Bot User OAuth Token。
- `SLACK_SIGNING_SECRET`: SlackアプリのSigning Secret。
- `NOTION_TOKEN`: Notion統合のAPIトークン。
- `NOTION_DATABASE_ID`: NotionデータベースのID。
- `OPENAI_API_KEY`: OpenAI APIキー。

### Notionデータベースの設定

Notionデータベースに以下のプロパティを追加してください：

- **Title** (タイトル)
- **Thread Creator** (リッチテキスト)
- **Participants** (マルチセレクト)
- **Reply Count** (数字)
- **Thread Date** (日付)
- **Thread ID** (リッチテキスト)
- **Thread URL** (URL)
- **Summary** (リッチテキスト)
- **Tags** (マルチセレクト)
- **Channel Name** (セレクト)
- **Created At** (日付)

## 使い方

設定が完了すると、Silk Weaveは自動的に指定されたSlackイベントを監視し、スレッドがメンションされた際に処理を開始します。処理の流れは以下の通りです：

1. **Slackイベントの検知**: SlackでSilk Weaveがメンションされたスレッドを検知。
2. **スレッド内容の取得**: Slack APIを使用してスレッドの内容を取得。
3. **要約とタグの生成**: OpenAI APIを使用してスレッドの要約、タグ、箇条書きポイント、結論、Next Actionを生成。
4. **Notionへの保存**: 生成された情報をNotion APIを通じてNotionデータベースに保存。
5. **Slackへの通知**: 処理完了のメッセージとNotionページへのリンクをSlackに送信。

## 技術スタック

- **[Slack API](https://api.slack.com/)**: スレッドの監視と取得。
- **[OpenAI API](https://openai.com/api/)**: 要約、タグ、箇条書きポイント、結論、Next Actionの生成。
- **[Notion API](https://developers.notion.com/)**: データの保存と整理。
- **[Cloudflare Workers](https://workers.cloudflare.com/)**: サーバーレス関数のホスティングと実行。
- **[Hono](https://honojs.dev/)**: 高速で軽量なウェブフレームワークを使用して、Cloudflare Workers上で効率的なAPIエンドポイントを提供。
- **[TypeScript](https://www.typescriptlang.org/)**: 型安全性とメンテナンス性の高いコードベース。

## ライセンス

このプロジェクトは [MIT ライセンス](https://github.com/imaimai17468/silk-weave-slack-bot/blob/main/LICENSE) の下でライセンスされています。

## 連絡先

- **作者**: [imaimai17468](https://github.com/imaimai17468)
- **Twitter**: [@imaimai17468](https://twitter.com/imaimai17468)
