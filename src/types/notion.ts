export type SaveThreadToNotionParams = {
  notionToken: string;
  notionDatabaseId: string;
  title: string;
  threadCreator: string;
  participantNames: string[];
  replyCount: number;
  threadDate: Date;
  threadId: string;
  threadUrl: string;
  shortSummary: string;
  longSummary: string;
  tags: string[];
  bulletPoints: string[];
  nextAction: string;
  channelName: string;
};

export type NotionPageCreateResponse = {
  object: string;
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: {
    object: string;
    id: string;
  };
  last_edited_by: {
    object: string;
    id: string;
  };
  cover: null | any;
  icon: null | any;
  parent: any;
  archived: boolean;
  properties: any;
  url: string;
};
