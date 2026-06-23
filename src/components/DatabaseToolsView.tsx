import React, { useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Trash2, AlertTriangle, ShieldCheck, Check, Search, RefreshCw, Loader2, AlertCircle } from "lucide-react";

interface DuplicateItem {
  id: string;
  key: string;
  name: string;
  details: string;
  docData: any;
}

export default function DatabaseToolsView() {
  const [loading, setLoading] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [targetType, setTargetType] = useState<"students" | "bloodbank" | "attendance" | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const findDuplicates = async (type: "students" | "bloodbank" | "attendance") => {
    setLoading(type);
    setTargetType(type);
    setDuplicates([]);
    try {
      const snap = await getDocs(collection(db, type));
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      const duplicateList: DuplicateItem[] = [];
      const seen = new Map<string, string>(); // key -> id

      if (type === "students") {
        list.forEach((item) => {
          const key = (item.admissionNo || "").trim().toLowerCase();
          if (!key) return;
          if (seen.has(key)) {
            duplicateList.push({
              id: item.id,
              key,
              name: item.name || "Student",
              details: `Admission No: ${item.admissionNo} | Dept: ${item.departmentId} | Sem: ${item.semester}`,
              docData: item
            });
          } else {
            seen.set(key, item.id);
          }
        });
      } else if (type === "bloodbank") {
        list.forEach((item) => {
          const key = (item.phone || item.whatsapp || "").trim().replace(/\s+/g, "");
          if (!key) return;
          if (seen.has(key)) {
            duplicateList.push({
              id: item.id,
              key,
              name: item.name || "Donor",
              details: `Phone: ${item.phone} | Blood: ${item.bloodGroup} | Place: ${item.place}`,
              docData: item
            });
          } else {
            seen.set(key, item.id);
          }
        });
      } else if (type === "attendance") {
        list.forEach((item) => {
          const key = `${(item.admissionNo || "").trim().toLowerCase()}_${(item.date || "").trim()}`;
          if (!item.admissionNo || !item.date) return;
          if (seen.has(key)) {
            duplicateList.push({
              id: item.id,
              key,
              name: item.name || item.admissionNo,
              details: `Date: ${item.date} | Status: ${item.status || "Present"} | Dept: ${item.departmentId}`,
              docData: item
            });
          } else {
            seen.set(key, item.id);
          }
        });
      }

      setDuplicates(duplicateList);
      showToast("success", `Found ${duplicateList.length} duplicate records!`);
    } catch (err: any) {
      console.error("[DatabaseToolsView] Query error:", err);
      showToast("error", err.message || "Failed to scan database.");
    } finally {
      setLoading(null);
    }
  };

  const removeDuplicates = async () => {
    if (!targetType || duplicates.length === 0) return;
    setLoading("deleting");
    let count = 0;
    try {
      for (const item of duplicates) {
        await deleteDoc(doc(db, targetType, item.id));
        count++;
      }
      showToast("success", `Successfully removed ${count} duplicate records!`);
      setDuplicates([]);
    } catch (err: any) {
      console.error("[DatabaseToolsView] Delete error:", err);
      showToast("error", `Removed ${count} records before failure: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs relative">
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
          <RefreshCw className="h-5 w-5 text-indigo-600" />
          Database Tools & Maintenance
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Scan Firestore collections to identify and remove duplicate records.
        </p>
      </div>

      {/* Action panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "students", label: "Students Registry", desc: "Checks duplicates by Admission Number." },
          { id: "bloodbank", label: "Blood Donors", desc: "Checks duplicates by Phone/WhatsApp number." },
          { id: "attendance", label: "Attendance Logs", desc: "Checks duplicates by Admission No + Date." },
        ].map((tool) => (
          <div key={tool.id} className="rounded-3xl border border-slate-100 bg-white p-5 space-y-3.5 flex flex-col justify-between shadow-xs">
            <div>
              <p className="font-black text-slate-800 text-sm">{tool.label}</p>
              <p className="text-slate-400 font-semibold mt-0.5">{tool.desc}</p>
            </div>
            <button
              onClick={() => findDuplicates(tool.id as any)}
              disabled={loading !== null}
              className="w-full rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-750 py-2.5 font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading === tool.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Scan {tool.label}
            </button>
          </div>
        ))}
      </div>

      {/* Duplicate list results */}
      {targetType && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h4 className="font-black text-slate-800 text-sm">
                Scan Results: <span className="capitalize">{targetType}</span>
              </h4>
              <p className="text-slate-400 font-semibold mt-0.5">
                Found {duplicates.length} duplicate records. Primary entries are kept intact.
              </p>
            </div>
            {duplicates.length > 0 && (
              <button
                onClick={removeDuplicates}
                disabled={loading !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 font-bold transition disabled:opacity-50 shadow-sm shrink-0"
              >
                {loading === "deleting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Purge All Duplicates
              </button>
            )}
          </div>

          {duplicates.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold flex flex-col items-center gap-2">
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
              <span>Database collection is clean. No duplicates detected!</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {duplicates.map((dup, idx) => (
                <div key={dup.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-slate-800">
                      #{idx + 1} - {dup.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{dup.details}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-black text-[10px] border border-red-100 flex items-center gap-1 shrink-0">
                    <AlertTriangle className="h-3 w-3" /> Duplicate
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
