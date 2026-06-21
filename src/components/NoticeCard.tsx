import * as React from "react";
import { Notice } from "../types";
import { Calendar, Tag, ChevronRight, FileDown } from "lucide-react";
import { motion } from "motion/react";

interface NoticeCardProps {
  key?: any;
  notice: Notice;
  onReadMore: (notice: Notice) => void;
}

const categoryColors = {
  academic: "bg-blue-50 text-blue-700 border-blue-200",
  placement: "bg-emerald-50 text-emerald-700 border-emerald-200",
  event: "bg-purple-50 text-purple-700 border-purple-200",
  general: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function NoticeCard({ notice, onReadMore }: NoticeCardProps) {
  const badgeClass = categoryColors[notice.category] || categoryColors.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-xs hover:shadow-md transition-all duration-300"
    >
      <div className="absolute top-0 left-0 h-1.5 w-full bg-linear-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
      
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold leading-none ${badgeClass}`}>
            <Tag className="h-3 w-3" />
            <span className="capitalize">{notice.category}</span>
          </span>
          {notice.departmentId !== "general" && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700 uppercase leading-none border border-indigo-100">
              {notice.departmentId}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-md font-bold tracking-tight text-slate-800 transition group-hover:text-blue-600">
          {notice.title}
        </h3>
        
        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-500">
          {notice.content}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          {notice.date}
        </span>

        <button
          onClick={() => onReadMore(notice)}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition group-hover:translate-x-1"
        >
          <span>Read Notice</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
