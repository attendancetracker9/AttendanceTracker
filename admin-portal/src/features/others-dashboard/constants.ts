import type { OthersTabKey } from "./types";
import { Calendar, GraduationCap, LayoutGrid, LineChart } from "lucide-react";

export const OTHERS_TABS: Array<{
  key: OthersTabKey;
  label: string;
  description: string;
  icon: typeof LineChart;
}> = [
  {
    key: "timetable",
    label: "Time Table",
    description: "View your weekly schedule and faculty details",
    icon: LayoutGrid
  },
  {
    key: "attendance",
    label: "Attendance",
    description: "Track your attendance percentage and logs",
    icon: Calendar
  },
  {
    key: "progress",
    label: "Progress Report",
    description: "Check semester-wise performance and grades",
    icon: LineChart
  },
  {
    key: "events",
    label: "College Events",
    description: "Stay updated with campus happenings",
    icon: GraduationCap
  }
];

export const CATEGORY_OPTIONS = ["Sports", "Cultural", "Academic", "Fest", "Others"] as const;


