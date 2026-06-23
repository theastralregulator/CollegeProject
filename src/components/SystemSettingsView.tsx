import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SystemSettings } from "../types";
import { Settings, Save, AlertCircle, Check, Loader2, Sparkles, Image, Mail, Phone, MapPin, Globe } from "lucide-react";

export default function SystemSettingsView() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "GPTC CONNECT",
    logo: "Govt Polytechnic College Kaduthuruthy",
    heroBanner: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1470&auto=format&fit=crop",
    contactEmail: "admin@gptckaduthuruthy.edu.in",
    contactPhone: "+91 4829 283120",
    address: "Kaduthuruthy, Kottayam, Kerala - 686611",
    socialFb: "https://facebook.com/gptck",
    socialTw: "https://twitter.com/gptck",
    socialInsta: "https://instagram.com/gptck",
    footerContent: "© 2026 Govt Polytechnic College Kaduthuruthy. All rights reserved.",
    notificationEmail: "alerts@gptckaduthuruthy.edu.in",
    emailAlertsEnabled: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "systemSettings", "config");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings(snap.data() as SystemSettings);
        }
      } catch (err) {
        console.error("[SystemSettingsView] Read settings failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, "systemSettings", "config");
      await setDoc(docRef, settings);
      setToast({ type: "success", msg: "System settings updated successfully!" });
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast({ type: "error", msg: err.message || "Failed to save settings." });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-bold text-slate-400">Loading system settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in relative">
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
            <Settings className="h-5 w-5 text-indigo-600" />
            System Settings
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Configure default variables, branding, notifications, and contacts.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 shadow-sm shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Branding & Logo */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <Sparkles className="h-4 w-4 text-amber-500" /> Branding & Title
          </h4>
          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Site Display Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings(p => ({ ...p, siteName: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Logo text</label>
            <input
              type="text"
              value={settings.logo}
              onChange={(e) => setSettings(p => ({ ...p, logo: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Hero Image Banner URL</label>
            <div className="relative mt-1">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={settings.heroBanner}
                onChange={(e) => setSettings(p => ({ ...p, heroBanner: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <Mail className="h-4 w-4 text-indigo-500" /> Contact Info
          </h4>
          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Contact Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings(p => ({ ...p, contactEmail: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Contact Phone Number</label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings(p => ({ ...p, contactPhone: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Campus Address</label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <textarea
                value={settings.address}
                onChange={(e) => setSettings(p => ({ ...p, address: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Footer & Social Media */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <Globe className="h-4 w-4 text-blue-500" /> Social Links & Footer
          </h4>
          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Footer Copyright Content</label>
            <input
              type="text"
              value={settings.footerContent}
              onChange={(e) => setSettings(p => ({ ...p, footerContent: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Facebook</label>
              <input
                type="text"
                value={settings.socialFb || ""}
                onChange={(e) => setSettings(p => ({ ...p, socialFb: e.target.value }))}
                placeholder="URL"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Twitter</label>
              <input
                type="text"
                value={settings.socialTw || ""}
                onChange={(e) => setSettings(p => ({ ...p, socialTw: e.target.value }))}
                placeholder="URL"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Instagram</label>
              <input
                type="text"
                value={settings.socialInsta || ""}
                onChange={(e) => setSettings(p => ({ ...p, socialInsta: e.target.value }))}
                placeholder="URL"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Email alerts */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <Mail className="h-4 w-4 text-emerald-500" /> Notifications & Alerts
          </h4>
          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Alert Notification Email</label>
            <input
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => setSettings(p => ({ ...p, notificationEmail: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
            <div>
              <p className="font-black text-slate-700">Enable Email Alerts</p>
              <p className="text-[10px] text-slate-400 font-semibold">Send logs/complaints alert notifications.</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(p => ({ ...p, emailAlertsEnabled: !p.emailAlertsEnabled }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${settings.emailAlertsEnabled ? "bg-emerald-500" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.emailAlertsEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
