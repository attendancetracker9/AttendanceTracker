import { nanoid } from "nanoid";
import * as XLSX from "xlsx";
import type {
  Announcement,
  AnnouncementChannel,
  BiometricEvent,
  MessageTemplate,
  NotificationLog,
  ProviderSettings,
  RosterRow,
  Student
} from "../types";
import {
  generateNotifications,
  generateStudents,
  seededAnnouncements,
  seededSettings,
  seededTemplates
} from "../data/seed";
import { formatTime, isE164Phone } from "../utils/formatters";
import { applyTemplate } from "../utils/templates";

type BiometricListener = (event: BiometricEvent) => void;

const sleep = (min = 300, max = 900) =>
  new Promise<void>((resolve) => {
    const ms = Math.floor(Math.random() * (max - min)) + min;
    setTimeout(resolve, ms);
  });

const studentsStore: Student[] = generateStudents();
let announcementsStore: Announcement[] = [...seededAnnouncements];
let notificationsStore: NotificationLog[] = generateNotifications(studentsStore);
let templatesStore: MessageTemplate[] = [...seededTemplates];
let settingsStore: ProviderSettings = { ...seededSettings };

const biometricListeners = new Set<BiometricListener>();
const biometricEventsStore: BiometricEvent[] = [];
let biometricIntervalId: number | null = null;

const attendanceTemplate = (direction: "entry" | "exit") =>
  templatesStore.find((template) => template.key === `attendance_${direction}`) ?? templatesStore[0];

const emitBiometricEvent = (event: BiometricEvent) => {
  biometricEventsStore.push(event);
  biometricListeners.forEach((listener) => listener(event));
};

const startBiometricStream = () => {
  if (biometricIntervalId) return;
  biometricIntervalId = window.setInterval(() => {
    const student = studentsStore[Math.floor(Math.random() * studentsStore.length)];
    const type = Math.random() > 0.4 ? "entry" : "exit";
    const template = attendanceTemplate(type);
    const { message } = applyTemplate(template, {
      "1": student.parentPrimaryPhone,
      "2": `${student.firstName} ${student.lastName}`,
      "3": formatTime(new Date().toISOString())
    });
    const event: BiometricEvent = {
      id: nanoid(),
      studentId: student.studentId,
      timestamp: new Date().toISOString(),
      type,
      deviceId: `Device-${Math.floor(Math.random() * 4) + 1}`,
      class: student.class,
      section: student.section,
      messagePreview: message,
      parentPhones: [student.parentPrimaryPhone, student.parentSecondaryPhone ?? ""].filter(Boolean)
    };
    emitBiometricEvent(event);
  }, 8000);
};

const stopBiometricStream = () => {
  if (biometricIntervalId) {
    clearInterval(biometricIntervalId);
    biometricIntervalId = null;
  }
};

const withLatency = async <T>(callback: () => T | Promise<T>) => {
  await sleep();
  return callback();
};

const findAnnouncement = (id: string) => announcementsStore.find((item) => item.id === id);

const requiredRosterFields: (keyof RosterRow["data"])[] = [
  "student_id",
  "name",
  "gender",
  "department",
  "year_of_study",
  "cgpa",
  "email",
  "phone_number",
  "parent_number",
  "city",
  "attendance_percentage"
];

const ensureRosterValidation = (rows: RosterRow[]): RosterRow[] => {
  const seenIds = new Map<string, string>();
  return rows.map((row) => {
    const errors = new Set<string>(row.errors);
    requiredRosterFields.forEach((field) => {
      if (!row.data[field]) errors.add(`Missing ${field.replace(/_/g, " ")}`);
    });
    if (row.data.phone_number && !isE164Phone(row.data.phone_number)) {
      errors.add("Invalid phone number (must be exactly 10 digits)");
    }
    if (row.data.parent_number && !isE164Phone(row.data.parent_number)) {
      errors.add("Invalid parent number (must be exactly 10 digits)");
    }
    if (row.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.data.email)) {
      errors.add("Invalid email format");
    }
    const duplicate = seenIds.get(row.data.student_id);
    if (duplicate) {
      errors.add("Duplicate student_id in file");
      return { ...row, errors: Array.from(errors), duplicateOf: duplicate };
    }
    if (row.data.student_id) {
      seenIds.set(row.data.student_id, row.rowId);
    }
    return { ...row, errors: Array.from(errors) };
  });
};

