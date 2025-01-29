import { streamText, Message } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { suggestionPrompt } from "@/data/ngo-connect";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const runtime = "edge";

const generateId = () => Math.random().toString(36).slice(2, 15);

const buildGoogleGenAIPrompt = (question) => [
  {
    id: generateId(),
    role: "user",
    content: suggestionPrompt.content
  },
  {
    id: question.id || generateId(),
    role: question.role,
    content: question.content,
  },
].map(msg => ({
  id: msg.id,
  role: msg.role,
  content: msg.content,
}));

export async function POST(request) {
  const { question } = await request.json();
  const messages = [{ role: "user", content: question }];
  const stream = await streamText({
    model: google("gemini-1.5-pro"),
    messages: buildGoogleGenAIPrompt(messages),
    temperature: 0.5,
  });

  const response = stream?.toDataStreamResponse();
  const result = Array.isArray(response) ? response.join(' ') : response;

  return new Response(result);
}