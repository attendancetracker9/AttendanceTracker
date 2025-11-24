import React from "react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { clsx } from "clsx";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "../../../../context/AuthContext";
import { Avatar } from "../../../../components/Avatar";
import { Button } from "../../../../components/Button";
import type { StudentProfile } from "../../types";

type HeaderBarProps = {
  className?: string;
  profile?: StudentProfile | null;
  loading?: boolean;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({ className, profile, loading }) => {
  const { userProfile, signOut } = useAuth();
  const displayName = profile?.name ?? userProfile?.name ?? "Student";
  const subText = profile
    ? `${profile.department ?? "Department"} • ${profile.semester ?? "Sem"}`
    : userProfile?.email ?? "Stay curious";

  return (
    <header
      className={clsx(
        "items-center justify-between border-b border-slate-100 bg-white/80 px-10 py-6 backdrop-blur dark:border-white/5 dark:bg-[rgb(var(--bg-elevated))]/60",
        className
      )}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-teal-500">Parent Notify</p>
        <motion.h1 layout className="text-2xl font-semibold md:text-3xl">
          Welcome back, {displayName}
        </motion.h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Track your classes, attendance, performance, and campus buzz from one clean dashboard.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/10 md:flex">
          <Avatar name={displayName} />
          <div>
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {loading ? "Syncing profile..." : subText}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="hidden md:inline-flex"
          onClick={async () => {
            await signOut();
          }}
          icon={<LogOut className="h-4 w-4" />}
        >
          Logout
        </Button>
      </div>
    </header>
  );
};


