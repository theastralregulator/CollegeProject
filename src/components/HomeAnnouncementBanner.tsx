import React, { useState, useEffect } from "react";
import { Announcement } from "../types";
import { Megaphone, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HomeAnnouncementBannerProps {
  announcements: Announcement[];
}

export default function HomeAnnouncementBanner({ announcements }: HomeAnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // 1. Filter out scheduled items that aren't active yet, and dismissed items
  const nowStr = new Date().toISOString();
  const visibleAnnouncements = announcements
    .filter((ann) => {
      // If scheduled in the future, don't show yet
      if (ann.scheduleTime && ann.scheduleTime > nowStr) return false;
      // If dismissed, don't show
      return !dismissedIds.includes(ann.id);
    })
    .sort((a, b) => {
      // Sort Emergency first, then Important, then Normal
      const score = (priority: string) => {
        if (priority === "emergency") return 3;
        if (priority === "important") return 2;
        return 1;
      };
      return score(b.priority || "normal") - score(a.priority || "normal");
    });

  // 2. Handle auto-cycling
  useEffect(() => {
    if (visibleAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % visibleAnnouncements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [visibleAnnouncements.length]);

  // Adjust active index if it exceeds list size
  useEffect(() => {
    if (activeIndex >= visibleAnnouncements.length && visibleAnnouncements.length > 0) {
      setActiveIndex(0);
    }
  }, [visibleAnnouncements.length, activeIndex]);

  if (visibleAnnouncements.length === 0) return null;

  const currentAnn = visibleAnnouncements[activeIndex];
  const isEmergency = currentAnn.priority === "emergency";

  // Priority specific styling
  const bgStyle = currentAnn.bgColor || (isEmergency ? "#fef2f2" : "#eff6ff");
  const textStyle = currentAnn.textColor || (isEmergency ? "#b91c1c" : "#1d4ed8");
  const borderStyle = currentAnn.borderColor || (isEmergency ? "#fecaca" : "#bfdbfe");

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative rounded-2xl border-2 p-3.5 sm:p-4 shadow-sm flex flex-col gap-2 bg-clip-padding backdrop-blur-xs select-none shrink-0"
      style={{
        backgroundColor: bgStyle,
        color: textStyle,
        borderColor: borderStyle,
      }}
    >
      {/* Self-contained CSS rules for marquee and pause effects */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(100%, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        .marquee-container {
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
          position: relative;
        }
        .marquee-inner {
          display: inline-block;
          animation: marquee 28s linear infinite;
        }
        .marquee-inner:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Main Row */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Left Side Label Badge */}
        <span 
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 bg-white/70 shadow-3xs border"
          style={{ borderColor: borderStyle }}
        >
          {isEmergency ? (
            <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-red-655" />
          ) : (
            <Megaphone className="h-3.5 w-3.5" />
          )}
          <span>Announcement</span>
        </span>

        {/* Priority Badge */}
        <span 
          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border"
          style={{
            backgroundColor: isEmergency ? "#fee2e2" : currentAnn.priority === "important" ? "#fef3c7" : "#dbeafe",
            borderColor: borderStyle,
            color: textStyle
          }}
        >
          {currentAnn.priority || "Normal"}
        </span>

        {/* Title (Static) */}
        <span className="font-extrabold text-xs hidden md:inline shrink-0 truncate max-w-[150px]">
          {currentAnn.title}:
        </span>

        {/* Marquee Body Text (Moving right to left, pauses on hover) */}
        <div className="marquee-container flex-1 min-w-0 text-xs font-semibold">
          <div className="marquee-inner pl-[20%] cursor-pointer hover:font-bold">
            <span className="md:hidden font-extrabold mr-1">{currentAnn.title} — </span>
            {currentAnn.content}
            <span className="ml-8 text-[10px] opacity-60">
              ({new Date(currentAnn.publishDate).toLocaleDateString()})
            </span>
          </div>
        </div>

        {/* Dismiss Trigger */}
        {!isEmergency && (
          <button
            onClick={(e) => handleDismiss(currentAnn.id, e)}
            className="p-1 rounded-lg hover:bg-white/50 transition cursor-pointer shrink-0"
            title="Dismiss Alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Carousel dots indicators */}
      {visibleAnnouncements.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-0.5 shrink-0">
          {visibleAnnouncements.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === activeIndex ? "w-3" : "opacity-40"
              }`}
              style={{ backgroundColor: textStyle }}
              title={`View slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
