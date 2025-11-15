import { nanoid } from "nanoid";
import type {
  Announcement,
  MessageTemplate,
  NotificationLog,
  ProviderSettings,
  Student,
  TemplateKey
} from "../types";

const classes = ["I", "II", "III"];
const sections = ["A", "B", "C"];

const firstNames = [
  "Aarav",
  "Diya",
  "Ishaan",
  "Kavya",
  "Rohan",
  "Anika",
  "Samar",
  "Meera",
  "Kabir",
  "Riya"
];

const lastNames = ["Singh", "Sharma", "Patel", "Iyer", "Verma", "Reddy"];

const makePhone = (index: number) => `+91${(9000000000 + index).toString()}`;

export const generateStudents = (): Student[] => {
  const result: Student[] = [];
  let phoneIndex = 0;
  for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      for (let i = 0; i < 4; i += 1) {
        const first = firstNames[(classIndex * 6 + sectionIndex * 3 + i) % firstNames.length];
        const last = lastNames[(classIndex * 6 + sectionIndex * 3 + i) % lastNames.length];
        const studentId = `STU-${classes[classIndex]}${sections[sectionIndex]}-${(i + 1).toString().padStart(2, "0")}`;
        result.push({
          id: nanoid(),
          studentId,
          firstName: first,
          lastName: last,
          class: classes[classIndex],
          section: sections[sectionIndex],
          rollNo: `${i + 1}`,
          parentPrimaryPhone: makePhone(phoneIndex),
          parentSecondaryPhone: makePhone(phoneIndex + 100),
          biometricId: `BIO-${classes[classIndex]}${sections[sectionIndex]}-${i + 1}`
        });
        phoneIndex += 1;
      }
    }
  }
  return result;
};

const makeAnnouncement = ({
  title,
  status,
  authorType,
  authorName,
  priority,
  scheduleType,
  createdOffsetMinutes = 0
}: {
  title: string;
  status: Announcement["status"];
  authorType: Announcement["authorType"];
  authorName: string;
  priority: Announcement["priority"];
  scheduleType: Announcement["schedule"]["type"];
  createdOffsetMinutes?: number;
}): Announcement => {
  const now = new Date();
  const created = new Date(now.getTime() - createdOffsetMinutes * 60000);
  return {
    id: nanoid(),
    title,
    htmlContent: `<p>${title} content with <strong>important</strong> details.</p>`,
    plainText: `${title} content with important details.`,
    target: { scope: "All" },
    channels: ["WhatsApp", "SMS"],
    priority,
    schedule: { type: scheduleType, datetime: scheduleType === "Later" ? now.toISOString() : undefined },
    status,
    authorType,
    authorName,
    attachments: [],
    createdAt: created.toISOString(),
    updatedAt: created.toISOString()
  };
};

export const seededAnnouncements: Announcement[] = [
  makeAnnouncement({
    title: "Fire Drill Reminder",
    status: "Pending",
    authorType: "Faculty",
    authorName: "Prof. Meera Iyer",
    priority: "Normal",
    scheduleType: "Now",
    createdOffsetMinutes: 40
  }),
  makeAnnouncement({
    title: "PTA Meeting",
    status: "Approved",
    authorType: "Admin",
    authorName: "Admin Office",
    priority: "Urgent",
    scheduleType: "Later",
    createdOffsetMinutes: 120
  }),
  makeAnnouncement({
    title: "Science Fair Projects",
    status: "Sent",
    authorType: "Admin",
    authorName: "Admin Office",
    priority: "Normal",
    scheduleType: "Now",
    createdOffsetMinutes: 240
  })
];

const notificationStatuses: NotificationLog["status"][] = ["queued", "sent", "delivered", "failed"];

export const generateNotifications = (students: Student[]): NotificationLog[] => {
  const now = Date.now();
  return students.slice(0, 15).map((student, index) => {
    const status = notificationStatuses[index % notificationStatuses.length];
    return {
      id: nanoid(),
      timestamp: new Date(now - index * 60000).toISOString(),
      studentId: student.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      class: student.class,
      section: student.section,
      parentPhone: student.parentPrimaryPhone,
      channel: index % 2 === 0 ? "WhatsApp" : "SMS",
      provider: index % 2 === 0 ? "Infobip BSP" : "Twilio SMS",
      providerMessageId: `MSG-${nanoid(6)}`,
      status,
      attempts: status === "failed" ? 2 : 1,
      errorText: status === "failed" ? "Recipient not on WhatsApp" : undefined
    };
  });
};

const templateMap: Record<TemplateKey, string> = {
  attendance_entry: "Hello {{1}}, {{2}} entered campus at {{3}}.",
  attendance_exit: "Hello {{1}}, {{2}} exited campus at {{3}}.",
  exam_alert: "Reminder: {{1}} exam for {{2}} is scheduled on {{3}}.",
  daily_digest: "Daily Digest: {{1}} attended {{2}} classes today."
};

export const seededTemplates: MessageTemplate[] = (Object.entries(templateMap) as [TemplateKey, string][]).map(
  ([key, content]) => ({
    key,
    name: key
      .split("_")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" "),
    description: "Editable template using WhatsApp placeholder format.",
    content,
    variables: ["1", "2", "3"],
    lastUpdated: new Date(Date.now() - 3600 * 1000).toISOString()
  })
);

export const seededSettings: ProviderSettings = {
  whatsappProvider: "Infobip BSP",
  whatsappApiKey: "whatsapp-placeholder-key",
  smsProvider: "Twilio",
  smsApiKey: "sms-placeholder-key",
  enableSmsFallback: true,
  rateLimitPerMinute: 120,
  optOutPolicyEnabled: true
};

