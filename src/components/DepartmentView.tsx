import { useState } from "react";
import { 
  Building2, Users, Users2, BookOpen, FileText, ClipboardList, 
  MapPin, Mail, Sparkles, FolderDown, ArrowUpRight 
} from "lucide-react";
import { Department, Teacher, Note, QuestionPaper, Assignment } from "../types";
import { motion } from "motion/react";

interface DepartmentViewProps {
  departments: Department[];
  teachers: Teacher[];
  notes: Note[];
  questionpapers: QuestionPaper[];
  assignments: Assignment[];
}

export default function DepartmentView({
  departments,
  teachers,
  notes,
  questionpapers,
  assignments,
}: DepartmentViewProps) {
  // Select active department ID, default to computer science
  const [activeDeptId, setActiveDeptId] = useState("computer");

  const dept = departments.find(d => d.id === activeDeptId) || departments[0];

  // Specific branch extractions
  const deptTeachers = teachers.filter(t => t.departmentId === activeDeptId);
  const deptNotes = notes.filter(n => n.departmentId === activeDeptId);
  const deptQuestionpapers = questionpapers.filter(qp => qp.departmentId === activeDeptId);
  const deptAssignments = assignments.filter(a => a.departmentId === activeDeptId);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Horizontal scrolling department tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto gap-2 pb-1.5 scrollbar-thin scrollbar-thumb-blue-200">
        {departments.map((d) => {
          const isActive = d.id === activeDeptId;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDeptId(d.id)}
              className={`flex-none px-6 py-4 rounded-2xl font-sans text-sm font-extrabold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs scale-100"
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 shrink-0" />
                <span>{d.name} ({d.code})</span>
              </div>
            </button>
          );
        })}
      </div>

      {dept && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main overview and lists */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-md font-extrabold text-slate-800">Academic Specialization Overview</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 font-medium font-sans">
                {dept.overview}
              </p>

              {/* Counts row */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-50 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Registered Students</p>
                  <p className="text-2xl font-extrabold text-blue-600 mt-2 tracking-tight">{dept.studentCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-50 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans">Syllabus Coordinators</p>
                  <p className="text-2xl font-extrabold text-indigo-600 mt-2 tracking-tight">{dept.facultyCount}</p>
                </div>
              </div>
            </div>

            {/* Department Files center: Notes, past papers, homeworks */}
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-slate-850 pl-1 uppercase tracking-wider">Branch Syllabus and Resources</h3>
              
              {/* Branch Notes */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>Syllabus Lecture Notes ({deptNotes.length})</span>
                </h4>

                {deptNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic pl-1">No notes currently available for this branch.</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {deptNotes.map(n => (
                      <div key={n.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-755 truncate">{n.title}</p>
                          <p className="text-[10px] text-slate-400">Subject: {n.subject} • Sem {n.semester}</p>
                        </div>
                        <a
                          href={n.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 px-3 rounded-lg bg-blue-50 text-[10px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition uppercase"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Branch Question papers */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <span>Board Solved Question Papers ({deptQuestionpapers.length})</span>
                </h4>

                {deptQuestionpapers.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic pl-1">No previous Board exams solved papers found.</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {deptQuestionpapers.map(qp => (
                      <div key={qp.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-755 truncate">{qp.title}</p>
                          <p className="text-[10px] text-slate-400">Semester {qp.semester} • Year {qp.year}</p>
                        </div>
                        <a
                          href={qp.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 px-3 rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition uppercase"
                        >
                          PDF Sheet
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Branch Assignments */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <ClipboardList className="h-4 w-4 text-emerald-500" />
                  <span>Active branch Assignments ({deptAssignments.length})</span>
                </h4>

                {deptAssignments.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic pl-1">No pending homework assignments registered.</p>
                ) : (
                  <div className="space-y-4">
                    {deptAssignments.map(a => (
                      <div key={a.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-50/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold bg-white/80 border border-slate-100 rounded-md px-2 py-0.5 text-slate-500 leading-none">Sem {a.semester}</span>
                            <span className="text-[10px] font-bold text-red-600">Due: {a.dueDate}</span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-800 tracking-tight mt-2">{a.title}</p>
                          <p className="text-[10.5px] leading-normal text-slate-500 mt-1">{a.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Sidebar - HOD and Faculty Details */}
          <div className="space-y-8">
            
            {/* HOD Details card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs text-center relative overflow-hidden">
              <p className="text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-600 tracking-widest border border-indigo-100/50 py-1 px-3 rounded-lg inline-block text-center mb-4">
                Head Of Department
              </p>

              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-slate-100 shadow-md">
                <img
                  src={dept.hodPhoto || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80"}
                  alt={dept.hodName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <h4 className="mt-4 text-sm font-extrabold text-slate-805 tracking-tight">{dept.hodName}</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Professor & branch Head</p>
              
              <div className="mt-5 border-t border-slate-50 pt-4">
                <a
                  href={`mailto:${dept.hodEmail}`}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 py-2 text-xs font-bold text-slate-705 transition"
                >
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span>Email HOD</span>
                </a>
              </div>
            </div>

            {/* Department Faculty members roster */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 pl-1 mb-2">
                <Users className="h-4.5 w-4.5 text-blue-500" />
                <span>Department Staff</span>
              </h4>

              <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto pr-1">
                {deptTeachers.map((t) => (
                  <div key={t.id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                    <img
                      src={t.photo || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80"}
                      alt={t.name}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">{t.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
