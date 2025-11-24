import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../config/firebase";
import { useAuth } from "../../../context/AuthContext";
import type { StudentProfile } from "../types";

export const useStudentProfile = () => {
  const { user, userProfile } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data();
        if (data) {
          setProfile({
            id: snapshot.id,
            name: data.name ?? user.displayName ?? "Student",
            role: data.role ?? "others",
            department: data.department ?? "CSE",
            semester: data.semester ?? "Sem 5",
            section: data.section ?? "A",
            email: data.email ?? user.email ?? "",
            profilePic: data.profilePic
          });
        } else {
          // Placeholder profile to keep UI functional until real data exists
          setProfile({
            id: user.uid,
            name: user.displayName ?? "Student",
            role: "others",
            department: "CSE",
            semester: "Sem 5",
            section: "A",
            email: user.email ?? ""
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load student profile", err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return {
    profile: profile ?? (userProfile
      ? {
          id: userProfile.id,
          name: userProfile.name,
          role: userProfile.role as StudentProfile["role"],
          department: "CSE",
          semester: "Sem 5",
          section: "A",
          email: userProfile.email
        }
      : null),
    loading,
    error
  };
};


