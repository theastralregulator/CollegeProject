import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Announcement } from "../types";
import { Megaphone, Send, AlertTriangle, Clock, Trash2, Calendar, Check, AlertCircle, Loader2 } from "lucide-react";

export default function AnnouncementCenter() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "emergency">("normal");
  const [colorPreset, setColorPreset] = useState<"info" | "success" | "warning" | "emergency" | "special" | "custom">("info");
  const [bgColor, setBgColor] = useState("#eff6ff");
  const [textColor, setTextColor] = useState("#1d4ed8");
  const [borderColor, setBorderColor] = useState("#bfdbfe");
  const [scheduleTime, setScheduleTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const PRESET_COLORS = {
    info: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    success: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    warning: { bg: "#fff7ed", text: "#c2410c", border: "#ffedd5" },
    emergency: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
    special: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" }
  };

  useEffect(() => {
    if (priority === "emergency") {
      setColorPreset("emergency");
      setBgColor(PRESET_COLORS.emergency.bg);
      setTextColor(PRESET_COLORS.emergency.text);
      setBorderColor(PRESET_COLORS.emergency.border);
    } else if (colorPreset !== "custom") {
      const colors = PRESET_COLORS[colorPreset];
      if (colors) {
        setBgColor(colors.bg);
        setTextColor(colors.text);
        setBorderColor(colors.border);
      }
    }
  }, [colorPreset, priority]);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("publishDate", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Announcement[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Announcement);
      });
      setAnnouncements(list);
      setLoading(false);
    }, (err) => {
      console.error("[AnnouncementCenter] Firestore error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    try {
      const payload: Omit<Announcement, "id"> = {
        title: title.trim(),
        content: content.trim(),
        type: priority === "emergency" ? "emergency" : "global",
        priority,
        bgColor,
        textColor,
        borderColor,
        publishDate: new Date().toISOString(),
        ...(scheduleTime ? { scheduleTime } : {})
      };
      await addDoc(collection(db, "announcements"), payload);
      setToast({ type: "success", msg: scheduleTime ? "Announcement scheduled!" : "Global announcement broadcasted!" });
      setTimeout(() => setToast(null), 4000);
      setTitle("");
      setContent("");
      setScheduleTime("");
      setPriority("normal");
      setColorPreset("info");
    } catch (err: any) {
      setToast({ type: "error", msg: err.message || "Broadcast failed." });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      setToast({ type: "success", msg: "Announcement deleted." });
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast({ type: "error", msg: "Delete failed." });
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative text-xs">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs font-bold shadow-xl border ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {toast.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-amber-500" />
          Announcement Center
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Send emergency alerts or schedule default site notifications for campus users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-100 bg-white p-6 space-y-4 h-fit">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <Send className="h-4 w-4 text-indigo-500" /> Broadcast New Announcement
          </h4>
          <form onSubmit={handlePublish} className="space-y-3.5">
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Notice Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Campus Holiday or Emergency Advisory"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Notification Body *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Compose announcement body..."
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Priority Level</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {[
                  { id: "normal", label: "Normal" },
                  { id: "important", label: "Important" },
                  { id: "emergency", label: "Emergency", icon: AlertTriangle }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = priority === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPriority(item.id as any)}
                      className={`py-2 rounded-xl border font-bold text-center transition flex items-center justify-center gap-1 cursor-pointer ${
                        isActive 
                          ? item.id === "emergency" 
                            ? "bg-red-50 border-red-200 text-red-700 font-extrabold" 
                            : item.id === "important"
                              ? "bg-amber-50 border-amber-200 text-amber-700 font-extrabold"
                              : "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Theme Color Schema</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {[
                  { id: "info", label: "Blue (Info)" },
                  { id: "success", label: "Green (Success)" },
                  { id: "warning", label: "Orange (Warn)" },
                  { id: "emergency", label: "Red (Alert)" },
                  { id: "special", label: "Purple (Event)" },
                  { id: "custom", label: "Custom Hex" }
                ].map((item) => {
                  const isActive = colorPreset === item.id;
                  const isDisabled = priority === "emergency" && item.id !== "emergency";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setColorPreset(item.id as any)}
                      className={`py-2 rounded-xl border font-bold text-center transition cursor-pointer text-[10px] ${
                        isActive 
                          ? "bg-slate-800 border-slate-900 text-white font-extrabold" 
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {colorPreset === "custom" && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-fade-in">
                <div className="text-center space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Background</label>
                  <div className="flex items-center justify-center">
                    <input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-7 w-7 rounded-lg border border-slate-200 cursor-pointer p-0"
                    />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Text Color</label>
                  <div className="flex items-center justify-center">
                    <input 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-7 w-7 rounded-lg border border-slate-200 cursor-pointer p-0"
                    />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Border Color</label>
                  <div className="flex items-center justify-center">
                    <input 
                      type="color" 
                      value={borderColor} 
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="h-7 w-7 rounded-lg border border-slate-200 cursor-pointer p-0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Schedule Release (Optional)</label>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={publishing || !title.trim() || !content.trim()}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              {scheduleTime ? "Schedule Notice" : "Broadcast Notice"}
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <Clock className="h-4 w-4 text-amber-500" /> Active Announcements ({announcements.length})
          </h4>
          {loading ? (
            <div className="text-center py-12 text-xs font-bold text-slate-400">Loading history...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-xs font-bold text-slate-400">No announcements broadcasted yet.</div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="rounded-2xl border p-4 flex gap-3 items-start transition"
                  style={{
                    backgroundColor: ann.bgColor || (ann.priority === "emergency" ? "#fef2f2" : "#f8fafc"),
                    color: ann.textColor || (ann.priority === "emergency" ? "#b91c1c" : "#334155"),
                    borderColor: ann.borderColor || (ann.priority === "emergency" ? "#fecaca" : "#e2e8f0")
                  }}
                >
                  <span 
                    className="p-2 rounded-xl shrink-0 border bg-white/85 shadow-2xs"
                    style={{ borderColor: ann.borderColor || "inherit" }}
                  >
                    {ann.priority === "emergency" ? (
                      <AlertTriangle className="h-4 w-4 text-red-650" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-slate-600" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <p className="font-black text-sm truncate">{ann.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          ann.priority === "emergency" ? "bg-red-200 text-red-800" :
                          ann.priority === "important" ? "bg-amber-100 text-amber-800" :
                          "bg-slate-200/60 text-slate-600"
                        }`}>
                          {ann.priority || "Normal"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-650 transition hover:bg-slate-100/60 shrink-0 cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="font-semibold mt-1 leading-relaxed text-[11px]" style={{ color: ann.textColor || "inherit" }}>
                      {ann.content}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Published: {new Date(ann.publishDate).toLocaleDateString()}
                      </span>
                      {ann.scheduleTime && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-3 w-3" />
                          Scheduled: {new Date(ann.scheduleTime).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
