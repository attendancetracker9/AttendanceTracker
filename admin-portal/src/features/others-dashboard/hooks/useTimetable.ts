import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../../config/firebase";
import type { TimetablePayload, TimetableClass } from "../types";

type Params = {
  department: string;
  semester: string;
  section: string;
};

const SAMPLE_TIMETABLE: TimetableClass[] = [
  {
    day: "Monday",
    period: "1",
    startTime: "09:00",
    endTime: "09:50",
    subject: "Data Structures",
    faculty: "Prof. Meera Patil",
    room: "C-203"
  },
  {
    day: "Monday",
    period: "2",
    startTime: "09:50",
    endTime: "10:40",
    subject: "Operating Systems",
    faculty: "Dr. Anil Verma",
    room: "C-203"
  },
  {
    day: "Tuesday",
    period: "3",
    startTime: "11:00",
    endTime: "11:50",
    subject: "Digital Electronics",
    faculty: "Prof. Kavya Rao",
    room: "Lab-2"
  }
];

export const useTimetable = ({ department, semester, section }: Params) => {
  const [payload, setPayload] = useState<TimetablePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docId = useMemo(() => `${department}_${semester}_${section}`.replace(/\s+/g, "").toLowerCase(), [department, semester, section]);

  useEffect(() => {
    if (!department || !semester || !section) return;
    const ref = doc(db, "timetables", docId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data();
        if (data) {
          setPayload({
            lastUpdated: data.lastUpdated,
            classes: (data.classes ?? []) as TimetableClass[]
          });
        } else {
          setPayload({
            lastUpdated: new Date().toISOString(),
            classes: SAMPLE_TIMETABLE
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load timetable", err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [department, semester, section, docId]);

  return { timetable: payload, loading, error, docId };
};


