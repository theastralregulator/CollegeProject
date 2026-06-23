export interface Department {
  id: string; // e.g. computer, electronics, mechanical, civil
  name: string;
  code: string;
  overview: string;
  hodName: string;
  hodEmail: string;
  hodPhoto: string;
  studentCount: number;
  facultyCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  designation: string;
  departmentId: string;
  email: string;
  phone: string;
  photo: string;
}

export interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  departmentId: string;
  semester: number;
  place: string;
  phone: string;
  dob: string;
  parentName: string;
  parentPhone: string;
  bloodGroup: string;
  email: string;
}

export interface StudentRequest {
  id: string; // compatibility
  studentId: string;
  studentName: string;
  requesterName: string;
  requesterEmail: string;
  purpose: string; // compatibility
  status: 'pending' | 'approved' | 'rejected'; // compatibility
  createdAt: string; // compatibility

  // New fields
  requestId: string;
  requesterPhone: string;
  department?: string;
  requestedInformation: string[];
  reasonForRequest: string;
  additionalNotes?: string;
  requestStatus: 'Pending' | 'Approved' | 'Rejected';
  submittedDate: string;
  reviewedDate?: string;
  adminRemarks?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  category: 'academic' | 'placement' | 'event' | 'general';
  departmentId: string; // 'general' or specific department ID
  attachmentUrl?: string; // Optional simulated download link
  attachmentName?: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  departmentId: string;
  semester: number;
  fileName: string;
  fileUrl: string; // Link to download
  uploadedBy: string;
  uploadedAt: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  departmentId: string;
  semester: number;
  year: string;
  fileName: string;
  fileUrl: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  departmentId: string;
  semester: number;
  dueDate: string;
  description: string;
  fileName?: string;
  fileUrl?: string;
}

export interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: string;
  departmentId: string;
  semester: number;
  place: string;
  phone: string;
  isAvailable: boolean;
}

export interface CollegeInformation {
  id: string;
  key: string;
  title: string;
  content: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  studentId: string;
  studentName: string;
  department: string;
  semester: number;
  month: string;
  attendancePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  complaintId: string;
  id?: string;
  name: string;
  phoneNumber: string;
  email?: string;
  department: string;
  semester: number;
  category: string;
  title: string;
  description: string;
  isAnonymous: boolean;
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';
  adminRemarks: string;
  createdAt: string;
  submittedAt?: string;
  updatedAt: string;
}

export interface OutsiderBloodDonor {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  bloodGroup: string;
  place: string;
  district: string;
  age?: number;
  gender?: string;
  createdAt: string;
}

export interface OutsiderBloodDonorRequest {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  bloodGroup: string;
  place: string;
  district: string;
  age?: number;
  gender?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

// ── Role-Based Admin System ──────────────────────────────────────────────────

export type AdminRole = "student_admin" | "support_admin" | "admin" | "super_admin";

export interface AdminPermissions {
  notices: boolean;
  teachers: boolean;
  students: boolean;
  attendance: boolean;
  notes: boolean;
  assignments: boolean;
  qpapers: boolean;
  bloodbank: boolean;
  requests: boolean;
  outsiderDonors: boolean;
  complaints: boolean;
  adminManagement: boolean;
  activityLogs: boolean;
  systemSettings: boolean;
  announcements: boolean;
  databaseTools: boolean;
  backupReports: boolean;
  securityCenter: boolean;
  messages: boolean;
  siteControl: boolean;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: AdminRole;
  suspended: boolean;
  customPermissions?: Partial<AdminPermissions>;
  createdAt: string;
  createdBy?: string;
}

export interface ActivityLog {
  id?: string;
  userName: string;
  role: string;
  action: string;
  date: string;
  time: string;
  userId?: string;
}

export interface SystemSettings {
  siteName: string;
  logo: string;
  heroBanner: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialFb?: string;
  socialTw?: string;
  socialInsta?: string;
  footerContent: string;
  notificationEmail: string;
  emailAlertsEnabled: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "global" | "emergency";
  priority: "normal" | "important" | "emergency";
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  publishDate: string;
  scheduleTime?: string;
}

export interface Message {
  id?: string;
  senderId: string;
  senderRole: string;
  receiverId: string;
  receiverRole: string;
  participantIds: string[];
  message: string;
  createdAt: string;
  read: boolean;
  deleted: boolean;
  pinned?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
}

export interface ConversationMeta {
  id: string; // adminUid
  adminUid: string;
  adminName: string;
  adminRole: string;
  pinned: boolean;
  isImportant: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MaintenanceSettings {
  maintenanceMode: boolean;
  allowAdminAccess: boolean;
  allowSupportAccess: boolean;
  allowStudentAccess: boolean;
  estimatedReturnTime?: string;
  lastUpdated: string;
}

export interface MaintenanceLog {
  id?: string;
  activatedBy: string;
  activatedDate: string;
  activatedTime: string;
  disabledBy: string;
  disabledDate: string;
  disabledTime: string;
  createdAt: string;
}
