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

