// エラーメッセージをSlackに送信する関数
export const sendErrorMessageToSlack = async (
  slackToken: string,
  channel_id: string,
  thread_ts: string,
  errorMessage: string
) => {
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
