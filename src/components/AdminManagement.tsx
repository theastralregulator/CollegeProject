import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { AdminUser, AdminRole, AdminPermissions } from "../types";
import { DEFAULT_PERMISSIONS, resolvePermissions } from "../hooks/useAdminRole";
import {
  Users, Plus, Search, Trash2, Edit2, ShieldCheck, ShieldOff,
  Key, X, Check, AlertCircle, Crown, BookOpen, ClipboardList, FileText,
  Bell, GraduationCap, Clock, Droplet, MessageSquare, ClipboardCheck, Heart
} from "lucide-react";

interface AdminManagementProps {
  currentAdminUid: string;
  currentAdminEmail: string;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  student_admin: "Student Admin",
  support_admin: "Support Admin",
  admin: "Admin",
  super_admin: "Super Admin",
};
const ROLE_COLORS: Record<AdminRole, string> = {
  student_admin: "bg-emerald-100 text-emerald-700",
  support_admin: "bg-amber-100 text-amber-700",
  admin: "bg-blue-100 text-blue-700",
  super_admin: "bg-purple-100 text-purple-700",
};

const PERMISSION_LABELS: { key: keyof AdminPermissions; label: string; icon: any }[] = [
  { key: "notices", label: "Manage Notices", icon: Bell },
  { key: "teachers", label: "Manage Faculty", icon: Users },
  { key: "students", label: "Manage Students", icon: GraduationCap },
  { key: "attendance", label: "Manage Attendance", icon: Clock },
  { key: "notes", label: "Manage Notes", icon: BookOpen },
  { key: "assignments", label: "Assignments", icon: ClipboardList },
  { key: "qpapers", label: "Question Papers", icon: FileText },
  { key: "bloodbank", label: "Blood Donors", icon: Droplet },
  { key: "requests", label: "Student Requests", icon: ClipboardCheck },
  { key: "outsiderDonors", label: "Outsider Donors", icon: Heart },
  { key: "complaints", label: "Complaints", icon: MessageSquare },
];

