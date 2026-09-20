"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Image as ImageIcon,
  FolderKanban,
  Settings,
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/search", label: "Search", icon: Search },
    { href: "/library", label: "Library", icon: ImageIcon },
    { href: "/collections", label: "Collections", icon: FolderKanban },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 flex items-center justify-around select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
