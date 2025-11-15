export type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  class: string;
  section: string;
  rollNo: string;
  parentPrimaryPhone: string;
  parentSecondaryPhone?: string;
  biometricId: string;
};

export type RosterColumnKey =
  | "student_id"
  | "name"
  | "gender"
  | "department"
  | "year_of_study"
  | "cgpa"
  | "email"
  | "phone_number"
  | "parent_number"
  | "city"
  | "attendance_percentage";

export type RosterFileRow = Record<string, string>;

export type RosterRow = {
  rowId: string;
  data: {
    student_id: string;
    name: string;
    gender: string;
    department: string;
    year_of_study: string;
    cgpa: string;
    email: string;
    phone_number: string;
    parent_number: string;
    city: string;
    attendance_percentage: string;
  };
  errors: string[];
  duplicateOf?: string;
  raw?: RosterFileRow;
};

export type AnnouncementStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Sent";

export type AnnouncementChannel = "WhatsApp" | "SMS" | "In-App";

export type Attachment = {
  id: string;
  name: string;
  type: "image" | "pdf" | "other";
  previewUrl: string;
};

export type Announcement = {
  id: string;
  title: string;
  htmlContent: string;
  plainText: string;
  target: {
    scope: "All" | "Class" | "Section" | "Custom";
    classes?: string[];
    sections?: string[];
    customRecipients?: string[];
  };
  channels: AnnouncementChannel[];
  priority: "Normal" | "Urgent";
  schedule: {
    type: "Now" | "Later";
    datetime?: string;
  };
  status: AnnouncementStatus;
  authorType: "Admin" | "Faculty";
  authorName: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
};

export type BiometricEventType = "entry" | "exit";

export type BiometricEvent = {
  id: string;
  studentId: string;
  timestamp: string;
  type: BiometricEventType;
  deviceId: string;
  class: string;
  section: string;
  messagePreview: string;
  parentPhones: string[];
  collapsed?: boolean;
  relatedEventId?: string;
};

export type NotificationStatus = "queued" | "sent" | "delivered" | "failed";

export type NotificationLog = {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  parentPhone: string;
  channel: AnnouncementChannel;
  provider: string;
  providerMessageId: string;
  status: NotificationStatus;
  attempts: number;
  errorText?: string;
};

export type TemplateKey = "attendance_entry" | "attendance_exit" | "exam_alert" | "daily_digest";

export type MessageTemplate = {
  key: TemplateKey;
  name: string;
  description: string;
  content: string;
  variables: string[];
  lastUpdated: string;
};

export type ProviderSettings = {
  whatsappProvider: string;
  whatsappApiKey: string;
  smsProvider: string;
  smsApiKey: string;
  enableSmsFallback: boolean;
  rateLimitPerMinute: number;
  optOutPolicyEnabled: boolean;
};

export type ThemeMode = "light" | "dark";

export type ThemePaletteKey = "softPink" | "warmCreme" | "offWhite" | "deepIndigo" | "tealSunrise";

export type ThemeVariant = Record<string, string>;

export type ThemePalette = {
  key: ThemePaletteKey;
  name: string;
  light: ThemeVariant;
  dark: ThemeVariant;
};