export default function AdminManagement({ currentAdminUid, currentAdminEmail }: AdminManagementProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", role: "admin" as AdminRole, password: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit drawer state
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>("admin");
  const [editSuspended, setEditSuspended] = useState(false);
  const [editCustomPerms, setEditCustomPerms] = useState<Partial<AdminPermissions>>({});
  const [useCustomPerms, setUseCustomPerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Live listener on new Vercel-compatible "users" collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list: AdminUser[] = [];
      snap.forEach((d) => {
        const data = d.data();
        // Only list users that have a role property (i.e. admin panel users)
        if (data.role) {
          list.push({
            uid: data.uid || d.id,
            email: data.email || "",
            name: data.fullName || data.name || "Admin",
            phone: data.phone || "",
            role: data.role as AdminRole,
            suspended: data.suspended ?? false,
            customPermissions: data.permissions || data.customPermissions || {},
            createdAt: data.createdAt || new Date().toISOString(),
          });
        }
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setAdmins(list);
      setLoading(false);
    }, (err) => {
      console.error("[AdminManagement] Firestore error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      ROLE_LABELS[a.role].toLowerCase().includes(q)
    );
  });

  // ── CREATE ADMIN (Client-side, Vercel-compatible via secondary Auth app) ──
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError("Name, email and password are required."); return;
    }
    if (createForm.password.length < 6) {
      setCreateError("Password must be at least 6 characters."); return;
    }
    if (!["student_admin", "support_admin", "admin", "super_admin"].includes(createForm.role)) {
      setCreateError("Please select a valid admin role."); return;
    }
    setIsCreating(true);
    try {
      const { getApps, initializeApp, getApp } = await import("firebase/app");
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import("firebase/auth");
      const { doc, setDoc } = await import("firebase/firestore");

      const firebaseConfig = {
        apiKey: "AIzaSyCPOJ75w5cN41mmyhZxuN7URBO-X-hL0qU",
        authDomain: "ai-studio-applet-webapp-d8652.firebaseapp.com",
        projectId: "ai-studio-applet-webapp-d8652",
        storageBucket: "ai-studio-applet-webapp-d8652.firebasestorage.app",
        messagingSenderId: "349783760184",
        appId: "1:349783760184:web:56289f30d4d216fab775cd"
      };

      const secondaryAppName = "secondary-auth-creator";
      const apps = getApps();
      const secondaryApp = apps.some(a => a.name === secondaryAppName)
        ? getApp(secondaryAppName)
        : initializeApp(firebaseConfig, secondaryAppName);

      const secondaryAuth = getAuth(secondaryApp);

      // 1. Create account using secondary Auth instance
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        createForm.email.trim(),
        createForm.password
      );
      const newUid = userCredential.user.uid;

      // 2. Save additional user information in Firestore users/{uid}
      const userDocRef = doc(db, "users", newUid);
      const permissions = DEFAULT_PERMISSIONS[createForm.role];
      await setDoc(userDocRef, {
        uid: newUid,
        fullName: createForm.name,
        email: createForm.email.trim(),
        phone: createForm.phone || "",
        role: createForm.role,
        permissions,
        suspended: false,
        createdAt: new Date().toISOString(),
      });

      // 3. Clean up/sign out secondary instance
      await signOut(secondaryAuth);

      showToast("success", `Admin "${createForm.name}" created successfully!`);
      setCreateForm({ name: "", email: "", phone: "", role: "admin", password: "" });
      setShowCreate(false);
    } catch (err: any) {
      console.error("[Create Admin client-side] Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setCreateError("An account with this email address already exists.");
      } else if (err.code === "auth/invalid-email") {
        setCreateError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setCreateError("The password must be stronger (at least 6 characters).");
      } else {
        setCreateError(err.message || "Failed to create admin.");
      }
    } finally {
      setIsCreating(false);
    }

  };

  // ── OPEN EDIT DRAWER ──────────────────────────────────────────────────────
  const openEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditRole(admin.role);
    setEditSuspended(admin.suspended);
    const hasCustom = !!admin.customPermissions && Object.keys(admin.customPermissions).length > 0;
    if (admin.role === "support_admin") {
      setUseCustomPerms(true);
      setEditCustomPerms(hasCustom ? (admin.customPermissions as Partial<AdminPermissions>) : { ...DEFAULT_PERMISSIONS.support_admin });
    } else {
      setUseCustomPerms(hasCustom);
      setEditCustomPerms(hasCustom ? (admin.customPermissions as Partial<AdminPermissions>) : {});
    }
  };

  // ── SAVE EDIT (Client-side, Vercel-compatible) ───────────────────────────
  const handleSaveEdit = async () => {
    if (!editingAdmin) return;
    setIsSaving(true);
    try {
      const { doc, updateDoc, addDoc, collection } = await import("firebase/firestore");
      const userDocRef = doc(db, "users", editingAdmin.uid);
      const permissions = (useCustomPerms || editRole === "support_admin") ? editCustomPerms : DEFAULT_PERMISSIONS[editRole];

      await updateDoc(userDocRef, {
        role: editRole,
        suspended: editSuspended,
        permissions,
        updatedAt: new Date().toISOString(),
      });

      // Track suspension / activation if changed
      if (editingAdmin.suspended !== editSuspended) {
        const actionType = editSuspended ? "Account Suspension" : "Account Activation";
        const actionDesc = `${actionType} for administrator ${editingAdmin.name}`;
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toLocaleTimeString([], { hour12: false });

        try {
          await addDoc(collection(db, "activityLogs"), {
            userName: "Super Admin",
            role: "super_admin",
            action: actionDesc,
            date: dateStr,
            time: timeStr,
          });
        } catch (e) {
          console.error("Failed to log activity log:", e);
        }

        try {
          await addDoc(collection(db, "security_logs"), {
            type: editSuspended ? "suspension" : "activation",
            action: actionDesc,
            targetUser: editingAdmin.name,
            targetEmail: editingAdmin.email,
            date: dateStr,
            time: timeStr,
            timestamp: now.toISOString()
          });
        } catch (e) {
          console.error("Failed to log security log:", e);
        }
      }

      showToast("success", `Admin "${editingAdmin.name}" updated.`);
      setEditingAdmin(null);
    } catch (err: any) {
      console.error("[Save Edit client-side] Error:", err);
      showToast("error", err.message || "Failed to update admin.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── RESET PASSWORD (Client-side, Vercel-compatible via email link) ──────────
  const handleResetPassword = async () => {
    if (!showPasswordReset) return;
    const targetAdmin = admins.find((a) => a.uid === showPasswordReset);
    if (!targetAdmin) return;
    setIsResetting(true);
    try {
      const { auth: mainAuth } = await import("../firebase");
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(mainAuth, targetAdmin.email);

      // Track password reset
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toLocaleTimeString([], { hour12: false });
      const actionDesc = `Password Reset Email Sent for admin ${targetAdmin.name}`;

      try {
        const { addDoc, collection } = await import("firebase/firestore");
        await addDoc(collection(db, "activityLogs"), {
          userName: "Super Admin",
          role: "super_admin",
          action: actionDesc,
          date: dateStr,
          time: timeStr,
        });

        await addDoc(collection(db, "security_logs"), {
          type: "password_reset",
          action: actionDesc,
          targetUser: targetAdmin.name,
          targetEmail: targetAdmin.email,
          date: dateStr,
          time: timeStr,
          timestamp: now.toISOString()
        });
      } catch (e) {
        console.error("Failed to log password reset:", e);
      }

      showToast("success", `Password reset email sent to ${targetAdmin.email}.`);
      setShowPasswordReset(null);
    } catch (err: any) {
      console.error("[Reset Password client-side] Error:", err);
      showToast("error", err.message || "Failed to send password reset email.");
    } finally {
      setIsResetting(false);
    }
  };

  // ── DELETE ADMIN (Client-side, Vercel-compatible via Firestore deletion) ──
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "users", deleteConfirm.uid));
      showToast("success", `Admin "${deleteConfirm.name}" removed.`);
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error("[Delete Admin client-side] Error:", err);
      showToast("error", err.message || "Failed to delete admin.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── EFFECTIVE PERMISSIONS for preview ────────────────────────────────────
  const effectivePerms = (admin: AdminUser): AdminPermissions => {
    const base = { ...DEFAULT_PERMISSIONS[editRole] };
    if (useCustomPerms) return { ...base, ...editCustomPerms };
    return base;
  };


  return (
    <div className="space-y-6 animate-fade-in relative">
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
            <Crown className="h-5 w-5 text-purple-500" />
            Admin Management
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Create and manage admin accounts and permissions.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-xs font-bold transition active:scale-95 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Admin
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search admins by name, email or role..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
        />
      </div>

      {/* Admin list */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-slate-400">Loading admins...</div>
      ) : filteredAdmins.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-xs font-bold text-slate-400">No admins found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAdmins.map((admin) => (
            <div
              key={admin.uid}
              className={`rounded-2xl border bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs transition ${
                admin.suspended ? "border-red-100 opacity-70" : "border-slate-100"
              }`}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-black text-sm uppercase">
                {admin.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black text-slate-800">{admin.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${ROLE_COLORS[admin.role]}`}>
                    {ROLE_LABELS[admin.role]}
                  </span>
                  {admin.suspended && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-600">
                      Suspended
                    </span>
                  )}
                  {admin.uid === currentAdminUid && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                      You
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{admin.email}</p>
                {admin.phone && <p className="text-[10px] text-slate-400 font-semibold">{admin.phone}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(admin)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-500 hover:text-blue-600 transition"
                  title="Edit admin"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setShowPasswordReset(admin.uid); setNewPassword(""); }}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-500 hover:text-amber-600 transition"
                  title="Reset password"
                >
                  <Key className="h-3.5 w-3.5" />
                </button>
                {admin.uid !== currentAdminUid && (
                  <button
                    onClick={() => setDeleteConfirm(admin)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 transition"
                    title="Delete admin"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE ADMIN MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full border border-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Plus className="h-4 w-4 text-purple-600" />Create New Admin
              </h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              {createError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-700 font-bold">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{createError}
                </div>
              )}
              {[
                { label: "Full Name *", key: "name", type: "text", placeholder: "e.g. Sabin Saji" },
                { label: "Email Address *", key: "email", type: "email", placeholder: "admin@example.com" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "+91 9876543210" },
                { label: "Password *", key: "password", type: "password", placeholder: "Min. 6 characters" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">{label}</label>
                  <input
                    type={type}
                    value={(createForm as any)[key]}
                    onChange={(e) => setCreateForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500"
                  />
                </div>
              ))}
              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as AdminRole }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-purple-500"
                >
                  <option value="student_admin">Student Admin</option>
                  <option value="support_admin">Support Admin</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-3 font-bold transition disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create Admin"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT DRAWER MODAL ── */}
      {editingAdmin && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full border border-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-600" />Edit — {editingAdmin.name}
              </h3>
              <button onClick={() => setEditingAdmin(null)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Role selector */}
              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const newRole = e.target.value as AdminRole;
                    setEditRole(newRole);
                    if (newRole === "support_admin") {
                      setUseCustomPerms(true);
                      setEditCustomPerms({ ...DEFAULT_PERMISSIONS.support_admin });
                    } else {
                      setUseCustomPerms(false);
                      setEditCustomPerms({});
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="student_admin">Student Admin</option>
                  <option value="support_admin">Support Admin</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* Suspend toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div>
                  <p className="font-black text-slate-700">Account Suspended</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Suspended admins cannot log in.</p>
                </div>
                <button
                  onClick={() => setEditSuspended((s) => !s)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${editSuspended ? "bg-red-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${editSuspended ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Custom permissions toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div>
                  <p className="font-black text-slate-700">Custom Permissions</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Override default role permissions.</p>
                </div>
                <button
                  onClick={() => { setUseCustomPerms((v) => !v); if (!useCustomPerms) setEditCustomPerms({ ...DEFAULT_PERMISSIONS[editRole] }); }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${useCustomPerms ? "bg-blue-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${useCustomPerms ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Permission grid */}
              {useCustomPerms && (
                <div className="space-y-2 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Module Access</p>
                  <div className="grid grid-cols-1 gap-2">
                    {PERMISSION_LABELS.map(({ key, label, icon: Icon }) => {
                      const isOn = !!(editCustomPerms as any)[key];
                      return (
                        <button
                          key={key}
                          onClick={() => setEditCustomPerms((p) => ({ ...p, [key]: !isOn }))}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                            isOn ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-100 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            <span className="font-bold">{label}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${isOn ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
                            {isOn && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PASSWORD RESET MODAL ── */}
      {showPasswordReset && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full border border-slate-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-600" />Reset Password
              </h3>
              <button onClick={() => setShowPasswordReset(null)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <p className="font-semibold text-slate-600 leading-relaxed">
                Are you sure you want to send a password reset link to the administrator's email address? This allows them to set a new password securely.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowPasswordReset(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-2.5 font-bold transition disabled:opacity-50"
                >
                  {isResetting ? "Sending..." : "Send Reset Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full border border-slate-100 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-800">Delete Admin?</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">This permanently removes their account.</p>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
              🗑️ {deleteConfirm.name} ({deleteConfirm.email})
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white py-2.5 text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
