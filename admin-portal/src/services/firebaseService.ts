import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../config/firebase";
import type {
  Student,
  Announcement,
  NotificationLog,
  MessageTemplate,
  ProviderSettings
} from "../types";

// Collection names
const COLLECTIONS = {
  STUDENTS: "students",
  ANNOUNCEMENTS: "announcements",
  NOTIFICATIONS: "notifications",
  TEMPLATES: "templates",
  SETTINGS: "settings"
} as const;

// Helper to convert Firestore timestamps to ISO strings
const toISO = (value: any): string => {
  if (value?.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
};

// Helper to convert ISO strings to Firestore timestamps
const toTimestamp = (value: string | Date): Timestamp => {
  if (value instanceof Date) return Timestamp.fromDate(value);
  return Timestamp.fromDate(new Date(value));
};

// ==================== STUDENTS ====================
export const studentsService = {
  async getAll(): Promise<Student[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];
  },

  async getById(id: string): Promise<Student | null> {
    const docRef = doc(db, COLLECTIONS.STUDENTS, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Student;
  },

  async create(student: Omit<Student, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), student);
    return docRef.id;
  },

  async update(id: string, data: Partial<Student>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.STUDENTS, id);
    await updateDoc(docRef, data);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.STUDENTS, id);
    await deleteDoc(docRef);
  },

  async bulkCreate(students: Omit<Student, "id">[]): Promise<{ successCount: number; failureCount: number }> {
    const batch = writeBatch(db);
    let successCount = 0;
    let failureCount = 0;

    for (const student of students) {
      try {
        const docRef = doc(collection(db, COLLECTIONS.STUDENTS));
        batch.set(docRef, student);
        successCount++;
      } catch (error) {
        failureCount++;
        console.error("Error adding student:", error);
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error committing batch:", error);
      failureCount += successCount;
      successCount = 0;
    }

    return { successCount, failureCount };
  }
};

// ==================== ANNOUNCEMENTS ====================
export const announcementsService = {
  async getAll(): Promise<Announcement[]> {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy("createdAt", "desc"))
    );
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
        schedule: {
          ...data.schedule,
          datetime: data.schedule?.datetime ? toISO(data.schedule.datetime) : undefined
        }
      };
    }) as Announcement[];
  },

  async getById(id: string): Promise<Announcement | null> {
    const docRef = doc(db, COLLECTIONS.ANNOUNCEMENTS, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
      schedule: {
        ...data.schedule,
        datetime: data.schedule?.datetime ? toISO(data.schedule.datetime) : undefined
      }
    } as Announcement;
  },

  async create(announcement: Omit<Announcement, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.ANNOUNCEMENTS), {
      ...announcement,
      createdAt: toTimestamp(announcement.createdAt),
      updatedAt: toTimestamp(announcement.updatedAt),
      schedule: {
        ...announcement.schedule,
        datetime: announcement.schedule?.datetime ? toTimestamp(announcement.schedule.datetime) : undefined
      }
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Announcement>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ANNOUNCEMENTS, id);
    const updateData: any = { ...data };
    
    if (data.updatedAt) updateData.updatedAt = toTimestamp(data.updatedAt);
    if (data.createdAt) updateData.createdAt = toTimestamp(data.createdAt);
    if (data.schedule?.datetime) {
      updateData.schedule = {
        ...data.schedule,
        datetime: toTimestamp(data.schedule.datetime)
      };
    }

    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ANNOUNCEMENTS, id);
    await deleteDoc(docRef);
  }
};

// ==================== NOTIFICATIONS ====================
export const notificationsService = {
  async getAll(): Promise<NotificationLog[]> {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.NOTIFICATIONS), orderBy("timestamp", "desc"))
    );
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: toISO(data.timestamp)
      };
    }) as NotificationLog[];
  },

  async getById(id: string): Promise<NotificationLog | null> {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      timestamp: toISO(data.timestamp)
    } as NotificationLog;
  },

  async create(notification: Omit<NotificationLog, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      ...notification,
      timestamp: toTimestamp(notification.timestamp)
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<NotificationLog>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
    const updateData: any = { ...data };
    if (data.timestamp) updateData.timestamp = toTimestamp(data.timestamp);
    await updateDoc(docRef, updateData);
  },

  async getByStatus(status: NotificationLog["status"]): Promise<NotificationLog[]> {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where("status", "==", status),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: toISO(data.timestamp)
      };
    }) as NotificationLog[];
  }
};

// ==================== TEMPLATES ====================
export const templatesService = {
  async getAll(): Promise<MessageTemplate[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.TEMPLATES));
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        key: doc.id as MessageTemplate["key"],
        ...data,
        lastUpdated: toISO(data.lastUpdated)
      };
    }) as MessageTemplate[];
  },

  async getByKey(key: string): Promise<MessageTemplate | null> {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, key);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      key: docSnap.id as MessageTemplate["key"],
      ...data,
      lastUpdated: toISO(data.lastUpdated)
    } as MessageTemplate;
  },

  async update(key: string, data: Partial<MessageTemplate>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, key);
    const updateData: any = { ...data };
    if (data.lastUpdated) updateData.lastUpdated = toTimestamp(data.lastUpdated);
    await updateDoc(docRef, updateData);
  },

  async create(template: MessageTemplate): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, template.key);
    await setDoc(docRef, {
      ...template,
      lastUpdated: toTimestamp(template.lastUpdated)
    });
  }
};

// ==================== SETTINGS ====================
export const settingsService = {
  async get(): Promise<ProviderSettings> {
    const docRef = doc(db, COLLECTIONS.SETTINGS, "main");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      // Return default settings if none exist
      return {
        whatsappProvider: "",
        whatsappApiKey: "",
        smsProvider: "",
        smsApiKey: "",
        enableSmsFallback: true,
        rateLimitPerMinute: 60,
        optOutPolicyEnabled: false
      };
    }
    return docSnap.data() as ProviderSettings;
  },

  async update(data: Partial<ProviderSettings>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SETTINGS, "main");
    await setDoc(docRef, data, { merge: true });
  }
};

// ==================== STORAGE (File Uploads) ====================
export const storageService = {
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  async getFileUrl(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  }
};

