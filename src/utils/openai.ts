import {
  OpenAIChatCompletionResponse,
  OpenAIErrorResponse,
} from "../types/openai";

// 要約とタグを生成する関数
export const generateSummaryAndTags = async (
  apiKey: string,
  content: string
): Promise<{
  summary: string;
  tags: string[];
  bulletPoints: string[];
  nextAction: string;
}> => {
  const prompt = `
以下のSlackスレッドの内容を分析し、以下の情報を生成してください：

1. スレッドの要約（日本語、100文字以内）
2. スレッドから抽出した3つのタグ（キーワード）
3. 簡潔な3つの箇条書きポイント
4. NextAction（次に取るべき行動）

出力は以下のJSON形式でお願いします：

{
  "summary": "要約テキスト",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "bulletPoints": ["ポイント1", "ポイント2", "ポイント3"],
  "nextAction": "NextActionの内容"
}

スレッド内容：
${content}
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = (await response.json()) as
    | OpenAIChatCompletionResponse
    | OpenAIErrorResponse;

  if (!response.ok) {
    const errorData = data as OpenAIErrorResponse;
    throw new Error(`OpenAI API error: ${errorData.error.message}`);
  }

  const chatData = data as OpenAIChatCompletionResponse;
  const assistantMessage = chatData.choices[0].message.content;
  
  // レスポンスからJSONを抽出
  const result = JSON.parse(assistantMessage);

  return {
    summary: result.summary,
    tags: result.tags,
    bulletPoints: result.bulletPoints,
    nextAction: result.nextAction,
  };
};
