import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { ActivityLog } from "../types";
import { Search, Filter, Shield, Clock, Calendar, User, Download, FileText } from "lucide-react";

export default function ActivityLogsView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "activityLogs"), orderBy("date", "desc"), orderBy("time", "desc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const list: ActivityLog[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setLogs(list);
      setLoading(false);
    }, (err) => {
      console.error("[ActivityLogsView] Firestore error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const textMatch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = roleFilter === "all" || log.role.toLowerCase() === roleFilter.toLowerCase();
    return textMatch && roleMatch;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = "Date,Time,User,Role,Action\n";
    const rows = filteredLogs.map(log => 
      `"${log.date}","${log.time}","${log.userName}","${log.role}","${log.action.replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `activity_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            Admin Activity Logs
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Audit trail of actions taken by administrators and student volunteers.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredLogs.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 shadow-sm shrink-0"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action or user..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
        >
          <option value="all">All Roles</option>
          <option value="student_admin">Student Admin</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-slate-400">Loading audit history...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-xs font-bold text-slate-400">No activity logs match your search criteria.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {log.date}
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                        {log.time}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {log.userName}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        log.role === "super_admin" ? "bg-purple-100 text-purple-700" :
                        log.role === "student_admin" ? "bg-emerald-100 text-emerald-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {log.role === "super_admin" ? "Super Admin" : log.role === "student_admin" ? "Student Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
