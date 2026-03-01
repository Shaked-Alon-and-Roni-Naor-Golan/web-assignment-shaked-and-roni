import { Request, response, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const enhanceReview = async (req: Request, res: Response) => {
  try {
    const { reviewContent } = req.body;

    if (!reviewContent) {
      return res.status(400).send("Review content is required");
    }

    const prompt = `You are a social media writing assistant. Your task is to enhance the following review/post to make it more engaging, polished, and socially appealing while preserving the original meaning and tone.

Guidelines:
- Improve grammar, spelling, and sentence structure
- Make the language more vivid and expressive
- Keep it concise and easy to read
- Add a friendly, approachable tone suitable for social media
- Add 2-4 relevant hashtags at the end of the text

Original text: "${reviewContent}"

Respond ONLY with a JSON object in this exact format: {"text": "your enhanced version here"}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const textToReturn = JSON.parse(result.response.text()).text;

    res.send(textToReturn);
  } catch (error) {
    console.error("Error enhancing review:", error.message);
    console.error("Full error:", error);
    res.status(500).send(`Failed to enhance review: ${error.message}`);
  }
};