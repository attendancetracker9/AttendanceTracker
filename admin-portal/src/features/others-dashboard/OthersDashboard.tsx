import React, { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { LayoutShell } from "./components/LayoutShell";
import { OTHERS_TABS } from "./constants";
import type { OthersTabKey } from "./types";
import { useStudentProfile } from "./hooks/useStudentProfile";
import { TimeTableView } from "./views/TimeTableView";
import { AttendanceView } from "./views/AttendanceView";
import { ProgressReportView } from "./views/ProgressReportView";
import { EventsView } from "./views/EventsView";

const tabComponents: Record<OthersTabKey, React.FC<{ profile: ReturnType<typeof useStudentProfile>["profile"] }>> = {
  timetable: TimeTableView,
  attendance: AttendanceView,
  progress: ProgressReportView,
  events: EventsView
};

export const OthersDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { profile, loading } = useStudentProfile();
  const [activeTab, setActiveTab] = useState<OthersTabKey>("timetable");

  const ActiveView = useMemo(() => tabComponents[activeTab], [activeTab]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile?.role === "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <LayoutShell activeTab={activeTab} onTabChange={setActiveTab} profile={profile} loadingProfile={loading}>
      <AnimatePresence mode="wait">
        <motion.section
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-8"
        >
          <ActiveView profile={profile} key={activeTab} />
          {loading && (
            <p className="text-center text-xs text-slate-400">
              Syncing latest profile data...
            </p>
          )}
        </motion.section>
      </AnimatePresence>
    </LayoutShell>
  );
};


