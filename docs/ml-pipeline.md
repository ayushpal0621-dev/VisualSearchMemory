# Multimodal Indexing & ML Pipeline

```
Image Ingestion
      ↓
[Validation & Security Checks]
      ↓
[Cryptographic & Perceptual Hashing] (SHA-256 + pHash)
      ↓
[EXIF & Palette Extraction] (Date taken, Camera, 4-color palette)
      ↓
[OCR Engine] (PyTesseract / PaddleOCR) → Text, Confidence, Bounding Boxes
      ↓
[Visual Embedding Generation] (OpenCLIP ViT-B-32 on GPU/MPS/CPU)
      ↓
[Database Storage] (PostgreSQL/SQLite metadata + OCR tables)
      ↓
[Vector Database Upsert] (Qdrant collection with payload filters)
      ↓
[BM25 Index Update] (Inverted token frequency corpus)
```

## Embedding Generation
- **Model Architecture**: OpenCLIP `ViT-B-32` trained on LAION-2B.
- **Normalization**: Vectors are $L_2$-normalized to unit length:
  $$\hat{\mathbf{v}} = \frac{\mathbf{v}}{\|\mathbf{v}\|_2}$$
  allowing cosine similarity to be computed as a simple dot product:
  $$\text{sim}(\mathbf{u}, \mathbf{v}) = \mathbf{u} \cdot \mathbf{v}$$

## Optical Character Recognition (OCR)
- **Engine Hierarchy**: Primary PaddleOCR with automatic fallbacks to PyTesseract, EasyOCR, or native EXIF visual text analysis.
- **Bounding Boxes**: Extracted at word level with individual confidence metrics.
- **Keyword Tokenization**: Hyphens, underscores, and punctuation are preserved and split into constituent tokens for high-recall BM25 indexing.
