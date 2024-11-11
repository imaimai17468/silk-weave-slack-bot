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

  // イベントデータの処理
  if (body.type === "event_callback") {
    const event = body.event;

    if (event.type === "app_mention") {
      const channel_id = event.channel;
      const thread_ts = event.thread_ts || event.ts;

      // リクエストの応答を返し、後続処理をwaitUntilで実行
      c.executionCtx.waitUntil(
        (async () => {
          try {
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
              return;
            }

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
              return;
            }

            const messages = result.messages;

            if (!messages || messages.length === 0) {
              await sendErrorMessageToSlack(
                slackToken,
                channel_id,
                thread_ts,
                "スレッドが見つかりません。"
              );
              return;
            }

            const threadCreatorId = messages[0].user;
            const participantIds = Array.from(
              new Set(messages.map((msg) => msg.user))
            );
            const threadTimestamp = messages[0].ts;

            const threadId = thread_ts;
            const [isStored, channelName, userNames] = await Promise.all([
              isThreadStored(notionToken, notionDatabaseId, threadId),
              getChannelName(slackToken, channel_id).then((name) => `#${name}`),
              getUserNames(slackToken, participantIds),
            ]);

            if (isStored) {
              await sendErrorMessageToSlack(
                slackToken,
                channel_id,
                thread_ts,
                "このスレッドは既に保存されています。"
              );
              return;
            }

            const threadCreator = userNames.find(
              (user) => user.userId === threadCreatorId
            )?.userName.replace(/,/g, " ");

            const participantNames = userNames.map((user) => user.userName.replace(/,/g, " "));
            const threadDate = new Date(parseFloat(threadTimestamp) * 1000);
            const formattedTimestamp = thread_ts.replace(".", "");
            const threadUrl = `${slackWorkspaceUrl}/archives/${channel_id}/p${formattedTimestamp}`;
            const threadContent = messages.map((msg) => msg.text).join("\n");

            const {
              shortSummary,
              longSummary,
              tags,
              bulletPoints,
              nextAction,
              conclusion,
            } = await generateSummaryAndTags(openaiApiKey, threadContent);

            const notionPageId = await saveThreadToNotion({
              notionToken,
              notionDatabaseId,
              title: messages[0].text || "No Title",
              threadCreator: threadCreator || "Unknown",
              participantNames,
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
              return;
            }

            const notionPageUrl = `https://www.notion.so/${notionPageId.replace(
              /-/g,
              ""
            )}`;

            const postMessageResult = await postMessageToSlack(
              slackToken,
              channel_id,
              thread_ts,
              `スレッドの情報をNotionに保存しました。\n${notionPageUrl}`
            );

            if (!postMessageResult.ok) {
              console.error("Slack API error:", postMessageResult.error);
              await sendErrorMessageToSlack(
                slackToken,
                channel_id,
                thread_ts,
                "Slackへのメッセージ送信中にエラーが発生しました。"
              );
              return;
            }
          } catch (error) {
            console.error("Error occurred:", error);
            await sendErrorMessageToSlack(
              slackToken,
              channel_id,
              thread_ts,
              "エラーが発生しました。"
            );
          }
        })()
      );

      return c.json({ status: "processing" });
    } else {
      return c.json({
        status: "error",
        message: "サポートされていないイベントタイプです。",
      });
    }
  } else {
    return c.json({
      status: "error",
      message: "サポートされていないイベントタイプです。",
    });
  }
});

export default app;
