import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Shield, Clock, Calendar, User, Search, Filter, AlertTriangle, Check, AlertCircle, Monitor, RefreshCw, Key } from "lucide-react";

interface LoginHistoryItem {
  id: string;
  userName: string;
  email: string;
  role: string;
  loginDate: string;
  loginTime: string;
  logoutTime?: string;
  sessionDuration?: number;
  timestamp: string;
}

interface SecurityLogItem {
  id: string;
  type: string;
  emailEntered?: string;
  targetUser?: string;
  targetEmail?: string;
  action?: string;
  errorCode?: string;
  errorMessage?: string;
  date: string;
  time: string;
  timestamp: string;
}

const ROLE_LABELS: Record<string, string> = {
  student_admin: "Student Admin",
  support_admin: "Support Admin",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  student_admin: "bg-emerald-100 text-emerald-700 border-emerald-200",
  support_admin: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function SecurityCenter() {
  const [logins, setLogins] = useState<LoginHistoryItem[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"logins" | "failed">("logins");
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    // 1. Listen to successful logins (login_history)
    const qLogins = query(collection(db, "login_history"), orderBy("timestamp", "desc"), limit(100));
    const unsubLogins = onSnapshot(qLogins, (snap) => {
      const list: LoginHistoryItem[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as LoginHistoryItem);
      });
      setLogins(list);
    }, (err) => {
      console.error("[SecurityCenter] Login history listener failed:", err);
    });

    // 2. Listen to security logs (security_logs)
    const qSec = query(collection(db, "security_logs"), orderBy("timestamp", "desc"), limit(100));
    const unsubSec = onSnapshot(qSec, (snap) => {
      const list: SecurityLogItem[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SecurityLogItem);
      });
      setSecurityLogs(list);
      setLoading(false);
    }, (err) => {
      console.error("[SecurityCenter] Security logs listener failed:", err);
      setLoading(false);
    });

    return () => {
      unsubLogins();
      unsubSec();
    };
  }, []);

  // Format session duration (seconds -> readable string)
  const formatDuration = (sec?: number) => {
    if (!sec || sec <= 0) return "Active Session";
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    if (mins < 60) return `${mins}m ${remainingSec}s`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  // Filter logins
  const filteredLogins = logins.filter((item) => {
    const text = searchQuery.toLowerCase().trim();
    const nameMatch = !text || item.userName?.toLowerCase().includes(text) || item.email?.toLowerCase().includes(text);
    const dateMatch = !dateFilter || item.loginDate === dateFilter;
    const roleMatch = roleFilter === "all" || item.role === roleFilter;
    return nameMatch && dateMatch && roleMatch;
  });

  // Filter security events
  const filteredSecurity = securityLogs.filter((item) => {
    const text = searchQuery.toLowerCase().trim();
    const targetMatch = !text || 
      item.emailEntered?.toLowerCase().includes(text) || 
      item.targetUser?.toLowerCase().includes(text) || 
      item.targetEmail?.toLowerCase().includes(text) ||
      item.errorMessage?.toLowerCase().includes(text) ||
      item.action?.toLowerCase().includes(text) ||
      item.errorCode?.toLowerCase().includes(text);
    const dateMatch = !dateFilter || item.date === dateFilter;
    
    // For failed logins, try checking if role is mentioned, otherwise allow roleFilter == "all"
    const matchesRole = roleFilter === "all" || 
      (item.type === "failed_login" && roleFilter === "admin") || // fallback failed login to admin search
      (item.action?.toLowerCase().includes(ROLE_LABELS[roleFilter]?.toLowerCase() || ""));
      
    return targetMatch && dateMatch && matchesRole;
  });

  const totalLogins = logins.length;
  const failedAttempts = securityLogs.filter(s => s.type === "failed_login").length;

  return (
    <div className="space-y-6 animate-fade-in text-xs relative">
      {/* Header */}
      <div>
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-650" />
          Security Center Dashboard
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Real-time session monitoring, login auditing, and failed authorization logs.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center gap-4 shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Shield className="h-6 w-6" />
          </span>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase">Shield Integrity</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">Active</p>
          </div>
        </div>
        
        <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center gap-4 shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Check className="h-6 w-6" />
          </span>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase">Total Successful Logins</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{totalLogins}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 flex items-center gap-4 shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase">Failed Login Attempts</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{failedAttempts}</p>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 flex flex-col md:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, email, action, error message..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 min-w-[140px]"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 min-w-[130px]"
          >
            <option value="all">All Roles</option>
            <option value="student_admin">Student Admin</option>
            <option value="support_admin">Support Admin</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          {(searchQuery || dateFilter || roleFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDateFilter("");
                setRoleFilter("all");
              }}
              className="px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold transition cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab("logins")}
          className={`pb-3 px-5 font-black uppercase tracking-wider text-[10px] border-b-2 transition cursor-pointer ${
            activeTab === "logins" 
              ? "border-indigo-650 text-indigo-650" 
              : "border-transparent text-slate-400 hover:text-indigo-650"
          }`}
        >
          Recent Logins ({filteredLogins.length})
        </button>
        <button
          onClick={() => setActiveTab("failed")}
          className={`pb-3 px-5 font-black uppercase tracking-wider text-[10px] border-b-2 transition cursor-pointer ${
            activeTab === "failed" 
              ? "border-indigo-650 text-indigo-650" 
              : "border-transparent text-slate-400 hover:text-indigo-650"
          }`}
        >
          Security Alerts & Failures ({filteredSecurity.length})
        </button>
      </div>

      {/* Main logs display */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs min-h-[250px]">
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            Loading security events...
          </div>
        ) : activeTab === "logins" ? (
          // ── SUCCESSFUL LOGINS FEED ──
          filteredLogins.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold">No successful login records match the active filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Login Time</th>
                    <th className="p-3.5">Logout Time</th>
                    <th className="p-3.5">Session Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredLogins.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 text-[11px]">{item.userName}</span>
                          <span className="text-[10px] text-slate-400">{item.email}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${ROLE_COLORS[item.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {ROLE_LABELS[item.role] || item.role}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {item.loginDate}
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                          {item.loginTime}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500">
                        {item.logoutTime ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {item.logoutTime}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            Active Now
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-600">
                        {formatDuration(item.sessionDuration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // ── SECURITY LOGS & FAILED LOGINS FEED ──
          filteredSecurity.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold">No security alert records match the active filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="p-3.5">Log Event</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Event Type</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredSecurity.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          {item.type === "failed_login" ? (
                            <>
                              <span className="font-extrabold text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                Failed Login Attempt
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Entered: {item.emailEntered}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-extrabold text-indigo-700 flex items-center gap-1">
                                <Key className="h-3.5 w-3.5 shrink-0" />
                                {item.action}
                              </span>
                              {item.targetUser && (
                                <span className="text-[10px] text-slate-400 mt-0.5">Target: {item.targetUser} ({item.targetEmail})</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {item.date}
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                          {item.time}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          item.type === "failed_login" ? "bg-red-50 text-rose-700 border-rose-200" :
                          item.type === "suspension" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-indigo-50 text-indigo-755 border-indigo-200"
                        }`}>
                          {item.type === "failed_login" ? "Failed Login" : item.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {item.type === "failed_login" ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-red-650 text-[10px]">{item.errorCode}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">{item.errorMessage}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">{item.action}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
