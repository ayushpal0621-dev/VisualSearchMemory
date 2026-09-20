"use client";

import React, { useState, useEffect } from "react";
import {
  FolderKanban,
  Plus,
  Images,
  Trash2,
  X,
  Loader2,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Edit2,
  Check,
} from "lucide-react";
import { fetchCollections, createCollection, fetchImages, getImageUrl } from "@/lib/api";
import { CollectionItem, ImageItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import ImageDetailModal from "@/components/ImageDetailModal";
import { useToast } from "@/components/providers/ToastProvider";

export default function CollectionsPage() {
  const { showToast } = useToast();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null);
  const [collectionImages, setCollectionImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);

  // New Collection Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [submitting, setSubmitting] = useState(false);

  // Image detail modal
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  const loadCollections = () => {
    setLoading(true);
    fetchCollections()
      .then((cols) => {
        setCollections(cols);
        if (cols.length > 0 && !selectedCollection) {
          setSelectedCollection(cols[0]);
        }
      })
      .catch((err) => console.error("Collections error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      setImagesLoading(true);
      fetchImages({ collection_id: selectedCollection.id, page_size: 50 })
        .then((res) => setCollectionImages(res.items))
        .catch(console.error)
        .finally(() => setImagesLoading(false));
    }
  }, [selectedCollection]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const newCol = await createCollection(name.trim(), description.trim(), color);
      setName("");
      setDescription("");
      setColor("#6366f1");
      setCreateOpen(false);
      showToast("Collection Created", {
        message: `Created collection "${newCol.name}"`,
        type: "success",
      });
      loadCollections();
      setSelectedCollection(newCol);
    } catch (err: any) {
      showToast("Error", { message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const presetColors = [
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#10b981", // Emerald
    "#0ea5e9", // Sky
    "#f59e0b", // Amber
    "#f43f5e", // Rose
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Collections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize visual memories into curated thematic workspaces ({collections.length} albums)
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)} variant="primary" size="md">
          <Plus className="h-4 w-4" />
          <span>New Collection</span>
        </Button>
      </div>

      {/* Collections Overview Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((col) => {
            const isSelected = selectedCollection?.id === col.id;

            return (
              <div
                key={col.id}
                onClick={() => setSelectedCollection(col)}
                className={`group rounded-2xl bg-white dark:bg-slate-900 border p-4.5 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-4 ring-slate-100 dark:ring-slate-800 shrink-0"
                      style={{ backgroundColor: col.color || "#6366f1" }}
                    />
                    <Badge variant="secondary" size="sm">
                      {col.image_count} items
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {col.name}
                  </h3>

                  {col.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {col.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                  <span>Updated {new Date(col.updated_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <FolderKanban className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No collections yet
          </p>
          <Button onClick={() => setCreateOpen(true)} variant="primary" size="sm" className="mt-3">
            Create your first collection
          </Button>
        </div>
      )}

      {/* Selected Collection Inspector Panel */}
      {selectedCollection && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: selectedCollection.color || "#6366f1" }}
              />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedCollection.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedCollection.description || "Collection workspace"} • {collectionImages.length} images
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="primary" size="md">
                Active Collection View
              </Badge>
            </div>
          </div>

          {/* Images inside Selected Collection */}
          {imagesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          ) : collectionImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {collectionImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className="group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 aspect-square cursor-pointer hover:border-indigo-500 transition-all shadow-2xs hover:shadow-sm"
                >
                  <img
                    src={getImageUrl(img.id)}
                    alt={img.original_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white font-medium truncate">
                      {img.original_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">
              No images have been tagged into this collection yet. In the Library or Search view, click
              &ldquo;Add to Collection&rdquo; to tag memories.
            </div>
          )}
        </div>
      )}

      {/* New Collection Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-slide-in text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Create New Collection</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. College, Projects, Notes, Screenshots..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs focus:outline-none focus:border-indigo-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What belongs in this collection?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        color === c ? "scale-110 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                  Create Collection
                </Button>
              </div>
            </form>
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
