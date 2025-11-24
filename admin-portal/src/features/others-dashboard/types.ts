import type { Timestamp } from "firebase/firestore";

export type OthersTabKey = "timetable" | "attendance" | "progress" | "events";

export type StudentProfile = {
  id: string;
  name: string;
  role: "student" | "parent" | "others";
  department: string;
  semester: string;
  section: string;
  email?: string;
  profilePic?: string;
};

export type TimetableClass = {
  period: string;
  startTime: string;
  endTime: string;
  subject: string;
  faculty: string;
  room: string;
  day: string;
};

export type TimetablePayload = {
  lastUpdated?: Timestamp | string;
  classes: TimetableClass[];
};

export type AttendanceSummary = {
  overallPercentage: number;
  subjectBreakdown: Array<{ subject: string; percentage: number }>;
  monthlyLogs: Record<string, "present" | "absent" | "late" | "holiday">;
  trend: Array<{ date: string; percentage: number }>;
  lastScan?: {
    timestamp: string;
    deviceId: string;
    type: "face" | "biometric";
  };
};

export type AttendanceLog = {
  id: string;
  status: "present" | "absent" | "late";
  timestamp: string;
  subject: string;
};

export type SemesterResult = {
  semesterId: string;
  internal: number;
  external: number;
  practicals: number;
  total: number;
  grade: string;
  status: "Pass" | "Fail";
  reportPdfUrl?: string;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  category: "Sports" | "Cultural" | "Academic" | "Fest" | "Others";
  imageUrl?: string;
  isUpcoming: boolean;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  summary: string;
  date: string;
};


