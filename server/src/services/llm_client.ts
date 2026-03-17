import { GoogleGenerativeAI } from "@google/generative-ai";

type GenerateJsonParams = {
  systemPrompt: string;
  userPrompt: string;
};

class LLMClient {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly modelName: string;

  constructor() {
    this.timeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? "12000");
    this.maxRetries = Number(process.env.LLM_MAX_RETRIES ?? "2");
    this.modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  }

  async generateJson<T>({ systemPrompt, userPrompt }: GenerateJsonParams): Promise<T> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing GOOGLE_GEMINI_API_KEY");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: this.modelName });

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await Promise.race([
          model.generateContent({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("LLM request timeout")), this.timeoutMs);
          }),
        ]);

        return JSON.parse(response.response.text()) as T;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to get LLM response");
  }
}

export default new LLMClient();
