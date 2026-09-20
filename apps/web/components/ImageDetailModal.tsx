"use client";

import React, { useState, useEffect } from "react";
import { ImageItem, CollectionItem, SearchResultItem } from "@/types";
import { getImageUrl, deleteImage, addImageToCollection, findSimilarImages, fetchCollections } from "@/lib/api";
import {
  X, Copy, Check, Sparkles, Trash2, Calendar, FileText,
  Layers, Camera, Clock, ExternalLink, HardDrive, ZoomIn,
  ZoomOut, Maximize2, RotateCcw, AlertTriangle, FolderPlus,
  ArrowRight, Image as ImageIcon, CheckCircle2, Search,
  SlidersHorizontal, ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

interface ImageDetailModalProps {
  image: ImageItem | null;
  collections?: CollectionItem[];
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onFindSimilar?: (id: string) => void;
  onSelectImage?: (img: ImageItem) => void;
}

export default function ImageDetailModal({
  image,
  collections: initialCollections,
  onClose,
  onDeleted,
  onFindSimilar,
  onSelectImage,
}: ImageDetailModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [selectedCol, setSelectedCol] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [collectionsList, setCollectionsList] = useState<CollectionItem[]>(initialCollections || []);

  // Image viewer zoom & bounding box overlay states
  const [zoom, setZoom] = useState(1);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Related images
  const [relatedImages, setRelatedImages] = useState<SearchResultItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Delete Confirmation Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSourceDisk, setDeleteSourceDisk] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync collections if not passed
  useEffect(() => {
    if (initialCollections && initialCollections.length > 0) {
      setCollectionsList(initialCollections);
    } else if (image) {
      fetchCollections()
        .then(setCollectionsList)
        .catch(() => {});
    }
  }, [image, initialCollections]);

  // Fetch related images when image changes
  useEffect(() => {
    if (!image) return;
    setZoom(1);
    setLoadingRelated(true);
    findSimilarImages(image.id, 6)
      .then((res) => {
        // Filter out self
        const filtered = (res.results || []).filter((r) => r.image.id !== image.id);
        setRelatedImages(filtered);
      })
      .catch((err) => {
        console.error("Failed to load similar images:", err);
        setRelatedImages([]);
      })
      .finally(() => setLoadingRelated(false));
  }, [image?.id]);

  if (!image) return null;

  const handleCopyOCR = () => {
    if (image.ocr?.text) {
      navigator.clipboard.writeText(image.ocr.text);
      setCopied(true);
      toast({ title: "OCR text copied", description: `${image.ocr.word_count || 0} words copied to clipboard` });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(image.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleAddToCollection = async () => {
    if (!selectedCol) return;
    setAddingCol(true);
    try {
      await addImageToCollection(selectedCol, image.id);
      const colName = collectionsList.find((c) => c.id === selectedCol)?.name || "Collection";
      toast({ title: "Added to collection", description: `Memory attached to "${colName}"` });
      setSelectedCol("");
    } catch (e: any) {
      toast({ title: "Failed to add", description: e.message, variant: "destructive" });
    } finally {
      setAddingCol(false);
    }
  };

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteImage(image.id, deleteSourceDisk);
      toast({
        title: "Memory removed from index",
        description: deleteSourceDisk ? "Embedding & original file deleted" : "Vector index record cleared safely",
      });
      if (onDeleted) onDeleted(image.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchWithThisImage = () => {
    if (onFindSimilar) {
      onFindSimilar(image.id);
      onClose();
    } else {
      router.push(`/search?mode=similar&image_id=${image.id}`);
      onClose();
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-6xl max-h-[94vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left Column: Large Image Canvas */}
          <div className="md:w-7/12 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 relative overflow-hidden select-none">
            {/* Canvas Header Controls */}
            <div className="flex items-center justify-between p-3.5 z-10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  <CheckCircle2 className="h-3 w-3" /> Indexed
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                  OpenCLIP ViT-B-32
                </span>
              </div>

              {/* Zoom & Overlay toolbar */}
              <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                  title="Zoom Out"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-slate-600 dark:text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                  title="Zoom In"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                {zoom !== 1 && (
                  <button
                    onClick={() => setZoom(1)}
                    title="Reset Zoom"
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 mx-0.5" />
                <button
                  onClick={() => setShowOverlay((v) => !v)}
                  title="Toggle Visual Bounding Box"
                  className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition ${
                    showOverlay
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                  }`}
                >
                  Regions
                </button>
              </div>
            </div>

            {/* Main Interactive Canvas */}
            <div className="flex-1 flex items-center justify-center p-6 min-h-[340px] md:min-h-[480px] overflow-hidden relative">
              <div
                className="relative transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              >
                <img
                  src={getImageUrl(image.id)}
                  alt={image.original_name}
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                />

                {/* Simulated OCR Detection Bounding Box Overlays */}
                {showOverlay && image.ocr?.text && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[18%] left-[12%] right-[18%] h-[24%] border-2 border-dashed border-indigo-500/80 bg-indigo-500/10 rounded-lg flex items-start p-1.5">
                      <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow">
                        OCR Text Region ({image.ocr.word_count} words)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Canvas Footer Specs */}
            <div className="p-3 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>{image.width} × {image.height} px</span>
              <span>{formatBytes(image.file_size)}</span>
              <span className="uppercase">{image.mime_type?.split("/")[1] || "IMAGE"}</span>
            </div>
          </div>

          {/* Right Column: Information, Actions, OCR & Related */}
          <div className="md:w-5/12 flex flex-col p-6 overflow-y-auto max-h-[60vh] md:max-h-[94vh] space-y-6">
            {/* Header / Filename */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 break-words leading-snug">
                  {image.original_name}
                </h2>
              </div>
              <button
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono mt-1 transition"
                title="Click to copy unique UUID"
              >
                <span>ID: {image.id.slice(0, 16)}...</span>
                {copiedId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>

            {/* Primary Action Row */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSearchWithThisImage}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm hover:shadow transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Search with this Image
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 rounded-xl transition"
                title="Delete from index"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Collection Widget */}
            {collectionsList.length > 0 && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <FolderPlus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Assign to Collection</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCol}
                    onChange={(e) => setSelectedCol(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose collection...</option>
                    {collectionsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.image_count || 0})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddToCollection}
                    disabled={!selectedCol || addingCol}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-xs font-semibold text-white rounded-xl transition shadow-sm"
                  >
                    {addingCol ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            )}

            {/* Extracted OCR Text Panel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Extracted OCR Text</span>
                  {image.ocr && (
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      ({image.ocr.word_count} words • {Math.round((image.ocr.confidence || 0) * 100)}% conf)
                    </span>
                  )}
                </div>
                {image.ocr?.text && (
                  <button
                    onClick={handleCopyOCR}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy OCR</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-300 max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                {image.ocr?.text ? (
                  image.ocr.text
                ) : (
                  <span className="text-slate-400 dark:text-slate-600 italic">
                    No textual information detected in this visual memory.
                  </span>
                )}
              </div>
            </div>

            {/* Metadata Specifications */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-2.5 text-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Metadata & Embeddings
              </h4>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Indexed On
                </span>
                <span className="text-slate-900 dark:text-slate-200 font-medium">
                  {new Date(image.created_at).toLocaleString()}
                </span>
              </div>

              {image.metadata?.date_taken && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" /> Captured
                  </span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {new Date(image.metadata.date_taken).toLocaleDateString()}
                  </span>
                </div>
              )}

              {image.metadata?.processing_time_ms && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Extraction Latency
                  </span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {image.metadata.processing_time_ms} ms
                  </span>
                </div>
              )}

              {image.phash && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Perceptual Hash
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 text-[11px]">
                    {image.phash}
                  </span>
                </div>
              )}

              {image.metadata?.color_palette && image.metadata.color_palette.length > 0 && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1">
                  <span>Color Palette</span>
                  <div className="flex gap-1.5">
                    {image.metadata.color_palette.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related Images Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Related Visual Memories</span>
                </h4>
                {relatedImages.length > 0 && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {relatedImages.length} found
                  </span>
                )}
              </div>

              {loadingRelated ? (
                <div className="grid grid-cols-3 gap-2 py-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : relatedImages.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                  No similar memories found above vector similarity threshold.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {relatedImages.slice(0, 3).map((item) => (
                    <div
                      key={item.image.id}
                      onClick={() => {
                        if (onSelectImage) {
                          onSelectImage(item.image);
                        } else {
                          // Fallback trigger
                          router.push(`/search?mode=similar&image_id=${item.image.id}`);
                          onClose();
                        }
                      }}
                      className="group relative aspect-video bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 cursor-pointer transition shadow-sm hover:shadow"
                    >
                      <img
                        src={getImageUrl(item.image.id)}
                        alt={item.image.original_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <span className="text-[10px] text-white font-medium truncate">
                          {Math.round(item.score * 100)}% match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Safety Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete Memory from Index?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirm visual record removal
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white font-semibold">{image.original_name}</strong> from your indexed visual memory? This will purge multimodal vectors, OCR text, and semantic metadata.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteSourceDisk}
                onChange={(e) => setDeleteSourceDisk(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Also permanently delete source file from disk
                </span>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                  Default leaves original media files untouched on filesystem.
                </span>
              </div>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-sm"
              >
                {isDeleting ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
