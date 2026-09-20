"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Copy,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Check,
  FolderPlus,
  ArrowRight,
  ShieldAlert,
  Info,
} from "lucide-react";
import { fetchDuplicates, getImageUrl, fetchImageDetail, fetchCollections, addImageToCollection } from "@/lib/api";
import { DuplicateGroup, ImageItem, CollectionItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import ImageDetailModal from "@/components/ImageDetailModal";
import { useToast } from "@/components/providers/ToastProvider";

export default function DuplicatesPage() {
  const { showToast } = useToast();
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "exact" | "near">("all");
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  // Selection & Collection Assignment
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [targetCollectionId, setTargetCollectionId] = useState("");

  const loadDuplicates = () => {
    setLoading(true);
    fetchDuplicates()
      .then(setDuplicates)
      .catch((err) => console.error("Duplicates error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDuplicates();
    fetchCollections().then(setCollections).catch(console.error);
  }, []);

  const handleOpenDetail = async (id: string) => {
    try {
      const detail = await fetchImageDetail(id);
      setSelectedImage(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddToCollection = async () => {
    if (!targetCollectionId || selectedImageIds.size === 0) return;
    try {
      for (const id of Array.from(selectedImageIds)) {
        await addImageToCollection(targetCollectionId, id);
      }
      showToast("Assigned to Collection", {
        message: `${selectedImageIds.size} duplicate memories assigned.`,
        type: "success",
      });
      setSelectedImageIds(new Set());
      setTargetCollectionId("");
    } catch (err: any) {
      showToast("Error", { message: err.message, type: "error" });
    }
  };

  const filteredDuplicates = useMemo(() => {
    if (activeTab === "all") return duplicates;
    return duplicates.filter((d) => d.type === activeTab);
  }, [duplicates, activeTab]);

  const exactCount = duplicates.filter((d) => d.type === "exact").length;
  const nearCount = duplicates.filter((d) => d.type === "near").length;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Duplicate Detection
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Identify exact byte-for-byte copies (SHA-256) and perceptual near-duplicates (pHash)
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            All ({duplicates.length})
          </button>
          <button
            onClick={() => setActiveTab("exact")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === "exact"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Exact ({exactCount})
          </button>
          <button
            onClick={() => setActiveTab("near")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === "near"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Near Duplicates ({nearCount})
          </button>
        </div>
      </div>

      {/* Overview Info Banner */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
              Non-Destructive Duplicate Management
            </span>
            <p className="leading-relaxed">
              VisualSearch Memory groups exact SHA-256 file collisions and near-duplicate images altered by compression or resolution.
              You can inspect, select, or organize duplicate groups into collections without accidentally deleting source files.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar (When duplicate images are selected) */}
      {selectedImageIds.size > 0 && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4 text-xs animate-slide-in">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
            <span>{selectedImageIds.size} duplicates selected</span>
            <button
              onClick={() => setSelectedImageIds(new Set())}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Deselect
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetCollectionId}
              onChange={(e) => setTargetCollectionId(e.target.value)}
              className="h-8 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 text-xs focus:outline-none"
            >
              <option value="">Add to Collection...</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button
              onClick={handleAddToCollection}
              disabled={!targetCollectionId}
              variant="primary"
              size="sm"
              className="h-8"
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Duplicate Groups List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredDuplicates.length > 0 ? (
        <div className="space-y-4">
          {filteredDuplicates.map((group, idx) => {
            const isExact = group.type === "exact";

            return (
              <Card key={idx} className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                {/* Group Header */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isExact ? (
                      <Badge variant="warning" size="md">
                        Exact SHA-256 Match
                      </Badge>
                    ) : (
                      <Badge variant="primary" size="md">
                        Near Duplicate ({Math.round((group.similarity_score || 0.95) * 100)}% Similarity)
                      </Badge>
                    )}
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {group.images.length} similar images detected
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]" title={group.hash_value}>
                    Hash: {group.hash_value}
                  </span>
                </div>

                {/* Side-by-Side Images Grid */}
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {group.images.map((img) => {
                      const isSelected = selectedImageIds.has(img.id);

                      return (
                        <div
                          key={img.id}
                          className={`group/item rounded-xl border bg-white dark:bg-slate-900 overflow-hidden transition-all duration-150 flex flex-col justify-between ${
                            isSelected
                              ? "border-indigo-500 ring-2 ring-indigo-500/20"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          {/* Image Thumbnail */}
                          <div
                            onClick={() => handleOpenDetail(img.id)}
                            className="aspect-video w-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative cursor-pointer"
                          >
                            <img
                              src={getImageUrl(img.id)}
                              alt={img.original_name}
                              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            />

                            {/* Select Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelect(img.id);
                              }}
                              className={`absolute top-2 left-2 h-5 w-5 rounded-md flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-black/50 backdrop-blur-xs text-transparent hover:text-white/60 border border-white/30"
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Image Info & Actions */}
                          <div className="p-3">
                            <h4
                              onClick={() => handleOpenDetail(img.id)}
                              className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                              title={img.original_name}
                            >
                              {img.original_name}
                            </h4>
                            <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1">
                              <span>{new Date(img.created_at).toLocaleDateString()}</span>
                              <span className="font-mono text-[10px]">
                                {(img.file_size / 1024).toFixed(0)} KB
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2.5 flex items-center justify-between">
                              <Button
                                onClick={() => handleOpenDetail(img.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Inspect</span>
                              </Button>

                              <button
                                onClick={() => toggleSelect(img.id)}
                                className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                {isSelected ? "Selected" : "Select"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-md mx-auto p-6 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No duplicates found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All visual memories in your library are unique. Both SHA-256 cryptographic and perceptual pHash checks passed cleanly.
          </p>
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
