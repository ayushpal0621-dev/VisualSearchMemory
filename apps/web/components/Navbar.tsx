"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, Image as ImageIcon, FolderHeart,
  Calendar, Copy, BarChart3, Settings, UploadCloud, MessageSquareCode
} from "lucide-react";

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenChat: () => void;
}

export default function Navbar({ onOpenUpload, onOpenChat }: NavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/search", label: "Search", icon: Search },
    { href: "/library", label: "Library", icon: ImageIcon },
    { href: "/collections", label: "Collections", icon: FolderHeart },
    { href: "/timeline", label: "Timeline", icon: Calendar },
    { href: "/duplicates", label: "Duplicates", icon: Copy },
    { href: "/evaluation", label: "ML Benchmark", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">VisualSearch</span>
            <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-medium border border-sky-500/20">
              Memory
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  isActive
                    ? "bg-slate-800 text-sky-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-slate-500"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
            title="Open Conversational AI Assistant"
          >
            <MessageSquareCode className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">AI Memory Assistant</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md shadow-sky-600/20 transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Import</span>
          </button>
        </div>
      </div>
    </header>
  );
}
