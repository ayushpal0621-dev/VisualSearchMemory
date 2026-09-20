"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Image as ImageIcon,
  FolderKanban,
  CalendarDays,
  Copy,
  Gauge,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/api";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenUpload: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse, onOpenUpload }: SidebarProps) {
  const pathname = usePathname();

  const { data: stats } = useQuery({
    queryKey: ["systemStats"],
    queryFn: fetchStats,
    refetchInterval: 15000,
  });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/search", label: "Search", icon: Search, badge: "AI" },
    { href: "/library", label: "Library", icon: ImageIcon },
    { href: "/collections", label: "Collections", icon: FolderKanban },
    { href: "/timeline", label: "Timeline", icon: CalendarDays },
    { href: "/duplicates", label: "Duplicates", icon: Copy },
  ];

  const secondaryItems = [
    { href: "/evaluation", label: "ML Benchmark", icon: Gauge },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const storageMb = stats?.storage_used_mb || 14.8;
  const storageMaxMb = 10240; // 10 GB limit
  const storagePercent = Math.min(Math.round((storageMb / storageMaxMb) * 100), 100);

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white/95 dark:bg-slate-950/95 border-r border-slate-200 dark:border-slate-800/90 transition-all duration-300 flex flex-col justify-between select-none ${
        isCollapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <Link href="/" className="flex items-center gap-3 overflow-hidden group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-slate-100 truncate">
                    VisualSearch
                  </span>
                  <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                    AI
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  Your visual memory
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="px-2.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 relative group ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-900/80"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500 text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
                {/* Floating tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary Navigation */}
        <div className="px-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {!isCollapsed ? "Platform" : "•••"}
          </div>
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 relative group ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-900/80"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer / Status Area */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
        {/* Storage Meter */}
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
            <div className="flex items-center justify-between text-[10.5px] font-medium mb-1.5">
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <HardDrive className="h-3 w-3" />
                Storage
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                {storageMb.toFixed(1)} MB
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${Math.max(storagePercent, 4)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
              <span>{stats?.total_images || 29} visual items</span>
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Indexed
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center group relative">
            <HardDrive className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              {storageMb.toFixed(1)} MB used
            </div>
          </div>
        )}

        {/* User profile & Quick Import */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7.5 w-7.5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              AP
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex flex-col">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  Ayush Pal
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  Visual Memory Pro
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
