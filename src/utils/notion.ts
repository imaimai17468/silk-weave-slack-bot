import { SlackConversationsRepliesResponse } from "../types/slack";
import { SaveThreadToNotionParams } from "../types/notion";

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
): Promise<boolean> {
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
    summary,
    tags,
    bulletPoints,
    nextAction,
  } = params;

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
          rich_text: [
            {
              text: {
                content: threadCreator,
              },
            },
          ],
        },
        Participants: {
          multi_select: participantNames.map((name) => ({ name })),
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
                content: summary,
              },
            },
          ],
        },
        Tags: {
          multi_select: tags.map((tag) => ({ name: tag })),
        },
      },
      children: [
        {
          object: "block",
          type: "bulleted_list",
          bulleted_list: bulletPoints.map((point) => ({
            type: "bulleted_list_item",
            bulleted_list_item: {
              text: [
                {
                  type: "text",
                  text: {
                    content: point,
                  },
                },
              ],
            },
          })),
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            text: [
              {
                type: "text",
                text: {
                  content: summary,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            text: [
              {
                type: "text",
                text: {
                  content: "Next Action",
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            text: [
              {
                type: "text",
                text: {
                  content: nextAction,
                },
              },
            ],
          },
        },
      ],
    }),
  });

  const notionResult = await notionResponse.json();

  if (!notionResponse.ok) {
    console.error("Notion API error:", notionResult);
    return false;
  }

  return true;
}
