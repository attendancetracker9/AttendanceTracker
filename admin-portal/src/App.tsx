import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./layout/Sidebar";
import { TopNav } from "./layout/TopNav";
import { Dashboard } from "./pages/Dashboard";
import { Roster } from "./pages/Roster";
import { Announcements } from "./pages/Announcements";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { Support } from "./pages/Support";

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLButtonElement || event.target?.hasAttribute("contenteditable")) {
        return;
      }
      if (event.key.toLowerCase() === "g") {
        navigate("/");
      }
      if (event.key.toLowerCase() === "r") {
        navigate("/roster");
      }
      if (event.key.toLowerCase() === "n") {
        navigate("/announcements");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col">
        <TopNav onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes location={location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/roster" element={<Roster />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/support" element={<Support />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;

