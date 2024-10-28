import { SlackConversationsRepliesResponse } from "../types/slack";
import {
  SaveThreadToNotionParams,
  NotionPageCreateResponse,
} from "../types/notion";

export const isThreadStored = async (
  notionToken: string,
  databaseId: string,
  messageId: string
): Promise<boolean> => {
  const searchResponse = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          property: "Message ID",
          rich_text: {
            equals: messageId,
          },
        },
      }),
    }
  );

  const searchResult: SlackConversationsRepliesResponse =
    await searchResponse.json();

  return searchResult.results && searchResult.results.length > 0;
};

export async function saveThreadToNotion(
  params: SaveThreadToNotionParams
): Promise<string | null> {
  const {
    notionToken,
    notionDatabaseId,
    title,
    threadCreator,
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
  } = params;

  // childrenBlocks を一度に定義
  const childrenBlocks = [
    // 概要
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "概要",
            },
          },
        ],
      },
    },
    // 長い要約をパラグラフブロックとして追加
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: shortSummary,
            },
          },
        ],
      },
    },
    // "内容" の見出しを追加
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "内容",
            },
          },
        ],
      },
    },
    // 長い要約をパラグラフブロックとして追加
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: longSummary,
            },
          },
        ],
      },
    },
    // "ポイント" の見出しを追加
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "ポイント",
            },
          },
        ],
      },
    },
    // 箇条書きポイントを `bulleted_list_item` ブロックとして追加
    ...bulletPoints.map((point) => ({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            text: {
              content: point,
            },
          },
        ],
      },
    })),
    // 結論の見出しを追加
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "結論",
            },
          },
        ],
      },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: conclusion,
            },
          },
        ],
      },
    },
    // "Next Action" の見出しを追加
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "Next Action",
            },
          },
        ],
      },
    },
    // NextActionをパラグラフブロックとして追加
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: nextAction,
            },
          },
        ],
      },
    },
  ];

  // Notion APIにページを作成
  const notionResponse = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: notionDatabaseId },
      properties: {
        Title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        "Thread Creator": {
          select: { name: threadCreator },
        },
        Participants: {
          multi_select: participantNames.map((name: string) => ({ name })),
        },
        "Reply Count": {
          number: replyCount,
        },
        "Thread Date": {
          date: {
            start: threadDate.toISOString(),
          },
        },
        "Thread ID": {
          rich_text: [
            {
              text: {
                content: threadId,
              },
            },
          ],
        },
        "Thread URL": {
          url: threadUrl,
        },
        Summary: {
          rich_text: [
            {
              text: {
                content: shortSummary,
              },
            },
          ],
        },
        Tags: {
          multi_select: tags.map((tag: string) => ({ name: tag })),
        },
        "Channel Name": {
          select: { name: channelName },
        },
      },
      children: childrenBlocks,
    }),
  });

  const notionResult: NotionPageCreateResponse = await notionResponse.json();

  if (!notionResponse.ok) {
    console.error("Notion API error:", notionResult);
    return null;
  }

  const pageId = notionResult.id;
  return pageId;
}
