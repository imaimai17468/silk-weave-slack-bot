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
  summary: string;
  tags: string[];
  bulletPoints: string[];
  nextAction: string;
};
