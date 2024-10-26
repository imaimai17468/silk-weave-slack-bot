// index.js
import { Hono } from "hono";
import { WebClient } from "@slack/web-api";
import { Client as NotionClient } from "@notionhq/client";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/thread-to-notion", async (c) => {
  const slackToken = c.env.SLACK_BOT_TOKEN;
  const notionToken = c.env.NOTION_API_TOKEN;
  const notionDatabaseId = c.env.NOTION_DATABASE_ID;

  const slackClient = new WebClient(slackToken);
  const notion = new NotionClient({ auth: notionToken });

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
        const result = await slackClient.conversations.replies({
          channel: channel_id,
          ts: thread_ts,
        });

        const messages = result.messages;

        if (!messages) {
          return c.json({ status: "error", message: "スレッドが見つかりません。" });
        }

        // Notionにメッセージを保存
        for (const message of messages) {
          if (!message.text) {
            continue;
          }

          await notion.pages.create({
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
          });
        }

        // ユーザーに返信
        await slackClient.chat.postMessage({
          channel: channel_id,
          thread_ts: thread_ts,
          text: "スレッドの内容をNotionに保存しました。",
        });

        return c.json({ status: "ok" });
      } catch (error) {
        console.error(error);
        return c.json({ status: "error", message: "エラーが発生しました。" });
      }
    }
  }

  return c.json({ status: "ignored" });
});

export default app;