const rosterColumns = [
  "Student_ID",
  "Name",
  "Gender",
  "Department",
  "Year_of_Study",
  "CGPA",
  "Email",
  "Phone_Number",
  "Parent_Number",
  "City",
  "Attendance_Percentage"
];

// Helper function to parse CSV line (handles quoted fields and commas)
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current);
  
  return result;
};

const normalizeRosterRows = (rows: RosterRow[]): RosterRow[] => ensureRosterValidation(rows);

const mapRosterColumnsInternal = (mapping: Record<string, string>, rows: RosterRow[]): RosterRow[] => {
  const mappedRows = rows.map((row) => {
    const mapped: RosterRow["data"] = {
      student_id: "",
      name: "",
      gender: "",
      department: "",
      year_of_study: "",
      cgpa: "",
      email: "",
      phone_number: "",
      parent_number: "",
      city: "",
      attendance_percentage: ""
    };
    Object.entries(mapping).forEach(([requiredKey, columnName]) => {
      const rawValue = row.raw?.[columnName] ?? "";
      if (requiredKey in mapped) {
        mapped[requiredKey as keyof typeof mapped] = rawValue.trim();
      }
    });
    return {
      ...row,
      data: mapped,
      errors: []
    };
  });
  return normalizeRosterRows(mappedRows);
};

const simulateSendLifecycle = async (notification: NotificationLog) => {
  notification.status = "queued";
  notification.attempts += 1;
  await sleep(200, 400);
  const fallbackTrigger = Math.random() < 0.2;
  if (notification.channel === "WhatsApp" && fallbackTrigger) {
    notification.status = "failed";
    notification.errorText = "Recipient not on WhatsApp";
    return "not_on_whatsapp";
  }
  notification.status = "sent";
  await sleep(200, 400);
  notification.status = Math.random() > 0.1 ? "delivered" : "failed";
  notification.errorText = notification.status === "failed" ? "Provider timeout" : undefined;
  return notification.status === "failed" ? "failed" : "delivered";
};

const sendNotificationForStudent = async (
  student: Student,
  channel: AnnouncementChannel,
  message: string
): Promise<NotificationLog> => {
  const notification: NotificationLog = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    studentId: student.studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    class: student.class,
    section: student.section,
    parentPhone: student.parentPrimaryPhone,
    channel,
    provider: channel === "WhatsApp" ? settingsStore.whatsappProvider : settingsStore.smsProvider,
    providerMessageId: `MSG-${nanoid(6)}`,
    status: "queued",
    attempts: 0
  };
  notificationsStore = [notification, ...notificationsStore];
  const result = await simulateSendLifecycle(notification);
  if (result === "not_on_whatsapp" && settingsStore.enableSmsFallback && channel === "WhatsApp") {
    const fallback = await sendNotificationForStudent(student, "SMS", message);
    fallback.errorText = undefined;
  }
  return notification;
};

const sendAnnouncementNotifications = async (announcement: Announcement) => {
  const targets =
    announcement.target.scope === "All"
      ? studentsStore
      : announcement.target.scope === "Class"
      ? studentsStore.filter((student) => announcement.target.classes?.includes(student.class))
      : announcement.target.scope === "Section"
      ? studentsStore.filter((student) => announcement.target.sections?.includes(`${student.class}-${student.section}`))
      : studentsStore.filter((student) => announcement.target.customRecipients?.includes(student.parentPrimaryPhone));
  const message = announcement.plainText;
  for (const channel of announcement.channels) {
    for (const student of targets.slice(0, 10)) {
      // limit to 10 recipients in mock
      // eslint-disable-next-line no-await-in-loop
      await sendNotificationForStudent(student, channel, message);
    }
  }
};

