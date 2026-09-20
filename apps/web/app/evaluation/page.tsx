"use client";

import { useState, useEffect } from "react";
import { fetchEvaluationResults, runEvaluation } from "@/lib/api";
import { BenchmarkReport, StrategyBenchmark } from "@/types";
import { BarChart3, Play, Clock, CheckCircle2, Award, Zap, Loader2 } from "lucide-react";

export default function EvaluationPage() {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadResults = () => {
    setLoading(true);
    fetchEvaluationResults()
      .then((data) => {
        if (data.results) setReport(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadResults();
  }, []);

  const handleRunEvaluation = async () => {
    setRunning(true);
    try {
      const res = await runEvaluation();
      setReport(res);
    } catch (err: any) {
      alert("Evaluation failed: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2">
            <Award className="h-3.5 w-3.5" />
            <span>Information Retrieval Benchmark Suite</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">ML Evaluation & Strategy Comparison</h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical evaluation comparing 5 retrieval methods: Precision@K, Recall@K, MRR, and Search Latency.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all shrink-0"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
          <span>{running ? "Evaluating Strategies..." : "Run New Benchmark"}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
          <p className="text-xs text-slate-400">Loading benchmark evaluation metrics...</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              <span>Evaluated on: </span>
              <span className="text-slate-200 font-mono font-medium">
                {new Date(report.timestamp).toLocaleString()}
              </span>
            </div>
            <div>
              <span>Test Corpus: </span>
              <span className="text-emerald-400 font-mono font-bold">
                {report.total_corpus_images} images
              </span>
            </div>
            <div>
              <span>Total Queries: </span>
              <span className="text-sky-400 font-mono font-bold">
                {report.total_queries} queries
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Retrieval Strategy</th>
                  <th className="py-3.5 px-3">Precision@5</th>
                  <th className="py-3.5 px-3">Precision@10</th>
                  <th className="py-3.5 px-3">Recall@5</th>
                  <th className="py-3.5 px-3">Recall@10</th>
                  <th className="py-3.5 px-3 text-emerald-400">MRR</th>
                  <th className="py-3.5 px-4 text-right">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {report.results.map((row, idx) => {
                  const isTopMRR = row.mrr === Math.max(...report.results.map((r) => r.mrr));
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isTopMRR ? "bg-emerald-950/10 font-medium" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-slate-200 font-semibold flex items-center gap-2">
                        {isTopMRR && <Award className="h-4 w-4 text-amber-400 shrink-0" />}
                        <span>{row.strategy}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono">{row.precision_at_5}</td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono">{row.precision_at_10}</td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono">{row.recall_at_5}</td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono">{row.recall_at_10}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                        {row.mrr}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-right">
                        {row.avg_latency_ms} ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Metric Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <h4 className="font-semibold text-slate-200 mb-1">Precision@K & Recall@K</h4>
              <p className="text-slate-400 leading-relaxed">
                Measures the proportion of retrieved visual memories in the top-K candidates that are genuinely relevant to the natural language query.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <h4 className="font-semibold text-emerald-400 mb-1">Mean Reciprocal Rank (MRR)</h4>
              <p className="text-slate-400 leading-relaxed">
                Evaluates ranking quality: computes 1 / Rank of the first relevant visual memory. Higher MRR indicates relevant items appear at the very top.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <h4 className="font-semibold text-sky-400 mb-1">Candidate Fusion & Reranking</h4>
              <p className="text-slate-400 leading-relaxed">
                Demonstrates how combining dense OpenCLIP vectors with sparse BM25 OCR keyword matching eliminates semantic blind spots and maximizes retrieval accuracy.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
          <BarChart3 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No benchmark report found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            Run the benchmark suite to evaluate your visual memory index across the 5 retrieval strategies.
          </p>
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
          >
            Run Benchmark Now
          </button>
        </div>
      )}
    </div>
  );
}
