import React from "react";
import dayjs from "dayjs";
import { Activity, CalendarDays, Clock, Download, MapPin } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  CartesianGrid,
  Legend
} from "recharts";
import { Card } from "../components/Card";
import { LoadingState, EmptyState } from "../components/LoadingState";
import { Button } from "../../../components/Button";
import { useAttendance } from "../hooks/useAttendance";
import type { StudentProfile } from "../types";

type Props = {
  profile: StudentProfile | null;
};

const statusColor: Record<string, string> = {
  present: "bg-emerald-500/20 text-emerald-600",
  absent: "bg-rose-500/20 text-rose-600",
  late: "bg-amber-500/20 text-amber-600",
  holiday: "bg-slate-400/20 text-slate-500"
};

export const AttendanceView: React.FC<Props> = ({ profile }) => {
  const { summary, logs, loading, error } = useAttendance(profile?.id);

  const downloadPdf = () => {
    console.info("TODO: download attendance PDF");
  };

  if (loading) return <LoadingState lines={6} />;
  if (error) {
    return (
      <Card variant="danger">
        <p className="text-sm font-semibold">Unable to load attendance</p>
        <p className="text-sm text-rose-800 dark:text-rose-100">{error.message}</p>
      </Card>
    );
  }

  if (!summary) {
    return (
      <EmptyState title="No attendance records yet" description="As soon as your first scan is recorded, progress will appear here." />
    );
  }

  const calendarEntries = Object.entries(summary.monthlyLogs);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500">Attendance</p>
          <h2 className="text-3xl font-semibold">Attendance Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Live data synced from biometric scans and faculty logs.</p>
        </div>
        <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={downloadPdf}>
          Download PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="primary">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Overall</p>
          <p className="mt-4 text-5xl font-bold">{summary.overallPercentage}%</p>
          <p className="mt-2 text-sm text-teal-100">Great consistency! Keep it above 90% for scholarship eligibility.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-10 w-10 rounded-2xl bg-teal-50 p-2 text-teal-600 dark:bg-white/10 dark:text-teal-100" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Last Scan</p>
              <p className="text-lg font-semibold">
                {summary.lastScan
                  ? dayjs(summary.lastScan.timestamp).format("DD MMM, hh:mm A")
                  : "No scans yet"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Device {summary.lastScan?.deviceId ?? "N/A"} ({summary.lastScan?.type ?? "Face"})
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Clock className="h-10 w-10 rounded-2xl bg-amber-50 p-2 text-amber-600 dark:bg-white/10 dark:text-amber-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Sessions</p>
              <p className="text-lg font-semibold">{logs.length || 24} sessions / month</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">Includes lectures + lab attendance</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weekly Trend</p>
              <p className="text-lg font-semibold">Consistency graph</p>
            </div>
            <Activity className="h-6 w-6 text-teal-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.trend}>
                <XAxis dataKey="date" />
                <YAxis domain={[70, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke="#14b8a6" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Subject Wise</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.subjectBreakdown}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="percentage" fill="#2dd4bf" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Monthly Calendar</p>
              <p className="text-lg font-semibold">Presence map</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {Object.entries(statusColor).map(([key, value]) => (
                <span key={key} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${value}`}>
                  <span className="capitalize">{key}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-7">
            {calendarEntries.map(([date, status]) => (
              <div
                key={date}
                className={`rounded-2xl border px-3 py-4 text-center text-sm font-semibold shadow-sm ${statusColor[status] ?? "bg-slate-100"}`}
              >
                <p>{dayjs(date).format("DD")}</p>
                <p className="text-xs">{dayjs(date).format("dd")}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent Logs</p>
          <div className="mt-4 space-y-3 overflow-y-auto max-h-72 pr-1 scrollbar-thin">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm shadow-sm dark:border-white/10">
                <div>
                  <p className="font-semibold">{log.subject}</p>
                  <p className="text-xs text-slate-500">{dayjs(log.timestamp).format("DD MMM, hh:mm A")}</p>
                </div>
                <span className={`rounded-2xl px-3 py-1 text-xs font-semibold ${statusColor[log.status] ?? "bg-slate-100"}`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};