const api = {
  async getInitialData() {
    return withLatency(() => ({
      students: studentsStore,
      announcements: announcementsStore,
      notifications: notificationsStore,
      templates: templatesStore,
      settings: settingsStore
    }));
  },
  getSettingsSync: () => settingsStore,
  async parseRosterFile(file: File) {
    await sleep(400, 700);
    
    try {
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      
      let columns: string[] = [];
      let dataRows: RosterRow[] = [];
      
      if (isExcel) {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        
        // Validate file size (Excel files should be at least a few KB)
        if (arrayBuffer.byteLength < 100) {
          throw new Error("File appears to be too small to be a valid Excel file");
        }
        
        let workbook: XLSX.WorkBook;
        try {
          workbook = XLSX.read(arrayBuffer, { 
            type: "array", 
            cellDates: false,
            cellNF: false,
            cellStyles: false
          });
        } catch (error) {
          throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : "Invalid file format"}`);
        }
        
        // Get first sheet
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Excel file has no sheets");
        }
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        if (!worksheet || !worksheet["!ref"]) {
          throw new Error("Excel sheet is empty or invalid");
        }
        
        // Extract headers from first row (row 0)
        // Use a simpler approach: convert sheet to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: "",
          raw: false,
          blankrows: false
        }) as any[][];
        
        if (jsonData.length === 0) {
          throw new Error("Excel file is empty");
        }
        
        // Find the header row - skip metadata rows that contain XML, brackets, or look like file structure
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;
          
          // Check if this row looks like a header row (contains common field names)
          const rowText = row.map((cell) => String(cell || "").toLowerCase()).join(" ");
          const looksLikeHeader = 
            rowText.includes("student") ||
            rowText.includes("name") ||
            rowText.includes("email") ||
            rowText.includes("phone") ||
            rowText.includes("department") ||
            rowText.includes("gender") ||
            rowText.includes("id");
          
          // Check if this row looks like metadata (XML, file structure, etc.)
          const looksLikeMetadata = 
            rowText.includes("xml") ||
            rowText.includes("content_types") ||
            rowText.includes("rels") ||
            rowText.includes("[content_types]") ||
            (rowText.includes("[") && rowText.includes("]") && row.length === 1);
          
          if (looksLikeHeader || (!looksLikeMetadata && i === 0)) {
            headerRowIndex = i;
            break;
          }
        }
        
        // Extract headers from the identified header row
        const headerRowRaw = jsonData[headerRowIndex] as any[] || [];
        const headerRow = headerRowRaw.map((col, idx) => {
          // Convert to string and trim
          let str = String(col || "").trim();
          
          // Skip if this looks like XML/metadata content
          if (str.includes("<") || 
              str.includes("xml") || 
              str.includes("XML") ||
              str.toLowerCase().includes("content_types") ||
              str.toLowerCase().includes("rels") ||
              (str.includes("[") && str.includes("]") && str.length > 50)) {
            // Use column letter as fallback
            return `Column ${String.fromCharCode(65 + (idx % 26))}`;
          }
          
          // If empty, use column letter
          if (!str || str.length === 0) {
            return `Column ${String.fromCharCode(65 + (idx % 26))}`;
          }
          
          return str;
        });
        
        // Filter out columns that are clearly metadata (very long strings with special chars)
        const validColumns = headerRow.map((col, idx) => {
          if (col.length > 100 || (col.includes("[") && col.includes("]"))) {
            return `Column ${String.fromCharCode(65 + (idx % 26))}`;
          }
          return col;
        });
        
        // Use cleaned headers for columns
        columns = validColumns;
        
        // Process data rows (start from row after header)
        const dataStartIndex = headerRowIndex + 1;
        for (let rowIndex = dataStartIndex; rowIndex < jsonData.length; rowIndex++) {
          const row = jsonData[rowIndex] as any[];
          if (!row || row.length === 0) continue;
          
          // Create raw data object using cleaned header names
          const raw: Record<string, string> = {};
          let hasData = false;
          
          validColumns.forEach((columnName, colIndex) => {
            const value = row[colIndex] !== undefined 
              ? String(row[colIndex] || "").trim() 
              : "";
            raw[columnName] = value;
            
            if (value.length > 0) {
              hasData = true;
            }
          });
          
          // Skip rows where all values are empty
          if (!hasData) {
            continue;
          }
          
          dataRows.push({
            rowId: nanoid(),
            data: {
              student_id: "",
              name: "",
              gender: "",
              department: "",
              year_of_study: "",
              cgpa: "",
              email: "",
              phone_number: "",
              parent_number: "",
              city: "",
              attendance_percentage: ""
            },
            errors: [],
            raw
          });
        }
      } else {
        // Parse CSV file
        const text = await file.text();
        
        // Split into lines and filter empty ones
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length === 0) {
          throw new Error("File is empty");
        }
        
        // Parse header row
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);
        columns = headers.map((h, idx) => {
          const cleaned = h.trim().replace(/^"|"$/g, "");
          // If empty or contains invalid content, use column letter
          if (!cleaned || cleaned.length === 0 || cleaned.includes("<") || cleaned.includes("xml")) {
            return `Column ${String.fromCharCode(65 + (idx % 26))}`;
          }
          return cleaned;
        });
        
        // Parse all data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          const values = parseCSVLine(line);
          
          // Create raw data object mapping column names to values
          const raw: Record<string, string> = {};
          columns.forEach((column, index) => {
            const value = values[index]?.trim().replace(/^"|"$/g, "") || "";
            raw[column] = value;
          });
          
          // Skip rows where all values are empty
          if (Object.values(raw).every((v) => !v.trim())) {
            continue;
          }
          
          dataRows.push({
            rowId: nanoid(),
            data: {
              student_id: "",
              name: "",
              gender: "",
              department: "",
              year_of_study: "",
              cgpa: "",
              email: "",
              phone_number: "",
              parent_number: "",
              city: "",
              attendance_percentage: ""
            },
            errors: [],
            raw
          });
        }
      }
      
      if (dataRows.length === 0) {
        throw new Error("No data rows found in file");
      }
      
      return {
        columns,
        rows: dataRows
      };
    } catch (error) {
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
  mapRosterColumns: (mapping: Record<string, string>, rows: RosterRow[]) =>
    withLatency(() => mapRosterColumnsInternal(mapping, rows)),
  async uploadRoster(rows: RosterRow[]) {
    await sleep(500, 900);
    const cleanRows = normalizeRosterRows(rows).filter((row) => row.errors.length === 0);
    let successCount = 0;
    let failureCount = rows.length - cleanRows.length;
    cleanRows.forEach((row) => {
      const existing = studentsStore.find((student) => student.studentId === row.data.student_id);
      // Split name into first and last name (simple split on first space)
      const nameParts = row.data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      // Map year_of_study to class format, department to section (for compatibility)
      const classValue = row.data.year_of_study || "";
      const sectionValue = row.data.department || "";
      
      if (existing) {
        Object.assign(existing, {
          firstName,
          lastName,
          class: classValue,
          section: sectionValue,
          rollNo: row.data.student_id, // Use student_id as roll no if not available
          parentPrimaryPhone: row.data.phone_number,
          parentSecondaryPhone: row.data.parent_number || undefined,
          biometricId: row.data.student_id // Use student_id as biometric id for compatibility
        });
      } else {
        studentsStore.push({
          id: nanoid(),
          studentId: row.data.student_id,
          firstName,
          lastName,
          class: classValue,
          section: sectionValue,
          rollNo: row.data.student_id,
          parentPrimaryPhone: row.data.phone_number,
          parentSecondaryPhone: row.data.parent_number || undefined,
          biometricId: row.data.student_id
        });
      }
      successCount += 1;
    });
    return {
      successCount,
      failureCount,
      students: studentsStore
    };
  },
  async createAnnouncement(payload: Partial<Announcement>) {
    await sleep();
    const announcement: Announcement = {
      id: nanoid(),
      title: payload.title ?? "Untitled",
      htmlContent: payload.htmlContent ?? "<p>Draft announcement</p>",
      plainText: payload.plainText ?? "Draft announcement",
      target: payload.target ?? { scope: "All" },
      channels: payload.channels ?? ["WhatsApp"],
      priority: payload.priority ?? "Normal",
      schedule: payload.schedule ?? { type: "Now" },
      status: payload.status ?? "Draft",
      authorType: "Admin",
      authorName: "Admin Office",
      attachments: payload.attachments ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rejectionReason: undefined
    };
    announcementsStore = [announcement, ...announcementsStore];
    if (announcement.status === "Approved" || announcement.status === "Sent") {
      await sendAnnouncementNotifications(announcement);
    }
    return announcement;
  },
  async submitFacultyAnnouncement(payload: Partial<Announcement>) {
    await sleep();
    const announcement = await api.createAnnouncement({
      ...payload,
      status: "Pending",
      authorType: "Faculty",
      authorName: payload.authorName ?? "Faculty Member"
    });
    return announcement;
  },
  async approveAnnouncement(id: string) {
    await sleep();
    const announcement = findAnnouncement(id);
    if (!announcement) throw new Error("Announcement not found");
    announcement.status = "Approved";
    announcement.updatedAt = new Date().toISOString();
    await sendAnnouncementNotifications(announcement);
    announcement.status = "Sent";
    return announcement;
  },
  async rejectAnnouncement(id: string, reason: string) {
    await sleep();
    const announcement = findAnnouncement(id);
    if (!announcement) throw new Error("Announcement not found");
    announcement.status = "Rejected";
    announcement.rejectionReason = reason;
    announcement.updatedAt = new Date().toISOString();
    return announcement;
  },
  async listNotifications() {
    return withLatency(() => notificationsStore);
  },
  async sendBiometricNotification(eventId: string) {
    await sleep();
    const event = biometricEventsStore.find((item) => item.id === eventId);
    if (!event) throw new Error("Biometric event not found");
    const student = studentsStore.find((item) => item.studentId === event.studentId);
    if (!student) throw new Error("Student missing");
    const template = attendanceTemplate(event.type);
    const { message } = applyTemplate(template, {
      "1": student.parentPrimaryPhone,
      "2": `${student.firstName} ${student.lastName}`,
      "3": formatTime(event.timestamp)
    });
    await sendNotificationForStudent(student, "WhatsApp", message);
  },
  async ignoreBiometricEvent(eventId: string) {
    await sleep(200, 400);
    const index = biometricEventsStore.findIndex((event) => event.id === eventId);
    if (index >= 0) {
      biometricEventsStore.splice(index, 1);
    }
  },
  async resendNotification(id: string) {
    await sleep();
    const notification = notificationsStore.find((item) => item.id === id);
    if (!notification) throw new Error("Notification not found");
    await simulateSendLifecycle(notification);
    return notification;
  },
  async bulkResend(ids: string[]) {
    await sleep();
    const results: NotificationLog[] = [];
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await api.resendNotification(id);
      const notification = notificationsStore.find((item) => item.id === id);
      if (notification) results.push(notification);
    }
    return results;
  },
  subscribeToBiometricFeed(listener: BiometricListener) {
    biometricListeners.add(listener);
    if (biometricListeners.size === 1) startBiometricStream();
    return () => {
      biometricListeners.delete(listener);
      if (!biometricListeners.size) stopBiometricStream();
    };
  },
  async updateSettings(partial: Partial<ProviderSettings>) {
    await sleep(200, 400);
    settingsStore = { ...settingsStore, ...partial };
    return settingsStore;
  },
  async updateTemplate(key: string, content: string) {
    await sleep(200, 400);
    const template = templatesStore.find((item) => item.key === key);
    if (!template) throw new Error("Template not found");
    template.content = content;
    template.lastUpdated = new Date().toISOString();
    return template;
  }
};

export const mockApi = api;

