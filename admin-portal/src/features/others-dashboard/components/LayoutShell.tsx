import React, { useState } from "react";
import { clsx } from "clsx";
import { Menu } from "lucide-react";
import type { OthersTabKey, StudentProfile } from "../types";
import { SidebarNav } from "./SidebarNav";
import { HeaderBar } from "./header/HeaderBar";

type LayoutShellProps = {
  activeTab: OthersTabKey;
  onTabChange: (tab: OthersTabKey) => void;
  children: React.ReactNode;
  profile?: StudentProfile | null;
  loadingProfile?: boolean;
};

export const LayoutShell: React.FC<LayoutShellProps> = ({ activeTab, onTabChange, children, profile, loadingProfile }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[rgb(var(--bg-base))] dark:text-[rgb(var(--text-primary))]">
      <SidebarNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab);
          setSidebarOpen(false);
        }}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur dark:border-white/5 dark:bg-[rgb(var(--bg-elevated))]/60 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="focus-ring rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Parent Notify</p>
            <h1 className="text-lg font-semibold">Others Dashboard</h1>
          </div>
        </div>
        <HeaderBar className={clsx("hidden md:flex")} profile={profile} loading={loadingProfile} />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};


