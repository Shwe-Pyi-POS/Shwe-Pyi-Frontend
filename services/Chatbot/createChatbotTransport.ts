import { TextStreamChatTransport, type UIMessage } from "ai";
import type { ChatbotResponse } from "./chatbotTypes";

const getChatbotApiUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/chatbot`;
};

const getLastUserMessageText = (messages: UIMessage[]) => {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return "";

  return lastMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
};

export const createChatbotTransport = () =>
  new TextStreamChatTransport({
    api: getChatbotApiUrl(),
    prepareSendMessagesRequest: ({ messages }) => ({
      body: { message: getLastUserMessageText(messages) },
    }),
    fetch: async (url, init) => {
      const token = localStorage.getItem("authToken");
      const headers = new Headers(init?.headers);

      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(url, {
        ...init,
        headers,
      });

      if (!response.ok) {
        return response;
      }

      const json = (await response.json()) as ChatbotResponse;

      if (!json.success || !json.data?.reply) {
        throw new Error(json.message || "Failed to get a response from AI.");
      }

      return new Response(json.data.reply, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    },
  });
