import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../../config/firebase";
import type { AnnouncementItem, EventItem } from "../types";

const sampleEvents: EventItem[] = [
  {
    id: "fest",
    title: "Tech Fest 2025",
    date: "2025-02-18",
    time: "09:00 AM",
    venue: "Auditorium",
    description: "Annual inter-college hackathon and startup showcase.",
    category: "Fest",
    imageUrl: "",
    isUpcoming: true
  },
  {
    id: "sports",
    title: "Intra Sports Meet Finals",
    date: "2025-01-30",
    time: "04:00 PM",
    venue: "Main Ground",
    description: "Final round for relay, basketball, and volleyball.",
    category: "Sports",
    imageUrl: "",
    isUpcoming: false
  }
];

const sampleAnnouncements: AnnouncementItem[] = [
  { id: "1", title: "Library Renovation", summary: "First floor under maintenance for 2 weeks.", date: "2025-01-12" },
  { id: "2", title: "Re-evaluation Window", summary: "Apply before 25 Jan for Sem 5 re-check.", date: "2025-01-10" }
];

export const useEvents = () => {
  const [events, setEvents] = useState<EventItem[]>(sampleEvents);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(sampleAnnouncements);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const eventsQuery = query(collection(db, "events"), orderBy("date", "asc"));
    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setEvents(sampleEvents);
        } else {
          setEvents(
            snapshot.docs.map((docSnap) => {
              const { id: _ignored, ...rest } = docSnap.data() as EventItem;
              return {
                id: docSnap.id,
                ...rest
              };
            })
          );
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load events", err);
        setError(err);
        setLoading(false);
      }
    );

    const announcementsQuery = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribeAnnouncements = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setAnnouncements(sampleAnnouncements);
        } else {
          setAnnouncements(
            snapshot.docs.slice(0, 4).map((docSnap) => ({
              id: docSnap.id,
              title: docSnap.data().title,
              summary: docSnap.data().plainText ?? docSnap.data().htmlContent ?? "",
              date: docSnap.data().createdAt ?? ""
            }))
          );
        }
      },
      (err) => {
        console.error("Failed to load announcements", err);
        setError(err);
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeAnnouncements();
    };
  }, []);

  const upcomingEvents = useMemo(() => events.filter((event) => event.isUpcoming), [events]);
  const pastEvents = useMemo(() => events.filter((event) => !event.isUpcoming), [events]);

  return {
    events,
    upcomingEvents,
    pastEvents,
    announcements,
    loading,
    error
  };
};


