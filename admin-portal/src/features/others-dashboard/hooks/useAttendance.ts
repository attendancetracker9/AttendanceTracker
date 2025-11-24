import { collection, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../config/firebase";
import type { AttendanceLog, AttendanceSummary } from "../types";

const sampleSummary: AttendanceSummary = {
  overallPercentage: 92,
  subjectBreakdown: [
    { subject: "Data Structures", percentage: 95 },
    { subject: "OS", percentage: 88 },
    { subject: "Electronics", percentage: 90 }
  ],
  monthlyLogs: {
    "2025-01-02": "present",
    "2025-01-03": "present",
    "2025-01-04": "late",
    "2025-01-05": "absent"
  },
  trend: [
    { date: "Week 1", percentage: 91 },
    { date: "Week 2", percentage: 92 },
    { date: "Week 3", percentage: 94 },
    { date: "Week 4", percentage: 90 }
  ],
  lastScan: {
    timestamp: new Date().toISOString(),
    deviceId: "FACE_01",
    type: "face"
  }
};

export const useAttendance = (studentId?: string) => {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const summaryRef = doc(db, "attendance_summary", studentId);
    const unsubscribeSummary = onSnapshot(
      summaryRef,
      (snapshot) => {
        const data = snapshot.data();
        setSummary(
          data
            ? ({
                overallPercentage: data.overallPercentage ?? 0,
                subjectBreakdown: data.subjectBreakdown ?? [],
                monthlyLogs: data.monthlyLogs ?? {},
                trend: data.trend ?? [],
                lastScan: data.lastScan
              } as AttendanceSummary)
            : sampleSummary
        );
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load attendance summary", err);
        setError(err);
        setSummary(sampleSummary);
        setLoading(false);
      }
    );

    const logsQuery = query(collection(db, "attendance", studentId, "logs"), orderBy("timestamp", "desc"));
    const unsubscribeLogs = onSnapshot(
      logsQuery,
      (snap) => {
        setLogs(
          snap.docs.map((docSnapshot) => {
            const { id: _ignored, ...rest } = docSnapshot.data() as AttendanceLog;
            return {
              id: docSnapshot.id,
              ...rest
            };
          })
        );
      },
      (err) => {
        console.error("Failed to load attendance logs", err);
        setError(err);
      }
    );

    return () => {
      unsubscribeSummary();
      unsubscribeLogs();
    };
  }, [studentId]);

  return { summary, logs, loading, error };
};


