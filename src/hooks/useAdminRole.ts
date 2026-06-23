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
        
        // 1. Try reading from "users" collection (Vercel-compatible RBAC path)
        const docRef = doc(db, "users", user.uid);
        let snap = await getDoc(docRef);
        let data: any = null;

        if (snap.exists()) {
          data = snap.data();
        } else {
          // 2. Fallback to "adminUsers" collection
          const legacyDocRef = doc(db, "adminUsers", user.uid);
          const legacySnap = await getDoc(legacyDocRef);
          if (legacySnap.exists()) {
            data = legacySnap.data();
            // Automatically migrate to new "users" collection
            try {
              const migratedData = {
                uid: user.uid,
                email: data.email || user.email || "",
                fullName: data.name || data.fullName || user.displayName || "Admin",
                name: data.name || data.fullName || user.displayName || "Admin",
                phone: data.phone || "",
                role: data.role,
                permissions: data.customPermissions || data.permissions || {},
                suspended: data.suspended ?? false,
                createdAt: data.createdAt || new Date().toISOString(),
              };
              await setDoc(docRef, migratedData);
              data = migratedData;
            } catch (migrateErr) {
              console.error("[useAdminRole] Legacy migration failed:", migrateErr);
            }
          }
        }

        if (!cancelled) {
          if (data) {
            const resolvedRole: AdminRole = isWhitelisted ? "super_admin" : data.role;
            const resolved: AdminUser = {
              uid: data.uid,
              email: data.email,
              name: data.fullName || data.name || "Admin",
              phone: data.phone || "",
              role: resolvedRole,
              suspended: data.suspended ?? false,
              customPermissions: data.permissions || data.customPermissions || {},
              createdAt: data.createdAt,
            };
            setAdminData(resolved); setRole(resolvedRole); setPermissions(resolvePermissions(resolved));
          } else {
            const defaultRole: AdminRole = isWhitelisted ? "super_admin" : "admin";
            const newAdminUser = {
              uid: user.uid,
              email: user.email || "",
              fullName: user.displayName || user.email?.split("@")[0] || "Admin",
              name: user.displayName || user.email?.split("@")[0] || "Admin",
              phone: "",
              role: defaultRole,
              permissions: {},
              suspended: false,
              createdAt: new Date().toISOString(),
            };
            try { await setDoc(docRef, newAdminUser); } catch { /* ignore */ }
            
            const resolved: AdminUser = {
              uid: newAdminUser.uid,
              email: newAdminUser.email,
              name: newAdminUser.fullName,
              phone: newAdminUser.phone,
              role: defaultRole,
              suspended: false,
              customPermissions: {},
              createdAt: newAdminUser.createdAt,
            };
            if (!cancelled) { setAdminData(resolved); setRole(defaultRole); setPermissions(resolvePermissions(resolved)); }
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
