import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Department, Teacher, Student, Notice, Note, QuestionPaper, Assignment, BloodDonor, CollegeInformation, AttendanceRecord, Complaint } from "./types";

const mockDepartments: Department[] = [
  {
    id: "computer",
    name: "Computer Engineering",
    code: "CT",
    overview: "Forming the vanguard of the digital age, our Computer Engineering department offers rigorous exposure to software engineering, real-time operating systems, artificial intelligence, networking, and micro-processing architecture.",
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
    overview: "Delving into advanced circuitry, analog systems, VLSI chips, signal processing, embedded systems, and robotic hardware. Electronics Engineering fosters critical technical aptitude.",
    hodName: "Prof. Priya Nair",
    hodEmail: "hod.el@gptckaduthuruthy.ac.in",
    hodPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=80",
    studentCount: 175,
    facultyCount: 10
  }
];

const mockTeachers: Teacher[] = [
  { id: "t1", name: "Dr. Sandeep K. R.", designation: "HOD & Professor", departmentId: "computer", email: "sandeep.kr@gptckaduthuruthy.ac.in", phone: "+91 9447101010", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&h=300&q=80" },
  { id: "t2", name: "Prof. Joseph Kurian", designation: "Asst. Professor", departmentId: "hardware", email: "joseph.kurian@gptckaduthuruthy.ac.in", phone: "+91 9447202020", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80" },
  { id: "t3", name: "Prof. Meera S.", designation: "Lecturer", departmentId: "computer", email: "meera.s@gptckaduthuruthy.ac.in", phone: "+91 9447303030", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80" },
  { id: "t4", name: "Prof. Priya Nair", designation: "HOD & Associate Professor", departmentId: "electronics", email: "priya.nair@gptckaduthuruthy.ac.in", phone: "+91 9447404040", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=80" },
  { id: "t5", name: "Prof. Vivek Sharma", designation: "Asst. Professor", departmentId: "electronics", email: "vivek.sharma@gptckaduthuruthy.ac.in", phone: "+91 9447505055", photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&h=300&q=80" }
];

const mockStudents: Student[] = [
  { id: "s1", name: "Adithya Sunil", admissionNumber: "ADM-2024-001", departmentId: "computer", semester: 5, place: "Kaduthuruthy", phone: "9876543201", dob: "2005-04-12", parentName: "Sunil Kumar", parentPhone: "9447112233", bloodGroup: "O+", email: "adithya.ct5@gptckaduthuruthy.ac.in" },
  { id: "s2", name: "Anjali Krishna", admissionNumber: "ADM-2024-012", departmentId: "computer", semester: 5, place: "Kottayam", phone: "9876543202", dob: "2005-08-25", parentName: "Krishnan Unni", parentPhone: "9447223344", bloodGroup: "A+", email: "anjali.ct5@gptckaduthuruthy.ac.in" },
  { id: "s3", name: "Gautham S.", admissionNumber: "ADM-2025-055", departmentId: "hardware", semester: 3, place: "Vaikom", phone: "9876543203", dob: "2006-01-15", parentName: "Soman Pillai", parentPhone: "9447334455", bloodGroup: "B+", email: "gautham.ct3@gptckaduthuruthy.ac.in" },
  { id: "s4", name: "Fathima R.", admissionNumber: "ADM-2024-098", departmentId: "electronics", semester: 5, place: "Ettumanoor", phone: "9876543204", dob: "2005-11-02", parentName: "Abdul Rahman", parentPhone: "9447445566", bloodGroup: "O-", email: "fathima.el5@gptckaduthuruthy.ac.in" },
  { id: "s5", name: "Midhun Mohan", admissionNumber: "ADM-2026-102", departmentId: "electronics", semester: 1, place: "Ernakulam", phone: "9876543205", dob: "2007-03-30", parentName: "Mohanan Nair", parentPhone: "9447556677", bloodGroup: "AB+", email: "midhun.el1@gptckaduthuruthy.ac.in" }
];

const mockNotices: Notice[] = [
  {
    id: "n1",
    title: "Semester 5 Board Practical Examinations June 2026 Scheduled",
    content: "The Technical Board Practical Examinations for S5 (Computer Engineering, Computer Hardware Engineering, and Electronics Engineering) are scheduled to start from June 28, 2026. All students must present their certified lab manuals and college IDs. Ensure you report in your official academic uniform. Late entry is strictly prohibited.",
    date: "2026-06-20",
    category: "academic",
    departmentId: "general"
  },
  {
    id: "n2",
    title: "Tata Consultancy Services (TCS) Campus Drive for Final Year Students",
    content: "TCS is organizing an off-campus selection drive focusing on final-year Polytechnic Diploma holders on July 10, 2026. Eligible branches: Computer Engineering, Computer Hardware Engineering, and Electronics Engineering. CGPA cut-off: 7.0 and above with no current backlogs. Register via the placement hub by June 30.",
    date: "2026-06-18",
    category: "placement",
    departmentId: "computer"
  },
  {
    id: "n3",
    title: "Eco Green Club Campus Cleaning & Afforestation Campaign",
    content: "The Eco Green Club of GPC Kaduthuruthy is hosting a campus-wide planting Drive on World Environment Week on June 25, 2026. The chief guest will be the local Municipal Chairperson. All staff and students are eagerly requested to participate. Refreshments will be provided.",
    date: "2026-06-15",
    category: "event",
    departmentId: "general"
  },
  {
    id: "n4",
    title: "Payment of Semester Fees last date extended to July 5",
    content: "The Department of Technical Education has extended the final deadline for the collection of tuition and lab equipment fees of even semesters (S2, S4, S6) to July 5, 2026 without fine. Subsequent collection will incur standard late penalty charges.",
    date: "2026-06-12",
    category: "general",
    departmentId: "general"
  }
];

const mockNotes: Note[] = [
  { id: "nt1", title: "Web Technology Core Notes", subject: "Web Programming", departmentId: "computer", semester: 5, fileName: "web-programming-s5.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", uploadedBy: "Prof. Joseph Kurian", uploadedAt: "2026-06-10" },
  { id: "nt2", title: "Microprocessors and Controllers", subject: "Architecture & Interfacing", departmentId: "computer", semester: 5, fileName: "microprocessors-8086-notes.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", uploadedBy: "Dr. Sandeep K. R.", uploadedAt: "2026-06-12" },
  { id: "nt3", title: "Analog System VLSI Layouts", subject: "Industrial Electronics", departmentId: "electronics", semester: 5, fileName: "analog-vlsi-layout.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", uploadedBy: "Prof. Priya Nair", uploadedAt: "2026-06-14" }
];

const mockQuestionPapers: QuestionPaper[] = [
  { id: "q1", title: "Computer Networks Board Paper 2025", subject: "Computer Networks", departmentId: "computer", semester: 5, year: "2025", fileName: "computer-networks-2025.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "q2", title: "Software Engineering End Exam 2024", subject: "Software Engineering", departmentId: "computer", semester: 5, year: "2024", fileName: "software-engg-2024.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "q3", title: "Microcontroller Board Paper 2025", subject: "Microcontrollers", departmentId: "electronics", semester: 5, year: "2025", fileName: "microcontroller-board-2025.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
];

const mockAssignments: Assignment[] = [
  { id: "a1", title: "React Context & Hooks Custom Project", subject: "Web Programming", departmentId: "computer", semester: 5, dueDate: "2026-06-30", description: "Design a fully functional single-page task board using React Context API for localized state coordination. Write a clear summary explaining your state persistence strategy." },
  { id: "a2", title: "8086 Assembly Traffic Controller Design", subject: "Microprocessors", departmentId: "computer", semester: 5, dueDate: "2026-07-02", description: "Implement an assembly program to control a standard four-way traffic signal grid using 8255 PPI chip interfacing. Show absolute addresses." },
  { id: "a3", title: "Operational Amplifier Circuits Lab", subject: "Industrial Electronics", departmentId: "electronics", semester: 5, dueDate: "2026-06-29", description: "Solder a differentiator and integrator op-amp circuit on a standard general purpose PCB. Plot output wave logs for sinus and square entries." }
];

const mockBloodBank: BloodDonor[] = [
  { id: "b1", name: "Adithya Sunil", bloodGroup: "O+", departmentId: "computer", semester: 5, place: "Kaduthuruthy", phone: "+91 9447123456", isAvailable: true },
  { id: "b2", name: "Midhun Mohan", bloodGroup: "AB+", departmentId: "electronics", semester: 1, place: "Ernakulam", phone: "+91 9447112233", isAvailable: true },
  { id: "b4", name: "Anjali Krishna", bloodGroup: "A+", departmentId: "computer", semester: 5, place: "Kottayam", phone: "+91 9554433221", isAvailable: false },
  { id: "b5", name: "Fathima R.", bloodGroup: "O-", departmentId: "electronics", semester: 5, place: "Ettumanoor", phone: "+91 9665544332", isAvailable: true }
];

const mockCategories = [
  { id: "academic", name: "Academic" },
  { id: "exam", name: "Exam" },
  { id: "placement", name: "Placement" },
  { id: "event", name: "Event" },
  { id: "circular", name: "Circular" },
  { id: "scholarship", name: "Scholarship" },
  { id: "general", name: "General" }
];

const mockCollegeInformation: CollegeInformation[] = [
  {
    id: "overview",
    key: "overview",
    title: "College Overview",
    content: "Government Polytechnic College Kaduthuruthy (GPC Kaduthuruthy) is a premier government technical institution located in Kaduthuruthy, Kottayam, Kerala. Established in 1999, the college is managed by the Directorate of Technical Education, Thiruvananthapuram, Government of Kerala. It is approved by AICTE and affiliated to the State Board of Technical Education, Kerala. The college offers 3-year diploma programmes in Computer Engineering, Computer Hardware Engineering, and Electronics Engineering with a total student strength of 438+ students and an institution code of 60 (DTE Kerala)."
  },
  {
    id: "vision",
    key: "vision",
    title: "Vision",
    content: "To be an ideal institution that moulds students, mainly from the rural community, into future professionals who are also model citizens of the nation."
  },
  {
    id: "mission",
    key: "mission",
    title: "Mission",
    content: "1. Employ modern infrastructure and facilities with innovative teaching methods.\n2. Prepare students to meet industry requirements and modern technology trends.\n3. Develop social responsibility, ethics, and environmental awareness."
  },
  {
    id: "principal",
    key: "principal",
    title: "Principal Information",
    content: "The institution is led by Principal Geetha C.M. The principal directs all institutional developments, ensuring proper laboratory infrastructure, active placement drives, and compliance with State Board standards.\n- Principal: Geetha C.M\n- Office Phone: 04829 295131\n- Email: principal@gpckaduthuruthy.ac.in\n- College Email: gptckaduthuruthy@gmail.com"
  },
  {
    id: "departments",
    key: "departments",
    title: "Academic Departments",
    content: "The college operates three core engineering diploma programmes:\n1. Computer Engineering (CT) - HOD: Dr. Sandeep K.R. - 180 students - Specialises in software engineering, AI, networking, and operating systems.\n2. Computer Hardware Engineering (CH) - HOD: Prof. Joseph Kurian - 120 students - Focuses on digital electronics, microcontrollers, PC maintenance, and peripheral interfacing.\n3. Electronics Engineering (EL) - HOD: Prof. Priya Nair - 175 students - Covers VLSI, analog systems, embedded systems, signal processing, and robotics."
  },
  {
    id: "facilities",
    key: "facilities",
    title: "Campus Facilities",
    content: "GPC Kaduthuruthy campus facilities include:\n- Central Library: 11,000+ books, IEEE journals, digital reading section, previous year question banks.\n- Computer Labs: High-speed fiber-connected workstations for programming, networking, and AI.\n- Electronics Labs: VLSI design, microcontroller interfacing, communication engineering labs.\n- Hardware Labs: PC hardware diagnostics, peripheral interfacing, digital electronics labs.\n- Language Lab: English communication and presentation skills development.\n- Finishing School: Personality development, soft skills, and interview preparation.\n- Placement Cell & Career Guidance Cell.\n- NSS Unit, NCC Unit, ISTE Students Chapter.\n- Sports Facilities: cricket, football, volleyball, indoor games.\n- Auditorium, Canteen, Cooperative Society.\n- Innovation Activities: TECHNOFILA technical symposium, hackathons, project expos."
  },
  {
    id: "placement",
    key: "placement",
    title: "Placement & Career Guidance",
    content: "GPC Kaduthuruthy achieved 100% placement for the academic year 2025-26. The Career Guidance & Placement Cell (CGPC) runs regular industry readiness workshops, resume editing, soft-skill training, and mock interviews. Recruiting companies include Tata Consultancy Services (TCS), Keltron, Wipro, BSNL, Infopark Kochi startups, and Technopark Trivandrum companies. Average package: ₹3.2 Lakhs per annum. 15+ companies recruit annually. Placement Cell Phone: 04829 295131. Website: gpckaduthuruthy.ac.in"
  },
  {
    id: "contact",
    key: "contact",
    title: "Contact Information",
    content: "Government Polytechnic College Kaduthuruthy\nKaduthuruthy, Kottayam, Kerala 686604\nPhone: 04829 295131\nEmail: gptckaduthuruthy@gmail.com\nPrincipal Email: principal@gpckaduthuruthy.ac.in\nOfficial Website: https://gpckaduthuruthy.ac.in\nInstitution Code: 60 (DTE Kerala Counselling)"
  },
  {
    id: "academics",
    key: "academics",
    title: "Academic Information",
    content: "Admissions are governed by the Directorate of Technical Education, Government of Kerala. Exams are conducted through a semester scheme by the State Board of Technical Education. The academic year follows a 6-semester (3-year) structure. Odd semesters start in June, Even semesters start in December/January. Continuous evaluation includes internal exams, lab assessments, and semester board exams (theory and practical). Institution Code for DTE Kerala counselling: 60."
  },
  {
    id: "activities",
    key: "activities",
    title: "Campus Activities",
    content: "Campus life at GPC Kaduthuruthy includes:\n- NSS (National Service Scheme): Community service, afforestation drives, blood donation camps, flood relief campaigns.\n- NCC (National Cadet Corps): Discipline, leadership, and national spirit development.\n- ISTE Students Chapter: Technology exhibitions, robotics workshops, coding hackathons, web development bootcamps.\n- TECHNOFILA: Annual technical symposium and cultural event.\n- Sports: Inter-collegiate tournaments in cricket, football, volleyball, athletics.\n- Eco Green Club: Campus green initiatives, rain harvesting, and afforestation.\n- Arts Club: Cultural programs and annual day celebrations."
  },
  {
    id: "admission",
    key: "admission",
    title: "Admission Information",
    content: "Admission Process:\n- Admissions to 3-year diploma programmes are through DTE Kerala centralised allotment.\n- Institution Code: 60.\n- Courses: Diploma in Computer Engineering, Diploma in Computer Hardware Engineering, Diploma in Electronics Engineering.\n- Intake: 60 students per course per year.\n- Eligibility: Class 10 pass (SSLC or equivalent).\n- Application through: www.polyadmission.org (DTE Kerala).\n- Reservations as per Government of Kerala norms.\n- For details contact: 04829 295131 or gptckaduthuruthy@gmail.com"
  },
  {
    id: "complaints_info",
    key: "complaints",
    title: "Complaint Box & Grievance Redressal System",
    content: "GPTC Kaduthuruthy provides a digital 'Complaint Box' where students can securely submit complaints, suggestion box entries, feedback, or grievances to the college administration. How to submit: Go to the 'Complaint Box' page in the 'More' menu or Home quick access. Complete the Complaint Form with Title, Category, and Description. Option to submit with identity or anonymously. Categories: Academic Issues, Faculty Related, Laboratory Issues, Infrastructure, Library, Examination, Attendance, Placement, Ragging Complaint, Suggestion, Other. Statuses track from Pending, Under Review, Resolved, to Rejected."
  }
];


export async function seedAllCollections() {
  console.log("Checking Firestore databases to support seeding...");
  try {
    // 1. Departments
    const deptSnap = await getDocs(collection(db, "departments"));
    if (deptSnap.empty) {
      console.log("Seeding departments...");
      for (const dept of mockDepartments) {
        await setDoc(doc(db, "departments", dept.id), dept);
      }
    }

    // 2. Faculty
    const teachSnap = await getDocs(collection(db, "faculty"));
    if (teachSnap.empty) {
      console.log("Seeding faculty...");
      for (const t of mockTeachers) {
        await setDoc(doc(db, "faculty", t.id), t);
      }
    }

    // 3. Students
    const studSnap = await getDocs(collection(db, "students"));
    if (studSnap.empty) {
      console.log("Seeding students...");
      for (const s of mockStudents) {
        await setDoc(doc(db, "students", s.id), s);
      }
    }

    // 4. Notices
    const noticeSnap = await getDocs(collection(db, "notices"));
    if (noticeSnap.empty) {
      console.log("Seeding notices...");
      for (const n of mockNotices) {
        await setDoc(doc(db, "notices", n.id), n);
      }
    }

    // 5. Notes
    const notesSnap = await getDocs(collection(db, "notes"));
    if (notesSnap.empty) {
      console.log("Seeding notes...");
      for (const note of mockNotes) {
        await setDoc(doc(db, "notes", note.id), note);
      }
    }

    // 6. Question Papers
    const qpSnap = await getDocs(collection(db, "questionPapers"));
    if (qpSnap.empty) {
      console.log("Seeding question papers...");
      for (const qp of mockQuestionPapers) {
        await setDoc(doc(db, "questionPapers", qp.id), qp);
      }
    }

    // 7. Assignments
    const assignSnap = await getDocs(collection(db, "assignments"));
    if (assignSnap.empty) {
      console.log("Seeding assignments...");
      for (const a of mockAssignments) {
        await setDoc(doc(db, "assignments", a.id), a);
      }
    }

    // 8. Blood Bank
    const bloodSnap = await getDocs(collection(db, "bloodBank"));
    if (bloodSnap.empty) {
      console.log("Seeding blood bank donors...");
      for (const b of mockBloodBank) {
        await setDoc(doc(db, "bloodBank", b.id), b);
      }
    }

    // 9. Categories
    const categorySnap = await getDocs(collection(db, "noticeCategories"));
    if (categorySnap.empty) {
      console.log("Seeding notice categories...");
      for (const cat of mockCategories) {
        await setDoc(doc(db, "noticeCategories", cat.id), cat);
      }
    }

    // 10. College Information RAG Data
    const infoSnap = await getDocs(collection(db, "collegeInformation"));
    if (infoSnap.empty) {
      console.log("Seeding college information knowledge base modules...");
      for (const info of mockCollegeInformation) {
        await setDoc(doc(db, "collegeInformation", info.id), info);
      }
    }

    // 11. Attendance Records
    const attendanceSnap = await getDocs(collection(db, "attendance"));
    if (attendanceSnap.empty) {
      console.log("Seeding attendance records...");
      for (const att of mockAttendance) {
        await setDoc(doc(db, "attendance", att.attendanceId), att);
      }
    }

    // 12. Complaints
    try {
      const complaintsSnap = await getDocs(collection(db, "complaints"));
      if (complaintsSnap.empty) {
        console.log("Seeding complaints...");
        for (const comp of mockComplaints) {
          await setDoc(doc(db, "complaints", comp.complaintId), comp);
        }
      }
    } catch (e) {
      console.info("Skipping complaints seeding (restricted to authenticated admins).");
    }

    console.log("Successfully validated and seeded Firebase Firestore databases!");
  } catch (error) {
    console.error("Failed to seed college database: ", error);
    handleFirestoreError(error, OperationType.WRITE, "seeding");
  }
}

const mockAttendance: AttendanceRecord[] = [
  {
    attendanceId: "att_s1_june",
    studentId: "s1",
    studentName: "Adithya Sunil",
    department: "computer",
    semester: 5,
    month: "June 2026",
    attendancePercentage: 92,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    attendanceId: "att_s1_july",
    studentId: "s1",
    studentName: "Adithya Sunil",
    department: "computer",
    semester: 5,
    month: "July 2026",
    attendancePercentage: 88,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    attendanceId: "att_s2_june",
    studentId: "s2",
    studentName: "Anjali Krishna",
    department: "computer",
    semester: 5,
    month: "June 2026",
    attendancePercentage: 72,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    attendanceId: "att_s3_june",
    studentId: "s3",
    studentName: "Gautham S.",
    department: "hardware",
    semester: 3,
    month: "June 2026",
    attendancePercentage: 95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    attendanceId: "att_s4_june",
    studentId: "s4",
    studentName: "Fathima R.",
    department: "electronics",
    semester: 5,
    month: "June 2026",
    attendancePercentage: 78,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    attendanceId: "att_s5_june",
    studentId: "s5",
    studentName: "Midhun Mohan",
    department: "electronics",
    semester: 1,
    month: "June 2026",
    attendancePercentage: 64,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockComplaints: Complaint[] = [
  {
    complaintId: "comp_001",
    name: "Adithya Sunil",
    phoneNumber: "9876543201",
    email: "adithya.ct5@gptckaduthuruthy.ac.in",
    department: "computer",
    semester: 5,
    category: "Infrastructure",
    title: "Projector not working in S5 classroom",
    description: "The projector in our S5 Computer Engineering classroom has been blinking and flickering for the last two weeks, making it hard to follow the slides during lectures. Please look into it.",
    isAnonymous: false,
    status: "Pending",
    adminRemarks: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    complaintId: "comp_002",
    name: "Anjali Krishna",
    phoneNumber: "9876543202",
    email: "anjali.ct5@gptckaduthuruthy.ac.in",
    department: "computer",
    semester: 5,
    category: "Laboratory Issues",
    title: "Insufficient VLSI lab kits",
    description: "During lab hours, 3 students have to share a single VLSI kit. This leaves very little hands-on practice time for each student. Kindly procure more kits if possible.",
    isAnonymous: true,
    status: "Under Review",
    adminRemarks: "Under investigation by the department.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
