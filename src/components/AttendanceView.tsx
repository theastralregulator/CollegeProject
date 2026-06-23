import React, { useState, useMemo } from "react";
import { 
  Search, Filter, Calendar, Award, AlertCircle, 
  GraduationCap, BookOpen, Layers, CheckCircle2, 
  TrendingUp, Clock, User
} from "lucide-react";
import { AttendanceRecord, Department } from "../types";

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  departments: Department[];
}

export default function AttendanceView({ attendance, departments }: AttendanceViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedSem, setSelectedSem] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Get unique months from attendance data for the filter dropdown
  const uniqueMonths = useMemo(() => {
    const months = attendance.map(a => a.month);
    return Array.from(new Set(months)).sort();
  }, [attendance]);

  // Resolve department name by ID
  const getDeptName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : deptId;
  };

  // Resolve department code by ID
  const getDeptCode = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.code : deptId;
  };

  // Helper to color-code attendance percentage
  const getPercentageTheme = (percent: number) => {
    if (percent >= 90) {
      return {
        bg: "bg-emerald-50 border-emerald-100",
        text: "text-emerald-700",
        pill: "bg-emerald-500 text-white",
        iconColor: "text-emerald-500",
        progressColor: "bg-emerald-500"
      };
    } else if (percent >= 75) {
      return {
        bg: "bg-amber-50 border-amber-100",
        text: "text-amber-700",
        pill: "bg-amber-500 text-white",
        iconColor: "text-amber-500",
        progressColor: "bg-amber-500"
      };
    } else {
      return {
        bg: "bg-rose-50 border-rose-100",
        text: "text-rose-700",
        pill: "bg-rose-500 text-white",
        iconColor: "text-rose-500",
        progressColor: "bg-rose-500"
      };
    }
  };

  // Filter attendance records
  const filteredRecords = useMemo(() => {
    return attendance.filter(rec => {
      const matchesSearch = rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (rec.studentId && rec.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDept = selectedDept === "all" || rec.department === selectedDept;
      const matchesSem = selectedSem === "all" || rec.semester.toString() === selectedSem;
      const matchesMonth = selectedMonth === "all" || rec.month === selectedMonth;

      return matchesSearch && matchesDept && matchesSem && matchesMonth;
    });
  }, [attendance, searchTerm, selectedDept, selectedSem, selectedMonth]);

  // Group by student for history views when searching a specific student
  const studentGroups = useMemo(() => {
    const groups: { [studentName: string]: AttendanceRecord[] } = {};
    filteredRecords.forEach(rec => {
      if (!groups[rec.studentName]) {
        groups[rec.studentName] = [];
      }
      groups[rec.studentName].push(rec);
    });
    // Sort student's records by month/date
    Object.keys(groups).forEach(name => {
      groups[name].sort((a, b) => b.month.localeCompare(a.month));
    });
    return groups;
  }, [filteredRecords]);

  // Calculate statistics of filtered set
  const stats = useMemo(() => {
    if (filteredRecords.length === 0) return { avg: 0, total: 0, lowCount: 0, highCount: 0 };
    
    const total = filteredRecords.length;
    const sum = filteredRecords.reduce((acc, r) => acc + r.attendancePercentage, 0);
    const avg = Math.round(sum / total);
    const lowCount = filteredRecords.filter(r => r.attendancePercentage < 75).length;
    const highCount = filteredRecords.filter(r => r.attendancePercentage >= 90).length;

    return { avg, total, lowCount, highCount };
  }, [filteredRecords]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Overview/Header Banner */}
      <div className="rounded-[32px] overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-8 sm:p-12 text-white relative shadow-md">
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 flex items-center gap-1.5 mb-2">
          <Clock className="h-4 w-4" /> Academic Metrics
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 leading-tight">Student Attendance Portal</h2>
        <p className="mt-4 text-sm sm:text-base text-indigo-100 leading-relaxed max-w-2xl font-light">
          Track and monitor your monthly attendance logs across all branches. Government Polytechnic College Kaduthuruthy requires a minimum of <strong className="font-semibold text-white">75% attendance</strong> to qualify for board examinations.
        </p>
        
        {/* Quick stat chips */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
          <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
            <span className="text-indigo-200 block text-[10px] uppercase font-semibold">Average Attendance</span>
            <span className="text-lg font-black block mt-0.5">{stats.avg}%</span>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
            <span className="text-indigo-200 block text-[10px] uppercase font-semibold">Total Records</span>
            <span className="text-lg font-black block mt-0.5">{stats.total}</span>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
            <span className="text-indigo-200 block text-[10px] uppercase font-semibold">Excellent (&gt;=90%)</span>
            <span className="text-lg font-black text-emerald-300 block mt-0.5">{stats.highCount} students</span>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
            <span className="text-indigo-200 block text-[10px] uppercase font-semibold">Shortage (&lt;75%)</span>
            <span className="text-lg font-black text-rose-300 block mt-0.5">{stats.lowCount} alerts</span>
          </div>
        </div>
      </div>

      {/* Filters & Search section */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student name or admission ID..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
            {/* Filter by Department */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
            </div>

            {/* Filter by Semester */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="all">All Semesters</option>
                {[1, 2, 3, 4, 5, 6].map(sem => (
                  <option key={sem} value={sem.toString()}>Semester {sem}</option>
                ))}
              </select>
            </div>

            {/* Filter by Month */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="all">All Months</option>
                {uniqueMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History & Cards Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-extrabold text-slate-800">Attendance Database ({filteredRecords.length} records found)</h3>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Attendance Records Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try refining your search terms or selecting a different department/semester filter.</p>
          </div>
        ) : searchTerm.trim().length > 0 ? (
          // If searching specifically, show grouped student profile card with month-wise history
          <div className="space-y-6">
            {Object.keys(studentGroups).map(studentName => {
              const records = studentGroups[studentName];
              const latestRecord = records[0]; // most recent month record
              // Calculate average attendance for this student
              const studentAvg = Math.round(records.reduce((sum, r) => sum + r.attendancePercentage, 0) / records.length);
              const theme = getPercentageTheme(studentAvg);
              const isShortage = studentAvg < 75;

              return (
                <div key={studentName} className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xs">
                  {/* Student Header */}
                  <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold shadow-2xs">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{studentName}</h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 font-semibold text-[11px] mt-0.5">
                          <span>Dept: {getDeptName(latestRecord.department)} ({getDeptCode(latestRecord.department)})</span>
                          <span>•</span>
                          <span>Semester: S{latestRecord.semester}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isShortage && (
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 font-black px-3 py-1.5 rounded-xl text-[10px] uppercase border border-red-200">
                          <AlertCircle className="h-3.5 w-3.5" /> Attendance Shortage
                        </span>
                      )}
                      <div className={`px-4 py-2 rounded-2xl border text-center ${theme.bg}`}>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Overall Avg</span>
                        <span className={`text-md font-black block ${theme.text}`}>{studentAvg}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance History List */}
                  <div className="p-6">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Monthly Attendance Logs</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {records.map(rec => {
                        const recTheme = getPercentageTheme(rec.attendancePercentage);
                        const recShortage = rec.attendancePercentage < 75;
                        return (
                          <div key={rec.attendanceId} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-slate-400" />
                              <div>
                                <span className="text-xs font-bold text-slate-700 block">{rec.month}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  {recShortage ? "Shortage Shortfall Alert" : "Attendance Status: Regular"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {recShortage && (
                                <span className="bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase border border-rose-200">
                                  Shortage
                                </span>
                              )}
                              <span className={`px-3 py-1.5 rounded-xl font-extrabold text-xs border ${recTheme.bg} ${recTheme.text}`}>
                                {rec.attendancePercentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // General grid list of cards
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecords.map(rec => {
              const theme = getPercentageTheme(rec.attendancePercentage);
              const isShortage = rec.attendancePercentage < 75;

              return (
                <div key={rec.attendanceId} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xs hover:shadow-xs transition duration-300 relative flex flex-col justify-between">
                  <div>
                    {/* Badge alert */}
                    {isShortage && (
                      <div className="absolute top-4 right-4 bg-rose-100 border border-rose-200 text-rose-700 rounded-lg px-2.5 py-1 text-[9px] uppercase font-extrabold flex items-center gap-1 shadow-2xs">
                        <AlertCircle className="h-3 w-3" /> Shortage
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold border border-slate-100">
                        {rec.studentName.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 tracking-tight leading-none">{rec.studentName}</h4>
                        <span className="text-[10px] text-slate-400 font-bold mt-1 inline-block uppercase">
                          S{rec.semester} {getDeptCode(rec.department)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {rec.month}</span>
                        <span>Percentage</span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${theme.progressColor}`}
                          style={{ width: `${rec.attendancePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Status: {isShortage ? "Shortage Shortfall" : "Regular"}
                    </span>
                    <span className={`text-sm font-black px-3.5 py-1 rounded-xl border ${theme.bg} ${theme.text}`}>
                      {rec.attendancePercentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
