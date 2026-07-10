"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { CHATBOT } from "@/lib/config/site";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const val = ref.current?.value.trim();
    if (!val || disabled) return;
    onSend(val);
    if (ref.current) ref.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 bg-surface-card">
      <textarea
        ref={ref}
        rows={1}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={`Ask ${CHATBOT.name} anything`}
        className="flex-1 resize-none bg-surface-input px-4 py-2.5 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] max-h-28 overflow-y-auto transition-all"
      />
      <button
        onClick={submit}
        disabled={disabled}
        aria-label="Send message"
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-primary text-primary-on transition-opacity duration-300 hover:opacity-90 disabled:opacity-40"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
