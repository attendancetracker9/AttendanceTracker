import React, { useMemo, useState } from "react";
import { CalendarPlus, CalendarRange, Megaphone, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/Card";
import { LoadingState, EmptyState } from "../components/LoadingState";
import { CATEGORY_OPTIONS } from "../constants";
import { useEvents } from "../hooks/useEvents";
import type { StudentProfile } from "../types";

type Props = {
  profile: StudentProfile | null;
};

export const EventsView: React.FC<Props> = ({ profile: _profile }) => {
  const { upcomingEvents, pastEvents, announcements, loading, error } = useEvents();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const filteredUpcoming = useMemo(() => {
    if (categoryFilter === "All") return upcomingEvents;
    return upcomingEvents.filter((event) => event.category === categoryFilter);
  }, [categoryFilter, upcomingEvents]);

  if (loading) return <LoadingState lines={4} />;
  if (error) {
    return (
      <Card variant="danger">
        <p className="text-sm font-semibold">Unable to load events</p>
        <p className="text-sm text-rose-800 dark:text-rose-100">{error.message}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500">Campus Buzz</p>
          <h2 className="text-3xl font-semibold">College Events & Announcements</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Add upcoming events to your calendar or browse past highlights.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          <Plus className="h-4 w-4" />
          Submit Event Idea
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...CATEGORY_OPTIONS].map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              categoryFilter === category ? "bg-teal-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredUpcoming.length === 0 && (
        <EmptyState
          title="No events in this category"
          description="Try switching categories or check back later for fresh campus activities."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {filteredUpcoming.map((event, index) => (
            <Card
              key={event.id}
              interactive
              className="flex flex-col gap-4 border border-slate-100 bg-white/70 dark:border-white/10 dark:bg-white/5 md:flex-row"
            >
              <motion.div
                className="h-48 flex-1 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-teal-600 dark:text-teal-100">
                    <CalendarRange className="h-12 w-12" />
                  </div>
                )}
              </motion.div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-600 dark:bg-white/10 dark:text-teal-100">
                    {event.category}
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-teal-500/30 px-3 py-1 text-xs font-semibold text-teal-600 dark:text-teal-100"
                    onClick={() => console.info("TODO: integrate calendar API")}
                  >
                    <CalendarPlus className="mr-1 inline-block h-4 w-4" />
                    Add to Calendar
                  </button>
                </div>
                <h3 className="text-xl font-semibold">{event.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">{event.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-300">
                  <span>{event.date}</span>
                  <span>•</span>
                  <span>{event.time}</span>
                  <span>•</span>
                  <span>{event.venue}</span>
                </div>
              </div>
            </Card>
          ))}

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Past Events</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {pastEvents.map((event) => (
                <Card key={event.id} className="space-y-2 border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">{event.title}</h4>
                    <span className="text-xs uppercase text-slate-400">{event.category}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-300">{event.description}</p>
                  <p className="text-xs text-slate-400">{event.date} • {event.time}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <Megaphone className="h-10 w-10 rounded-2xl bg-amber-50 p-2 text-amber-500 dark:bg-white/10 dark:text-amber-200" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Announcements</p>
                <p className="text-lg font-semibold">Campus notices</p>
              </div>
            </div>
            <div className="space-y-3">
              {announcements.map((note) => (
                <div key={note.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold">{note.title}</p>
                  <p className="text-xs text-slate-500">{note.summary}</p>
                  <p className="text-[10px] uppercase text-slate-400">{note.date}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quick Actions</p>
            <button className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg">
              Share Feedback
            </button>
            <button className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-white">
              View Calendar
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};


