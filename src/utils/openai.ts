import {
  OpenAIChatCompletionResponse,
  OpenAIErrorResponse,
} from "../types/openai";

// 要約とタグを生成する関数
export const generateSummaryAndTags = async (
  apiKey: string,
  content: string
): Promise<{
  shortSummary: string;
  longSummary: string;
  tags: string[];
  bulletPoints: string[];
  nextAction: string;
  conclusion: string;
}> => {
  try {
    const prompt = `
以下のSlackスレッドの内容を分析し、以下の情報を生成してください：

1. スレッドの短い要約（日本語、100文字以内）
2. スレッドの詳細な要約（日本語、300文字程度）
3. 結論（日本語、150文字程度）
4. スレッドから抽出した3つのタグ（キーワード）
5. 簡潔な3つの箇条書きポイント
6. NextAction（次に取るべき行動）。必要ない場合は「NextActionは必要ありません」としてください。

出力は以下のJSON形式でお願いします：

{
  "shortSummary": "短い要約テキスト（100文字以内）",
  "longSummary": "詳細な要約テキスト（300文字程度）",
  "conclusion": "結論テキスト（150文字程度）",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "bulletPoints": ["ポイント1", "ポイント2", "ポイント3"],
  "nextAction": "NextActionの内容または「NextActionは必要ありません」"
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
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 900,
        temperature: 0.4,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "SummaryAndTags",
            schema: {
              type: "object",
              properties: {
                shortSummary: { type: "string" },
                longSummary: { type: "string" },
                conclusion: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                bulletPoints: { type: "array", items: { type: "string" } },
                nextAction: { type: "string" },
              },
              required: [
                "shortSummary",
                "longSummary",
                "tags",
                "bulletPoints",
                "nextAction",
              ],
            },
          },
        },
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
    let result;
    try {
      result = JSON.parse(assistantMessage);
    } catch (parseError) {
      console.error("Failed to parse assistant message:", assistantMessage);
      throw new Error("Failed to parse assistant message");
    }

    return {
      shortSummary: result.shortSummary,
      longSummary: result.longSummary,
      tags: result.tags,
      bulletPoints: result.bulletPoints,
      nextAction: result.nextAction,
      conclusion: result.conclusion,
    };
  } catch (error) {
    console.error("Error generating summary and tags:", error);
    throw new Error("Error generating summary and tags");
  }
};
