import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  Users, Bell, GraduationCap, ClipboardList, BookOpen, FileText, Droplet, Clock, MessageSquare, ShieldCheck, AlertCircle, ArrowUpRight
} from "lucide-react";

interface StatsData {
  students: number;
  faculty: number;
  bloodDonors: number;
  attendance: number;
  complaints: number;
  requests: number;
  notes: number;
  assignments: number;
  qpapers: number;
  admins: number;
  studentAdmins: number;
  pendingRequests: number;
  pendingComplaints: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<StatsData>({
    students: 0, faculty: 0, bloodDonors: 0, attendance: 0, complaints: 0, requests: 0,
    notes: 0, assignments: 0, qpapers: 0, admins: 0, studentAdmins: 0, pendingRequests: 0, pendingComplaints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const getCount = async (collName: string) => {
          const snap = await getDocs(collection(db, collName));
          return snap.size;
        };

        const getCountFiltered = async (collName: string, field: string, val: any) => {
          const q = query(collection(db, collName), where(field, "==", val));
          const snap = await getDocs(q);
          return snap.size;
        };

        const [
          studentCount, facultyCount, donorCount, attendanceCount, complaintCount, requestCount,
          noteCount, assignmentCount, qpCount, usersSnap
        ] = await Promise.all([
          getCount("students"),
          getCount("teachers"),
          getCount("bloodbank"),
          getCount("attendance"),
          getCount("complaints"),
          getCount("studentRequests"),
          getCount("notes"),
          getCount("assignments"),
          getCount("questionpapers"),
          getDocs(collection(db, "users"))
        ]);

        let adminCount = 0;
        let stdAdminCount = 0;
        usersSnap.forEach((doc) => {
          const role = doc.data().role;
          if (role === "admin" || role === "super_admin") adminCount++;
          if (role === "student_admin") stdAdminCount++;
        });

        // Filter pendings
        let pendingComp = 0;
        const complaintsSnap = await getDocs(collection(db, "complaints"));
        complaintsSnap.forEach(d => { if (d.data().status === "Pending") pendingComp++; });

        let pendingReq = 0;
        const requestsSnap = await getDocs(collection(db, "studentRequests"));
        requestsSnap.forEach(d => { if (d.data().status === "Pending") pendingReq++; });

        setStats({
          students: studentCount,
          faculty: facultyCount,
          bloodDonors: donorCount,
          attendance: attendanceCount,
          complaints: complaintCount,
          requests: requestCount,
          notes: noteCount,
          assignments: assignmentCount,
          qpapers: qpCount,
          admins: adminCount,
          studentAdmins: stdAdminCount,
          pendingComplaints: pendingComp,
          pendingRequests: pendingReq
        });
      } catch (err) {
        console.error("[SuperAdminDashboard] Stats loading failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs font-bold text-slate-400">Loading metrics dashboard...</div>;
  }

  const statCards = [
    { label: "Total Students", val: stats.students, icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
    { label: "Total Faculty", val: stats.faculty, icon: Users, color: "text-emerald-600 bg-emerald-50" },
    { label: "Blood Donors", val: stats.bloodDonors, icon: Droplet, color: "text-red-600 bg-red-50" },
    { label: "Attendance Logs", val: stats.attendance, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Total Complaints", val: stats.complaints, icon: MessageSquare, color: "text-purple-600 bg-purple-50", badge: stats.pendingComplaints },
    { label: "Student Requests", val: stats.requests, icon: ShieldCheck, color: "text-indigo-600 bg-indigo-50", badge: stats.pendingRequests },
    { label: "Lecture Notes", val: stats.notes, icon: BookOpen, color: "text-pink-600 bg-pink-50" },
    { label: "Assignments", val: stats.assignments, icon: ClipboardList, color: "text-rose-600 bg-rose-50" },
    { label: "Question Papers", val: stats.qpapers, icon: FileText, color: "text-violet-600 bg-violet-50" },
    { label: "Staff Admins", val: stats.admins, icon: Users, color: "text-orange-600 bg-orange-50" },
    { label: "Student Admins", val: stats.studentAdmins, icon: GraduationCap, color: "text-teal-600 bg-teal-50" },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Header */}
      <div>
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          Super Admin Console
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Real-time metrics, analytics, system health indicators, and registration stats.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="rounded-3xl border border-slate-100 bg-white p-5 space-y-3 shadow-2xs hover:shadow-xs transition relative">
              {card.badge && card.badge > 0 ? (
                <span className="absolute top-4 right-4 bg-red-500 text-white font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center animate-pulse">
                  {card.badge} Pending
                </span>
              ) : null}
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.color} shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{card.label}</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{card.val}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple charts using custom CSS/SVGs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
          <h4 className="font-black text-slate-800 text-sm flex items-center justify-between">
            <span>Pending Alert Monitoring</span>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </h4>
          <div className="space-y-3.5">
            {[
              { label: "Pending Grievances / Complaints", val: stats.pendingComplaints, max: stats.complaints, color: "bg-purple-500" },
              { label: "Pending Official Document Requests", val: stats.pendingRequests, max: stats.requests, color: "bg-indigo-500" }
            ].map((bar, idx) => {
              const percentage = bar.max > 0 ? Math.round((bar.val / bar.max) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-600">
                    <span>{bar.label}</span>
                    <span className="text-slate-800">{bar.val} / {bar.max} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${bar.color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
          <h4 className="font-black text-slate-800 text-sm flex items-center justify-between">
            <span>Campus Registry Distribution</span>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </h4>
          <div className="flex items-center justify-around py-2">
            {[
              { label: "Students", val: stats.students, color: "border-blue-500" },
              { label: "Staff", val: stats.faculty, color: "border-emerald-500" },
              { label: "Admins", val: stats.admins + stats.studentAdmins, color: "border-teal-500" }
            ].map((donut, idx) => (
              <div key={idx} className="text-center space-y-1">
                <div className={`mx-auto h-16 w-16 rounded-full border-4 ${donut.color} flex items-center justify-center font-black text-slate-800 text-sm`}>
                  {donut.val}
                </div>
                <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">{donut.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
