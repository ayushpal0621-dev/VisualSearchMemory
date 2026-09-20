"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Image as ImageIcon,
  FolderKanban,
  CalendarDays,
  Copy,
  Gauge,
  Settings,
  Sparkles,
  ArrowRight,
  X,
  History,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Search Memories", href: "/search", icon: Search },
    { label: "Asset Library", href: "/library", icon: ImageIcon },
    { label: "Visual Collections", href: "/collections", icon: FolderKanban },
    { label: "Timeline", href: "/timeline", icon: CalendarDays },
    { label: "Duplicate Detection", href: "/duplicates", icon: Copy },
    { label: "ML Benchmark", href: "/evaluation", icon: Gauge },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const suggestedQueries = [
    "AWS serverless architecture",
    "Python Dijkstra algorithm code",
    "PostgreSQL database diagram",
    "Handwritten DSA notes",
    "Conference presentation slides",
    "Red sports car photo",
  ];

  const handleExecuteSearch = (searchQuery: string) => {
    onClose();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&mode=hybrid`);
  };

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-slide-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-4.5 w-4.5 text-indigo-500 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search memories, keywords, or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                handleExecuteSearch(query.trim());
              }
            }}
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results / Navigation Body */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-4 text-xs">
          {/* If user typed a query, offer to execute search immediately */}
          {query.trim() && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Execute Natural-Language Search
              </div>
              <button
                onClick={() => handleExecuteSearch(query)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span>Search for &ldquo;{query}&rdquo;</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Quick Suggestions */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sample Semantic Queries
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {suggestedQueries.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleExecuteSearch(sq)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left truncate cursor-pointer"
                >
                  <History className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{sq}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Navigation Pages */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Navigation
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {quickNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-center gap-1.5"
                  >
                    <Icon className="h-4 w-4 text-indigo-500" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px]">
              ENTER
            </kbd>{" "}
            to select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px]">
              ESC
            </kbd>{" "}
            to dismiss
          </span>
        </div>
      </div>
    </div>
  );
}
