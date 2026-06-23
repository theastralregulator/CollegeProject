import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Shield, Key, AlertTriangle, Users, Check, AlertCircle, Calendar, Clock, Monitor } from "lucide-react";

interface LoginHistoryItem {
  id?: string;
  email: string;
  status: "success" | "failed";
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export default function SecurityCenter() {
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Listen to login history logs
    const q = query(collection(db, "loginHistory"), orderBy("timestamp", "desc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const list: LoginHistoryItem[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as LoginHistoryItem);
      });
      setLoginHistory(list);
      setLoading(false);
    }, (err) => {
      console.error("[SecurityCenter] Login history listener failed:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
          <Shield className="h-5 w-5 text-indigo-600" />
          Security Center
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Monitor login attempts, track session history, and inspect failed logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Overview Cards */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center gap-4 shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Shield className="h-6 w-6" />
          </span>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase">Shield Integrity</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">Active</p>
          </div>
        </div>
        
        <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center gap-4 shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Check className="h-6 w-6" />
          </span>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase">Success Logins</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">
              {loginHistory.filter(l => l.status === "success").length}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center gap-4 shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase">Failed Attempts</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">
              {loginHistory.filter(l => l.status === "failed").length}
            </p>
          </div>
        </div>
      </div>

      {/* Login History Feed */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
        <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
          <Clock className="h-4 w-4 text-indigo-500" /> Recent Authentication Attempts
        </h4>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-bold">Loading security events...</div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold">No security log entries found.</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {loginHistory.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === "failed" ? "bg-red-50/30 border-red-100" : "bg-slate-50/50 border-slate-100"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-800">{item.email}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      item.status === "failed" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {item.status === "success" ? "Success" : "Failed"}
                    </span>
                  </div>
                  {item.userAgent && (
                    <p className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                      <Monitor className="h-3 w-3 shrink-0" />
                      {item.userAgent.substring(0, 80)}...
                    </p>
                  )}
                </div>
                <div className="text-right text-[10px] text-slate-400 font-bold uppercase shrink-0">
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.timestamp).toLocaleDateString()}
                    <Clock className="h-3 w-3 ml-1.5" />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
