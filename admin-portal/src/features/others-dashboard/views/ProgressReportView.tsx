import React, { useMemo, useState } from "react";
import { Download, Medal } from "lucide-react";
import { Card } from "../components/Card";
import { LoadingState, EmptyState } from "../components/LoadingState";
import { Button } from "../../../components/Button";
import { useResults } from "../hooks/useResults";
import type { StudentProfile } from "../types";

type Props = {
  profile: StudentProfile | null;
};

export const ProgressReportView: React.FC<Props> = ({ profile }) => {
  const { semesters, loading, error } = useResults(profile?.id);
  const semesterKeys = Object.keys(semesters);
  const [selected, setSelected] = useState(semesterKeys[0]);

  const current = useMemo(() => (selected ? semesters[selected] : null), [selected, semesters]);

  const downloadReport = (semId: string) => {
    console.info("TODO: download progress report PDF for", semId);
  };

  if (loading) return <LoadingState lines={4} />;
  if (error) {
    return (
      <Card variant="danger">
        <p className="text-sm font-semibold">Unable to load progress report</p>
        <p className="text-sm text-rose-800 dark:text-rose-100">{error.message}</p>
      </Card>
    );
  }

  if (!semesterKeys.length) {
    return <EmptyState title="No results found" description="Performance cards will appear once the exam section publishes your results." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500">Academics</p>
          <h2 className="text-3xl font-semibold">Progress Report</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Switch between semesters to compare grades and download the PDF.</p>
        </div>
        {current && (
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => downloadReport(current.semesterId)}>
            Download Report
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {semesterKeys.map((semId) => (
          <button
            key={semId}
            type="button"
            onClick={() => setSelected(semId)}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              selected === semId ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10" : "border-slate-100 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5"
            }`}
          >
            {semId.toUpperCase()}
          </button>
        ))}
      </div>

      {current && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card variant={current.status === "Pass" ? "primary" : "danger"}>
            <div className="flex items-center gap-3">
              <Medal className="h-10 w-10 rounded-2xl bg-white/20 p-2 text-white" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Summary</p>
                <p className="text-2xl font-semibold text-white">{current.total} pts</p>
                <p className="text-sm text-white/80">Grade {current.grade} • {current.status}</p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Breakdown</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-3xl font-bold">{current.internal}</p>
                <p className="text-xs uppercase text-slate-400">Internal</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-3xl font-bold">{current.external}</p>
                <p className="text-xs uppercase text-slate-400">External</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-3xl font-bold">{current.practicals}</p>
                <p className="text-xs uppercase text-slate-400">Practicals</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {semesterKeys.map((semId) => {
          const sem = semesters[semId];
          return (
            <Card key={semId} interactive className="space-y-2 border border-slate-100 bg-white/70 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{semId.toUpperCase()}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    sem.status === "Pass" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100" : "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100"
                  }`}
                >
                  {sem.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-slate-400">Internal</p>
                  <p className="text-lg font-semibold">{sem.internal}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">External</p>
                  <p className="text-lg font-semibold">{sem.external}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Practicals</p>
                  <p className="text-lg font-semibold">{sem.practicals}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Total</p>
                  <p className="text-lg font-semibold">{sem.total}</p>
                </div>
              </div>
              <Button variant="ghost" className="px-0" onClick={() => downloadReport(sem.semesterId)}>
                Download Report
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};


