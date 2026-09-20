"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Moon,
  Sun,
  Laptop,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { Button } from "../ui/Button";

interface TopbarProps {
  onOpenUpload: () => void;
  onOpenCommandPalette: () => void;
}

export function Topbar({ onOpenUpload, onOpenCommandPalette }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [statusOpen, setStatusOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  // Derive breadcrumb & page title
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/search")) return "Search";
    if (pathname.startsWith("/library")) return "Library";
    if (pathname.startsWith("/collections")) return "Collections";
    if (pathname.startsWith("/timeline")) return "Timeline";
    if (pathname.startsWith("/duplicates")) return "Duplicates";
    if (pathname.startsWith("/evaluation")) return "ML Benchmark";
    if (pathname.startsWith("/settings")) return "Settings";
    return "VisualSearch Memory";
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Page Title / Breadcrumb */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
          Workspace
        </span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
        <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Global Search Trigger (⌘K) */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-3 px-3 py-1.5 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs cursor-pointer min-w-[200px] justify-between group"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="truncate">Search memories...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Quick Import CTA */}
        <Button
          onClick={onOpenUpload}
          variant="primary"
          size="sm"
          className="h-9 shadow-xs"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Import</span>
        </Button>

        {/* System Status Indicator / Popover */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="System & AI Model Status"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium hidden md:inline">Ready</span>
          </button>

          {statusOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl z-50 animate-fade-in text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                <span className="text-xs font-bold">AI System Status</span>
                <span className="text-[10px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Operational
                </span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Embedding Model</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    OpenCLIP ViT-B-32
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">OCR Engine</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    Tesseract 5.5 / Paddle
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Vector Index</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    Qdrant HNSW
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Keyword Index</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    BM25+ Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Database</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    SQLite / Postgres
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Dark / Light / System) */}
        <div className="relative">
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-indigo-400" />
            ) : theme === "light" ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Laptop className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {themeMenuOpen && (
            <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-xl z-50 animate-fade-in space-y-0.5">
              {[
                { id: "dark", label: "Dark", icon: Moon },
                { id: "light", label: "Light", icon: Sun },
                { id: "system", label: "System", icon: Laptop },
              ].map((t) => {
                const Icon = t.icon;
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id as any);
                      setThemeMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
