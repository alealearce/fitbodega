"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { CHATBOT } from "@/lib/config/site";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const sessionId = useRef<string>("");
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current =
        Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    }
  }, []);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: CHATBOT.greeting },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          sessionId: sessionId.current,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? "Something went wrong. Try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Trouble connecting. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={`Open ${CHATBOT.name} chat`}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-primary text-primary-on hover:opacity-90 transition-opacity duration-300"
        >
          <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col bg-surface-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{
            width: "400px",
            height: "520px",
            maxWidth: "calc(100vw - 2rem)",
            boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 bg-bg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary text-primary-on flex items-center justify-center flex-shrink-0 font-sans font-extrabold text-sm">
                {CHATBOT.avatar}
              </div>
              <div>
                <p className="font-sans text-label-md uppercase text-on-surface leading-tight">
                  {CHATBOT.name}
                </p>
                <p className="font-sans text-xs text-on-surface-variant leading-tight">
                  FitBodega concierge
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-on-surface-variant hover:text-primary transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-bg">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="flex-shrink-0 w-7 h-7 bg-primary text-primary-on flex items-center justify-center font-sans font-extrabold text-xs">
                  {CHATBOT.avatar}
                </div>
                <div className="bg-surface-low px-4 py-3 flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-on-surface-variant animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-on-surface-variant animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-on-surface-variant animate-bounce" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
      )}
    </>
  );
}
