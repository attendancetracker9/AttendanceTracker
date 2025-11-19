import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ThemeMode, ThemePalette, ThemePaletteKey, ThemeVariant } from "../types";

type ThemeContextValue = {
  palette: ThemePalette;
  mode: ThemeMode;
  setPaletteByKey: (key: ThemePaletteKey) => void;
  toggleMode: () => void;
  availablePalettes: ThemePalette[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "admin-portal-theme";

const variant = (values: {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  surface: string;
  ring: string;
  bgBase: string;
  bgElevated: string;
  textPrimary: string;
  textMuted: string;
}): ThemeVariant => ({
  "color-primary": values.primary,
  "color-secondary": values.secondary,
  "color-accent": values.accent,
  "color-muted": values.muted,
  "color-surface": values.surface,
  "color-ring": values.ring,
  "bg-base": values.bgBase,
  "bg-elevated": values.bgElevated,
  "text-primary": values.textPrimary,
  "text-muted": values.textMuted
});

export const THEME_PALETTES: ThemePalette[] = [
  {
    key: "tealSunrise",
    name: "Teal Sunrise",
    light: variant({
      primary: "20 184 166",
      secondary: "45 212 191",
      accent: "14 165 233",
      muted: "71 85 105",
      surface: "241 250 255",
      ring: "20 184 166",
      bgBase: "236 253 245",
      bgElevated: "255 255 255",
      textPrimary: "15 23 42",
      textMuted: "71 85 105"
    }),
    dark: variant({
      primary: "45 212 191",
      secondary: "56 189 248",
      accent: "129 140 248",
      muted: "148 163 184",
      surface: "19 78 74",
      ring: "45 212 191",
      bgBase: "12 53 50",
      bgElevated: "19 78 74",
      textPrimary: "236 253 245",
      textMuted: "148 163 184"
    })
  }
];

type PersistedTheme = {
  paletteKey: ThemePaletteKey;
  mode: ThemeMode;
};

const getPaletteByKey = (key: ThemePaletteKey) => THEME_PALETTES.find((palette) => palette.key === key) ?? THEME_PALETTES.find((p) => p.key === "tealSunrise")!;

const applyVariantToDocument = (variantData: ThemeVariant) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  Object.entries(variantData).forEach(([token, value]) => {
    root.style.setProperty(`--${token}`, value);
  });
};

const persistTheme = (payload: PersistedTheme) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
};

const readPersistedTheme = (): PersistedTheme | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTheme;
  } catch {
    return null;
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = useMemo(() => (typeof window !== "undefined" ? readPersistedTheme() : null), []);
  const initialPaletteKey = useMemo<ThemePaletteKey>(() => {
    if (persisted?.paletteKey && THEME_PALETTES.some((palette) => palette.key === persisted.paletteKey)) {
      return persisted.paletteKey;
    }
    return "tealSunrise";
  }, [persisted]);
  const [paletteKey, setPaletteKey] = useState<ThemePaletteKey>(initialPaletteKey);
  const [mode, setMode] = useState<ThemeMode>(persisted?.mode ?? "dark");

  const palette = useMemo(() => getPaletteByKey(paletteKey), [paletteKey]);

  useEffect(() => {
    const variantToApply = mode === "dark" ? palette.dark : palette.light;
    applyVariantToDocument(variantToApply);
    persistTheme({ paletteKey, mode });
  }, [palette, paletteKey, mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      palette,
      mode,
      availablePalettes: THEME_PALETTES,
      setPaletteByKey: (key) => setPaletteKey(key),
      toggleMode: () => setMode((current) => (current === "dark" ? "light" : "dark"))
    }),
    [palette, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

