export type SlackMessage = {
  type: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  [key: string]: any;
}

export type SlackEvent = {
  type: string;
  challenge?: string;
  event: {
    type: string;
    channel: string;
    thread_ts?: string;
    ts: string;
  };
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

export interface SlackUserInfoResponse {
  ok: boolean;
  user?: {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    color?: string;
    real_name: string;
    tz?: string;
    tz_label?: string;
    tz_offset?: number;
    profile: {
      avatar_hash?: string;
      status_text?: string;
      status_emoji?: string;
      real_name?: string;
      display_name?: string;
      real_name_normalized?: string;
      display_name_normalized?: string;
      email?: string;
      image_original?: string;
      image_24?: string;
      image_32?: string;
      image_48?: string;
      image_72?: string;
      image_192?: string;
      image_512?: string;
      team?: string;
      [key: string]: any; // その他のプロパティを許容
    };
    is_admin?: boolean;
    is_owner?: boolean;
    is_primary_owner?: boolean;
    is_restricted?: boolean;
    is_ultra_restricted?: boolean;
    is_bot?: boolean;
    is_app_user?: boolean;
    updated?: number;
    has_2fa?: boolean;
    locale?: string;
    [key: string]: any; // その他のプロパティを許容
  };
  error?: string;
  [key: string]: any; // その他のプロパティを許容
}
