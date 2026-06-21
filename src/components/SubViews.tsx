import React, { useState, useEffect } from "react";
import { 
  Search, BookOpen, FileText, ClipboardList, Droplet, Users, 
  MapPin, Award, Mail, Phone, ExternalLink, Calendar, Compass, 
  Sparkles, CheckCircle2, ChevronRight, GraduationCap, Lock, Unlock, Eye, Send, Clock, PhoneCall, X
} from "lucide-react";
import { Notice, Teacher, Student, Note, QuestionPaper, Assignment, BloodDonor, Department, StudentRequest } from "../types";
import { db } from "../firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { motion } from "motion/react";

/* ==========================================================================
   ABOUT VIEW
   ========================================================================== */
export function AboutView() {
  const coreValues = [
    { title: "Academic Rigor", description: "Providing practical high-tech Diploma training matching current industry demands.", icon: Award },
    { title: "Holistic Training", description: "Encouraging sports, community leadership, and green environmental initiatives.", icon: Compass },
    { title: "Empathetic Care", description: "Active blood donors program and cooperative student assistance cells.", icon: Droplet },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* College Identity Banner */}
      <div className="rounded-[32px] overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-800 p-8 sm:p-12 text-white relative shadow-md">
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Established in 1999</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 leading-tight">Govt Polytechnic College Kaduthuruthy</h2>
        <p className="mt-4 text-sm sm:text-base text-blue-150 leading-relaxed max-w-2xl font-light">
          Approved by AICTE and engineered under the Department of Technical Education, Govt. of Kerala. GPC Kaduthuruthy has emerged as a premium center of professional training, nurturing Kerala's technical talent with modern computing infrastructures, electronics core development rooms, heavy machinery tooling centers, and expert state faculty.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 text-xs font-bold text-blue-100">
          <span className="flex items-center gap-1 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10">
            <MapPin className="h-4 w-4" />
            Kaduthuruthy, Kottayam, Kerala
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10">
            <Mail className="h-4 w-4" />
            gptckdy@gmail.com
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10">
            <Phone className="h-4 w-4" />
            +91 4829 283155
          </span>
        </div>
      </div>

      {/* Vision & Mission Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[28px] border border-blue-50 bg-white p-8 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Compass className="h-5.5 w-5.5" />
          </div>
          <h3 className="mt-4 text-md font-extrabold text-slate-800">Our Vision</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium font-sans">
            To evolve into a center of global distinction in technical skill-empowerment and practical learning, nurturing professional technical minds packed with social responsiveness, professional discipline, and engineering caliber.
          </p>
        </div>

        <div className="rounded-[28px] border border-blue-50 bg-white p-8 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Sparkles className="h-5.5 w-5.5 font-bold" />
          </div>
          <h3 className="mt-4 text-md font-extrabold text-slate-800">Our Mission</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500 font-medium font-sans">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>To provide dynamic experiential curriculums that blend laboratory work with corporate technology consultancies.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>To inculcate eco-friendly awareness, team integrity, and critical problem-solving capabilities.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>To maintain updated high-octane engineering laboratories accessible to all regions of the community.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Core Values */}
      <div className="space-y-4">
        <h3 className="text-md font-extrabold text-slate-800">Our Core Pillars</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {coreValues.map((v, idx) => {
            const Icon = v.icon;
            return (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-3 text-xs font-bold text-slate-800">{v.title}</h4>
                <p className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">{v.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campus Facilities */}
      <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6">
        <h3 className="text-sm font-bold text-slate-800">Available Campus Infrastructure</h3>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
          {[
            "High-Speed Fiber Compute Labs",
            "VLSI CAD Hardware Room",
            "Heavy Lathe & CNC Machine Shop",
            "High-Contrast Concrete Hydrology Lab",
            "National Service Scheme Unit",
            "Dynamic Placement Counseling Hub",
            "Autonomous Eco Club Greenhouse",
            "Fully-Equipped Digital Library",
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-2xs border border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   TEACHERS DIRECTORY VIEW
   ========================================================================== */
interface TeachersViewProps {
  teachers: Teacher[];
  departments: Department[];
}

export function TeachersView({ teachers, departments }: TeachersViewProps) {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  const filteredTeachers = selectedDeptFilter === "all"
    ? teachers
    : teachers.filter(t => t.departmentId === selectedDeptFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-850">Faculty Directory</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Contact and meet our certified lecturers and coordinators.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedDeptFilter("all")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              selectedDeptFilter === "all"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
            }`}
          >
            All Branches
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDeptFilter(d.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedDeptFilter === d.id
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              {d.code}
            </button>
          ))}
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-xs font-bold text-slate-400">No faculty members found registration matching this department branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredTeachers.map((t) => (
            <div
              key={t.id}
              className="rounded-[24px] border border-slate-100 bg-white p-5 flex items-center gap-4 hover:shadow-xs transition duration-300 transform hover:-translate-y-1"
            >
              <img
                src={t.photo || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80"}
                alt={t.name}
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-2xl object-cover border border-slate-100 shadow-2xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 leading-none inline-block">
                  {t.departmentId}
                </span>
                <h4 className="text-sm font-bold text-slate-800 mt-1 leading-tight truncate">{t.name}</h4>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{t.designation}</p>
                <a
                  href={`mailto:${t.email}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-bold"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[150px]">{t.email}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ==========================================================================
   STUDENTS DIRECTORY VIEW
   ========================================================================== */
interface StudentsViewProps {
  students: Student[];
  departments: Department[];
  studentRequests: StudentRequest[];
}

export function StudentsView({ students, departments, studentRequests = [] }: StudentsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedSem, setSelectedSem] = useState("all");

  // Email input state for checking approvals
  const [checkerEmail, setCheckerEmail] = useState("");
  const [activeUnlockEmail, setActiveUnlockEmail] = useState("");

  // Modal requesting state
  const [requestStudent, setRequestStudent] = useState<Student | null>(null);
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [reqDept, setReqDept] = useState("");
  const [reqPurpose, setReqPurpose] = useState("");
  const [reqInfoSpecs, setReqInfoSpecs] = useState<string[]>([]);
  const [addNotes, setAddNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Auto-fill student department
  useEffect(() => {
    if (requestStudent) {
      const parentDept = departments.find(d => d.id === requestStudent.departmentId);
      setReqDept(parentDept ? parentDept.name : requestStudent.departmentId || "");
      setReqInfoSpecs([]);
      setAddNotes("");
      setRequesterPhone("");
    }
  }, [requestStudent?.id, departments]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.place && s.place.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          s.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || s.departmentId === selectedDept;
    const matchesSem = selectedSem === "all" || s.semester === parseInt(selectedSem);
    return matchesSearch && matchesDept && matchesSem;
  });

  // Calculate which student IDs are unlocked for the current active email
  const unlockedStudentIds = studentRequests
    .filter(req => req.requesterEmail.toLowerCase().trim() === activeUnlockEmail.toLowerCase().trim() && (req.status === "approved" || req.requestStatus === "Approved"))
    .map(req => req.studentId);

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestStudent || !requesterName || !requesterEmail || !requesterPhone || !reqPurpose) {
      alert("Please fill in all required fields.");
      return;
    }
    if (reqInfoSpecs.length === 0) {
      alert("Please check at least one information option.");
      return;
    }
    setIsSubmitting(true);
    setSuccessMsg("");
    try {
      const generatedId = "req_" + Date.now();
      const nowISO = new Date().toISOString();

      await setDoc(doc(db, "studentRequests", generatedId), {
        // Compatibility properties
        id: generatedId,
        studentId: requestStudent.id,
        studentName: requestStudent.name,
        requesterName: requesterName.trim(),
        requesterEmail: requesterEmail.trim(),
        purpose: reqPurpose.trim(),
        status: "pending",
        createdAt: nowISO,

        // Required new explicit schema properties
        requestId: generatedId,
        requesterPhone: requesterPhone.trim(),
        department: reqDept.trim(),
        requestedInformation: reqInfoSpecs,
        reasonForRequest: reqPurpose.trim(),
        additionalNotes: addNotes.trim(),
        requestStatus: "Pending",
        submittedDate: nowISO,
        reviewedDate: "",
        adminRemarks: ""
      });

      setSuccessMsg("Your request has been submitted successfully. The college administration will review your request and update you through your Email or WhatsApp within one week.");
      setRequesterName("");
      setRequesterPhone("");
      setRequesterEmail("");
      setReqPurpose("");
      setAddNotes("");
      setReqInfoSpecs([]);
      setTimeout(() => {
        setRequestStudent(null);
        setSuccessMsg("");
      }, 7000);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-850">Registered College Students</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">List of fellow campus students representing GPC Kaduthuruthy.</p>
        </div>

      </div>



      {/* Query Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student names, blood, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-xs font-bold text-slate-400">No campus student profiles match your specific filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredStudents.map((s) => {
            const isUnlocked = unlockedStudentIds.includes(s.id);
            return (
              <div key={s.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs hover:border-blue-100 transition duration-300 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{s.name}</h4>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider">
                        Adm: #{s.admissionNumber || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500 font-bold mt-1">
                        Sem {s.semester} • <span className="uppercase text-blue-600 font-extrabold">{s.departmentId === "computer" ? "Computer Engg" : s.departmentId === "hardware" ? "Hardware Engg" : "Electronics Engg"}</span>
                      </p>
                    </div>

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 text-xs font-extrabold shadow-3xs" title="Blood Group">
                      {s.bloodGroup}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600 font-medium">
                    <p className="flex items-center gap-1.5 font-semibold text-slate-750">
                      📍 Place: <span className="font-bold text-slate-800">{s.place || "N/A"}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      ✉️ Email: <span className="font-bold text-slate-800">{s.email || "N/A"}</span>
                    </p>
                  </div>

                  {/* UNLOCKED PRIVATE STUFF */}
                  {isUnlocked ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="border-t border-emerald-100 bg-emerald-50/50 rounded-xl p-3 mt-3 space-y-2 text-xs text-slate-700"
                    >
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider flex items-center gap-1">
                        <Unlock className="h-3 w-3" /> Details Unlocked
                      </span>
                      <p>📞 Phone: <span className="font-bold text-slate-900">{s.phone || "N/A"}</span></p>
                      <p>📅 DOB: <span className="font-bold text-slate-900">{s.dob || "N/A"}</span></p>
                      <p>👨 Parent Name: <span className="font-bold text-slate-900">{s.parentName || "N/A"}</span></p>
                      <p>📱 Parent Phone: <span className="font-bold text-slate-900">{s.parentPhone || "N/A"}</span></p>
                    </motion.div>
                  ) : (
                    <div className="border-t border-dashed border-slate-100 pt-3 mt-3">
                      <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between gap-2 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 leading-none">
                          <Lock className="h-3 w-3 text-slate-400" /> Details Protected
                        </span>
                        <button
                          onClick={() => setRequestStudent(s)}
                          className="rounded-lg bg-blue-50 hover:bg-blue-105 px-2.5 py-1 text-[10px] font-black text-blue-700 uppercase border border-blue-100"
                        >
                          Request Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REQUEST MODAL */}
      {requestStudent && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setRequestStudent(null)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative z-10 border border-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div>
              <h3 className="text-md sm:text-lg font-black text-slate-800 tracking-tight">Request Student Information</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Submitting a formal request to view details for <span className="text-blue-600">{requestStudent.name}</span>.
              </p>
            </div>

            {successMsg ? (
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-150 text-xs text-emerald-850 font-bold leading-relaxed text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto animate-bounce" />
                <p>{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateRequest} className="space-y-4">
                
                {/* Section header */}
                <div className="border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">Requester Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-1 ml-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-1 ml-1">Phone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={requesterPhone}
                      onChange={(e) => setRequesterPhone(e.target.value)}
                      placeholder="e.g. +91 94455..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-1 ml-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    placeholder="Enter your email to view when approved"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                {/* Section header */}
                <div className="border-b border-slate-100 pb-1.5 pt-1">
                  <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">Request Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-0.5 ml-1">Student Name</label>
                    <input
                      type="text"
                      disabled
                      value={requestStudent.name}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-0.5 ml-1">Department (Optional)</label>
                    <input
                      type="text"
                      value={reqDept}
                      onChange={(e) => setReqDept(e.target.value)}
                      placeholder="e.g. Computer Engineering"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-1 ml-1">Reason for Request *</label>
                  <textarea
                    required
                    rows={2}
                    value={reqPurpose}
                    onChange={(e) => setReqPurpose(e.target.value)}
                    placeholder="Why do you require this student's phone number or details?"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 resize-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                {/* Information Options checkpoints */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block ml-1">Information Required * (Select at least one)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                    {[
                      "Phone Number",
                      "Date of Birth",
                      "Parent Name",
                      "Parent Phone Number",
                      "Complete Student Profile",
                      "Other"
                    ].map((opt) => {
                      const checked = reqInfoSpecs.includes(opt);
                      return (
                        <label key={opt} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition ${checked ? "bg-indigo-50 border-indigo-200 font-extrabold text-indigo-900" : "bg-white border-slate-200 font-semibold text-slate-600"} text-xs`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setReqInfoSpecs(reqInfoSpecs.filter(x => x !== opt));
                              } else {
                                setReqInfoSpecs([...reqInfoSpecs, opt]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-1 ml-1">Additional Notes</label>
                  <textarea
                    rows={2}
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="Provide any additional notes or message details here..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 resize-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRequestStudent(null)}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-5 py-2.5 text-xs font-bold text-white transition flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}


/* ==========================================================================
   BLOOD BANK VIEW
   ========================================================================== */
interface BloodBankViewProps {
  donors: BloodDonor[];
}

export function BloodBankView({ donors }: BloodBankViewProps) {
  const [bloodQuery, setBloodQuery] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("");
  const [availFilter, setAvailFilter] = useState("all");

  // Phone request modal state
  const [requestDonor, setRequestDonor] = useState<BloodDonor | null>(null);
  const [reqName, setReqName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const resetForm = () => {
    setReqName(""); setReqPhone(""); setReqEmail(""); setReqNote("");
    setSuccessMsg("");
  };

  const handlePhoneRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDonor) return;
    setIsSubmitting(true);
    try {
      const requestId = `BLOOD-${Date.now()}`;
      const payload: StudentRequest = {
        id: requestId,
        requestId,
        studentId: requestDonor.id,
        studentName: requestDonor.name,
        requesterName: reqName,
        requesterEmail: reqEmail,
        requesterPhone: reqPhone,
        purpose: `Blood Donor Phone Request — ${requestDonor.bloodGroup}`,
        department: requestDonor.departmentId,
        requestedInformation: ["Phone Number"],
        reasonForRequest: `Emergency blood contact request for donor ${requestDonor.name} (${requestDonor.bloodGroup}).`,
        additionalNotes: reqNote,
        status: "pending",
        requestStatus: "Pending",
        submittedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "studentRequests", requestId), payload);
      setSuccessMsg(`✅ Your request has been submitted! The admin will review and share ${requestDonor.name}'s contact details soon.`);
    } catch (err) {
      console.error(err);
      setSuccessMsg("❌ Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDonors = donors.filter((d) => {
    const matchesBlood = bloodQuery === "all" || d.bloodGroup.toUpperCase() === bloodQuery.toUpperCase();
    const matchesDept = deptFilter === "all" || d.departmentId === deptFilter;
    const matchesSem = semFilter === "all" || String(d.semester) === semFilter;
    const matchesPlace = !placeFilter || (d.place && d.place.toLowerCase().includes(placeFilter.toLowerCase()));
    const matchesAvail = availFilter === "all" || (availFilter === "active" ? d.isAvailable : !d.isAvailable);
    return matchesBlood && matchesDept && matchesSem && matchesPlace && matchesAvail;
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Phone Request Modal */}
      {requestDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full relative border border-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <PhoneCall className="h-4 w-4" />
                  </span>
                  <h3 className="text-md font-black text-slate-800 tracking-tight">Request Donor Phone Number</h3>
                </div>
                <p className="text-xs text-slate-400 font-semibold ml-10">
                  Requesting contact for <span className="text-red-600 font-bold">{requestDonor.name}</span>&nbsp;
                  <span className="bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-lg text-[11px]">{requestDonor.bloodGroup}</span>
                </p>
              </div>
              <button onClick={() => { setRequestDonor(null); resetForm(); }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {successMsg ? (
              <div className={`p-5 rounded-2xl border text-xs font-bold leading-relaxed text-center space-y-2 ${
                successMsg.startsWith("✅") ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"
              }`}>
                <p className="text-sm">{successMsg}</p>
                <button
                  onClick={() => { setRequestDonor(null); resetForm(); }}
                  className="mt-3 rounded-xl bg-slate-800 text-white px-5 py-2 text-xs font-bold hover:bg-slate-900 transition"
                >Close</button>
              </div>
            ) : (
              <form onSubmit={handlePhoneRequest} className="space-y-4">
                <div className="border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest">Your Information</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Your Full Name *</label>
                  <input
                    type="text" required value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Your Phone Number *</label>
                  <input
                    type="tel" required value={reqPhone}
                    onChange={(e) => setReqPhone(e.target.value)}
                    placeholder="e.g. +91 94455..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Your Email Address *</label>
                  <input
                    type="email" required value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Note / Reason</label>
                  <textarea
                    rows={3} value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    placeholder="Briefly explain your reason for contacting this donor (optional)..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 resize-none focus:bg-white focus:border-red-400"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setRequestDonor(null); resetForm(); }}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                  >Cancel</button>
                  <button
                    type="submit" disabled={isSubmitting}
                    className="rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-5 py-2.5 text-xs font-bold text-white transition flex items-center gap-1.5"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    {isSubmitting ? "Submitting..." : "Send Request"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      <div className="rounded-3xl bg-linear-to-r from-red-550 to-red-650 p-6 sm:p-8 text-white shadow-xs">
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">On-Campus Emergency Blood Bank</h2>
        <p className="mt-2 text-xs sm:text-sm text-white/85 leading-relaxed max-w-2xl font-medium font-sans">
          Welcome to the Govt Polytechnic College Kaduthuruthy student donor registry. Filter and search for active student contributors across departments and semesters for safe local emergency planning.
        </p>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-100">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Blood Group</label>
          <select
            value={bloodQuery}
            onChange={(e) => setBloodQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="all">All Groups</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="all">All Departments</option>
            <option value="computer">Computer Engineering</option>
            <option value="hardware">Computer Hardware Engg</option>
            <option value="electronics">Electronics Engineering</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Semester</label>
          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="all">All Semesters</option>
            {["1", "2", "3", "4", "5", "6"].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Place / City</label>
          <input
            type="text"
            value={placeFilter}
            onChange={(e) => setPlaceFilter(e.target.value)}
            placeholder="Search Place (e.g. Kottayam)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-650 outline-none placeholder-slate-400"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Availability</label>
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="all">All Donors</option>
            <option value="active">Active Available</option>
            <option value="inactive">Away</option>
          </select>
        </div>
      </div>

      {filteredDonors.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-red-100 bg-white p-10 text-center space-y-2">
          <p className="text-sm font-extrabold text-slate-700">No student donors found matching your exact filters.</p>
          <p className="text-xs text-slate-400 font-semibold font-sans">Try widening your filters or location search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonors.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 hover:border-red-100 shadow-2xs hover:shadow-xs transition duration-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{d.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wide leading-none">
                    Sem {d.semester} • {d.departmentId === "computer" ? "Computer Engg" : d.departmentId === "hardware" ? "Hardware Engg" : "Electronics Engg"}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-2">
                    📍 Place: {d.place || "N/A"}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${d.isAvailable ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
                    <span className="text-[11px] font-bold text-slate-500">
                      {d.isAvailable ? "Emergency Active" : "Away / Engaged"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 text-sm font-extrabold border border-red-100/40">
                    {d.bloodGroup}
                  </span>
                </div>
              </div>

              {/* Request Phone Number button */}
              <button
                onClick={() => { setRequestDonor(d); resetForm(); }}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-extrabold py-2 transition active:scale-95"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Request Phone Number
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ==========================================================================
   ACADEMIC REPOSITORY DOWNLOAD CENTER (Notes, QPapers, Assignments)
   ========================================================================== */
interface AcademicCenterProps {
  initialType?: "notes" | "papers" | "assignments";
  notes: Note[];
  questionpapers: QuestionPaper[];
  assignments: Assignment[];
  departments: Department[];
}

export function AcademicCenter({
  initialType = "notes",
  notes,
  questionpapers,
  assignments,
  departments,
}: AcademicCenterProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "papers" | "assignments">(initialType);

  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedSem, setSelectedSem] = useState("all");
  const [searchWord, setSearchWord] = useState("");

  const clearFilters = () => {
    setSelectedDept("all");
    setSelectedSem("all");
    setSearchWord("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Visual toggle buttons */}
      <div className="flex border-b border-slate-100">
        {[
          { id: "notes", label: "Lecture Notes", icon: BookOpen, count: notes.length },
          { id: "papers", label: "Question Papers", icon: FileText, count: questionpapers.length },
          { id: "assignments", label: "Assignments", icon: ClipboardList, count: assignments.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                clearFilters();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4.5 border-b-2 font-bold text-xs sm:text-sm transition-all focus:outline-none ${
                isSelected 
                  ? "border-blue-600 text-blue-700 bg-blue-50/20" 
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{tab.label}</span>
              <span className="rounded-full bg-slate-100 text-[10px] text-slate-500 font-extrabold px-2 py-0.5 ml-1">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Query panel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-650 outline-none"
          >
            <option value="all">All Specialties</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-650 outline-none"
          >
            <option value="all">All Semesters</option>
            {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      {/* RENDER ACTIVE TAB VIEW LISTS */}

      {/* 1. NOTES VIEW */}
      {activeTab === "notes" && (
        <div className="space-y-3">
          {notes
            .filter(n => {
              const matchesDept = selectedDept === "all" || n.departmentId === selectedDept;
              const matchesSem = selectedSem === "all" || n.semester === parseInt(selectedSem);
              const matchesSearch = n.title.toLowerCase().includes(searchWord.toLowerCase()) || n.subject.toLowerCase().includes(searchWord.toLowerCase());
              return matchesDept && matchesSem && matchesSearch;
            })
            .map((note) => (
              <div 
                key={note.id} 
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border border-slate-100 bg-white gap-4 hover:border-slate-200 transition"
              >
                <div className="min-w-0">
                  <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-[9px] font-extrabold text-blue-700 uppercase">
                    {note.departmentId} (Sem {note.semester})
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight mt-2">{note.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 font-semibold leading-normal">
                    Subject: {note.subject} • Compiled by: <strong className="text-slate-600">{note.uploadedBy}</strong>
                  </p>
                </div>

                <a
                  href={note.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="rounded-xl bg-slate-50 hover:bg-blue-600 border border-slate-100 hover:border-blue-600 px-4 py-2 text-xs font-bold text-slate-700 hover:text-white transition flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <Compass className="h-4 w-4" />
                  <span>Download Notes</span>
                </a>
              </div>
            ))}
        </div>
      )}

      {/* 2. QUESTION PAPERS VIEW */}
      {activeTab === "papers" && (
        <div className="space-y-3">
          {questionpapers
            .filter(qp => {
              const matchesDept = selectedDept === "all" || qp.departmentId === selectedDept;
              const matchesSem = selectedSem === "all" || qp.semester === parseInt(selectedSem);
              const matchesSearch = qp.title.toLowerCase().includes(searchWord.toLowerCase()) || qp.subject.toLowerCase().includes(searchWord.toLowerCase());
              return matchesDept && matchesSem && matchesSearch;
            })
            .map((qp) => (
              <div 
                key={qp.id} 
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border border-slate-100 bg-white gap-4 hover:border-slate-200 transition"
              >
                <div className="min-w-0">
                  <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-[9px] font-extrabold text-indigo-700 uppercase">
                    {qp.departmentId} • Paper {qp.year}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 mt-2">{qp.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Subject Core: {qp.subject} • Board Semester: {qp.semester}</p>
                </div>

                <a
                  href={qp.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-slate-50 hover:bg-indigo-600 border border-slate-100 hover:border-indigo-600 px-4 py-2 text-xs font-bold text-slate-700 hover:text-white transition flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download PDF</span>
                </a>
              </div>
            ))}
        </div>
      )}

      {/* 3. ASSIGNMENTS VIEW */}
      {activeTab === "assignments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments
            .filter(a => {
              const matchesDept = selectedDept === "all" || a.departmentId === selectedDept;
              const matchesSem = selectedSem === "all" || a.semester === parseInt(selectedSem);
              const matchesSearch = a.title.toLowerCase().includes(searchWord.toLowerCase()) || a.subject.toLowerCase().includes(searchWord.toLowerCase());
              return matchesDept && matchesSem && matchesSearch;
            })
            .map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-rose-50 px-2.5 py-0.5 text-[9px] font-extrabold text-red-600 uppercase">
                      Sem {a.semester} {a.departmentId}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Due: {a.dueDate}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-800 tracking-tight mt-3">{a.title}</h4>
                  <p className="text-xs text-slate-450 mt-1 font-bold">Subject: {a.subject}</p>
                  
                  <p className="mt-3.5 text-xs leading-normal text-slate-500 font-medium whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-50">
                    {a.description}
                  </p>
                </div>

                {a.fileUrl && (
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1.5"
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span>Task Materials PDF</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

    </div>
  );
}
