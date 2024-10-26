import {
  SlackChatPostMessageResponse,
  SlackUserInfoResponse,
} from "../types/slack";

export const sendErrorMessageToSlack = async (
  slackToken: string,
  channel_id: string,
  thread_ts: string,
  errorMessage: string
): Promise<void> => {
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${slackToken}`,
    },
    body: JSON.stringify({
      channel: channel_id,
      thread_ts: thread_ts,
      text: `エラーが発生しました: ${errorMessage}`,
    }),
  });
};

export const postMessageToSlack = async (
  slackToken: string,
  channel_id: string,
  thread_ts: string,
  text: string
): Promise<SlackChatPostMessageResponse> => {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${slackToken}`,
    },
    body: JSON.stringify({
      channel: channel_id,
      thread_ts: thread_ts,
      text: text,
    }),
  });

  return (await response.json()) as SlackChatPostMessageResponse;
};

export const getUserNames = async (
  slackToken: string,
  userIds: string[]
): Promise<{ userId: string; userName: string }[]> => {
  const userNamePromises = userIds.map(async (userId) => {
    const userInfoResponse = await fetch(
      `https://slack.com/api/users.info?user=${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${slackToken}`,
        },
      }
    );

    const userInfoResult =
      (await userInfoResponse.json()) as SlackUserInfoResponse;

    if (userInfoResult.ok && userInfoResult.user) {
      const realName = userInfoResult.user.profile.real_name || "Unknown User";
      return { userId, userName: realName };
    } else {
      console.error(
        `Failed to get user info for ${userId}:`,
        userInfoResult.error
      );
      return { userId, userName: "Unknown User" };
    }
  });

  return await Promise.all(userNamePromises);
};

export const getChannelName = async (
  slackToken: string,
  channelId: string
): Promise<string> => {
  const response = await fetch(
    `https://slack.com/api/conversations.info?channel=${channelId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${slackToken}`,
      },
    }
  );

  const data = (await response.json()) as {
    ok: boolean;
    channel?: {
      id: string;
      name: string;
      [key: string]: any;
    };
    error?: string;
  };

  if (data.ok && data.channel) {
    return data.channel.name;
  } else {
    console.error("Failed to get channel info:", data.error);
    return "Unknown Channel";
  }
}
