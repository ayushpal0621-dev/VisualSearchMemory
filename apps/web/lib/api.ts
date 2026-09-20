import {
  SystemStats, SearchResponse, ImageItem, CollectionItem,
  TimelineGroup, DuplicateGroup, ClusterGroup, BenchmarkReport
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchStats(): Promise<SystemStats> {
  const res = await fetch(`${API_BASE}/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch system stats");
  return res.json();
}

export async function performSearch(params: {
  query: string;
  search_mode?: string;
  filters?: any;
  weights?: any;
  limit?: number;
}): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: params.query,
      search_mode: params.search_mode || "hybrid",
      filters: params.filters,
      weights: params.weights,
      limit: params.limit || 24,
    }),
  });
  if (!res.ok) throw new Error("Search request failed");
  return res.json();
}

export async function findSimilarImages(imageId: string, limit = 12): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/search/similar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_id: imageId, limit }),
  });
  if (!res.ok) throw new Error("Similar image search failed");
  return res.json();
}

export async function sendConversationalSearch(params: {
  messages: Array<{ role: string; content: string }>;
  current_query: string;
  filters?: any;
  limit?: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/search/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Conversational search failed");
  return res.json();
}

export async function fetchImages(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  collection_id?: string;
  cluster_id?: number;
}): Promise<{ total: number; page: number; page_size: number; items: ImageItem[] }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.page_size) query.set("page_size", params.page_size.toString());
  if (params?.status) query.set("status", params.status);
  if (params?.collection_id) query.set("collection_id", params.collection_id);
  if (params?.cluster_id !== undefined) query.set("cluster_id", params.cluster_id.toString());

  const res = await fetch(`${API_BASE}/images?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch images");
  return res.json();
}

export async function fetchImageDetail(id: string): Promise<ImageItem> {
  const res = await fetch(`${API_BASE}/images/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch image detail");
  return res.json();
}

export function getImageUrl(id: string): string {
  return `${API_BASE}/images/${id}/file`;
}

export async function deleteImage(id: string, deleteSource = false): Promise<void> {
  const res = await fetch(`${API_BASE}/images/${id}?delete_source=${deleteSource}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete image");
}

export async function uploadImages(files: File[]): Promise<any> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await fetch(`${API_BASE}/images/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Image upload failed");
  return res.json();
}

export async function importDirectory(path: string): Promise<any> {
  const formData = new FormData();
  formData.append("directory_path", path);

  const res = await fetch(`${API_BASE}/images/import-directory`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || "Directory import failed");
  }
  return res.json();
}

export async function fetchJobStatus(jobId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch job status");
  return res.json();
}

export async function fetchCollections(): Promise<CollectionItem[]> {
  const res = await fetch(`${API_BASE}/collections`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch collections");
  return res.json();
}

export async function createCollection(name: string, description?: string, color?: string): Promise<CollectionItem> {
  const res = await fetch(`${API_BASE}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, color }),
  });
  if (!res.ok) throw new Error("Failed to create collection");
  return res.json();
}

export async function addImageToCollection(collectionId: string, imageId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/collections/${collectionId}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_ids: [imageId] }),
  });
  if (!res.ok) throw new Error("Failed to add image to collection");
}

export async function fetchTimeline(): Promise<TimelineGroup[]> {
  const res = await fetch(`${API_BASE}/timeline`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

export async function fetchDuplicates(): Promise<DuplicateGroup[]> {
  const res = await fetch(`${API_BASE}/stats/duplicates`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch duplicates");
  return res.json();
}

export async function fetchClusters(): Promise<ClusterGroup[]> {
  const res = await fetch(`${API_BASE}/stats/clusters`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch clusters");
  return res.json();
}

export async function runClustering(nClusters = 4): Promise<ClusterGroup[]> {
  const res = await fetch(`${API_BASE}/stats/clusters/run?n_clusters=${nClusters}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to run clustering");
  return res.json();
}

export async function fetchEvaluationResults(): Promise<BenchmarkReport | any> {
  const res = await fetch(`${API_BASE}/evaluation/results`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch evaluation results");
  return res.json();
}

export async function runEvaluation(): Promise<BenchmarkReport> {
  const res = await fetch(`${API_BASE}/evaluation/run`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to run ML evaluation benchmark");
  }
  return res.json();
}
