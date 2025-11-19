import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowRightOnRectangleIcon,
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  HomeIcon,
  InboxStackIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const navItems = [
  { label: "Dashboard", to: "/", icon: HomeIcon, hotkey: "G" },
  { label: "Data Upload", to: "/roster", icon: UsersIcon, hotkey: "R" },
  { label: "Announcements", to: "/announcements", icon: ClipboardDocumentCheckIcon, hotkey: "N" },
  { label: "Notifications", to: "/notifications", icon: BellAlertIcon },
  { label: "Settings", to: "/settings", icon: Cog6ToothIcon },
  { label: "Support", to: "/support", icon: DocumentArrowDownIcon }
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { push } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      push({ status: "success", title: "Signed out", description: "You have been successfully signed out" });
      navigate("/login");
      onCloseMobile();
    } catch (error: any) {
      push({ status: "error", title: "Error", description: error.message || "Failed to sign out" });
    }
  };

  return (
  <>
    <div
      className={clsx(
        "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition md:hidden",
        mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={onCloseMobile}
      role="presentation"
    />
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-white/5 bg-[rgb(var(--bg-base))]/90 backdrop-blur transition-transform md:relative md:translate-x-0",
        collapsed ? "w-20" : "w-72",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      aria-label="Primary"
    >
      <div className="flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <motion.div layout className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-2xl font-bold text-primary">
            PN
          </motion.div>
          {!collapsed && (
            <div>
              <p className="text-xs text-primary">Parent Notify</p>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Admin Console</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="focus-ring hidden rounded-full border border-white/5 bg-white/10 p-2 text-white transition hover:bg-white/20 md:inline-flex"
            aria-label="Toggle sidebar width"
          >
            <InboxStackIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="focus-ring inline-flex rounded-full border border-white/5 bg-white/10 p-2 text-white transition hover:bg-white/20 md:hidden"
            aria-label="Close navigation"
          >
            <InboxStackIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "focus-ring group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-[rgb(var(--text-muted))] hover:bg-white/5 hover:text-[rgb(var(--text-primary))]"
                    )
                  }
                  onClick={onCloseMobile}
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && (
                    <div className="flex w-full items-center justify-between">
                      <span>{item.label}</span>
                      {item.hotkey && <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase">{item.hotkey}</span>}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
        {/* Logout Button */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleLogout}
            className={clsx(
              "focus-ring group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
              "text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
            )}
            data-testid="sidebar-logout"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </nav>
      <div className="px-4 pb-6">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-4 text-xs text-[rgb(var(--text-muted))]">
          <p className="font-semibold text-[rgb(var(--text-primary))]">Keyboard Shortcuts</p>
          <p className="mt-2">G → Dashboard</p>
          <p>R → Data Upload</p>
          <p>N → New Announcement</p>
        </div>
      </div>
    </aside>
  </>
  );
};

