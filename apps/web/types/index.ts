export interface ImageMetadata {
  date_taken?: string | null;
  camera_make?: string | null;
  camera_model?: string | null;
  embedding_model?: string | null;
  embedding_version?: string | null;
  color_palette?: string[] | null;
  processing_time_ms?: number | null;
}

export interface BoundingBox {
  text: string;
  confidence: number;
  box: number[][] | number[];
}

export interface OCRResult {
  text: string;
  confidence?: number | null;
  word_count: number;
  bounding_boxes?: BoundingBox[] | null;
}

export interface ImageItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  file_hash?: string | null;
  phash?: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message?: string | null;
  cluster_id?: number | null;
  created_at: string;
  updated_at: string;
  metadata?: ImageMetadata | null;
  ocr?: OCRResult | null;
  collections?: string[] | null;
}

export interface RetrievalSignals {
  semantic_score: number;
  keyword_score: number;
  metadata_score: number;
  final_score: number;
  matched_terms: string[];
  explanation_reasons: string[];
}

export interface SearchResultItem {
  image: ImageItem;
  score: number;
  signals: RetrievalSignals;
}

export interface SearchResponse {
  query: string;
  search_mode: string;
  total_found: number;
  latency_ms: number;
  results: SearchResultItem[];
  query_understanding?: any;
}

export interface SystemStats {
  total_images: number;
  indexed_images: number;
  failed_images: number;
  pending_images: number;
  collections_count: number;
  storage_used_bytes: number;
  storage_used_mb: number;
  ocr_coverage_percentage: number;
  recent_searches: Array<{
    query: string;
    mode: string;
    results: number;
    latency_ms: number;
    time: string;
  }>;
  recently_indexed: Array<{
    id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    created_at: string;
  }>;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  image_count: number;
  cover_image_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineGroup {
  date: string;
  year: number;
  month: number;
  day: number;
  image_count: number;
  sample_images: Array<{
    id: string;
    filename: string;
    original_name: string;
    mime_type: string;
  }>;
}

export interface DuplicateGroup {
  type: "exact" | "near";
  hash_value: string;
  similarity_score?: number | null;
  images: Array<{
    id: string;
    filename: string;
    original_name: string;
    file_size: number;
    created_at: string;
  }>;
}

export interface ClusterGroup {
  cluster_id: number;
  label: string;
  image_count: number;
  top_keywords: string[];
  sample_images: Array<{
    image_id: string;
    filename: string;
  }>;
}

export interface StrategyBenchmark {
  strategy: string;
  queries_evaluated: number;
  precision_at_5: number;
  precision_at_10: number;
  recall_at_5: number;
  recall_at_10: number;
  mrr: number;
  avg_latency_ms: number;
}

export interface BenchmarkReport {
  timestamp: string;
  total_queries: number;
  total_corpus_images: number;
  results: StrategyBenchmark[];
}
