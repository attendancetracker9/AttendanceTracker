import { nanoid } from "nanoid";
import type {
  Announcement,
  NotificationLog,
  MessageTemplate,
  ProviderSettings,
  RosterRow,
  Student
} from "../types";
import {
  studentsService,
  announcementsService,
  notificationsService,
  templatesService,
  settingsService
} from "../services/firebaseService";
import { mockApi } from "./mockApi";
import { sendBulkSMS } from "../services/fast2smsService";

// Firebase API adapter - uses Firebase for data storage, mockApi for file parsing
export const firebaseApi = {
  // Use mockApi for file parsing (client-side operation)
  parseRosterFile: mockApi.parseRosterFile,
  mapRosterColumns: mockApi.mapRosterColumns,

  // Get initial data from Firebase
  async getInitialData() {
    const [students, announcements, notifications, templates, settings] = await Promise.all([
      studentsService.getAll(),
      announcementsService.getAll(),
      notificationsService.getAll(),
      templatesService.getAll(),
      settingsService.get()
    ]);

    return {
      students,
      announcements,
      notifications,
      templates,
      settings
    };
  },

  getSettingsSync: () => {
    // This is async in Firebase, but we'll return a default for sync access
    // In practice, settings should be loaded async
    return {
      whatsappProvider: "",
      whatsappApiKey: "",
      smsProvider: "",
      smsApiKey: "",
      enableSmsFallback: true,
      rateLimitPerMinute: 60,
      optOutPolicyEnabled: false
    };
  },

  // Upload roster to Firebase
  async uploadRoster(rows: RosterRow[]) {
    // Convert RosterRow to Student format
    const studentsToCreate: Omit<Student, "id">[] = rows
      .filter((row) => row.errors.length === 0)
      .map((row) => {
        const nameParts = row.data.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        return {
          studentId: row.data.student_id,
          firstName,
          lastName,
          class: row.data.year_of_study || "",
          section: row.data.department || "",
          rollNo: row.data.student_id,
          parentPrimaryPhone: row.data.phone_number,
          parentSecondaryPhone: row.data.parent_number || undefined,
          biometricId: row.data.student_id
        };
      });

    const result = await studentsService.bulkCreate(studentsToCreate);
    const allStudents = await studentsService.getAll();

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      students: allStudents
    };
  },

  // Announcements
  async createAnnouncement(payload: Partial<Announcement>) {
    const now = new Date().toISOString();
    const announcement: Omit<Announcement, "id"> = {
      title: payload.title || "",
      htmlContent: payload.htmlContent || "",
      plainText: payload.plainText || "",
      target: payload.target || { scope: "All" },
      channels: payload.channels || ["WhatsApp"],
      priority: payload.priority || "Normal",
      schedule: payload.schedule || { type: "Now" },
      status: payload.status || "Draft",
      authorType: payload.authorType || "Admin",
      authorName: payload.authorName || "Admin",
      attachments: payload.attachments || [],
      createdAt: now,
      updatedAt: now,
      ...payload
    };

    const id = await announcementsService.create(announcement);
    return { ...announcement, id } as Announcement;
  },

  async submitFacultyAnnouncement(payload: Partial<Announcement>) {
    return this.createAnnouncement({
      ...payload,
      status: "Pending",
      authorType: "Faculty",
      authorName: payload.authorName || "Faculty Member"
    });
  },

  async approveAnnouncement(id: string) {
    const announcement = await announcementsService.getById(id);
    if (!announcement) throw new Error("Announcement not found");

    // Update status to Approved
    await announcementsService.update(id, {
      status: "Approved",
      updatedAt: new Date().toISOString()
    });

    // Send notifications (this would trigger actual WhatsApp/SMS sending)
    // For now, we'll create notification logs
    // In production, this would call your WhatsApp/SMS service
    await this.sendAnnouncementNotifications({ ...announcement, status: "Approved" });

    // Update to Sent
    await announcementsService.update(id, {
      status: "Sent",
      updatedAt: new Date().toISOString()
    });

    return (await announcementsService.getById(id))!;
  },

  async rejectAnnouncement(id: string, reason: string) {
    await announcementsService.update(id, {
      status: "Rejected",
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    });
    return (await announcementsService.getById(id))!;
  },

  // Send notifications for an announcement
  async sendAnnouncementNotifications(announcement: Announcement) {
    const students = await studentsService.getAll();
    
    // Filter students based on target
    let targets: Student[] = [];
    if (announcement.target.scope === "All") {
      targets = students;
    } else if (announcement.target.scope === "Class") {
      targets = students.filter((s) => announcement.target.classes?.includes(s.class));
    } else if (announcement.target.scope === "Section") {
      targets = students.filter((s) =>
        announcement.target.sections?.includes(`${s.class}-${s.section}`)
      );
    } else if (announcement.target.scope === "Custom") {
      targets = students.filter((s) =>
        announcement.target.customRecipients?.includes(s.parentPrimaryPhone)
      );
    }

    // Create notification logs for each channel and student
    const notifications: Omit<NotificationLog, "id">[] = [];
    for (const channel of announcement.channels) {
      for (const student of targets.slice(0, 10)) {
        // Limit to 10 in demo
        notifications.push({
          timestamp: new Date().toISOString(),
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          class: student.class,
          section: student.section,
          parentPhone: student.parentPrimaryPhone,
          channel,
          provider: channel === "WhatsApp" ? "Infobip BSP" : "Twilio SMS",
          providerMessageId: `MSG-${nanoid(6)}`,
          status: "queued",
          attempts: 0
        });
      }
    }

    // Save notifications to Firebase
    for (const notification of notifications) {
      await notificationsService.create(notification);
    }
  },

  // Notifications
  async listNotifications() {
    return notificationsService.getAll();
  },

  async resendNotification(id: string) {
    const notification = await notificationsService.getById(id);
    if (!notification) throw new Error("Notification not found");

    // Update notification status
    await notificationsService.update(id, {
      status: "queued",
      attempts: notification.attempts + 1,
      timestamp: new Date().toISOString()
    });

    // Simulate sending (in production, this would call your provider API)
    setTimeout(async () => {
      await notificationsService.update(id, {
        status: "sent"
      });
      setTimeout(async () => {
        const isFailed = Math.random() > 0.1;
        const updateData: any = {
          status: isFailed ? "failed" : "delivered"
        };
        // Only add errorText if status is failed (Firestore doesn't allow undefined)
        if (isFailed) {
          updateData.errorText = "Provider timeout";
        }
        await notificationsService.update(id, updateData);
      }, 200);
    }, 200);

    return (await notificationsService.getById(id))!;
  },

  async bulkResend(ids: string[]) {
    const results: NotificationLog[] = [];
    for (const id of ids) {
      const result = await this.resendNotification(id);
      results.push(result);
    }
    return results;
  },

  // Settings
  async updateSettings(partial: Partial<ProviderSettings>) {
    await settingsService.update(partial);
    return settingsService.get();
  },

  // Templates
  async updateTemplate(key: string, content: string) {
    const template = await templatesService.getByKey(key);
    if (!template) throw new Error("Template not found");

    await templatesService.update(key, {
      content,
      lastUpdated: new Date().toISOString()
    });

    return (await templatesService.getByKey(key))!;
  },

  // Quick Send - Send announcement immediately via SMS
  async quickSendAnnouncement(payload: {
    title: string;
    message: string;
    targetScope?: "All" | "Class" | "Section" | "Custom";
    classes?: string[];
    sections?: string[];
    customRecipients?: string[];
  }) {
    // Get settings to retrieve Fast2SMS API key
    const settings = await settingsService.get();
    
    if (!settings.smsApiKey) {
      throw new Error("SMS API key not configured. Please set it in Settings.");
    }

    // Get all students
    const students = await studentsService.getAll();

    // Filter students based on target
    let targets: Student[] = [];
    if (!payload.targetScope || payload.targetScope === "All") {
      targets = students;
    } else if (payload.targetScope === "Class") {
      targets = students.filter((s) => payload.classes?.includes(s.class));
    } else if (payload.targetScope === "Section") {
      targets = students.filter((s) =>
        payload.sections?.includes(`${s.class}-${s.section}`)
      );
    } else if (payload.targetScope === "Custom") {
      targets = students.filter((s) =>
        payload.customRecipients?.includes(s.parentPrimaryPhone)
      );
    }

    if (targets.length === 0) {
      throw new Error("No recipients found for the selected target.");
    }

    // Extract phone numbers
    const phoneNumbers = targets
      .map((s) => s.parentPrimaryPhone)
      .filter((phone) => phone && phone.trim().length > 0);

    if (phoneNumbers.length === 0) {
      throw new Error("No valid phone numbers found in student data.");
    }

    // Prepare message
    const message = `${payload.title}\n\n${payload.message}`;

    // Send SMS via Fast2SMS
    let smsResults;
    try {
      smsResults = await sendBulkSMS(settings.smsApiKey, message, phoneNumbers);
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Create announcement record
    const now = new Date().toISOString();
    const announcement: Omit<Announcement, "id"> = {
      title: payload.title,
      htmlContent: `<p>${payload.message.replace(/\n/g, "<br>")}</p>`,
      plainText: payload.message,
      target: {
        scope: payload.targetScope || "All",
        classes: payload.classes || [],
        sections: payload.sections || [],
        customRecipients: payload.customRecipients || []
      },
      channels: ["SMS"],
      priority: "Normal",
      schedule: { type: "Now" },
      status: "Sent",
      authorType: "Admin",
      authorName: "Admin",
      attachments: [],
      createdAt: now,
      updatedAt: now
    };

    const announcementId = await announcementsService.create(announcement);

    // Create notification logs for tracking
    const notifications: Omit<NotificationLog, "id">[] = [];
    const successfulNumbers = new Set<string>();
    const failedBatches: number[] = [];
    
    // Track successful sends from SMS results
    // Fast2SMS returns success when result.return === true
    smsResults.forEach((result, batchIndex) => {
      if (result.return === true) {
        // Extract numbers from this batch (6 per batch by default)
        const batchSize = 6;
        const batchStart = batchIndex * batchSize;
        const batchNumbers = phoneNumbers.slice(batchStart, batchStart + batchSize);
        batchNumbers.forEach((phone) => successfulNumbers.add(phone));
      } else {
        // Track failed batches
        failedBatches.push(batchIndex);
        console.error(`Batch ${batchIndex + 1} failed:`, result.message || "Unknown error");
      }
    });

    // Create notification logs for all targets
    for (const student of targets) {
      const phone = student.parentPrimaryPhone;
      const wasSuccessful = successfulNumbers.has(phone);
      
      // Get error message from failed batch if applicable
      let errorText: string | undefined = undefined;
      if (!wasSuccessful) {
        // Find which batch this phone number belongs to
        const phoneIndex = phoneNumbers.indexOf(phone);
        const batchIndex = Math.floor(phoneIndex / 6);
        if (failedBatches.includes(batchIndex) && smsResults[batchIndex]) {
          const errorMsg = smsResults[batchIndex].message;
          errorText = Array.isArray(errorMsg) ? errorMsg.join(", ") : "SMS send failed";
        } else {
          errorText = "SMS send failed";
        }
      }
      
      // Build notification object, only include errorText if it exists
      const notification: Omit<NotificationLog, "id"> = {
        timestamp: now,
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        class: student.class,
        section: student.section,
        parentPhone: phone,
        channel: "SMS",
        provider: settings.smsProvider || "Fast2SMS",
        providerMessageId: smsResults[0]?.request_id || `MSG-${nanoid(6)}`,
        status: wasSuccessful ? "sent" : "failed",
        attempts: 1
      };
      
      // Only add errorText if it's defined (Firestore doesn't allow undefined)
      if (errorText) {
        notification.errorText = errorText;
      }
      
      notifications.push(notification);
    }

    // Save notifications to Firebase
    for (const notification of notifications) {
      await notificationsService.create(notification);
    }

    return {
      announcement: { ...announcement, id: announcementId } as Announcement,
      sentCount: successfulNumbers.size,
      totalCount: targets.length,
      failedCount: targets.length - successfulNumbers.size
    };
  }
};

