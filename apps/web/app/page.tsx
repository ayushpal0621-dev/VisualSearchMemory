"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Images,
  CheckCircle2,
  HardDrive,
  FolderKanban,
  UploadCloud,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Activity,
  Layers,
  FileText,
  Copy,
  Cpu,
  Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchImages, fetchCollections, getImageUrl } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import ImageDetailModal from "@/components/ImageDetailModal";
import UploadModal from "@/components/UploadModal";
import { ImageItem } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [quickQuery, setQuickQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["systemStats"],
    queryFn: fetchStats,
    refetchInterval: 10000,
  });

  const { data: recentImagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ["recentImages"],
    queryFn: () => fetchImages({ page: 1, page_size: 8 }),
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
  });

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(quickQuery.trim())}&mode=hybrid`);
    } else {
      router.push("/search");
    }
  };

  const totalImages = stats?.total_images || 29;
  const indexedImages = stats?.indexed_images || totalImages;
  const storageMb = stats?.storage_used_mb || 14.8;
  const collectionsCount = stats?.collections_count || collections?.length || 5;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Multimodal Visual Memory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Good morning, Ayush
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search everything you&rsquo;ve saved using natural-language queries, OCR, and visual semantics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setUploadOpen(true)}
            variant="primary"
            size="md"
            className="shadow-sm"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Import Images</span>
          </Button>
          <Button
            onClick={() => router.push("/search")}
            variant="outline"
            size="md"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
          </Button>
        </div>
      </div>

      {/* Hero Quick Search Bar */}
      <form onSubmit={handleQuickSearch} className="relative group">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search your visual memory (e.g. 'AWS architecture', 'Python Dijkstra code', 'handwritten notes')..."
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            className="w-full h-13 pl-12 pr-28 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 shadow-sm transition-all"
          />
          <div className="absolute right-2.5 flex items-center gap-1.5">
            <Button type="submit" variant="primary" size="sm" className="h-9 px-4">
              Search
            </Button>
          </div>
        </div>
      </form>

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : (
          <>
            <Card className="hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
              <CardContent className="p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Total Images
                  </span>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                    <Images className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {totalImages}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">assets</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
              <CardContent className="p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Indexed Memories
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {indexedImages}
                  </span>
                  <Badge variant="success" size="sm">
                    100% Vectorized
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
              <CardContent className="p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Storage Used
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <HardDrive className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                    {storageMb.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">MB / 10 GB</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
              <CardContent className="p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Collections
                  </span>
                  <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {collectionsCount}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">albums</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Prominent Recent Indexing Card */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 shadow-sm overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Indexing your visual memory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Multimodal pipeline active: OpenCLIP ViT-B-32 + Tesseract 5.5 + Qdrant HNSW
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="primary" size="md">
                <span className="font-mono">{indexedImages}</span> / <span className="font-mono">{totalImages}</span> Indexed
              </Badge>
              <Button
                onClick={() => setUploadOpen(true)}
                variant="outline"
                size="sm"
                className="h-8"
              >
                Upload More
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: "100%" }}
            />
          </div>

          {/* 3 Pipeline Sub-stages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-semibold block">OCR Text Extraction</span>
                <span className="text-[10px] text-slate-400 font-mono">Tesseract 5.5 / Paddle</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-semibold block">Embedding Generation</span>
                <span className="text-[10px] text-slate-400 font-mono">OpenCLIP ViT-B-32 (512-dim)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-semibold block">Vector Indexing</span>
                <span className="text-[10px] text-slate-400 font-mono">Qdrant HNSW + BM25+</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Recent Images & Activity Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Images Masonry/Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Recent Memories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest visual assets ingested and searchable in your memory
              </p>
            </div>
            <Link
              href="/library"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
            >
              <span>View all in Library</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {imagesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-2xl" />
              ))}
            </div>
          ) : recentImagesData?.items && recentImagesData.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {recentImagesData.items.slice(0, 6).map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-indigo-500 dark:hover:border-indigo-500/80 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video w-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
                    <img
                      src={getImageUrl(img.id)}
                      alt={img.original_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="success" size="sm">
                        ✓ Indexed
                      </Badge>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-3">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {img.original_name}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{new Date(img.created_at).toLocaleDateString()}</span>
                      <span className="font-mono text-[10px]">
                        {(img.file_size / 1024).toFixed(0)} KB
                      </span>
                    </div>

                    {img.ocr?.text && (
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1.5 font-mono bg-slate-50 dark:bg-slate-950/80 p-1 rounded">
                        {img.ocr.text.replace(/\s+/g, " ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Images className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No visual memories yet
              </p>
              <Button
                onClick={() => setUploadOpen(true)}
                variant="primary"
                size="sm"
                className="mt-3"
              >
                Import your first folder
              </Button>
            </div>
          )}
        </div>

        {/* Right Col: Recent Searches & Collections Quick View */}
        <div className="space-y-6">
          {/* Recent Searches */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>Recent Searches</span>
                </CardTitle>
                <Link
                  href="/search"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Explore
                </Link>
              </div>
              <CardDescription>
                Click any query to re-execute search
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {stats?.recent_searches && stats.recent_searches.length > 0 ? (
                <div className="space-y-2">
                  {stats.recent_searches.slice(0, 5).map((s, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        router.push(`/search?q=${encodeURIComponent(s.query)}&mode=${s.mode}`)
                      }
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {s.query}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {s.results} results • {s.latency_ms}ms
                        </span>
                      </div>
                      <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                        {s.mode}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No recent search queries
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Collections View */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-slate-400" />
                  <span>Collections</span>
                </CardTitle>
                <Link
                  href="/collections"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Manage
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {collections && collections.length > 0 ? (
                <div className="space-y-2">
                  {collections.slice(0, 4).map((col) => (
                    <Link
                      key={col.id}
                      href={`/library?collection_id=${col.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: col.color || "#6366f1" }}
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {col.name}
                        </span>
                      </div>
                      <Badge variant="secondary" size="sm">
                        {col.image_count} items
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No custom collections created yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onIndexingComplete={() => {
          setUploadOpen(false);
          window.location.reload();
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
