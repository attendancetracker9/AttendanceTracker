import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import { Download, Sparkles } from "lucide-react";
import { Card } from "../components/Card";
import { FilterBar } from "../components/FilterBar";
import { LoadingState, EmptyState } from "../components/LoadingState";
import { Button } from "../../../components/Button";
import { useTimetable } from "../hooks/useTimetable";
import type { StudentProfile } from "../types";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

type Props = {
  profile: StudentProfile | null;
};

export const TimeTableView: React.FC<Props> = ({ profile }) => {
  const [department, setDepartment] = useState(profile?.department ?? "CSE");
  const [semester, setSemester] = useState(profile?.semester ?? "Sem 5");
  const [section, setSection] = useState(profile?.section ?? "A");

  const { timetable, loading, error } = useTimetable({ department, semester, section });

  const today = dayjs().format("dddd");
  const now = dayjs();

  const classesGrouped = useMemo(() => {
    if (!timetable?.classes) return {};
    return timetable.classes.reduce<Record<string, typeof timetable.classes>>((acc, session) => {
      acc[session.day] = acc[session.day] ? [...acc[session.day], session] : [session];
      return acc;
    }, {});
  }, [timetable]);

  const currentClassId = useMemo(() => {
    if (!timetable?.classes) return null;
    const session = timetable.classes.find((cls) => {
      const start = dayjs(cls.startTime, "HH:mm");
      const end = dayjs(cls.endTime, "HH:mm");
      return cls.day === today && now.isAfter(start) && now.isBefore(end);
    });
    return session ? `${session.day}-${session.period}` : null;
  }, [timetable, today, now]);

  const downloadPdf = () => {
    console.info("TODO: generate & download timetable PDF");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500">Planner</p>
          <h2 className="text-3xl font-semibold">Weekly Time Table</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            All periods fetched directly from Firestore timetable sources. Last synced{" "}
            {timetable?.lastUpdated ? dayjs(timetable.lastUpdated.toString()).fromNow() : "just now"}.
          </p>
        </div>
        <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={downloadPdf}>
          Download PDF
        </Button>
      </div>

      <FilterBar
        filters={[
          {
            id: "department",
            label: "Dept",
            value: department,
            options: ["CSE", "IT", "ECE", "EEE"].map((dept) => ({ label: dept, value: dept })),
            onChange: setDepartment
          },
          {
            id: "semester",
            label: "Semester",
            value: semester,
            options: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"].map((sem) => ({
              label: sem,
              value: sem
            })),
            onChange: setSemester
          },
          {
            id: "section",
            label: "Section",
            value: section,
            options: ["A", "B", "C", "D"].map((sec) => ({ label: sec, value: sec })),
            onChange: setSection
          }
        ]}
      />

      {loading && <LoadingState lines={5} />}
      {error && (
        <Card variant="danger">
          <p className="text-sm font-semibold">Unable to fetch timetable</p>
          <p className="text-sm text-rose-800 dark:text-rose-100">{error.message}</p>
        </Card>
      )}

      {!loading && timetable?.classes?.length === 0 && (
        <EmptyState
          title="No timetable published yet"
          description="Once your department publishes the official timetable, it will appear here automatically."
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(classesGrouped).map(([day, sessions]) => (
          <Card
            key={day}
            className="border border-slate-100 bg-white/70 backdrop-blur dark:border-white/5 dark:bg-white/5"
            variant={day === today ? "primary" : "default"}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Day</p>
                <p className="text-lg font-semibold">{day}</p>
              </div>
              {day === today && (
                <span className="inline-flex items-center gap-1 rounded-2xl bg-white/20 px-3 py-1 text-xs font-semibold text-teal-900 dark:bg-white/10 dark:text-teal-100">
                  <Sparkles className="h-4 w-4" />
                  Today
                </span>
              )}
            </div>
            <div className="space-y-3">
              {sessions.map((session) => {
                const isCurrent = currentClassId === `${session.day}-${session.period}`;
                return (
                  <div
                    key={session.period}
                    className={`flex flex-col rounded-2xl border px-4 py-3 text-sm shadow-sm transition ${
                      isCurrent
                        ? "border-teal-500 bg-teal-50/70 dark:border-teal-400/60 dark:bg-teal-900/30"
                        : "border-slate-100 bg-white dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold">{session.subject}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Period {session.period}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-300">
                      <span>{session.startTime} - {session.endTime}</span>
                      <span>•</span>
                      <span>{session.room}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-100">{session.faculty}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};


