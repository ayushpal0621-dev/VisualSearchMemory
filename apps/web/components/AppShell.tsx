"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./layout/Sidebar";
import { Topbar } from "./layout/Topbar";
import { MobileNav } from "./layout/MobileNav";
import { CommandPalette } from "./layout/CommandPalette";
import UploadModal from "./UploadModal";
import ImageDetailModal from "./ImageDetailModal";
import { ImageItem } from "@/types";
import { ThemeProvider } from "./providers/ThemeProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { ToastProvider } from "./providers/ToastProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  // Global ⌘K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <QueryProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
            {/* Desktop Collapsible Left Sidebar */}
            <Sidebar
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onOpenUpload={() => setUploadOpen(true)}
            />

            {/* Main Content Area */}
            <div
              className={`flex-1 flex flex-col min-h-screen transition-all duration-300 pb-20 md:pb-6 ${
                sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[240px]"
              }`}
            >
              {/* Top Navigation Bar */}
              <Topbar
                onOpenUpload={() => setUploadOpen(true)}
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              />

              {/* Page Content Container */}
              <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
                {children}
              </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav />

            {/* ⌘K Command Palette */}
            <CommandPalette
              isOpen={commandPaletteOpen}
              onClose={() => setCommandPaletteOpen(false)}
            />

            {/* Ingestion & Import Modal */}
            <UploadModal
              isOpen={uploadOpen}
              onClose={() => setUploadOpen(false)}
              onIndexingComplete={() => {
                setUploadOpen(false);
                window.location.reload();
              }}
            />

            {/* Image Detail Viewer Modal */}
            <ImageDetailModal
              image={selectedImage}
              onClose={() => setSelectedImage(null)}
            />
          </div>
        </ToastProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
