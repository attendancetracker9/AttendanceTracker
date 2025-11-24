import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { OTHERS_TABS } from "../constants";
import type { OthersTabKey } from "../types";

type SidebarNavProps = {
  activeTab: OthersTabKey;
  onTabChange: (tab: OthersTabKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onTabChange, mobileOpen, onCloseMobile }) => {
  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
        role="presentation"
      />
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-slate-100 bg-white/95 px-4 py-6 text-slate-900 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[rgb(var(--bg-elevated))]/90 md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-teal-500">Parent Notify</p>
            <h2 className="text-2xl font-semibold">Others Portal</h2>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="focus-ring rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-3">
          {OTHERS_TABS.map(({ key, label, description, icon: Icon }) => {
            const isActive = key === activeTab;
            return (
              <motion.button
                type="button"
                key={key}
                onClick={() => onTabChange(key)}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  "w-full rounded-3xl border px-5 py-4 text-left transition",
                  "border-slate-100 bg-white shadow-sm hover:border-teal-200 hover:bg-teal-50/60 dark:border-white/5 dark:bg-white/5 dark:hover:border-teal-500/40 dark:hover:bg-teal-500/5",
                  isActive &&
                    "border-teal-500 bg-gradient-to-r from-teal-100 via-white to-white text-teal-900 shadow-lg dark:from-teal-950/80 dark:to-transparent"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      "rounded-2xl p-3 text-teal-600 shadow-inner dark:text-teal-200",
                      isActive ? "bg-white dark:bg-white/10" : "bg-teal-50 dark:bg-white/5"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-3xl border border-slate-100 bg-gradient-to-br from-teal-500 to-emerald-500 p-5 text-white shadow-xl dark:border-white/10 dark:from-teal-600 dark:to-emerald-600">
          <p className="text-xs uppercase tracking-wide text-white/80">Need help?</p>
          <p className="mt-2 text-lg font-semibold">We’re one tap away</p>
          <p className="mt-1 text-sm text-white/80">Reach out to your counselor or class mentor any time.</p>
        </div>
      </aside>
    </>
  );
};


