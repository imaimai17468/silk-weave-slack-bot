export type SlackMessage = {
  type: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  [key: string]: any;
}

export type SlackConversationsRepliesResponse = {
  ok: boolean;
  messages: SlackMessage[];
  has_more?: boolean;
  [key: string]: any;
}

export type SlackChatPostMessageResponse = {
  ok: boolean;
  channel: string;
  ts: string;
  message: SlackMessage;
  [key: string]: any;
}
