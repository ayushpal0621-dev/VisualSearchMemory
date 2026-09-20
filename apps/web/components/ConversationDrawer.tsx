"use client";

import { useState, useRef, useEffect } from "react";
import { sendConversationalSearch, getImageUrl } from "@/lib/api";
import { SearchResultItem } from "@/types";
import { X, Send, Bot, User, Sparkles, Loader2, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  results?: SearchResultItem[];
}

interface ConversationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: any) => void;
}

export default function ConversationDrawer({
  isOpen,
  onClose,
  onSelectImage,
}: ConversationDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your AI Visual Memory Assistant. Ask me things like \"Show AWS images\", \"Only screenshots\", or \"Find Python Dijkstra code\".",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery.trim();
    setInputQuery("");

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const historyPayload = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await sendConversationalSearch({
        messages: historyPayload,
        current_query: userText,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.assistant_reply,
          results: response.search_response?.results || [],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue retrieving visual memories. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Conversational Visual Memory</h3>
            <p className="text-[11px] text-slate-400">Context-aware multi-turn retrieval</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-sky-600 text-white rounded-br-none"
                  : "bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none"
              }`}
            >
              {m.content}
            </div>

            {/* Results Grid inline */}
            {m.results && m.results.length > 0 && (
              <div className="w-full mt-2 grid grid-cols-2 gap-2">
                {m.results.slice(0, 4).map((r) => (
                  <div
                    key={r.image.id}
                    onClick={() => onSelectImage(r.image)}
                    className="group relative cursor-pointer bg-slate-950 rounded-lg overflow-hidden border border-slate-800 hover:border-sky-500 transition-all shadow"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-900">
                      <img
                        src={getImageUrl(r.image.id)}
                        alt={r.image.original_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-1.5 text-[10px]">
                      <p className="font-medium text-slate-300 truncate">{r.image.original_name}</p>
                      <p className="text-sky-400 font-semibold">{Math.round(r.score * 100)}% match</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2.5 rounded-xl w-fit">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            Analyzing query context & retrieving...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask your visual memory..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="absolute right-1.5 p-1.5 text-indigo-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
