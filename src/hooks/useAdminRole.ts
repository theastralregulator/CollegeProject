import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AdminUser, AdminRole, AdminPermissions } from "../types";

const SUPER_ADMIN_WHITELIST = [
  "sabinsaji3900@gmail.com",
  "admin@gptckaduthuruthy.edu.in",
];

export const DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  student_admin: {
    notices: false, teachers: false, students: false, attendance: false,
    notes: true, assignments: true, qpapers: true,
    bloodbank: false, requests: false, outsiderDonors: false, complaints: false, adminManagement: false,
  },
  admin: {
    notices: true, teachers: true, students: true, attendance: true,
    notes: true, assignments: true, qpapers: true,
    bloodbank: true, requests: true, outsiderDonors: true, complaints: true, adminManagement: false,
  },
  super_admin: {
    notices: true, teachers: true, students: true, attendance: true,
    notes: true, assignments: true, qpapers: true,
    bloodbank: true, requests: true, outsiderDonors: true, complaints: true, adminManagement: true,
  },
};

export function resolvePermissions(adminUser: AdminUser): AdminPermissions {
  const base = { ...DEFAULT_PERMISSIONS[adminUser.role] };
  if (adminUser.customPermissions) return { ...base, ...adminUser.customPermissions };
  return base;
}

interface UseAdminRoleResult {
  role: AdminRole | null;
  adminData: AdminUser | null;
  permissions: AdminPermissions | null;
  loading: boolean;
  refetch: () => void;
}

export function useAdminRole(user: User | null): UseAdminRoleResult {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!user) { setRole(null); setAdminData(null); setPermissions(null); return; }
    let cancelled = false;
    setLoading(true);

    const fetchRole = async () => {
      try {
        const email = user.email?.toLowerCase() || "";
        const isWhitelisted = SUPER_ADMIN_WHITELIST.includes(email);
        const docRef = doc(db, "adminUsers", user.uid);
        const snap = await getDoc(docRef);

        if (!cancelled) {
          if (snap.exists()) {
            const data = snap.data() as AdminUser;
            const resolvedRole: AdminRole = isWhitelisted ? "super_admin" : data.role;
            const resolved: AdminUser = { ...data, role: resolvedRole };
            setAdminData(resolved); setRole(resolvedRole); setPermissions(resolvePermissions(resolved));
          } else {
            const defaultRole: AdminRole = isWhitelisted ? "super_admin" : "admin";
            const newAdminUser: AdminUser = {
              uid: user.uid, email: user.email || "",
              name: user.displayName || user.email?.split("@")[0] || "Admin",
              phone: "", role: defaultRole, suspended: false,
              createdAt: new Date().toISOString(),
            };
            try { await setDoc(docRef, newAdminUser); } catch { /* ignore */ }
            if (!cancelled) { setAdminData(newAdminUser); setRole(defaultRole); setPermissions(resolvePermissions(newAdminUser)); }
          }
        }
      } catch (err) {
        console.error("[useAdminRole] Error:", err);
        if (!cancelled) {
          const isWhitelisted = SUPER_ADMIN_WHITELIST.includes(user.email?.toLowerCase() || "");
          const fallbackRole: AdminRole = isWhitelisted ? "super_admin" : "admin";
          const fallback: AdminUser = {
            uid: user.uid, email: user.email || "", name: user.displayName || "Admin",
            phone: "", role: fallbackRole, suspended: false, createdAt: new Date().toISOString(),
          };
          setAdminData(fallback); setRole(fallbackRole); setPermissions(resolvePermissions(fallback));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRole();
    return () => { cancelled = true; };
  }, [user?.uid, tick]);

  return { role, adminData, permissions, loading, refetch };
}
