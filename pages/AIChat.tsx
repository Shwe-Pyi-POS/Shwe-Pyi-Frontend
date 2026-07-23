import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { createChatbotTransport } from "../services/Chatbot/createChatbotTransport";
import { ChatMarkdown } from "../components/Chat/ChatMarkdown";

const getMessageText = (parts: { type: string; text?: string }[]) =>
  parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("");

export const AIChat: React.FC = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(() => createChatbotTransport(), []);

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport,
    onError: (err) => {
      toast.error(err.message || t("aiChat.error"));
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    await sendMessage({ parts: [{ type: "text", text }] });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success(t("aiChat.cleared"));
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {t("aiChat.title")}
                </h1>
                <p className="text-sm text-slate-500">{t("aiChat.subtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearChat}
              disabled={messages.length === 0 && !isLoading}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("aiChat.clearChat")}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-240px)] min-h-[420px]">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.length === 0 && !isLoading && (
                <div className="text-center text-slate-500 mt-16 sm:mt-20">
                  <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {t("aiChat.emptyTitle")}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    {t("aiChat.emptyDescription")}
                  </p>
                </div>
              )}

              {messages.map((message) => {
                const text = getMessageText(message.parts);
                if (!text) return null;

                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 flex flex-col ${
                        isUser
                          ? "bg-primary text-white shadow-lg"
                          : "bg-white text-slate-800 border border-gray-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        {!isUser && (
                          <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        )}
                        <span className="text-xs opacity-70">
                          {isUser
                            ? t("aiChat.userLabel")
                            : t("aiChat.assistantLabel")}
                        </span>
                      </div>
                      {isUser ? (
                        <span className="text-sm whitespace-pre-wrap leading-relaxed">
                          {text}
                        </span>
                      ) : (
                        <ChatMarkdown content={text} />
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white text-slate-800 border border-gray-200 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-slate-500">
                      {t("aiChat.thinking")}
                    </span>
                  </div>
                </div>
              )}

              {error && !isLoading && (
                <p className="text-sm text-red-600 text-center">{error.message}</p>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-3 bg-gray-50 rounded-xl p-2 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("aiChat.placeholder")}
                  className="flex-1 outline-none bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  aria-label={t("aiChat.send")}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                {t("aiChat.sendHint")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
