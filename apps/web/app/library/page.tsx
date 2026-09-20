"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Images,
  UploadCloud,
  FolderUp,
  Filter,
  ArrowUpDown,
  Grid3X3,
  LayoutGrid,
  Columns,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  FolderPlus,
  Trash2,
  Search,
  Eye,
  X,
} from "lucide-react";
import { fetchImages, fetchCollections, getImageUrl, deleteImage, addImageToCollection } from "@/lib/api";
import { ImageItem, CollectionItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import ImageDetailModal from "@/components/ImageDetailModal";
import UploadModal from "@/components/UploadModal";
import { useToast } from "@/components/providers/ToastProvider";

export default function LibraryPage() {
  const { showToast } = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [density, setDensity] = useState<"compact" | "comfortable" | "large">("comfortable");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "size">("newest");

  // Selection & Modals
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [assignCollectionId, setAssignCollectionId] = useState("");

  const loadData = () => {
    setLoading(true);
    fetchImages({
      page,
      page_size: pageSize,
      collection_id: selectedCollection || undefined,
      status: statusFilter || undefined,
    })
      .then((data) => {
        setImages(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        console.error("Failed to load library images:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCollections().then(setCollections).catch(console.error);
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize, selectedCollection, statusFilter]);

  // Client-side filtering & sorting for search term and order
  const filteredAndSortedImages = useMemo(() => {
    let result = [...images];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (img) =>
          img.original_name.toLowerCase().includes(q) ||
          (img.ocr?.text && img.ocr.text.toLowerCase().includes(q))
      );
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "name") {
      result.sort((a, b) => a.original_name.localeCompare(b.original_name));
    } else if (sortBy === "size") {
      result.sort((a, b) => b.file_size - a.file_size);
    }
    return result;
  }, [images, searchTerm, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    if (selectedIds.size === filteredAndSortedImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedImages.map((i) => i.id)));
    }
  };

  const handleBulkAddToCollection = async () => {
    if (!assignCollectionId || selectedIds.size === 0) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await addImageToCollection(assignCollectionId, id);
      }
      showToast("Added to Collection", {
        message: `${selectedIds.size} images assigned to collection.`,
        type: "success",
      });
      setSelectedIds(new Set());
      setAssignCollectionId("");
      loadData();
    } catch (err: any) {
      showToast("Error", { message: err.message, type: "error" });
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, inspect, and organize all your visual memories ({total} total assets)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={() => setUploadOpen(true)} variant="primary" size="md">
            <UploadCloud className="h-4 w-4" />
            <span>Import Images</span>
          </Button>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search within Library */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search filename or text on page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed (Indexed)</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Collection Filter */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.image_count})
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="size">Largest Size</option>
          </select>

          {/* Grid Density */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setDensity("compact")}
              title="Compact density"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                density === "compact"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDensity("comfortable")}
              title="Comfortable density"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                density === "comfortable"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDensity("large")}
              title="Large density"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                density === "large"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (When items selected) */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4 text-xs animate-slide-in">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
            <span>{selectedIds.size} images selected</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={assignCollectionId}
              onChange={(e) => setAssignCollectionId(e.target.value)}
              className="h-8 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 text-xs focus:outline-none"
            >
              <option value="">Assign to Collection...</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button
              onClick={handleBulkAddToCollection}
              disabled={!assignCollectionId}
              variant="primary"
              size="sm"
              className="h-8"
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Images Grid */}
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
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/3 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredAndSortedImages.length > 0 ? (
        <div
          className={`grid gap-4 ${
            density === "compact"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : density === "large"
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {filteredAndSortedImages.map((img) => {
            const isSelected = selectedIds.has(img.id);

            return (
              <div
                key={img.id}
                className={`group relative rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Thumbnail Canvas */}
                <div
                  onClick={() => setSelectedImage(img)}
                  className="aspect-video w-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative cursor-pointer"
                >
                  <img
                    src={getImageUrl(img.id)}
                    alt={img.original_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Left: Select Checkbox */}
                  <div className="absolute top-2.5 left-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(img.id);
                      }}
                      className={`h-5 w-5 rounded-md flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-black/50 backdrop-blur-xs text-transparent hover:text-white/60 border border-white/30"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Top Right: Index Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {img.status === "completed" && (
                      <Badge variant="success" size="sm">
                        ✓ Indexed
                      </Badge>
                    )}
                    {img.status === "processing" && (
                      <Badge variant="warning" size="sm" className="flex items-center gap-1">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Processing
                      </Badge>
                    )}
                    {img.status === "pending" && (
                      <Badge variant="secondary" size="sm">
                        Pending
                      </Badge>
                    )}
                    {img.status === "failed" && (
                      <Badge variant="destructive" size="sm" title={img.error_message || "Failed"}>
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Metadata Body */}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3
                      onClick={() => setSelectedImage(img)}
                      className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title={img.original_name}
                    >
                      {img.original_name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{new Date(img.created_at).toLocaleDateString()}</span>
                      <span className="font-mono text-[10px]">
                        {(img.file_size / 1024).toFixed(0)} KB
                      </span>
                    </div>

                    {img.collections && img.collections.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {img.collections.map((c, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-3">
                    <Button
                      onClick={() => setSelectedImage(img)}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Details</span>
                    </Button>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {img.mime_type.replace("image/", "").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-md mx-auto p-6 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Images className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Your visual memory is empty
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Import your first folder of images or screenshots to begin multimodal indexing and semantic retrieval.
          </p>
          <Button onClick={() => setUploadOpen(true)} variant="primary" size="sm" className="mt-2">
            Import Images
          </Button>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
          <span className="text-slate-500">
            Page {page} of {totalPages} ({total} items total)
          </span>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onIndexingComplete={() => {
          setUploadOpen(false);
          loadData();
        }}
      />

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
