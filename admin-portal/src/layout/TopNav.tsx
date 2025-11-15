import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BoltIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Button } from "../components/Button";
import { PaletteSwitcher } from "../components/PaletteSwitcher";

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
        <PaletteSwitcher />
      </div>
    </header>
  );
};

