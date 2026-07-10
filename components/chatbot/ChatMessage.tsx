"use client";

import { CHATBOT } from "@/lib/config/site";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div
      className={`flex items-end gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Coach avatar — only for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 bg-primary text-primary-on flex items-center justify-center font-sans font-extrabold text-xs">
          {CHATBOT.avatar}
        </div>
      )}

      <div
        className={`max-w-[80%] px-4 py-2.5 font-sans text-sm leading-relaxed ${
          isUser
            ? "bg-surface-input text-on-surface"
            : "bg-surface-low text-on-surface"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
