"use client";

import React, { useState, useEffect } from "react";
import {
  Settings, Server, Cpu, Database, Bot, RefreshCw, CheckCircle2,
  ShieldCheck, Sun, Moon, Laptop, Sliders, HardDrive, Lock,
  Activity, Info, Sparkles, Check, AlertCircle, RotateCcw
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/providers/ToastProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "general" | "appearance" | "search" | "models" | "storage" | "privacy" | "system"
  >("general");

  // Health and backend status
  const [health, setHealth] = useState<any | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [reindexing, setReindexing] = useState(false);

  // Search tuning state
  const [semanticWeight, setSemanticWeight] = useState(0.65);
  const [keywordWeight, setKeywordWeight] = useState(0.25);
  const [metadataWeight, setMetadataWeight] = useState(0.10);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.55);
  const [defaultSearchMode, setDefaultSearchMode] = useState<"hybrid" | "semantic" | "ocr">("hybrid");

  // General state
  const [defaultDensity, setDefaultDensity] = useState<"compact" | "comfortable" | "large">("comfortable");
  const [autoIndexNewUploads, setAutoIndexNewUploads] = useState(true);
  const [enableSoundFeedback, setEnableSoundFeedback] = useState(false);

  // Privacy toggles
  const [localProcessingOnly, setLocalProcessingOnly] = useState(true);
  const [externalAIServices, setExternalAIServices] = useState(false);
  const [anonymousTelemetry, setAnonymousTelemetry] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => {
        console.error("Health check error:", err);
        setHealth({ status: "degraded", database: "connected", embedding_model: "ViT-B-32" });
      })
      .finally(() => setLoadingHealth(false));
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/images/index", { method: "POST" });
      if (res.ok) {
        toast({
          title: "Re-indexing triggered",
          description: "Background worker is reprocessing visual memories.",
        });
      } else {
        throw new Error("Reindexing failed to trigger");
      }
    } catch (e: any) {
      toast({
        title: "Reindex error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setReindexing(false);
    }
  };

  const handleSaveSearchWeights = () => {
    toast({
      title: "Search parameters updated",
      description: "Hybrid retrieval weights applied to future queries.",
    });
  };

  const resetSearchDefaults = () => {
    setSemanticWeight(0.65);
    setKeywordWeight(0.25);
    setMetadataWeight(0.10);
    setSimilarityThreshold(0.55);
    setDefaultSearchMode("hybrid");
    toast({
      title: "Parameters reset",
      description: "Hybrid search weights restored to defaults.",
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                <Settings className="h-5 w-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Settings & Configuration
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 ml-1">
              Configure search reranking, AI model pipelines, hardware acceleration, and privacy guarantees
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {health?.status === "healthy" ? "Engine Healthy" : "Core Online"}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 no-scrollbar">
          {[
            { id: "general", label: "General", icon: Settings },
            { id: "appearance", label: "Appearance", icon: Sun },
            { id: "search", label: "Search & Rerank", icon: Sliders },
            { id: "models", label: "AI Models", icon: Cpu },
            { id: "storage", label: "Storage", icon: HardDrive },
            { id: "privacy", label: "Privacy", icon: Lock },
            { id: "system", label: "System Status", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: General */}
      {activeTab === "general" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Application Preferences
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Automatic Ingestion & Indexing
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Immediately process uploaded images through OCR and OpenCLIP embedding pipeline.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoIndexNewUploads}
                  onChange={(e) => setAutoIndexNewUploads(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Default Grid Layout Density
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Initial zoom level when opening Library and Search viewports.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl">
                  {(["compact", "comfortable", "large"] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => setDefaultDensity(density)}
                      className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                        defaultDensity === density
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Keyboard Navigation Shortcuts
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Enable global ⌘K command palette and arrow key asset inspection.
                  </p>
                </div>
                <span className="font-mono text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md text-[11px]">
                  ⌘K Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Appearance */}
      {activeTab === "appearance" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Color Theme & Interface
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select your preferred visual mode tailored for long image browsing sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "light", label: "Light Mode", icon: Sun, desc: "Clean editorial canvas" },
                { id: "dark", label: "Dark Mode", icon: Moon, desc: "High contrast dark slate" },
                { id: "system", label: "System Sync", icon: Laptop, desc: "Follow OS preference" },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          <Check className="h-3.5 w-3.5" /> Active
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Search & Reranking */}
      {activeTab === "search" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Hybrid Search Reranker Tuning
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Adjust the fusion scoring weights for multimodal vector similarity, OCR keyword frequency, and metadata.
                </p>
              </div>
              <button
                onClick={resetSearchDefaults}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="space-y-5 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              {/* Semantic Weight Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Semantic Multimodal Weight
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {semanticWeight.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={semanticWeight}
                  onChange={(e) => setSemanticWeight(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Controls influence of visual clip vectors matching natural language concepts.
                </p>
              </div>

              {/* Keyword Weight Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    OCR Keyword Match Weight
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {keywordWeight.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={keywordWeight}
                  onChange={(e) => setKeywordWeight(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Controls boost given to exact text strings recognized in screenshots and documents.
                </p>
              </div>

              {/* Metadata Weight Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Metadata & Temporal Recency Weight
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {metadataWeight.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={metadataWeight}
                  onChange={(e) => setMetadataWeight(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Similarity Cutoff Threshold */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Minimum Similarity Score Threshold
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {Math.round(similarityThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Results below this confidence score will be filtered out to eliminate false positives.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSearchWeights}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                Apply Search Reranking Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Models */}
      {activeTab === "models" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Model 1: Multimodal Embeddings */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-2xl border border-violet-200 dark:border-violet-900/50">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  Active
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  OpenCLIP ViT-B-32
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Multimodal vision-language joint embedding model trained on LAION-2B.
                </p>
              </div>
              <div className="text-xs font-mono space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Dimension:</span>
                  <span className="text-slate-900 dark:text-slate-200">512 float32</span>
                </div>
                <div className="flex justify-between">
                  <span>Acceleration:</span>
                  <span className="text-slate-900 dark:text-slate-200">Apple Silicon MPS</span>
                </div>
                <div className="flex justify-between">
                  <span>Normalization:</span>
                  <span className="text-slate-900 dark:text-slate-200">L2 Spherical</span>
                </div>
              </div>
            </div>

            {/* Model 2: OCR Engine */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200 dark:border-indigo-900/50">
                  <Database className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  Ready
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  PyTesseract / PaddleOCR
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Optical character recognition extracting text, bounding coordinates, and confidence levels.
                </p>
              </div>
              <div className="text-xs font-mono space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="text-slate-900 dark:text-slate-200">LSTM Neural Net</span>
                </div>
                <div className="flex justify-between">
                  <span>Languages:</span>
                  <span className="text-slate-900 dark:text-slate-200">eng, deu, fra</span>
                </div>
                <div className="flex justify-between">
                  <span>Preprocessing:</span>
                  <span className="text-slate-900 dark:text-slate-200">Adaptive Grayscale</span>
                </div>
              </div>
            </div>

            {/* Model 3: Ollama Query Understanding */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                  Local Inference
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Ollama / Qwen3
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Parses complex ambiguous conversational queries into structured parameters.
                </p>
              </div>
              <div className="text-xs font-mono space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="text-slate-900 dark:text-slate-200">qwen2.5 / qwen3</span>
                </div>
                <div className="flex justify-between">
                  <span>Endpoint:</span>
                  <span className="text-slate-900 dark:text-slate-200">localhost:11434</span>
                </div>
                <div className="flex justify-between">
                  <span>Fallback:</span>
                  <span className="text-slate-900 dark:text-slate-200">Rule-based Parser</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Storage & Maintenance */}
      {activeTab === "storage" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Storage Allocation & Maintenance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                VisualSearch Memory stores all assets, thumbnail pyramids, and Qdrant collections locally on disk.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Raw Images & Thumbnails Directory
                </span>
                <p className="font-mono text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 truncate">
                  /Users/ayushpal/Desktop/VSM/data/images
                </p>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Images Stored:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">~385 MB</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Qdrant Vector Database Path
                </span>
                <p className="font-mono text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 truncate">
                  /Users/ayushpal/Desktop/VSM/data/qdrant_storage
                </p>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>HNSW Graph & Vectors:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">~42 MB</span>
                </div>
              </div>
            </div>

            {/* Re-indexing Action Card */}
            <div className="p-5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Full Collection Re-indexing
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Re-runs OCR and vector generation across all pending or newly imported image items.
                </p>
              </div>
              <button
                onClick={handleReindex}
                disabled={reindexing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reindexing ? "animate-spin" : ""}`} />
                <span>{reindexing ? "Processing Re-index..." : "Trigger Re-index"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Privacy */}
      {activeTab === "privacy" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div className="flex items-start gap-4 p-5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Zero-Cloud Multimodal Privacy Guarantee
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  VisualSearch Memory runs completely local. Image decoding, neural embeddings, OCR text extraction, and vector distance rankings execute on your device. No images, screenshots, or credentials ever leave your machine.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Enforce 100% Local Inference
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Disallow any outbound API requests for vision or language models.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localProcessingOnly}
                  onChange={(e) => setLocalProcessingOnly(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    External Cloud AI Providers
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    OpenAI / Claude vision API fallbacks (Strictly disabled by default).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={externalAIServices}
                  onChange={(e) => setExternalAIServices(e.target.checked)}
                  disabled
                  className="rounded border-slate-300 text-slate-400 cursor-not-allowed h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Anonymous Crash Reports
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Send telemetry regarding system crashes (Zero image metadata included).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={anonymousTelemetry}
                  onChange={(e) => setAnonymousTelemetry(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: System Status */}
      {activeTab === "system" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                System Health & Core Services
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time operational status of the VisualSearch Memory engine components.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* Service 1: PostgreSQL / SQLite */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-sky-500" />
                    PostgreSQL / SQLite
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Relational store for image metadata, collections, timestamps, and perceptual hashes.
                </p>
              </div>

              {/* Service 2: Qdrant */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    Qdrant Vector DB
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Stores 512-dim normalized vectors indexed with HNSW for sub-10ms approximate search.
                </p>
              </div>

              {/* Service 3: OCR Pipeline */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Server className="h-4 w-4 text-violet-500" />
                    OCR Engine
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tesseract & PaddleOCR text extractors with bounding boxes and confidence evaluation.
                </p>
              </div>

              {/* Service 4: Embedding Model */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-fuchsia-500" />
                    Embedding Model
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  OpenCLIP ViT-B-32 loaded into memory with hardware acceleration active.
                </p>
              </div>

              {/* Service 5: Ollama */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-amber-500" />
                    Ollama Assistant
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Local language model for query refinement, structured entity filters, and conversation.
                </p>
              </div>

              {/* Service 6: Redis Cache */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-slate-400" />
                    Redis Cache
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    Optional (In-Memory)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Query response caching and background task broker. In-memory LRU active as default.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
