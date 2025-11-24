import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { Sidebar } from "./layout/Sidebar";
import { TopNav } from "./layout/TopNav";
import { Dashboard } from "./pages/Dashboard";
import { Roster } from "./pages/Roster";
import { Announcements } from "./pages/Announcements";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { Support } from "./pages/Support";
import Login from "./pages/Login";
import { OthersDashboard } from "./features/others-dashboard";

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLButtonElement ||
        target?.hasAttribute("contenteditable")
      ) {
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

  // Redirect to login if not authenticated (except on login page)
  useEffect(() => {
    if (!loading && !user && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  // Redirect authenticated users from login page to dashboard
  useEffect(() => {
    if (!loading && user && userProfile && userProfile.role === "admin" && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [user, userProfile, loading, location.pathname, navigate]);

  // Redirect "others" role into their dashboard route
  useEffect(() => {
    if (!loading && user && userProfile?.role === "others" && location.pathname !== "/others") {
      navigate("/others", { replace: true });
    }
  }, [user, userProfile, loading, location.pathname, navigate]);

  // Show login page without sidebar/nav
  if (location.pathname === "/login") {
    return <Login />;
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgb(var(--color-primary))] border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-[rgb(var(--text-muted))]">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null;
  }

  if (!loading && userProfile?.role === "others") {
    if (location.pathname !== "/others") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgb(var(--color-primary))] border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-[rgb(var(--text-muted))]">Preparing your dashboard...</p>
          </div>
        </div>
      );
    }
    return <OthersDashboard />;
  }

  // Check if user has admin role - only admins can access the admin console
  // Wait for userProfile to load before checking role
  if (!loading && userProfile && userProfile.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">Access Denied</h2>
            <p className="text-[rgb(var(--text-muted))] mb-6">
              You don't have permission to access the Admin Console. This area is restricted to administrators only.
            </p>
            <p className="text-sm text-[rgb(var(--text-muted))] mb-6">
              If you need admin access, please contact your administrator or sign in with an admin account and access code.
            </p>
            <button
              onClick={() => {
                navigate("/login");
              }}
              className="px-6 py-2 rounded-lg bg-[rgb(var(--color-primary))] text-[rgb(var(--bg-base))] font-semibold hover:opacity-90 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if userProfile is not loaded yet
  if (user && !userProfile && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgb(var(--color-primary))] border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-[rgb(var(--text-muted))]">Loading your profile...</p>
        </div>
      </div>
    );
  }

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
                <Route path="/others" element={<OthersDashboard />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;

