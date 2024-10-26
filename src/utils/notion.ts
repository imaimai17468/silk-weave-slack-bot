import { SlackConversationsRepliesResponse } from "../types/slack";

export const isMessageStored = async (
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
