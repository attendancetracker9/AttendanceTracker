import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import type { ThemePalette } from "../types";
import { Button } from "./Button";

const PaletteIcon: React.FC<{ palette: ThemePalette }> = ({ palette }) => (
  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 p-1">
    <div className="grid h-full w-full grid-cols-2 gap-0.5 rounded-full">
      <span
        className="rounded-full"
        style={{ backgroundColor: `rgb(${palette.light["color-primary"]})` }}
        aria-hidden="true"
      />
      <span
        className="rounded-full"
        style={{ backgroundColor: `rgb(${palette.light["color-secondary"]})` }}
        aria-hidden="true"
      />
      <span
        className="rounded-full"
        style={{ backgroundColor: `rgb(${palette.dark["color-primary"]})` }}
        aria-hidden="true"
      />
      <span
        className="rounded-full"
        style={{ backgroundColor: `rgb(${palette.dark["color-secondary"]})` }}
        aria-hidden="true"
      />
    </div>
  </div>
);

export const PaletteSwitcher: React.FC = () => {
  const { palette, mode, toggleMode } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen((prev) => !prev)} aria-haspopup="menu" aria-expanded={open}>
        <PaletteIcon palette={palette} />
        <span className="hidden md:inline text-sm font-semibold">Theme</span>
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="absolute right-0 z-50 mt-3 w-64 rounded-3xl border border-white/10 bg-[rgb(var(--bg-elevated))] p-4 shadow-soft"
            role="menu"
          >
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">Mode</p>
                <p className="text-xs text-[rgb(var(--text-muted))]">Switch between Light & Dark</p>
              </div>
              <Button variant="primary" onClick={toggleMode}>
                {mode === "dark" ? "Dark" : "Light"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

