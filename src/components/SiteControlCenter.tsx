import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy, limit, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MaintenanceSettings, MaintenanceLog } from "../types";
import { 
  Settings, Save, AlertCircle, Check, Loader2, Power, Calendar, User, 
  Activity, ShieldCheck, ToggleLeft, ToggleRight, Clock
} from "lucide-react";

interface SiteControlCenterProps {
  adminData: any;
}

export default function SiteControlCenter({ adminData }: SiteControlCenterProps) {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    maintenanceMode: false,
    allowAdminAccess: true,
    allowSupportAccess: true,
    allowStudentAccess: true,
    estimatedReturnTime: "",
    lastUpdated: new Date().toISOString()
  });

  const [initialMode, setInitialMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Logs state
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Fetch initial configuration
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "systemSettings", "maintenance");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          setSettings({
            maintenanceMode: data.maintenanceMode ?? false,
            allowAdminAccess: data.allowAdminAccess ?? true,
            allowSupportAccess: data.allowSupportAccess ?? true,
            allowStudentAccess: data.allowStudentAccess ?? true,
            estimatedReturnTime: data.estimatedReturnTime ?? "",
            lastUpdated: data.lastUpdated ?? new Date().toISOString()
          });
          setInitialMode(data.maintenanceMode ?? false);
        } else {
          // Initialize defaults
          const defaultSettings: MaintenanceSettings = {
            maintenanceMode: false,
            allowAdminAccess: true,
            allowSupportAccess: true,
            allowStudentAccess: true,
            estimatedReturnTime: "",
            lastUpdated: new Date().toISOString()
          };
          await setDoc(docRef, defaultSettings);
          setSettings(defaultSettings);
          setInitialMode(false);
        }
      } catch (err) {
        console.error("[SiteControlCenter] Load settings failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Subscribe to maintenance logs
  useEffect(() => {
    const q = query(
      collection(db, "maintenanceLogs"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: MaintenanceLog[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as MaintenanceLog);
      });
      setLogs(list);
      setLogsLoading(false);
    }, (err) => {
      console.error("[SiteControlCenter] Read logs failed:", err);
      setLogsLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0]; // HH:MM:SS
      const userIdentifier = `${adminData?.name || "Super Admin"} (${adminData?.email || ""})`;

      const docRef = doc(db, "systemSettings", "maintenance");
      const updatedSettings = {
        ...settings,
        lastUpdated: now.toISOString()
      };

      // Check if status changed
      if (settings.maintenanceMode !== initialMode) {
        if (settings.maintenanceMode) {
          // Activated Maintenance Mode -> Create a new log
          await addDoc(collection(db, "maintenanceLogs"), {
            activatedBy: userIdentifier,
            activatedDate: dateStr,
            activatedTime: timeStr,
            disabledBy: "",
            disabledDate: "",
            disabledTime: "",
            createdAt: now.toISOString()
          });
        } else {
          // Deactivated Maintenance Mode -> Find the active log and close it
          const activeLog = logs.find(log => !log.disabledDate || log.disabledDate === "");
          if (activeLog && activeLog.id) {
            const logRef = doc(db, "maintenanceLogs", activeLog.id);
            await updateDoc(logRef, {
              disabledBy: userIdentifier,
              disabledDate: dateStr,
              disabledTime: timeStr
            });
          } else {
            // Fallback: create a completed log if no open log was found
            await addDoc(collection(db, "maintenanceLogs"), {
              activatedBy: "Unknown (System)",
              activatedDate: dateStr,
              activatedTime: timeStr,
              disabledBy: userIdentifier,
              disabledDate: dateStr,
              disabledTime: timeStr,
              createdAt: now.toISOString()
            });
          }
        }
        setInitialMode(settings.maintenanceMode);
      }

      await setDoc(docRef, updatedSettings);
      showToast("success", "Site control configuration updated successfully!");
    } catch (err: any) {
      console.error("[SiteControlCenter] Save settings failed:", err);
      showToast("error", err.message || "Failed to update configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-bold text-slate-400">Loading control center...</div>;
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Power className="h-5 w-5 text-purple-600" />
            Site Control Center
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Manage public website availability, maintenance status, and view activation history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-3xl border border-slate-100 bg-white p-6 space-y-6 shadow-2xs">
            <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Settings className="h-4 w-4 text-purple-500" />
              Availability Configuration
            </h4>

            {/* Site Status Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 block">Site Status</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  !settings.maintenanceMode 
                    ? "border-emerald-500 bg-emerald-50/30 text-emerald-900" 
                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                }`}>
                  <input 
                    type="radio" 
                    name="siteStatus" 
                    checked={!settings.maintenanceMode} 
                    onChange={() => setSettings(p => ({ ...p, maintenanceMode: false }))}
                    className="h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-black text-xs flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                      Online Mode (Public Access)
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      The public website is fully accessible to all visitors and students.
                    </p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  settings.maintenanceMode 
                    ? "border-red-500 bg-red-50/30 text-red-900" 
                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                }`}>
                  <input 
                    type="radio" 
                    name="siteStatus" 
                    checked={settings.maintenanceMode} 
                    onChange={() => setSettings(p => ({ ...p, maintenanceMode: true }))}
                    className="h-4 w-4 text-red-600 border-slate-300 focus:ring-red-500"
                  />
                  <div>
                    <p className="font-black text-xs flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block animate-pulse" />
                      Maintenance Mode
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Public website is locked. Visitors see a custom maintenance page.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Admin Bypass Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="font-black text-slate-800">Allow Admin Access During Maintenance</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  When enabled, users with the standard Admin role can log in and access the Admin Panel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(p => ({ ...p, allowAdminAccess: !p.allowAdminAccess }))}
                className="focus:outline-none shrink-0 cursor-pointer"
              >
                {settings.allowAdminAccess ? (
                  <ToggleRight className="h-9 w-9 text-purple-600" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-slate-300" />
                )}
              </button>
            </div>

            {/* Support Admin Bypass Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="font-black text-slate-800">Allow Support Admin Access During Maintenance</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  When enabled, users with the Support Admin role can log in and access their modules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(p => ({ ...p, allowSupportAccess: !p.allowSupportAccess }))}
                className="focus:outline-none shrink-0 cursor-pointer"
              >
                {settings.allowSupportAccess ? (
                  <ToggleRight className="h-9 w-9 text-purple-600" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-slate-300" />
                )}
              </button>
            </div>

            {/* Student Admin Bypass Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="font-black text-slate-800">Allow Student Admin Access During Maintenance</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  When enabled, users with the Student Admin role can log in and access their modules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(p => ({ ...p, allowStudentAccess: !p.allowStudentAccess }))}
                className="focus:outline-none shrink-0 cursor-pointer"
              >
                {settings.allowStudentAccess ? (
                  <ToggleRight className="h-9 w-9 text-purple-600" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-slate-300" />
                )}
              </button>
            </div>

            {/* Estimated Return Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500">Estimated Return Time (Optional)</label>
              <input
                type="text"
                value={settings.estimatedReturnTime || ""}
                onChange={(e) => setSettings(p => ({ ...p, estimatedReturnTime: e.target.value }))}
                placeholder="e.g. 2 hours, 6:00 PM today, or June 25th 10:00 AM"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 font-medium">
                This message will be visible to public users on the maintenance screen to estimate offline downtime.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-50 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 font-bold transition active:scale-95 disabled:opacity-50 shadow-sm shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Site Status Settings
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-linear-to-br from-purple-900 to-indigo-900 p-6 text-white space-y-4 shadow-sm">
            <h4 className="font-black text-sm flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-300" />
              Safety Operations
            </h4>
            <p className="text-[11px] leading-relaxed text-purple-200 font-medium">
              Maintenance mode completely locks the public-facing components of the portal.
            </p>
            <div className="space-y-2 text-[10px] font-semibold text-purple-100">
              <div className="flex gap-2.5 items-start">
                <Check className="h-4 w-4 text-purple-300 shrink-0 mt-0.5" />
                <span>Super Admins always bypass maintenance limits.</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <Check className="h-4 w-4 text-purple-300 shrink-0 mt-0.5" />
                <span>Transition audit logs cannot be modified once written.</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <Check className="h-4 w-4 text-purple-300 shrink-0 mt-0.5" />
                <span>Real-time listeners propagate site locks to users instantly.</span>
              </div>
            </div>
            {settings.lastUpdated && (
              <div className="pt-3 border-t border-purple-800 text-[10px] text-purple-300 font-medium">
                Last Updated: {new Date(settings.lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div>
        <h4 className="font-black text-slate-800 flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-purple-500" />
          Maintenance Audit Trail
        </h4>
        {logsLoading ? (
          <div className="text-center py-6 text-slate-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400 font-semibold">
            No maintenance records registered in database yet.
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="p-4">Status</th>
                    <th className="p-4">Activated By</th>
                    <th className="p-4">Activated Date & Time</th>
                    <th className="p-4">Disabled By</th>
                    <th className="p-4">Disabled Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {logs.map((log) => {
                    const isActive = !log.disabledDate || log.disabledDate === "";
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                              Active Now
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {log.activatedBy}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {log.activatedDate}
                            <Clock className="h-3.5 w-3.5 text-slate-400 ml-1" />
                            {log.activatedTime}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap font-bold text-slate-800">
                          {isActive ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              {log.disabledBy}
                            </span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-500">
                          {isActive ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {log.disabledDate}
                              <Clock className="h-3.5 w-3.5 text-slate-400 ml-1" />
                              {log.disabledTime}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
