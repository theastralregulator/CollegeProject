import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Department, Teacher, Student, Notice, Note, QuestionPaper, Assignment, BloodDonor, CollegeInformation } from "./types";

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
    content: "Govt. Polytechnic College Kaduthuruthy (GPC Kaduthuruthy) is a premier technical institution located in the scenic and peaceful town of Muttuchira near Kaduthuruthy in Kottayam district, Kerala. Established to provide supreme technical education, the college is operated directly under the Department of Technical Education, Government of Kerala. It is approved by the All India Council for Technical Education (AICTE), New Delhi, and affiliated to the State Board of Technical Education, Kerala. GPC Kaduthuruthy offers intensive and standard engineering diploma courses across computer science, electronics, and microcomputing hardware domains."
  },
  {
    id: "history",
    key: "history",
    title: "College History",
    content: "The college was established by the Government of Kerala to uplift the rural and semi-urban populations of central Travancore by granting access to high-quality technological training. Over the years, the institution has risen significantly in research, industry placement, and athletic competitions, producing modern engineers, service operators, and tech leaders currently deployed in prestigious organizations globally."
  },
  {
    id: "vision",
    key: "vision",
    title: "Vision",
    content: "To emerge as a premier center of technical excellence and vocational training, empowering young minds with modern engineering skills, moral integrity, innovative drive, and values of social sustainability and global progress."
  },
  {
    id: "mission",
    key: "mission",
    title: "Mission",
    content: "1. Delivering comprehensive technical education with severe emphasis on theoretical clarity and robust hands-on laboratory expertise.\n2. Hardening standard industry linkages, ethical standards of practice, teamwork, and entrepreneurial mindset in our students.\n3. Empowering the local and state economy through engineering consultancy, green energy drives, and community-centric technology models."
  },
  {
    id: "principal",
    key: "principal",
    title: "Principal Information",
    content: "The institution is led by the esteemed Principal Susha S., a highly qualified academician and tech administrator with multiple decades of experience in technical curricula. Smt. Susha S. directs all institutional developments, ensuring proper laboratory infrastructure, active placement drives, and compliance with State Board standards.\n- Contact Email: principal@gptckaduthuruthy.ac.in\n- Alternate Email: gptckaduthuruthy@gmail.com\n- Office Phone: +91 4829 283100"
  },
  {
    id: "departments",
    key: "departments",
    title: "Academic Departments",
    content: "The college operates three core engineering branches, each run by highly experienced HODs and highly trained faculty members:\n1. Department of Computer Engineering: Specializes in modern full-stack developer ecosystems, machine learning, networking, and software principles.\n2. Department of Computer Hardware Engineering: Focuses on digital circuits, chip diagnostic interfacing, peripheral controllers, and PC system maintenance.\n3. Department of Electronics Engineering: Centered on analog communications, VLSI boards, embedded systems, signaling, and robotics."
  },
  {
    id: "facilities",
    key: "facilities",
    title: "Campus Facilities",
    content: "GPC Kaduthuruthy boasts a rich suite of modern campus facilities:\n- Advanced Computing Centers with high-speed leased bandwidth connection.\n- Fully automated Central Library with extensive reference registers and high-speed digital search docks.\n- Fully operational student hostels with high security and dietary food courts.\n- Eco Green Club gardens, sports tracks, gymnasiums, and state-of-the-art Seminar halls for tech symposiums.\n- Secure laboratories equipped with advanced testing kits, industrial solder stations, and microcontroller modules."
  },
  {
    id: "courses",
    key: "courses",
    title: "Courses Offered",
    content: "We deliver full-time 3-year AICTE-approved engineering diploma courses (6 Semesters per course) leading to standard State Board certificates:\n1. Diploma in Computer Engineering (Duration: 3 Years, Intake: 60 students per batch)\n2. Diploma in Computer Hardware Engineering (Duration: 3 Years, Intake: 60 students per batch)\n3. Diploma in Electronics Engineering (Duration: 3 Years, Intake: 60 students per batch)"
  },
  {
    id: "laboratories",
    key: "laboratories",
    title: "Engineering Laboratories",
    content: "Industrial-grade lab setups are maintained within each branch:\n- Computer Engineering Labs: Software & Web Programming Lab, Networks and Operating Systems Lab, Artificial Intelligence Lab.\n- Computer Hardware Labs: Digital Electronics Interfacing Lab, PC Hardware Diagnostic Maintenance Station, Peripheral Interfacing Lab.\n- Electronics Engineering Labs: VLSI Design & Microcontroller Interfacing Lab, Communication Engineering Lab, Basic Electronics Circuit Solodering Station, Physics & Chemistry Research Core."
  },
  {
    id: "library",
    key: "library",
    title: "Central Library",
    content: "Our library is the intellectual heart of the campus. It holds over 11,000 reference textbooks, tech guides, and academic encyclopedias. It houses a premium Digital Reading section where students can access free IEEE publications, AICTE journals, online lecture portals, and previous years' question banks."
  },
  {
    id: "placement",
    key: "placement",
    title: "Career Guidance & Placements",
    content: "The Career Guidance & Placement Cell (CGPC) runs regular industry readiness workshops, resume editing courses, soft-skill training and mock interviews. GPC Kaduthuruthy graduates are hired annually by giants like Tata Consultancy Services (TCS), Keltron, Wipro, and various start-ups in Infopark Kochi and Technopark Trivandrum."
  },
  {
    id: "activities",
    key: "activities",
    title: "Campus Activities",
    content: "Life at GPC Kaduthuruthy is balanced with vibrant co-curricular clubs:\n- National Service Scheme (NSS): Partakes in community service, afforestation drives, and flood relief campaigns.\n- Eco Green Club: Cultivates standard green-campus practices, rain harvesting setups, and afforestation.\n- ISTE Students Chapter: Spearheads technology and robotics exhibitions, web development bootcamps, and coding hackathons.\n- Arts & Sports Festivals: Annual championships featuring regional performance art and competitive track and field sports."
  },
  {
    id: "academics",
    key: "academics",
    title: "Academic Information",
    content: "Admissions are governed strictly by the Department of Technical Education, Government of Kerala. Exams are executed through a semester scheme by the State Board. Continuous evaluations consist of internal exams, lab test evaluations, and semester board exams (both practical and theory written sheets) designed to test authentic core engineering talent."
  },
  {
    id: "contact",
    key: "contact",
    title: "Contact Information",
    content: "- Main Office Hotline: +91 4829 283100\n- Alternate Support: +91 4829 283200\n- Principal Email: principal@gptckaduthuruthy.ac.in\n- General Office Enquiries: gptckaduthuruthy@gmail.com\n- Website: https://gpckaduthuruthy.ac.in"
  },
  {
    id: "address",
    key: "address",
    title: "Address & Location Map Details",
    content: "Govt. Polytechnic College Kaduthuruthy,\nNear Muttuchira, Kaduthuruthy P.O.,\nKottayam District,\nKerala, India, Pin - 686613.\nConveniently located near the Kottayam-Ernakulam highway, GPC Kaduthuruthy is highly accessible via Kaduthuruthy Railway Station or local bus transits."
  },
  {
    id: "important",
    key: "important",
    title: "Important College Information Summary",
    content: "- Institution Code: 60 (for DTE Kerala Counseling allotments)\n- Campus Type: Co-Educational Government Technical Diploma College\n- Governing Authority: State Board of Technical Education, Department of Technical Education (DTE), Government of Kerala.\n- Academic Year Cycle: Odd semesters start in June, Even semesters start in December/January."
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

    console.log("Successfully validated and seeded Firebase Firestore databases!");
  } catch (error) {
    console.error("Failed to seed college database: ", error);
    handleFirestoreError(error, OperationType.WRITE, "seeding");
  }
}
