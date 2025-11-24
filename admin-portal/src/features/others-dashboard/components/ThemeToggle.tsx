import React from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === "dark";

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={toggleMode}
      className="focus-ring inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span>{isDark ? "Dark" : "Light"} Mode</span>
    </motion.button>
  );
};


