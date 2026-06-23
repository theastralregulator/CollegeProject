import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Announcement } from "../types";
import { Megaphone, Send, AlertTriangle, Clock, Trash2, Calendar, Check, AlertCircle, Loader2 } from "lucide-react";

export default function AnnouncementCenter() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"global" | "emergency">("global");
  const [scheduleTime, setScheduleTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
        type,
        publishDate: new Date().toISOString(),
        ...(scheduleTime ? { scheduleTime } : {})
      };
      await addDoc(collection(db, "announcements"), payload);
      setToast({ type: "success", msg: scheduleTime ? "Announcement scheduled!" : "Global announcement broadcasted!" });
      setTimeout(() => setToast(null), 4000);
      setTitle("");
      setContent("");
      setScheduleTime("");
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
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Announcement Type</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setType("global")}
                  className={`py-2 rounded-xl border font-bold text-center transition ${
                    type === "global" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-500"
                  }`}
                >
                  Global Info
                </button>
                <button
                  type="button"
                  onClick={() => setType("emergency")}
                  className={`py-2 rounded-xl border font-bold text-center transition flex items-center justify-center gap-1 ${
                    type === "emergency" ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-slate-200 text-slate-500"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Emergency
                </button>
              </div>
            </div>
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
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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
                  className={`rounded-2xl border p-4 flex gap-3 items-start ${
                    ann.type === "emergency" ? "bg-red-50/50 border-red-100" : "bg-slate-50/50 border-slate-100"
                  }`}
                >
                  <span className={`p-2 rounded-xl shrink-0 ${
                    ann.type === "emergency" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"
                  }`}>
                    {ann.type === "emergency" ? <AlertTriangle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black text-slate-800 text-sm truncate">{ann.title}</p>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition hover:bg-slate-100 shrink-0"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-600 font-semibold mt-1 leading-relaxed">{ann.content}</p>
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
