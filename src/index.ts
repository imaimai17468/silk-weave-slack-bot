import { Hono } from "hono";
import type {
  SlackConversationsRepliesResponse,
  SlackChatPostMessageResponse,
} from "./types/slack";
import { isMessageStored } from "./utils/notion";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/thread-to-notion", async (c) => {
  const slackToken = c.env.SLACK_BOT_TOKEN;
  const notionToken = c.env.NOTION_API_TOKEN;
  const notionDatabaseId = c.env.NOTION_DATABASE_ID;

  const body = await c.req.json();

  // Slackのイベントサブスクリプションの検証
  if (body.type === "url_verification") {
    return c.text(body.challenge);
  }

  // イベントデータの処理
  if (body.type === "event_callback") {
    const event = body.event;

    // `app_mention`イベントのみ処理
    if (event.type === "app_mention") {
      const channel_id = event.channel;
      const thread_ts = event.thread_ts || event.ts;

      try {
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
          return c.json({
            status: "error",
            message: "Slack APIエラーが発生しました。",
          });
        }

        const messages = result.messages;

        if (!messages) {
          return c.json({
            status: "error",
            message: "スレッドが見つかりません。",
          });
        }

        // Notionにメッセージを保存
        for (const message of messages) {
          if (!message.text) {
            continue;
          }

          const isStored = await isMessageStored(
            notionToken,
            notionDatabaseId,
            message.client_msg_id
          );

          if (isStored) {
            continue;
          }

          const notionResponse = await fetch(
            "https://api.notion.com/v1/pages",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${notionToken}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28", // 最新のNotion APIバージョンを指定
              },
              body: JSON.stringify({
                parent: { database_id: notionDatabaseId },
                properties: {
                  Name: {
                    title: [
                      {
                        text: {
                          content: message.text,
                        },
                      },
                    ],
                  },
                  Author: {
                    rich_text: [
                      {
                        text: {
                          content: message.user || "unknown",
                        },
                      },
                    ],
                  },
                },
              }),
            }
          );

          const notionResult = await notionResponse.json();

          if (!notionResponse.ok) {
            console.error("Notion API error:", notionResult);
            return c.json({
              status: "error",
              message: "Notion APIエラーが発生しました。",
            });
          }
        }

        // ユーザーに返信
        const postMessageResponse = await fetch(
          "https://slack.com/api/chat.postMessage",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${slackToken}`,
            },
            body: JSON.stringify({
              channel: channel_id,
              thread_ts: thread_ts,
              text: "スレッドの内容をNotionに保存しました。",
            }),
          }
        );

        const postMessageResult: SlackChatPostMessageResponse =
          await postMessageResponse.json();

        if (!postMessageResult.ok) {
          console.error("Slack API error:", postMessageResult.error);
          return c.json({
            status: "error",
            message: "Slack APIエラーが発生しました。",
          });
        }

        return c.json({ status: "ok" });
      } catch (error) {
        console.error("Error occurred:", error);
        return c.json({ status: "error", message: "エラーが発生しました。" });
      }
    }
  }

  return c.json({ status: "ignored" });
});

export default app;
