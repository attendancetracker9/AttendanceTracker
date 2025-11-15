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
        await notificationsService.update(id, {
          status: Math.random() > 0.1 ? "delivered" : "failed",
          errorText: Math.random() > 0.1 ? undefined : "Provider timeout"
        });
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
  }
};

