import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "outline" | "secondary";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const base = "inline-flex items-center font-medium rounded-md tracking-tight transition-colors";
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantClasses = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60",
    primary: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60",
    success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
    warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
    destructive: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
    outline: "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-transparent",
    secondary: "bg-slate-200/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300",
  };

  return (
    <span
      className={twMerge(clsx(base, sizeClasses[size], variantClasses[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
}
