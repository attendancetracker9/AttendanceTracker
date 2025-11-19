import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BoltIcon, Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import { Button } from "../components/Button";
import { PaletteSwitcher } from "../components/PaletteSwitcher";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useApi } from "../context/ApiContext";

type TopNavProps = {
  onMenuClick: () => void;
};

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/roster": "Data Upload",
  "/announcements": "Announcements",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/support": "Support"
};

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageTitle = titleMap[pathname] ?? "Admin Console";
  const { notifications } = useApi();
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Count recent notifications (last 24 hours or unread)
  const recentCount = notifications.filter((n) => {
    const notificationTime = new Date(n.timestamp).getTime();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return notificationTime > dayAgo;
  }).length;

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-[rgb(var(--bg-base))]/80 px-6 backdrop-blur">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="focus-ring inline-flex rounded-2xl border border-white/5 bg-white/10 p-2 text-white transition hover:bg-white/20 md:hidden"
          aria-label="Open navigation"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest text-[rgb(var(--text-muted))]">Neo Horizon College</p>
          <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{pageTitle}</h1>
        </div>
        <Button
          variant="primary"
          icon={<BoltIcon className="h-4 w-4" />}
          onClick={() => navigate("/announcements")}
          aria-label="Quick send notification"
        >
          Quick Send
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative focus-ring inline-flex items-center justify-center rounded-2xl border border-white/5 bg-white/10 p-2.5 text-[rgb(var(--text-primary))] transition hover:bg-white/20"
            aria-label="View notifications"
          >
            <BellIcon className="h-5 w-5" />
            {recentCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow-lg z-10">
                {recentCount > 9 ? "9+" : recentCount}
              </span>
            )}
          </button>
          <NotificationDropdown open={notificationOpen} onClose={() => setNotificationOpen(false)} />
        </div>
        <PaletteSwitcher />
      </div>
    </header>
  );
};

