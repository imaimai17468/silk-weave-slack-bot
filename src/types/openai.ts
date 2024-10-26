export type OpenAIChatCompletionResponse = {
  id: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type OpenAIErrorResponse = {
  error: {
    message: string;
    type: string;
    param: any;
    code: string | null;
  };
}
