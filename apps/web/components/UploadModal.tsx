"use client";

import { useState, useRef } from "react";
import { uploadImages, importDirectory, fetchJobStatus } from "@/lib/api";
import { X, UploadCloud, FolderUp, CheckCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIndexingComplete: () => void;
}

export default function UploadModal({ isOpen, onClose, onIndexingComplete }: UploadModalProps) {
  const [tab, setTab] = useState<"files" | "directory">("files");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [directoryPath, setDirectoryPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [jobProgress, setJobProgress] = useState<{
    status: string;
    total: number;
    processed: number;
    failed: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const startJobPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const job = await fetchJobStatus(jobId);
        setJobProgress({
          status: job.status,
          total: job.total_images,
          processed: job.processed_images,
          failed: job.failed_images,
        });

        if (job.status === "completed" || job.status === "failed") {
          clearInterval(interval);
          setUploading(false);
          onIndexingComplete();
        }
      } catch (err) {
        clearInterval(interval);
        setUploading(false);
      }
    }, 1000);
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setErrorMsg("");
    try {
      const job = await uploadImages(selectedFiles);
      setJobProgress({
        status: "running",
        total: job.total_images,
        processed: 0,
        failed: 0,
      });
      startJobPolling(job.id);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload images");
      setUploading(false);
    }
  };

  const handleImportDirectory = async () => {
    if (!directoryPath.trim()) return;
    setUploading(true);
    setErrorMsg("");
    try {
      const job = await importDirectory(directoryPath.trim());
      setJobProgress({
        status: "running",
        total: job.total_images,
        processed: 0,
        failed: 0,
      });
      startJobPolling(job.id);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to import directory");
      setUploading(false);
    }
  };

  const progressPercent = jobProgress && jobProgress.total > 0
    ? Math.round(((jobProgress.processed + jobProgress.failed) / jobProgress.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-bold text-slate-100 mb-1">Import Visual Memory</h3>
        <p className="text-xs text-slate-400 mb-5">
          Ingest images, screenshots, notes, and documents into the multimodal vector index.
        </p>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 mb-5">
          <button
            onClick={() => setTab("files")}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "files"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            Upload Files
          </button>
          <button
            onClick={() => setTab("directory")}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "directory"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FolderUp className="h-4 w-4" />
            Import Local Folder
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Progress Tracker */}
        {uploading && jobProgress && (
          <div className="mb-5 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
                Indexing Multimodal Pipeline Active...
              </span>
              <span className="text-sky-400 font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{jobProgress.processed} of {jobProgress.total} images indexed</span>
              {jobProgress.failed > 0 && (
                <span className="text-rose-400">{jobProgress.failed} failed</span>
              )}
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>EXIF & Color Palette</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>OCR Text & Boxes</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>OpenCLIP Embedding</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Qdrant Vector + BM25</span>
              </div>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {tab === "files" && !uploading && (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-sky-500 bg-sky-950/20"
                  : "border-slate-700 hover:border-slate-600 bg-slate-950/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileInput}
                className="hidden"
              />
              <UploadCloud className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-200">
                Click or drag images here to upload
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP, GIF up to 50MB
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 font-medium mb-2">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected:
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-slate-300 font-mono">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="truncate p-1 bg-slate-950 rounded">
                      {f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleUploadFiles}
              disabled={selectedFiles.length === 0}
              className="w-full mt-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-sky-600/20 transition-colors"
            >
              Start Indexing ({selectedFiles.length})
            </button>
          </div>
        )}

        {/* Directory Tab */}
        {tab === "directory" && !uploading && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Absolute Local Directory Path
            </label>
            <input
              type="text"
              placeholder="/Users/username/Pictures/Screenshots or ./data/sample"
              value={directoryPath}
              onChange={(e) => setDirectoryPath(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-2">
              Recursively scans all folders for supported images and indexes them with OCR and multimodal embeddings.
            </p>

            <button
              onClick={handleImportDirectory}
              disabled={!directoryPath.trim()}
              className="w-full mt-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-colors"
            >
              Scan & Index Folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
