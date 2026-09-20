import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "VisualSearch Memory | AI-Powered Multimodal Semantic Search",
  description: "Personal visual memory system featuring OpenCLIP embeddings, OCR, Qdrant vector search, and hybrid BM25 retrieval.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors selection:bg-indigo-500 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
