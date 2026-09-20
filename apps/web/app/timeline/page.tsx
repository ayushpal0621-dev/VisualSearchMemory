"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Loader2,
  Calendar,
  ChevronRight,
  Filter,
  Eye,
  Images,
} from "lucide-react";
import { fetchTimeline, getImageUrl, fetchImageDetail } from "@/lib/api";
import { TimelineGroup, ImageItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import ImageDetailModal from "@/components/ImageDetailModal";

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  // Filter state
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    fetchTimeline()
      .then((data) => {
        setTimeline(data);
        if (data.length > 0) {
          setSelectedYear(data[0].year || 2026);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOpenDetail = async (imgId: string) => {
    try {
      const detail = await fetchImageDetail(imgId);
      setSelectedImage(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const months = [
    { num: 1, name: "January" },
    { num: 2, name: "February" },
    { num: 3, name: "March" },
    { num: 4, name: "April" },
    { num: 5, name: "May" },
    { num: 6, name: "June" },
    { num: 7, name: "July" },
    { num: 8, name: "August" },
    { num: 9, name: "September" },
    { num: 10, name: "October" },
    { num: 11, name: "November" },
    { num: 12, name: "December" },
  ];

  // Filter groups by selected year & month
  const filteredTimeline = useMemo(() => {
    return timeline.filter((g) => {
      const matchYear = selectedYear ? g.year === selectedYear : true;
      const matchMonth = selectedMonth !== null ? g.month === selectedMonth : true;
      return matchYear && matchMonth;
    });
  }, [timeline, selectedYear, selectedMonth]);

  const years = useMemo(() => {
    const ySet = new Set<number>();
    timeline.forEach((g) => ySet.add(g.year));
    return Array.from(ySet).sort((a, b) => b - a);
  }, [timeline]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Explore your visual journey grouped chronologically by year, month, and day
          </p>
        </div>

        {/* Year Tabs */}
        {years.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedYear === y
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Month Navigation Rail */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedMonth(null)}
          className={`px-3 py-1.5 rounded-xl border font-semibold shrink-0 transition-colors cursor-pointer ${
            selectedMonth === null
              ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          All Months
        </button>
        {months.map((m) => {
          const hasImages = timeline.some(
            (t) => t.year === selectedYear && t.month === m.num
          );
          const active = selectedMonth === m.num;

          return (
            <button
              key={m.num}
              onClick={() => setSelectedMonth(m.num)}
              className={`px-3 py-1.5 rounded-xl border font-medium shrink-0 transition-colors cursor-pointer ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                  : hasImages
                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 font-semibold"
                  : "bg-transparent text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-6 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredTimeline.length > 0 ? (
        <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-3 sm:ml-6 space-y-8 pl-5 sm:pl-8 py-2">
          {filteredTimeline.map((group, idx) => {
            const dateObj = new Date(group.date);
            const formattedDate = dateObj.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <div key={idx} className="relative group space-y-3">
                {/* Visual node on timeline spine */}
                <div className="absolute -left-[27px] sm:-left-[39px] top-1 h-5 w-5 rounded-full bg-white dark:bg-slate-950 border-3 border-indigo-600 text-indigo-600 shadow-sm flex items-center justify-center" />

                {/* Day Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formattedDate}
                    </h2>
                    <Badge variant="primary" size="sm">
                      {group.image_count} visual memories
                    </Badge>
                  </div>
                </div>

                {/* Image Previews Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                  {group.sample_images.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => handleOpenDetail(img.id)}
                      className="group/card relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 aspect-square cursor-pointer hover:border-indigo-500 transition-all shadow-2xs hover:shadow-sm"
                    >
                      <img
                        src={getImageUrl(img.id)}
                        alt={img.original_name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white font-medium truncate">
                          {img.original_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-md mx-auto p-6 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No memories for this period
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Select &ldquo;All Months&rdquo; or a different year to browse your visual timeline.
          </p>
          <Button
            onClick={() => {
              setSelectedMonth(null);
            }}
            variant="outline"
            size="sm"
          >
            Reset Timeline Filters
          </Button>
        </div>
      )}

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
