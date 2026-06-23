import React, { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Download, FileSpreadsheet, Database, Loader2, Check, AlertCircle } from "lucide-react";

export default function BackupReportsView() {
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to trigger file download in browser
  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── JSON BACKUPS ──────────────────────────────────────────────────────────
  const handleBackup = async (collName: string) => {
    setLoading(`backup_${collName}`);
    try {
      const snap = await getDocs(collection(db, collName));
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      const jsonStr = JSON.stringify(list, null, 2);
      downloadFile(`${collName}_backup_${new Date().toISOString().split("T")[0]}.json`, jsonStr, "application/json");
      showToast("success", `Backup completed for '${collName}' collection!`);
    } catch (err: any) {
      console.error("[BackupReportsView] Backup error:", err);
      showToast("error", err.message || `Backup failed for ${collName}`);
    } finally {
      setLoading(null);
    }
  };

  // ── CSV REPORTS EXPORTS ───────────────────────────────────────────────────
  const handleCSVReport = async (collName: string) => {
    setLoading(`csv_${collName}`);
    try {
      const snap = await getDocs(collection(db, collName));
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      if (list.length === 0) {
        showToast("error", `No data found in '${collName}' to export.`);
        setLoading(null);
        return;
      }

      let csvContent = "";
      if (collName === "students") {
        csvContent = "Name,Admission Number,Email,Department,Semester,Place\n" +
          list.map(s => `"${s.name || ''}","${s.admissionNo || ''}","${s.email || ''}","${s.departmentId || ''}","${s.semester || ''}","${s.place || ''}"`).join("\n");
      } else if (collName === "teachers" || collName === "faculty") {
        csvContent = "Name,Email,Department,Designation,Phone\n" +
          list.map(t => `"${t.name || ''}","${t.email || ''}","${t.departmentId || ''}","${t.designation || ''}","${t.phone || ''}"`).join("\n");
      } else if (collName === "attendance") {
        csvContent = "Student Name,Admission Number,Date,Status,Department\n" +
          list.map(a => `"${a.name || ''}","${a.admissionNo || ''}","${a.date || ''}","${a.status || ''}","${a.departmentId || ''}"`).join("\n");
      } else if (collName === "bloodbank") {
        csvContent = "Donor Name,Blood Group,Phone,WhatsApp,Place,District\n" +
          list.map(b => `"${b.name || ''}","${b.bloodGroup || ''}","${b.phone || ''}","${b.whatsapp || ''}","${b.place || ''}","${b.district || ''}"`).join("\n");
      } else if (collName === "complaints") {
        csvContent = "Title,Category,Status,Submitted By,Phone,Date\n" +
          list.map(c => `"${c.title || ''}","${c.category || ''}","${c.status || ''}","${c.name || ''}","${c.phoneNumber || ''}","${c.createdAt || ''}"`).join("\n");
      } else if (collName === "studentRequests") {
        csvContent = "Student Name,Admission Number,Request Type,Status,Created At\n" +
          list.map(r => `"${r.name || ''}","${r.admissionNo || ''}","${r.requestType || ''}","${r.status || ''}","${r.createdAt || ''}"`).join("\n");
      }

      downloadFile(`${collName}_report_${new Date().toISOString().split("T")[0]}.csv`, csvContent, "text/csv;charset=utf-8;");
      showToast("success", `CSV Report exported for '${collName}'!`);
    } catch (err: any) {
      console.error("[BackupReportsView] CSV error:", err);
      showToast("error", err.message || `Export failed for ${collName}`);
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
          <Database className="h-5 w-5 text-indigo-600" />
          Backup & Reports Center
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Generate CSV reports or download full Firestore collection backups as JSON.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reports */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Generate & Export CSV Reports
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { id: "students", label: "Students Registry" },
              { id: "teachers", label: "Faculty / Staff" },
              { id: "attendance", label: "Attendance History" },
              { id: "bloodbank", label: "Blood Bank Donors" },
              { id: "complaints", label: "Complaints Registry" },
              { id: "studentRequests", label: "Student Requests History" }
            ].map((report) => (
              <button
                key={report.id}
                onClick={() => handleCSVReport(report.id)}
                disabled={loading !== null}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition font-bold text-slate-700 disabled:opacity-50"
              >
                <span>{report.label}</span>
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px]">
                  {loading === `csv_${report.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Download CSV
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Backups */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <Database className="h-4 w-4 text-indigo-500" /> Download Firestore JSON Backups
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { id: "students", label: "Students Collection" },
              { id: "teachers", label: "Faculty Collection" },
              { id: "attendance", label: "Attendance Collection" },
              { id: "bloodbank", label: "Blood Bank Collection" },
              { id: "complaints", label: "Complaints Collection" },
              { id: "studentRequests", label: "Requests Collection" }
            ].map((backup) => (
              <button
                key={backup.id}
                onClick={() => handleBackup(backup.id)}
                disabled={loading !== null}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition font-bold text-slate-700 disabled:opacity-50"
              >
                <span>{backup.label}</span>
                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px]">
                  {loading === `backup_${backup.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Download JSON
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
