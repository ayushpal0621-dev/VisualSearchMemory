"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  Filter,
  Info,
  Loader2,
  ArrowRight,
  Eye,
  X,
  MessageSquare,
  Send,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Grid3X3,
  Columns,
  Check,
  Tag,
  Clock,
  HelpCircle,
} from "lucide-react";
import { performSearch, findSimilarImages, fetchCollections, sendConversationalSearch, getImageUrl } from "@/lib/api";
import { SearchResponse, SearchResultItem, CollectionItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import ImageDetailModal from "@/components/ImageDetailModal";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialMode = searchParams.get("mode") || "hybrid";
  const similarImageId = searchParams.get("image_id");

  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<string>(initialMode);
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  // Retrieval Weights & Density
  const [semanticWeight, setSemanticWeight] = useState(0.6);
  const [keywordWeight, setKeywordWeight] = useState(0.3);
  const [metadataWeight, setMetadataWeight] = useState(0.1);
  const [density, setDensity] = useState<"compact" | "comfortable" | "large">("comfortable");
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "oldest">("relevance");

  // Filters
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedMimeType, setSelectedMimeType] = useState<string>("");
  const [hasOCR, setHasOCR] = useState<boolean | undefined>(undefined);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Results & Modals
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [explainModalItem, setExplainModalItem] = useState<SearchResultItem | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  // Conversational Assistant Drawer
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I can help you filter and explore your visual memories. Try queries like 'Show AWS images', 'Only screenshots', or 'From 2025'.",
    },
  ]);
  const [assistantInput, setAssistantInput] = useState("");
  const [interpretedFilters, setInterpretedFilters] = useState<Array<{ id: string; label: string; value: string }>>([]);

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections().then(setCollections).catch(console.error);

    if (similarImageId) {
      setLoading(true);
      findSimilarImages(similarImageId)
        .then(setResponse)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (initialQuery) {
      executeSearch(initialQuery, initialMode);
    }
  }, [initialQuery, initialMode, similarImageId]);

  const executeSearch = async (q = query, mode = searchMode) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedCollection) filters.collection_id = selectedCollection;
      if (selectedMimeType) filters.mime_types = [selectedMimeType];
      if (hasOCR !== undefined) filters.has_ocr = hasOCR;
      if (similarityThreshold > 0) filters.similarity_threshold = similarityThreshold;
      if (dateFrom) filters.date_from = new Date(dateFrom).toISOString();
      if (dateTo) filters.date_to = new Date(dateTo).toISOString();

      const res = await performSearch({
        query: q.trim(),
        search_mode: mode,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        weights: {
          semantic: semanticWeight,
          keyword: keywordWeight,
          metadata: metadataWeight,
        },
        limit: 30,
      });

      setResponse(res);

      // Extract mock/real interpreted filters for conversational UI
      const mockInterpreted: Array<{ id: string; label: string; value: string }> = [];
      const lower = q.toLowerCase();
      if (lower.includes("aws")) mockInterpreted.push({ id: "kw-aws", label: "Keyword", value: "AWS" });
      if (lower.includes("lambda")) mockInterpreted.push({ id: "kw-lambda", label: "Keyword", value: "Lambda" });
      if (lower.includes("python")) mockInterpreted.push({ id: "kw-python", label: "Keyword", value: "Python" });
      if (lower.includes("screenshot")) mockInterpreted.push({ id: "type-screenshot", label: "Content", value: "Screenshot" });
      if (lower.includes("code")) mockInterpreted.push({ id: "type-code", label: "Content", value: "Source Code" });
      if (lower.includes("diagram")) mockInterpreted.push({ id: "type-diagram", label: "Content", value: "Diagram" });
      if (lower.includes("2025")) mockInterpreted.push({ id: "year-2025", label: "Date", value: "2025" });
      if (lower.includes("2026")) mockInterpreted.push({ id: "year-2026", label: "Date", value: "2026" });
      setInterpretedFilters(mockInterpreted);
    } catch (err) {
      console.error("Search execution failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantSend = async () => {
    if (!assistantInput.trim()) return;
    const userText = assistantInput.trim();
    setAssistantInput("");

    const newMsgs = [...conversationMessages, { role: "user", content: userText }];
    setConversationMessages(newMsgs);

    try {
      setLoading(true);
      const res = await sendConversationalSearch({
        messages: newMsgs,
        current_query: userText,
      });

      setConversationMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.assistant_reply || `Found ${res.search_response?.total_found || 0} matching visual memories.` },
      ]);

      if (res.search_response) {
        setResponse(res.search_response);
      }
    } catch (err) {
      setConversationMessages((prev) => [
        ...prev,
        { role: "assistant", content: `I encountered an issue executing conversational search. Refined your search directly.` },
      ]);
      executeSearch(userText);
    } finally {
      setLoading(false);
    }
  };

  const removeInterpretedFilter = (id: string) => {
    setInterpretedFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleSelectCard = (id: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedCollection("");
    setSelectedMimeType("");
    setHasOCR(undefined);
    setSimilarityThreshold(0.0);
    setDateFrom("");
    setDateTo("");
    setSemanticWeight(0.6);
    setKeywordWeight(0.3);
    setMetadataWeight(0.1);
  };

  const activeFilterCount =
    (selectedCollection ? 1 : 0) +
    (selectedMimeType ? 1 : 0) +
    (hasOCR !== undefined ? 1 : 0) +
    (similarityThreshold > 0 ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  // Sorting
  const sortedResults = useMemo(() => {
    if (!response?.results) return [];
    const list = [...response.results];
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.image.created_at).getTime() - new Date(a.image.created_at).getTime());
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.image.created_at).getTime() - new Date(b.image.created_at).getTime());
    }
    return list;
  }, [response, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Search Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold shadow-2xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Multimodal Hybrid Retrieval Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Search your visual memory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Dense OpenCLIP embeddings paired with BM25+ OCR keyword retrieval and explainable ranking.
        </p>
      </div>

      {/* Centerpiece Search Bar Card */}
      <div className="max-w-3xl mx-auto">
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md transition-all space-y-3">
          {/* Main Input Field */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-indigo-500 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Find screenshots about AWS Lambda from last semester..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && executeSearch()}
              className="w-full h-13 pl-12 pr-32 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20 transition-all shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-24 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              onClick={() => executeSearch()}
              disabled={loading || !query.trim()}
              variant="primary"
              size="sm"
              className="absolute right-2 h-9 px-4 font-semibold shadow-xs"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* Search Modes & Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
            {/* 3 Search Modes */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              {[
                { id: "hybrid", label: "Hybrid Search", icon: Sparkles, badge: "Default" },
                { id: "semantic", label: "Semantic / Visual", icon: Layers },
                { id: "ocr", label: "OCR Keywords", icon: FileText },
              ].map((m) => {
                const Icon = m.icon;
                const active = searchMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSearchMode(m.id);
                      executeSearch(query, m.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700/60"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{m.label}</span>
                    {m.badge && (
                      <span className="hidden sm:inline text-[9px] px-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {m.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filter Toggle & AI Assistant Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  showFilterDrawer || activeFilterCount > 0
                    ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                    : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setAssistantOpen(!assistantOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  assistantOpen
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>AI Assistant</span>
              </button>
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showFilterDrawer && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Collection Filter */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Filter by Collection
                  </label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">All Collections</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.image_count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Type Filter */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Media File Type
                  </label>
                  <select
                    value={selectedMimeType}
                    onChange={(e) => setSelectedMimeType(e.target.value)}
                    className="w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">Any Format</option>
                    <option value="image/png">PNG Screenshot/Diagram</option>
                    <option value="image/jpeg">JPG / JPEG Photo</option>
                    <option value="image/webp">WEBP Document</option>
                  </select>
                </div>

                {/* OCR Text Toggle */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    OCR Text Detected
                  </label>
                  <select
                    value={hasOCR === undefined ? "" : hasOCR ? "true" : "false"}
                    onChange={(e) =>
                      setHasOCR(e.target.value === "" ? undefined : e.target.value === "true")
                    }
                    className="w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">Any (With or Without OCR)</option>
                    <option value="true">Must have extracted text</option>
                    <option value="false">Visual-only (No text)</option>
                  </select>
                </div>
              </div>

              {/* Retrieval Weight Sliders */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-500" />
                    Linear Fusion Scoring Weights
                  </span>
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Semantic Vector (OpenCLIP)</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {Math.round(semanticWeight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={semanticWeight}
                      onChange={(e) => setSemanticWeight(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Keyword Match (BM25+)</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {Math.round(keywordWeight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={keywordWeight}
                      onChange={(e) => setKeywordWeight(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Metadata Prior</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {Math.round(metadataWeight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={metadataWeight}
                      onChange={(e) => setMetadataWeight(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Interpreted Query Chips */}
      {interpretedFilters.length > 0 && (
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
            AI interpreted your query:
          </span>
          {interpretedFilters.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-[11px] font-semibold"
            >
              <span className="text-indigo-400 dark:text-indigo-500 font-normal">{f.label}:</span>
              <span>{f.value}</span>
              <button
                onClick={() => removeInterpretedFilter(f.id)}
                className="hover:text-indigo-900 dark:hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results Header Toolbar (Total, Latency, Density, Sort) */}
      {response && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Found {response.total_found} visual memories
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              Latency: {response.latency_ms.toFixed(1)}ms
            </span>
            {response.query_understanding && (
              <Badge variant="outline" size="sm" className="hidden md:inline-flex">
                Engine: {response.query_understanding.engine || "OpenCLIP+BM25"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sorting */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-2 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Density Controls */}
            <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setDensity("compact")}
                title="Compact density (5 columns)"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  density === "compact"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDensity("comfortable")}
                title="Comfortable density (4 columns)"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  density === "comfortable"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDensity("large")}
                title="Large density (3 columns)"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  density === "large"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Results Grid */}
      {loading ? (
        <div
          className={`grid gap-4 ${
            density === "compact"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : density === "large"
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/3 w-full rounded-2xl" />
          ))}
        </div>
      ) : sortedResults.length > 0 ? (
        <div
          className={`grid gap-4 ${
            density === "compact"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : density === "large"
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {sortedResults.map((item) => {
            const scorePct = Math.round(item.score * 100);
            const isSelected = selectedCardIds.has(item.image.id);

            return (
              <div
                key={item.image.id}
                className={`group relative rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Thumbnail Canvas */}
                <div
                  onClick={() => setSelectedImage(item.image)}
                  className="aspect-video w-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative cursor-pointer"
                >
                  <img
                    src={getImageUrl(item.image.id)}
                    alt={item.image.original_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Badges: Select Checkbox & Relevance % */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectCard(item.image.id);
                      }}
                      className={`pointer-events-auto h-5 w-5 rounded-md flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-black/50 backdrop-blur-xs text-transparent hover:text-white/60 border border-white/30"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </button>

                    <div
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono shadow-xs backdrop-blur-md ${
                        scorePct >= 75
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
                          : scorePct >= 40
                          ? "bg-indigo-950/80 text-indigo-300 border border-indigo-700/60"
                          : "bg-slate-950/80 text-slate-300 border border-slate-700/60"
                      }`}
                    >
                      {scorePct}% match
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3
                      onClick={() => setSelectedImage(item.image)}
                      className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title={item.image.original_name}
                    >
                      {item.image.original_name}
                    </h3>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1">
                      <span>{new Date(item.image.created_at).toLocaleDateString()}</span>
                      {item.image.collections && item.image.collections.length > 0 && (
                        <span className="text-indigo-500 font-medium truncate max-w-[90px]">
                          {item.image.collections[0]}
                        </span>
                      )}
                    </div>

                    {/* OCR snippet preview */}
                    {item.image.ocr?.text && (
                      <div className="mt-2 text-[10.5px] text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-950/80 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/80 font-mono">
                        <span className="text-slate-400 font-sans font-semibold mr-1">OCR:</span>
                        {item.image.ocr.text.replace(/\s+/g, " ").slice(0, 80)}...
                      </div>
                    )}

                    {/* Matched keyword chips */}
                    {item.signals.matched_terms && item.signals.matched_terms.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.signals.matched_terms.slice(0, 3).map((term, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => setSelectedImage(item.image)}
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </Button>

                      <Button
                        onClick={() => {
                          setLoading(true);
                          findSimilarImages(item.image.id)
                            .then((res) => {
                              setResponse(res);
                              setQuery(`Similar to: ${item.image.original_name}`);
                            })
                            .catch(console.error)
                            .finally(() => setLoading(false));
                        }}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-indigo-600 dark:text-indigo-400"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Similar</span>
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExplainModalItem(item)}
                      title="Why this matched"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : response && !loading ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg mx-auto space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            We couldn&rsquo;t find images matching this query
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Try broader keywords, switch to Semantic Search, or lower the similarity threshold.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              onClick={() => {
                setSearchMode("semantic");
                executeSearch(query, "semantic");
              }}
              variant="secondary"
              size="sm"
            >
              Switch to Semantic
            </Button>
            <Button onClick={resetFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          </div>
        </div>
      ) : null}

      {/* Explainable AI Modal ("Why this matched") */}
      {explainModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-slide-in text-slate-900 dark:text-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {Math.round(explainModalItem.score * 100)}% match
                  </span>
                  <h3 className="text-sm font-bold truncate max-w-[220px]">
                    Why this matched
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                  {explainModalItem.image.original_name}
                </p>
              </div>
              <button
                onClick={() => setExplainModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Explanatory Reasons Checklist */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>High semantic similarity (OpenCLIP ViT-B-32)</span>
              </div>
              {explainModalItem.signals.matched_terms.length > 0 && (
                <div className="flex items-start gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    OCR detected: &ldquo;{explainModalItem.signals.matched_terms.join(", ")}&rdquo;
                  </span>
                </div>
              )}
              {explainModalItem.signals.explanation_reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            {/* Technical Metric Scores */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Technical Signal Breakdown
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Semantic similarity</span>
                <span className="font-mono font-semibold">
                  {(explainModalItem.signals.semantic_score || 0).toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Keyword score (BM25+)</span>
                <span className="font-mono font-semibold">
                  {(explainModalItem.signals.keyword_score || 0).toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Metadata prior</span>
                <span className="font-mono font-semibold">
                  {(explainModalItem.signals.metadata_score || 0).toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-bold">
                <span>Final Ranked Score</span>
                <span className="font-mono text-sm">
                  {(explainModalItem.score || 0).toFixed(4)}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setExplainModalItem(null)}
              variant="secondary"
              size="sm"
              className="w-full mt-2"
            >
              Close Explanation
            </Button>
          </div>
        </div>
      )}

      {/* Conversational Assistant Drawer */}
      {assistantOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-slide-in">
          <div className="p-3.5 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold">AI Visual Search Assistant</span>
            </div>
            <button
              onClick={() => setAssistantOpen(false)}
              className="p-1 hover:bg-indigo-700 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-64 overflow-y-auto p-3 space-y-2.5 text-xs">
            {conversationMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-2.5 rounded-xl leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-950">
            <input
              type="text"
              placeholder="Refine search... (e.g. 'Only 2025')"
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAssistantSend()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAssistantSend}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500 mb-3" />
          <p className="text-xs text-slate-500">Loading Search Platform...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
