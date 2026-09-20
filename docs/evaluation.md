# Information Retrieval (IR) Evaluation Methodology

The evaluation module evaluates visual memory retrieval using standard information retrieval metrics.

## Evaluated Strategies
1. **Filename Search**: Baseline lexical matching on file basenames.
2. **OCR-only Search**: Keyword search over extracted image text.
3. **Vector Embedding**: OpenCLIP dense vector similarity retrieval.
4. **Hybrid Retrieval**: Candidate fusion of Vector + BM25 scores.
5. **Hybrid + Re-ranking**: Score adjustments based on candidate signals and metadata.

## Mathematical Formulations

### Precision@K
$$\text{Precision@}K = \frac{|\text{Retrieved}_K \cap \text{Relevant}|}{K}$$

### Recall@K
$$\text{Recall@}K = \frac{|\text{Retrieved}_K \cap \text{Relevant}|}{|\text{Relevant}|}$$

### Mean Reciprocal Rank (MRR)
$$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$$
where $\text{rank}_i$ is the position of the first relevant document for query $i$.

## Running Evaluation
- Via Web UI: Navigate to the **ML Benchmark** tab and click **Run New Benchmark**.
- Via CLI: `python -m app.cli evaluate`
Results are saved to `data/evaluation/benchmark_results.json`.
