import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  doc,
  setDoc
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { seedAllCollections } from "./dataSeed";
import { 
  Notice, Department, Teacher, Student, Note, QuestionPaper, Assignment, BloodDonor, StudentRequest, CollegeInformation, AttendanceRecord, Complaint,
  OutsiderBloodDonor, OutsiderBloodDonorRequest
} from "./types";

// Component imports
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import NoticeCard from "./components/NoticeCard";
import AiAssistant from "./components/AiAssistant";
import AdminPanel from "./components/AdminPanel";
import DepartmentView from "./components/DepartmentView";
import AttendanceView from "./components/AttendanceView";
import ComplaintView from "./components/ComplaintView";
import ErrorBoundary from "./components/ErrorBoundary";
import { 
  AboutView, TeachersView, StudentsView, BloodBankView, AcademicCenter
} from "./components/SubViews";

// Icon imports
import { 
  Sparkles, Search, Mic, ArrowRight, BookOpen, FileText, ClipboardList, 
  Droplet, RefreshCw, Layers, Shield, Volume2, HelpCircle, 
  GraduationCap, Download, ChevronRight, X, Heart, Building2, MapPin, Mail, Phone, Users,
  Briefcase, PhoneCall, Clock, MessageSquare, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import collegeHero from "./assets/images/college_hero_1782064601753.png";

// Local static fallbacks to guarantee instant render while Firebase loads or if offline
const localFallbackDepartments: Department[] = [
  {
    id: "computer",
    name: "Computer Engineering",
    code: "CT",
    overview: "Computer Engineering department offers rigorous exposure to software engineering, real-time operating systems, artificial intelligence, networking, and micro-processing architecture. Equipped with state-of-the-art computer networks, and laboratories.",
    hodName: "Dr. Sandeep K. R.",
    hodEmail: "hod.ct@gptckaduthuruthy.ac.in",
    hodPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80",
    studentCount: 180,
    facultyCount: 12
  },
  {
    id: "hardware",
    name: "Computer Hardware Engineering",
    code: "CH",
    overview: "Specialized focus on digital electronics, microcontroller programming, system maintenance, peripheral interfacing, and hardware-software co-design.",
    hodName: "Prof. Joseph Kurian",
    hodEmail: "hod.ch@gptckaduthuruthy.ac.in",
    hodPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80",
    studentCount: 120,
    facultyCount: 8
  },
  {
    id: "electronics",
    name: "Electronics Engineering",
    code: "EL",
    overview: "Delving into advanced circuitry, analog systems, VLSI chips, signal processing, embedded systems, and robotic hardware.",
    hodName: "Prof. Priya Nair",
    hodEmail: "hod.el@gptckaduthuruthy.ac.in",
    hodPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=80",
    studentCount: 175,
    facultyCount: 10
  }
];

export default function App() {
  // Navigation tabs: 'home' | 'notices' | 'ai' | 'departments' | 'more' | 'admin'
  const [activeTab, setActiveTab] = useState<string>("home");

  // Sub-tabs under 'more': 'about' | 'teachers' | 'students' | 'bloodbank' | 'academics'
  const [activeMoreSubTab, setActiveMoreSubTab] = useState<string>("about");

  // Auxiliary props for deep linking to academics type from Home
  const [academicInitialType, setAcademicInitialType] = useState<"notes" | "papers" | "assignments">("notes");

  // Dynamic context passed to chat
  const [pendingAiQuery, setPendingAiQuery] = useState<string>("");
  const [chatBoxInput, setChatBoxInput] = useState<string>("");

  // Firestore Reactive state folders
  const [notices, setNotices] = useState<Notice[]>([]);
  const [departments, setDepartments] = useState<Department[]>(localFallbackDepartments);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [studentRequests, setStudentRequests] = useState<StudentRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [collegeInfo, setCollegeInfo] = useState<CollegeInformation[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [outsiderDonors, setOutsiderDonors] = useState<OutsiderBloodDonor[]>([]);
  const [outsiderDonorRequests, setOutsiderDonorRequests] = useState<OutsiderBloodDonorRequest[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    importedStudentsCount: 0,
    duplicateRecordsFound: 0,
    duplicateRecordsRemoved: 0
  });
  const [bloodBankStats, setBloodBankStats] = useState({
    duplicateDonorsFound: 0,
    duplicateDonorsRemoved: 0
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Authentication statuses
  const [adminUser, setAdminUser] = useState<User | null>(null);

  // Trigger seeding and load Firestore observers
  useEffect(() => {
    let active = true;
    const unsubscribes: (() => void)[] = [];

    const registerListeners = () => {
      if (!active) return;

      const unsubNotices = onSnapshot(collection(db, "notices"), (snap) => {
        const list: Notice[] = [];
        snap.forEach(d => list.push(d.data() as Notice));
        // sort by date descending
        list.sort((a, b) => b.date.localeCompare(a.date));
        setNotices(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "notices");
      });
      unsubscribes.push(unsubNotices);

      const unsubDepts = onSnapshot(collection(db, "departments"), (snap) => {
        const list: Department[] = [];
        snap.forEach(d => list.push(d.data() as Department));
        if (list.length > 0) setDepartments(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "departments");
      });
      unsubscribes.push(unsubDepts);

      const unsubTeachers = onSnapshot(collection(db, "faculty"), (snap) => {
        const list: Teacher[] = [];
        snap.forEach(d => list.push(d.data() as Teacher));
        setTeachers(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "faculty");
      });
      unsubscribes.push(unsubTeachers);

      const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
        const list: Student[] = [];
        snap.forEach(d => list.push(d.data() as Student));
        setStudents(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "students");
      });
      unsubscribes.push(unsubStudents);

      const unsubNotes = onSnapshot(collection(db, "notes"), (snap) => {
        const list: Note[] = [];
        snap.forEach(d => list.push(d.data() as Note));
        setNotes(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "notes");
      });
      unsubscribes.push(unsubNotes);

      const unsubQPs = onSnapshot(collection(db, "questionPapers"), (snap) => {
        const list: QuestionPaper[] = [];
        snap.forEach(d => list.push(d.data() as QuestionPaper));
        setQuestionPapers(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "questionPapers");
      });
      unsubscribes.push(unsubQPs);

      const unsubAssigns = onSnapshot(collection(db, "assignments"), (snap) => {
        const list: Assignment[] = [];
        snap.forEach(d => list.push(d.data() as Assignment));
        setAssignments(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "assignments");
      });
      unsubscribes.push(unsubAssigns);

      const unsubDonors = onSnapshot(collection(db, "bloodBank"), (snap) => {
        const list: BloodDonor[] = [];
        snap.forEach(d => list.push(d.data() as BloodDonor));
        setDonors(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "bloodBank");
      });
      unsubscribes.push(unsubDonors);

      const unsubRequests = onSnapshot(collection(db, "studentRequests"), (snap) => {
        const list: StudentRequest[] = [];
        snap.forEach(d => list.push(d.data() as StudentRequest));
        setStudentRequests(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "studentRequests");
      });
      unsubscribes.push(unsubRequests);

      const unsubCollegeInfo = onSnapshot(collection(db, "collegeInformation"), (snap) => {
        const list: CollegeInformation[] = [];
        snap.forEach(d => list.push(d.data() as CollegeInformation));
        setCollegeInfo(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "collegeInformation");
      });
      unsubscribes.push(unsubCollegeInfo);

      const unsubAttendance = onSnapshot(collection(db, "attendance"), (snap) => {
        const list: AttendanceRecord[] = [];
        snap.forEach(d => list.push(d.data() as AttendanceRecord));
        setAttendance(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "attendance");
      });
      unsubscribes.push(unsubAttendance);

      const unsubOutsiderDonors = onSnapshot(collection(db, "outsiderBloodDonors"), (snap) => {
        const list: OutsiderBloodDonor[] = [];
        snap.forEach(d => list.push(d.data() as OutsiderBloodDonor));
        setOutsiderDonors(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "outsiderBloodDonors");
      });
      unsubscribes.push(unsubOutsiderDonors);

      const unsubOutsiderRequests = onSnapshot(collection(db, "outsiderBloodDonorRequests"), (snap) => {
        const list: OutsiderBloodDonorRequest[] = [];
        snap.forEach(d => list.push(d.data() as OutsiderBloodDonorRequest));
        setOutsiderDonorRequests(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "outsiderBloodDonorRequests");
      });
      unsubscribes.push(unsubOutsiderRequests);

      const unsubStats = onSnapshot(doc(db, "attendanceStats", "summary"), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAttendanceStats({
            importedStudentsCount: data.importedStudentsCount || 0,
            duplicateRecordsFound: data.duplicateRecordsFound || 0,
            duplicateRecordsRemoved: data.duplicateRecordsRemoved || 0
          });
        } else {
          setDoc(doc(db, "attendanceStats", "summary"), {
            importedStudentsCount: 0,
            duplicateRecordsFound: 0,
            duplicateRecordsRemoved: 0
          }).catch(err => console.error("Error initializing stats:", err));
        }
      }, (error) => {
        console.error("Error observing stats:", error);
      });
      unsubscribes.push(unsubStats);

      const unsubBloodBankStats = onSnapshot(doc(db, "bloodBankStats", "summary"), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setBloodBankStats({
            duplicateDonorsFound: data.duplicateDonorsFound || 0,
            duplicateDonorsRemoved: data.duplicateDonorsRemoved || 0
          });
        } else {
          setDoc(doc(db, "bloodBankStats", "summary"), {
            duplicateDonorsFound: 0,
            duplicateDonorsRemoved: 0
          }).catch(err => console.error("Error initializing blood bank stats:", err));
        }
      }, (error) => {
        console.error("Error observing stats:", error);
      });
      unsubscribes.push(unsubBloodBankStats);

      // complaints listener removed from startup to prevent public permission issues.
      // it is now managed via a separate useEffect hook.

      const unsubCategories = onSnapshot(collection(db, "noticeCategories"), (snap) => {
        const list: { id: string; name: string }[] = [];
        snap.forEach(d => list.push(d.data() as any));
        setCategories(list);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "noticeCategories");
        setLoading(false);
      });
      unsubscribes.push(unsubCategories);
    };

    // 1. Run seeding
    seedAllCollections()
      .catch((err) => {
        console.error("Firebase Database seeding failed:", err);
      })
      .finally(() => {
        registerListeners();
      });

    // Check pre-existing auth session
    const savedAdminEmail = localStorage.getItem("campusai_admin_email");
    if (savedAdminEmail) {
      setAdminUser({
        email: savedAdminEmail,
        uid: "sabin-fallback-uid",
        emailVerified: true,
      } as User);
    }

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setAdminUser(u);
      } else {
        if (!localStorage.getItem("campusai_admin_email")) {
          setAdminUser(null);
        }
      }
    });

    return () => {
      active = false;
      unsubscribes.forEach(unsub => unsub());
      unsubAuth();
    };
  }, []);

  // Load complaints only for logged-in admin (real or mock fallback since auth console is restricted)
  useEffect(() => {
    if (!adminUser) {
      console.log("[Complaints Listener] Skip subscribing: no admin session active.");
      setComplaints([]);
      return;
    }

    console.log("[Complaints Listener] Starting realtime listener on 'complaints' collection for user:", adminUser.email);
    const unsub = onSnapshot(collection(db, "complaints"), (snap) => {
      const list: Complaint[] = [];
      snap.forEach(d => {
        const data = d.data() as Complaint;
        // Check 6 mapping fallback
        if (!data.id) {
          data.id = data.complaintId || d.id;
        }
        if (!data.complaintId) {
          data.complaintId = data.id;
        }
        if (!data.createdAt) {
          data.createdAt = data.submittedAt || new Date().toISOString();
        }
        if (!data.submittedAt) {
          data.submittedAt = data.createdAt;
        }
        list.push(data);
      });
      console.log(`[Complaints Listener] Read success! Count: ${list.length} documents fetched.`);
      setComplaints(list);
    }, (error) => {
      console.error("[Complaints Listener] Firestore query error occurred:", error);
      handleFirestoreError(error, OperationType.LIST, "complaints");
    });

    return () => {
      console.log("[Complaints Listener] Cleaning up active listener.");
      unsub();
    };
  }, [adminUser]);

  const handleAdminLogout = async () => {
    localStorage.removeItem("campusai_admin_email");
    await signOut(auth);
    setAdminUser(null);
  };

  const handleDirectAiInquiry = () => {
    if (!chatBoxInput.trim()) return;
    setPendingAiQuery(chatBoxInput);
    setChatBoxInput("");
    setActiveTab("ai");
  };

  const handleQuickQuizTrigger = (promptText: string) => {
    setPendingAiQuery(promptText);
    setActiveTab("ai");
  };

  const handleDeepAcademicNavigation = (type: "notes" | "papers" | "assignments") => {
    setAcademicInitialType(type);
    setActiveMoreSubTab("academics");
    setActiveTab("more");
  };

  const handleQuickAccessNavigation = (subId: string) => {
    setActiveMoreSubTab(subId);
    setActiveTab("more");
  };

  // Scroll to top on navigation changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeTab, activeMoreSubTab]);

  // Custom notice category badges
  const categoryThemes = {
    academic: "bg-blue-100 text-blue-800",
    placement: "bg-emerald-100 text-emerald-800",
    event: "bg-purple-100 text-purple-800",
    general: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-6">
      
      {/* Header / Desktop Navbar */}
      <Navbar 
        currentTab={activeTab} 
        setTab={(t) => setActiveTab(t)} 
        isAdminLoggedIn={!!adminUser}
        onLogout={handleAdminLogout}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        {/* SKELETON LOADER WINDOW */}
        {loading ? (
          <div className="space-y-6 pt-12 animate-pulse">
            <div className="h-65 w-full rounded-3xl bg-slate-200" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="h-28 rounded-2xl bg-slate-200" />
              <div className="h-28 rounded-2xl bg-slate-200" />
              <div className="h-28 rounded-2xl bg-slate-200" />
              <div className="h-28 rounded-2xl bg-slate-200" />
            </div>
            <div className="h-50 rounded-3xl bg-slate-200" />
          </div>
        ) : (
          
          <AnimatePresence mode="wait">
            
            {/* ==========================================
                1. TAB: HOME PAGE
                ========================================== */}
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-10"
              >
                
                {/* Section 1: Hero Banner */}
                <div className="relative overflow-hidden rounded-[24px] shadow-xl border border-slate-100 min-h-[480px] md:h-[520px] flex items-center group shrink-0 bg-slate-950">
                  {/* Full Background image (college building) */}
                  <img
                    src={collegeHero}
                    alt="Govt Polytechnic College Kaduthuruthy building"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover object-[60%_center] md:object-center contrast-[1.03] saturate-[1.05] brightness-[0.98] transition-transform duration-1000 group-hover:scale-101 z-0"
                  />
                  
                  {/* Very light blue overlay - Reduced blue tint opacity to 15% to preserve natural colors */}
                  <div className="absolute inset-0 bg-blue-900/15 z-10" />
                  
                  {/* Subtle dark gradient behind the text area for 100% legibility */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 md:via-slate-950/50 to-transparent z-10" />

                  {/* Left Side: Title and Controls */}
                  <div className="relative z-20 p-6 sm:p-12 md:p-14 h-full flex flex-col justify-center text-white w-full md:max-w-2xl">
                    <p className="text-[11px] font-black uppercase tracking-widest text-blue-300 drop-shadow-sm">
                      Govt Polytechnic College Kaduthuruthy
                    </p>
                    <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight leading-none text-white drop-shadow-md">
                      GPTC CONNECT
                    </h2>
                    <p className="mt-1.5 text-md sm:text-xl font-bold tracking-tight text-blue-200">
                      Your Digital Student Portal
                    </p>
                    <p className="mt-3.5 text-xs sm:text-sm text-slate-200 font-medium max-w-lg leading-relaxed drop-shadow-sm">
                      A smart digital student portal providing notices, notes, assignments, question papers, blood bank information, department information, and college resources in one place.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button 
                        onClick={() => setActiveTab("departments")} 
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/30 font-sans"
                      >
                        Explore Campus
                      </button>
                      <button 
                        onClick={() => setActiveTab("ai")} 
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 rounded-xl text-xs font-bold transition-all active:scale-95"
                      >
                        Ask GPTC Assistant
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 2: AI Assistant Micro Card */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-2 max-w-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold italic text-sm">AI</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-md">Ask GPTC Assistant</h3>
                        <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Online</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        Type clear queries of blood groups, class assignments, or syllabus notes. Bounded safely to Govt Polytechnic files.
                      </p>
                    </div>

                    {/* Search box block */}
                    <div className="flex-1 max-w-lg w-full">
                      <div className="relative flex items-center space-x-1.5 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all duration-200">
                        <input
                          type="text"
                          value={chatBoxInput}
                          onChange={(e) => setChatBoxInput(e.target.value)}
                          placeholder="Ask: Show S5 web notes or Find O+ blood donors..."
                          onKeyDown={(e) => { if (e.key === "Enter") handleDirectAiInquiry(); }}
                          className="flex-1 text-xs font-semibold px-3 py-2 text-slate-800 outline-none placeholder-slate-400 bg-transparent"
                        />
                        <button
                          onClick={handleDirectAiInquiry}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
                        >
                          Ask
                        </button>
                      </div>

                      {/* Spark prompts */}
                      <div className="mt-3.5 flex flex-wrap gap-2 text-[10.5px] font-bold text-slate-500">
                        <span className="text-slate-400">FAQ sparks:</span>
                        <button onClick={() => handleQuickQuizTrigger("Show latest notices")} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 text-slate-600 rounded-full border border-slate-100 transition whitespace-nowrap">Show notices</button>
                        <button onClick={() => handleQuickQuizTrigger("Find O+ blood donors")} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 text-slate-600 rounded-full border border-slate-100 transition whitespace-nowrap">O+ Blood</button>
                        <button onClick={() => handleQuickQuizTrigger("Show assignments s5")} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 text-slate-600 rounded-full border border-slate-100 transition whitespace-nowrap">S5 Homework</button>
                        <button onClick={() => handleQuickQuizTrigger("How to submit a complaint?")} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 text-slate-600 rounded-full border border-slate-100 transition whitespace-nowrap">File Complaint</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Quick Access Bento Grid */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-405 pl-1 uppercase tracking-widest">Active Archives Quick access</h3>
                  
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                      { id: "notes", title: "Syllabus Notes", subtitle: "Branch PDFs & texts", icon: BookOpen, color: "bg-blue-500", text: "text-blue-600", action: () => handleDeepAcademicNavigation("notes") },
                      { id: "papers", title: "Question Papers", subtitle: "Previous series", icon: FileText, color: "bg-indigo-500", text: "text-indigo-600", action: () => handleDeepAcademicNavigation("papers") },
                      { id: "assignments", title: "Active Assignments", subtitle: "Homework tracker", icon: ClipboardList, color: "bg-emerald-500", text: "text-emerald-600", action: () => handleDeepAcademicNavigation("assignments") },
                      { id: "attendance", title: "Attendance Tracker", subtitle: "Check active status", icon: Calendar, color: "bg-amber-500", text: "text-amber-600", action: () => setActiveTab("attendance") },
                      { id: "bloodbank", title: "Blood Bank", subtitle: "Emergency donors", icon: Droplet, color: "bg-red-500", text: "text-red-600", action: () => handleQuickAccessNavigation("bloodbank") },
                      { id: "complaints", title: "Complaint Box", subtitle: "Submit feedback", icon: MessageSquare, color: "bg-purple-500", text: "text-purple-600", action: () => handleQuickAccessNavigation("complaints") },
                    ].map((card, idx) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={idx}
                          onClick={card.action}
                          className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 hover:border-slate-200 shadow-2xs hover:shadow-xs transition duration-200"
                        >
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.color} text-white shadow-2xs`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <h4 className="mt-4 text-xs font-black text-slate-800 tracking-tight">{card.title}</h4>
                          <p className="mt-0.5 text-[10.5px] text-slate-400 font-semibold">{card.subtitle}</p>
                          <div className="mt-3.5 flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600 transition">
                            <span>Browse Catalog</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Latest Notices & Department Scroll */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Notice feed block */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between pl-1">
                      <h3 className="text-sm font-extrabold text-slate-405 uppercase tracking-widest leading-none">High-Priority Notices</h3>
                      <button 
                        onClick={() => setActiveTab("notices")} 
                        className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>View All Feed</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {notices.slice(0, 2).map((n) => (
                        <NoticeCard 
                          key={n.id} 
                          notice={n} 
                          onReadMore={(selNotice) => setSelectedNotice(selNotice)} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Horizontal Scroll Departments Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pl-1">
                      <h3 className="text-sm font-extrabold text-slate-405 uppercase tracking-widest leading-none">Departments Offered</h3>
                      <button 
                        onClick={() => setActiveTab("departments")} 
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        All Details
                      </button>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-5 space-y-3 shadow-2xs">
                      {departments.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setActiveTab("departments");
                          }}
                          className="group cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-slate-50 hover:bg-slate-50/60 transition"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-750 group-hover:text-blue-600 transition">{d.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">HOD: {d.hodName} • Code: {d.code}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ==========================================
                2. TAB: NOTICES FEED
                ========================================== */}
            {activeTab === "notices" && (
              <motion.div
                key="notices"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold text-slate-850">Recent Announcements</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Official board publications, placement invites, fee deadlines, and schedule rosters.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {notices.map((n) => (
                    <NoticeCard 
                      key={n.id} 
                      notice={n} 
                      onReadMore={(selNotice) => setSelectedNotice(selNotice)} 
                    />
                  ))}
                  {notices.length === 0 && (
                    <div className="sm:col-span-3 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                      <p className="text-xs font-bold text-slate-400">No official announcements found loaded in Firestore database.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ==========================================
                3. TAB: AI VOICE/CHAT ASSISTANT
                ========================================== */}
            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <AiAssistant 
                  initialQuery={pendingAiQuery} 
                  onClearInitialQuery={() => setPendingAiQuery("")}
                  notices={notices}
                  donors={donors}
                  notes={notes}
                  assignments={assignments}
                  departments={departments}
                  faculty={teachers}
                  questionPapers={questionPapers}
                  collegeInformation={collegeInfo}
                  attendance={attendance}
                  activeTab={activeTab}
                />
              </motion.div>
            )}

            {/* ==========================================
                4. TAB: DEPARTMENTS DETAILS
                ========================================== */}
            {activeTab === "departments" && (
              <motion.div
                key="departments"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DepartmentView 
                  departments={departments}
                  teachers={teachers}
                  notes={notes}
                  questionpapers={questionPapers}
                  assignments={assignments}
                />
              </motion.div>
            )}

            {/* ==========================================
                4.5 TAB: ATTENDANCE DETAILS
                ========================================== */}
            {activeTab === "attendance" && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ErrorBoundary>
                  <AttendanceView 
                    attendance={attendance}
                    departments={departments}
                  />
                </ErrorBoundary>
              </motion.div>
            )}

            {/* ==========================================
                5. TAB: MORE FEATURES
                ========================================== */}
            {activeTab === "more" && (
              <motion.div
                key="more"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Visual horizontal selector submenu */}
                <div className="flex border-b border-slate-100 overflow-x-auto gap-1.5 pb-1 select-none">
                  {[
                    { id: "about", label: "About GPC", icon: Building2 },
                    { id: "teachers", label: "Teachers", icon: Users },
                    { id: "students", label: "Students", icon: GraduationCap },
                    { id: "bloodbank", label: "Blood Bank", icon: Droplet },
                    { id: "attendance", label: "Attendance", icon: Clock },
                    { id: "complaints", label: "Complaint Box", icon: MessageSquare },
                    { id: "academics", label: "Downloads Center", icon: Download },
                  ].map((subItem) => {
                    const Icon = subItem.icon;
                    const isSubActive = activeMoreSubTab === subItem.id;
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveMoreSubTab(subItem.id)}
                        className={`flex-none flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold transition ${
                          isSubActive
                            ? "bg-indigo-550 text-white shadow-2xs"
                            : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                        }`}
                      >
                        <Icon className="h-4 w-4 truncate shrink-0" />
                        <span>{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  {activeMoreSubTab === "about" && <AboutView departments={departments} />}
                  {activeMoreSubTab === "teachers" && <TeachersView teachers={teachers} departments={departments} />}
                  {activeMoreSubTab === "students" && <StudentsView students={students} departments={departments} studentRequests={studentRequests} />}
                  {activeMoreSubTab === "bloodbank" && <BloodBankView donors={donors} outsiderDonors={outsiderDonors} />}
                  {activeMoreSubTab === "attendance" && <AttendanceView attendance={attendance} departments={departments} />}
                  {activeMoreSubTab === "complaints" && <ComplaintView departments={departments} />}
                  {activeMoreSubTab === "academics" && (
                    <AcademicCenter 
                      initialType={academicInitialType} 
                      notes={notes} 
                      questionpapers={questionPapers} 
                      assignments={assignments}
                      departments={departments}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* ==========================================
                6. TAB: SECURE COLLEGE ADMIN SESSION
                ========================================== */}
            {activeTab === "admin" && (
              <motion.div
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AdminPanel 
                  notices={notices}
                  teachers={teachers}
                  students={students}
                  notes={notes}
                  assignments={assignments}
                  questionpapers={questionPapers}
                  donors={donors}
                  departments={departments}
                  studentRequests={studentRequests}
                  attendance={attendance}
                  complaints={complaints}
                  noticeCategories={categories}
                  outsiderDonorRequests={outsiderDonorRequests}
                  outsiderDonors={outsiderDonors}
                  attendanceStats={attendanceStats}
                  bloodBankStats={bloodBankStats}
                  onRefreshData={() => {
                    // Reactive snapshot automatically syncing, but we trigger a log confirm.
                    console.log("Notifying admin dashboard update sync complete.");
                  }}
                  onLoginSuccess={(authU) => setAdminUser(authU)}
                  onLogoutSuccess={() => setAdminUser(null)}
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}

      </main>

      {/* Detail Modal layer for notice expansion */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotice(null)}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs"
            />

            {/* popup window */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative max-w-lg w-full rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xl z-10"
            >
              <button 
                onClick={() => setSelectedNotice(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
                title="Close overlay"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold leading-none ${categoryThemes[selectedNotice.category] || categoryThemes.general}`}>
                  <span className="capitalize">{selectedNotice.category}</span>
                </span>
                {selectedNotice.departmentId !== "general" && (
                  <span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 uppercase leading-none border border-indigo-100">
                    {selectedNotice.departmentId}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-semibold ml-auto">{selectedNotice.date}</span>
              </div>

              <h3 className="text-md sm:text-lg font-black tracking-tight text-slate-800 leading-snug">
                {selectedNotice.title}
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-slate-500 whitespace-pre-line font-medium leading-relaxed font-sans">
                {selectedNotice.content}
              </p>

              {/* simulated PDF attachment download link */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Govt Polytechnic College</span>
                <a
                  href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download file material</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-12 mb-20 md:mb-6 border-t border-slate-100 pt-6 pb-4 text-center">
        <p className="text-sm font-black tracking-widest text-slate-800 uppercase">GPTC Connect</p>
        <p className="text-xs font-semibold text-slate-400 mt-1">Govt Polytechnic College Kaduthuruthy</p>
        <p className="text-[10px] text-slate-300 font-medium mt-1">© 2026 All Rights Reserved</p>
      </footer>

      {/* Bottom bar navigation menu */}
      <BottomNav currentTab={activeTab} setTab={(t) => setActiveTab(t)} />


    </div>
  );
}
