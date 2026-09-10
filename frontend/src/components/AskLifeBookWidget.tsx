import React, { useState } from "react";
import { Sparkles, X, Send, CheckCircle2, Clock, Calendar, ChevronRight } from "lucide-react";
import { api } from "../services/api";
import { ForgettingItem } from "../types";

interface Message {
  sender: "ai" | "user";
  text: string;
  forgettingItems?: ForgettingItem[];
  sourceEntryId?: string;
}

export const AskLifeBookWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hi Arun! ?? What would you like to remember today?"
    }
  ]);

  const quickQuestions = [
    "What am I forgetting?",
    "When did I last meet Ravi?",
    "Show my Madurai trips.",
    "What food do I usually eat on Fridays?",
    "Read today's diary."
  ];

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim()) return;
    const userMsg = textToAsk.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setQuery("");
    setLoading(true);

    try {
      if (userMsg.toLowerCase().includes("forgetting")) {
        const res = await api.whatAmIForgetting();
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.headline || "You have 3 things worth checking:",
            forgettingItems: res.items
          }
        ]);
      } else {
        const res = await api.askQuestion(userMsg);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.answer,
            sourceEntryId: res.source_entry_id
          }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I couldn't complete that search right now. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCommitment = async (item: ForgettingItem) => {
    try {
      await api.completeCommitment(item.id);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `? Marked "${item.title}" as Done in your database.`
        }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#18181b] text-white shadow-2xl hover:bg-black transition-all hover:scale-105 border border-zinc-700"
      >
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-bold">Ask LifeBook</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 sm:w-88 bg-[#18181b] text-zinc-100 rounded-2xl shadow-2xl border border-zinc-700/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#27272a] border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold tracking-wide">Ask LifeBook</h4>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-700/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="p-3.5 max-h-80 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-xl max-w-[90%] leading-relaxed ${
                m.sender === "user"
                  ? "bg-emerald-700 text-white font-medium"
                  : "bg-zinc-800/90 text-zinc-200 border border-zinc-700/60"
              }`}
            >
              {m.text}
            </div>

            {/* Render Forgetting Items Cards if present */}
            {m.forgettingItems && m.forgettingItems.length > 0 && (
              <div className="w-full mt-2 space-y-2">
                {m.forgettingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-semibold text-emerald-400">
                        {item.title}
                      </span>
                      {item.due_date && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40 shrink-0">
                          {item.due_date}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-2">{item.description}</p>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800">
                      <button
                        onClick={() => handleCompleteCommitment(item)}
                        className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-[10px] font-semibold border border-emerald-700/50 transition-colors"
                      >
                        Done
                      </button>
                      <button
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-medium border border-zinc-700 transition-colors"
                      >
                        Reschedule
                      </button>
                      <button
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-[10px] font-medium border border-zinc-700 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs italic">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Searching your memories...</span>
          </div>
        )}
      </div>

      {/* Suggested Query Buttons */}
      <div className="px-3 py-2 bg-zinc-900/60 border-t border-zinc-800 flex flex-wrap gap-1.5">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(q)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 border border-zinc-700/80 transition-colors"
          >
            <ChevronRight className="w-3 h-3 text-emerald-400" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-2.5 bg-[#27272a] border-t border-zinc-700/50 flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk(query)}
          placeholder="Ask anything..."
          className="flex-1 bg-zinc-800 text-white placeholder-zinc-400 text-xs px-3 py-2 rounded-xl border border-zinc-600 focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={() => handleAsk(query)}
          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
