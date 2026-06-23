import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MessageSquare, ShieldAlert, CheckCircle, Send } from "lucide-react";
import { Department } from "../types";

interface ComplaintViewProps {
  departments: Department[];
}

const CATEGORIES = [
  "Academic Issues",
  "Faculty Related",
  "Laboratory Issues",
  "Infrastructure",
  "Library",
  "Examination",
  "Attendance",
  "Placement",
  "Ragging Complaint",
  "Suggestion",
  "Other"
];

export default function ComplaintView({ departments }: ComplaintViewProps) {
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    department: "computer",
    semester: 5,
    category: "Academic Issues",
    title: "",
    description: "",
    isAnonymous: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      const collectionRef = collection(db, "complaints");
      const timestamp = new Date().toISOString();
      
      const complaintPayload = {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || "",
        department: form.department,
        semester: Number(form.semester),
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        isAnonymous: form.isAnonymous,
        status: "Pending",
        adminRemarks: "",
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const docRef = await addDoc(collectionRef, complaintPayload);
      
      setSubmitStatus("success");
      setForm({
        name: "",
        phoneNumber: "",
        email: "",
        department: "computer",
        semester: 5,
        category: "Academic Issues",
        title: "",
        description: "",
        isAnonymous: false
      });
    } catch (err: any) {
      console.error("Error submitting complaint:", err);
      setSubmitStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card banner */}
      <div className="rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-indigo-100/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
          <MessageSquare className="h-44 w-44" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-sans uppercase">GPTC Connect Complaint Box</h2>
          <p className="text-xs text-indigo-100 font-semibold max-w-lg leading-relaxed">
            Submit grievances, academic feedback, suggestions, or facility concerns. Your feedback helps improve Govt Polytechnic College Kaduthuruthy.
          </p>
        </div>
      </div>

      {submitStatus === "success" && (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-6 text-center space-y-3 animate-fade-in">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-md font-bold text-emerald-800">Submission Successful</h3>
          <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed font-semibold">
            Your complaint has been submitted successfully. The administration will review your complaint and take necessary action. Thank you for helping improve GPTC Kaduthuruthy.
          </p>
          <button
            onClick={() => setSubmitStatus(null)}
            className="mt-2 rounded-xl bg-emerald-650 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold transition-all uppercase tracking-wider"
          >
            Submit Another Complaint
          </button>
        </div>
      )}

      {submitStatus !== "success" && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans">
            {submitStatus === "error" && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 font-bold flex gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Checkbox for anonymous submission */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={form.isAnonymous}
                onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                className="mt-1 h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <label htmlFor="isAnonymous" className="font-extrabold text-slate-800 cursor-pointer flex items-center gap-1.5">
                  Submit Anonymously
                </label>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  If selected, your personal details (Name, Phone, Email) will be masked as <strong>Anonymous User</strong> in the Admin Dashboard lists and details. The administration will securely store the data for safety reviews only.
                </p>
              </div>
            </div>

            {/* Student Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50/30 focus:bg-white outline-none focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="e.g. +91 9447XXXXXX"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50/30 focus:bg-white outline-none focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. student@gptckaduthuruthy.ac.in"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50/30 focus:bg-white outline-none focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Complaint Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Complaint Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Summarize your concern in one sentence..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50/30 focus:bg-white outline-none focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Detailed Description</label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide clear details, dates, or instances of the issue you are facing..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-800 bg-slate-50/30 focus:bg-white outline-none focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 text-xs font-bold transition-all shadow-md shadow-indigo-200/50 flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Submit to Administration"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
