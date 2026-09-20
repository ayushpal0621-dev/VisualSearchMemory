import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 shadow-sm backdrop-blur-[2px] transition-all",
          className
        )
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge(clsx("p-5 pb-3", className))} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={twMerge(
        clsx("text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100", className)
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={twMerge(clsx("text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed", className))}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge(clsx("p-5 pt-0", className))} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx("p-5 pt-0 flex items-center border-t border-slate-100 dark:border-slate-800/60 mt-4", className)
      )}
      {...props}
    />
  );
}
