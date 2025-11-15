import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { mockApi } from "../api/mockApi";
import type {
  Announcement,
  MessageTemplate,
  NotificationLog,
  ProviderSettings,
  RosterRow,
  Student
} from "../types";

type RosterUploadState = {
  columns: string[];
  mapping: Record<string, string>;
  originalRows: RosterRow[]; // Original parsed rows before mapping
  rows: RosterRow[]; // Mapped and validated rows
};

type ApiContextValue = {
  students: Student[];
  rosterUpload: RosterUploadState | null;
  announcements: Announcement[];
  notifications: NotificationLog[];
  templates: MessageTemplate[];
  settings: ProviderSettings;
  refreshDashboard: () => Promise<void>;
  loadRosterPreview: (file: File) => Promise<{ columns: string[]; rows: RosterRow[] }>;
  setRosterUploadState: (state: RosterUploadState) => void;
  updateRosterMapping: (mapping: Record<string, string>) => Promise<void>;
  updateRosterRows: (rows: RosterRow[]) => void;
  mapRosterColumns: (mapping: Record<string, string>, rows: RosterRow[]) => RosterRow[];
  saveRoster: (rows: RosterRow[]) => Promise<{ successCount: number; failureCount: number }>;
  createAnnouncement: (payload: Partial<Announcement>) => Promise<Announcement>;
  submitFacultyAnnouncement: (payload: Partial<Announcement>) => Promise<Announcement>;
  approveAnnouncement: (id: string) => Promise<Announcement>;
  rejectAnnouncement: (id: string, reason: string) => Promise<Announcement>;
  resendNotification: (id: string) => Promise<NotificationLog>;
  bulkResend: (ids: string[]) => Promise<NotificationLog[]>;
  updateSettings: (settings: Partial<ProviderSettings>) => Promise<ProviderSettings>;
  updateTemplate: (key: string, content: string) => Promise<MessageTemplate>;
  clearRosterPreview: () => void;
};

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

const STORAGE_KEY_ROSTER = "roster_upload_state";

const loadRosterFromStorage = (): RosterUploadState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ROSTER);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  return null;
};

const saveRosterToStorage = (state: RosterUploadState | null) => {
  if (state) {
    localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY_ROSTER);
  }
};

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [rosterUpload, setRosterUpload] = useState<RosterUploadState | null>(loadRosterFromStorage());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [settings, setSettings] = useState<ProviderSettings>(mockApi.getSettingsSync());

  useEffect(() => {
    mockApi.getInitialData().then((data) => {
      setStudents(data.students);
      setAnnouncements(data.announcements);
      setNotifications(data.notifications);
      setTemplates(data.templates);
      setSettings(data.settings);
    });
  }, []);

  // Persist roster upload state to localStorage whenever it changes
  useEffect(() => {
    saveRosterToStorage(rosterUpload);
  }, [rosterUpload]);


  const value = useMemo<ApiContextValue>(
    () => ({
      students,
      rosterUpload,
      announcements,
      notifications,
      templates,
      settings,
      refreshDashboard: async () => {
        const { students: updatedStudents, announcements: updatedAnnouncements, notifications: updatedNotifications } =
          await mockApi.getInitialData();
        setStudents(updatedStudents);
        setAnnouncements(updatedAnnouncements);
        setNotifications(updatedNotifications);
      },
      clearRosterPreview: () => {
        setRosterUpload(null);
        saveRosterToStorage(null);
      },
      loadRosterPreview: async (file) => {
        const result = await mockApi.parseRosterFile(file);
        return result;
      },
      setRosterUploadState: (state) => {
        setRosterUpload(state);
      },
      updateRosterMapping: async (mapping) => {
        if (!rosterUpload) return;
        // Remap from original rows to preserve data integrity
        // Note: validation should be done by the caller if needed
        const remapped = await mockApi.mapRosterColumns(mapping, rosterUpload.originalRows);
        setRosterUpload({ ...rosterUpload, mapping, rows: remapped });
      },
      updateRosterRows: (rows) => {
        if (!rosterUpload) return;
        setRosterUpload({ ...rosterUpload, rows });
      },
      mapRosterColumns: (mapping, rows) => mockApi.mapRosterColumns(mapping, rows),
      saveRoster: async (rows) => {
        const result = await mockApi.uploadRoster(rows);
        setStudents(result.students);
        return { successCount: result.successCount, failureCount: result.failureCount };
      },
      createAnnouncement: async (payload) => {
        const created = await mockApi.createAnnouncement(payload);
        setAnnouncements((prev) => [created, ...prev]);
        return created;
      },
      submitFacultyAnnouncement: async (payload) => {
        const created = await mockApi.submitFacultyAnnouncement(payload);
        setAnnouncements((prev) => [created, ...prev]);
        return created;
      },
      approveAnnouncement: async (id) => {
        const updated = await mockApi.approveAnnouncement(id);
        setAnnouncements((prev) => prev.map((item) => (item.id === id ? updated : item)));
        setNotifications(await mockApi.listNotifications());
        return updated;
      },
      rejectAnnouncement: async (id, reason) => {
        const updated = await mockApi.rejectAnnouncement(id, reason);
        setAnnouncements((prev) => prev.map((item) => (item.id === id ? updated : item)));
        return updated;
      },
      resendNotification: async (id) => {
        const updated = await mockApi.resendNotification(id);
        setNotifications((prev) => prev.map((item) => (item.id === id ? updated : item)));
        return updated;
      },
      bulkResend: async (ids) => {
        const updated = await mockApi.bulkResend(ids);
        setNotifications((prev) => prev.map((item) => updated.find((entry) => entry.id === item.id) ?? item));
        return updated;
      },
      updateSettings: async (next) => {
        const updated = await mockApi.updateSettings(next);
        setSettings(updated);
        return updated;
      },
      updateTemplate: async (key, content) => {
        const updated = await mockApi.updateTemplate(key, content);
        setTemplates((prev) => prev.map((template) => (template.key === updated.key ? updated : template)));
        return updated;
      }
    }),
    [announcements, notifications, rosterUpload, settings, students, templates]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used within ApiProvider");
  return ctx;
};

