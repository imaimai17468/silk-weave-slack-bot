import { Hono } from "hono";
import type { SlackConversationsRepliesResponse } from "./types/slack";
import { isThreadStored, saveThreadToNotion } from "./utils/notion";
import {
  sendErrorMessageToSlack,
  postMessageToSlack,
  getUserNames,
  getChannelName,
} from "./utils/slack";
import { generateSummaryAndTags } from "./utils/openai";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/thread-to-notion", async (c) => {
  const {
    SLACK_BOT_TOKEN: slackToken,
    NOTION_API_TOKEN: notionToken,
    NOTION_DATABASE_ID: notionDatabaseId,
    OPENAI_API_KEY: openaiApiKey,
    SLACK_WORKSPACE_URL: slackWorkspaceUrl,
  } = c.env;

  const body = await c.req.json();

  // Slackのイベントサブスクリプションの検証
  if (body.type === "url_verification") {
    return c.text(body.challenge);
  }

  // リトライイベントの処理をスキップ
  const retryNumHeader = c.req.header("X-Slack-Retry-Num");
  const retryNum = retryNumHeader ? parseInt(retryNumHeader, 10) : 0;
  if (retryNum > 0) {
    return c.json({ status: "ok" });
  }

  // イベントデータの処理
  if (body.type === "event_callback") {
    const event = body.event;

    // `app_mention`イベントのみ処理
    if (event.type === "app_mention") {
      const channel_id = event.channel;
      const thread_ts = event.thread_ts || event.ts;

      try {
        // 処理開始のメッセージを投稿
        const startMessageResult = await postMessageToSlack(
          slackToken,
          channel_id,
          thread_ts,
          "スレッドの情報を処理しています..."
        );

        if (!startMessageResult.ok) {
          console.error("Slack API error:", startMessageResult.error);
          await sendErrorMessageToSlack(
            slackToken,
            channel_id,
            thread_ts,
            "Slackへのメッセージ送信中にエラーが発生しました。"
          );
          return c.json({
            status: "error",
            message: "Slack APIエラーが発生しました。",
          });
        }

        // スレッドのメッセージを取得
        const slackResponse = await fetch(
          `https://slack.com/api/conversations.replies?channel=${encodeURIComponent(
            channel_id
          )}&ts=${encodeURIComponent(thread_ts)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${slackToken}`,
            },
          }
        );

        const result =
          (await slackResponse.json()) as SlackConversationsRepliesResponse;

        if (!result.ok) {
          console.error("Slack API error:", result.error);
          await sendErrorMessageToSlack(
            slackToken,
            channel_id,
            thread_ts,
            "Slack APIエラーが発生しました。"
          );
          return c.json({
            status: "error",
            message: "Slack APIエラーが発生しました。",
          });
        }

        const messages = result.messages;

        if (!messages || messages.length === 0) {
          await sendErrorMessageToSlack(
            slackToken,
            channel_id,
            thread_ts,
            "スレッドが見つかりません。"
          );
          return c.json({
            status: "error",
            message: "スレッドが見つかりません。",
          });
        }

        // スレッドが既に保存されているか確認
        const threadId = thread_ts;
        const isStored = await isThreadStored(
          notionToken,
          notionDatabaseId,
          threadId
        );

        if (isStored) {
          await sendErrorMessageToSlack(
            slackToken,
            channel_id,
            thread_ts,
            "このスレッドは既に保存されています。"
          );
          return c.json({
            status: "error",
            message: "スレッドは既に保存されています。",
          });
        }

        // スレッド情報の抽出
        const threadCreatorId = messages[0].user;
        const participantIds = Array.from(
          new Set(messages.map((msg) => msg.user))
        );
        const replyCount = messages.length - 1; // 最初のメッセージを除く
        const threadTimestamp = messages[0].ts;

        // チャンネル名の取得
        const channelName = await getChannelName(slackToken, channel_id).then(
          (name) => `#${name}`
        );

        // ユーザー名の取得
        const userNames = await getUserNames(slackToken, participantIds);

        // スレッド作成者の名前を取得
        const threadCreator = userNames.find(
          (user) => user.userId === threadCreatorId
        )?.userName;

        // 参加者の名前のリストを作成
        const participantNames = userNames.map((user) => user.userName);

        // タイムスタンプを日時に変換
        const threadDate = new Date(parseFloat(threadTimestamp) * 1000);

        // スレッドのURLを生成
        const formattedTimestamp = thread_ts.replace(".", "");
        const threadUrl = `${slackWorkspaceUrl}/archives/${channel_id}/p${formattedTimestamp}`;

        // スレッドのメッセージを結合
        const threadContent = messages.map((msg) => msg.text).join("\n");

        // 要約とタグの生成
        const {
          shortSummary,
          longSummary,
          tags,
          bulletPoints,
          nextAction,
          conclusion,
        } = await generateSummaryAndTags(openaiApiKey, threadContent);

        // Notionにスレッド情報を保存
        const notionPageId = await saveThreadToNotion({
          notionToken,
          notionDatabaseId,
          title: messages[0].text || "No Title",
          threadCreator: threadCreator || "Unknown",
          participantNames,
          replyCount,
          threadDate,
          threadId,
          threadUrl,
          shortSummary,
          longSummary,
          tags,
          bulletPoints,
          nextAction,
          conclusion,
          channelName,
        });

        if (!notionPageId) {
          await sendErrorMessageToSlack(
            slackToken,
            channel_id,
            thread_ts,
            "Notion APIエラーが発生しました。"
          );
          return c.json({
            status: "error",
            message: "Notion APIエラーが発生しました。",
          });
        }

        // NotionページのURLを構築
        const notionPageUrl = `https://www.notion.so/${notionPageId.replace(
          /-/g,
          ""
        )}`;

        // 処理完了のメッセージを投稿
        const completionMessage = `スレッドの情報をNotionに保存しました。\n${notionPageUrl}`;

        // 処理完了のメッセージを投稿
        const postMessageResult = await postMessageToSlack(
          slackToken,
          channel_id,
          thread_ts,
          completionMessage
        );

        if (!postMessageResult.ok) {
          console.error("Slack API error:", postMessageResult.error);
          await sendErrorMessageToSlack(
            slackToken,
            channel_id,
            thread_ts,
            "Slackへのメッセージ送信中にエラーが発生しました。"
          );
          return c.json({
            status: "error",
            message: "Slack APIエラーが発生しました。",
          });
        }

        return c.json({ status: "ok" });
      } catch (error) {
        console.error("Error occurred:", error);
        await sendErrorMessageToSlack(
          slackToken,
          channel_id,
          thread_ts,
          "エラーが発生しました。"
        );
        return c.json({ status: "error", message: "エラーが発生しました。" });
      }
    }
  }

  return c.json({ status: "ignored" });
});

export default app;
