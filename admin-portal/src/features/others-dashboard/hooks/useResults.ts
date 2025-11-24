import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../config/firebase";
import type { SemesterResult } from "../types";

export const useResults = (studentId?: string) => {
  const [semesters, setSemesters] = useState<Record<string, SemesterResult>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studentId) return;
    const ref = doc(db, "results", studentId);
    const unsubscribeSummary = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data();
        if (data?.semesters) {
          setSemesters(data.semesters as Record<string, SemesterResult>);
        } else {
          setSemesters({
            "sem-5": {
              semesterId: "sem-5",
              internal: 38,
              external: 52,
              practicals: 25,
              total: 115,
              grade: "A",
              status: "Pass"
            },
            "sem-4": {
              semesterId: "sem-4",
              internal: 35,
              external: 48,
              practicals: 20,
              total: 103,
              grade: "B+",
              status: "Pass"
            }
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load results", err);
        setError(err);
        setLoading(false);
      }
    );

    const collectionRef = collection(db, "results", studentId, "semesters");
    const unsubscribeSemesters = onSnapshot(
      collectionRef,
      (snap) => {
        if (!snap.empty) {
          const mapped: Record<string, SemesterResult> = {};
          snap.docs.forEach((docSnap) => {
            const { semesterId: _ignored, ...rest } = docSnap.data() as SemesterResult;
            mapped[docSnap.id] = {
              semesterId: docSnap.id,
              ...rest
            };
          });
          setSemesters(mapped);
        }
      },
      (err) => {
        console.error("Failed to load semester details", err);
        setError(err);
      }
    );

    return () => {
      unsubscribeSummary();
      unsubscribeSemesters();
    };
  }, [studentId]);

  return {
    semesters,
    loading,
    error
  };
};


