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
    key: "softPink",
    name: "Soft Pink",
    light: variant({
      primary: "236 72 153",
      secondary: "219 39 119",
      accent: "59 130 246",
      muted: "71 85 105",
      surface: "248 250 252",
      ring: "236 72 153",
      bgBase: "249 250 251",
      bgElevated: "255 255 255",
      textPrimary: "15 23 42",
      textMuted: "71 85 105"
    }),
    dark: variant({
      primary: "244 114 182",
      secondary: "219 39 119",
      accent: "129 140 248",
      muted: "148 163 184",
      surface: "30 41 59",
      ring: "244 114 182",
      bgBase: "15 23 42",
      bgElevated: "30 41 59",
      textPrimary: "248 250 252",
      textMuted: "148 163 184"
    })
  },
  {
    key: "warmCreme",
    name: "Warm Creme",
    light: variant({
      primary: "248 196 113",
      secondary: "214 158 46",
      accent: "45 212 191",
      muted: "100 116 139",
      surface: "255 255 255",
      ring: "248 196 113",
      bgBase: "254 249 231",
      bgElevated: "255 255 255",
      textPrimary: "15 23 42",
      textMuted: "100 116 139"
    }),
    dark: variant({
      primary: "234 179 8",
      secondary: "250 204 21",
      accent: "34 197 94",
      muted: "148 163 184",
      surface: "38 50 56",
      ring: "250 204 21",
      bgBase: "22 30 36",
      bgElevated: "38 50 56",
      textPrimary: "248 250 252",
      textMuted: "203 213 225"
    })
  },
  {
    key: "offWhite",
    name: "Off White",
    light: variant({
      primary: "59 130 246",
      secondary: "14 165 233",
      accent: "56 189 248",
      muted: "71 85 105",
      surface: "255 255 255",
      ring: "56 189 248",
      bgBase: "244 247 252",
      bgElevated: "255 255 255",
      textPrimary: "15 23 42",
      textMuted: "71 85 105"
    }),
    dark: variant({
      primary: "96 165 250",
      secondary: "56 189 248",
      accent: "45 212 191",
      muted: "148 163 184",
      surface: "31 41 55",
      ring: "96 165 250",
      bgBase: "17 24 39",
      bgElevated: "31 41 55",
      textPrimary: "248 250 252",
      textMuted: "148 163 184"
    })
  },
  {
    key: "deepIndigo",
    name: "Deep Indigo",
    light: variant({
      primary: "99 102 241",
      secondary: "129 140 248",
      accent: "244 114 182",
      muted: "79 70 229",
      surface: "244 247 255",
      ring: "129 140 248",
      bgBase: "238 242 255",
      bgElevated: "255 255 255",
      textPrimary: "30 27 75",
      textMuted: "79 70 229"
    }),
    dark: variant({
      primary: "165 180 252",
      secondary: "129 140 248",
      accent: "244 114 182",
      muted: "196 181 253",
      surface: "33 34 74",
      ring: "165 180 252",
      bgBase: "23 24 48",
      bgElevated: "33 34 74",
      textPrimary: "240 245 255",
      textMuted: "196 181 253"
    })
  },
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

const getPaletteByKey = (key: ThemePaletteKey) => THEME_PALETTES.find((palette) => palette.key === key) ?? THEME_PALETTES[0];

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
  const [paletteKey, setPaletteKey] = useState<ThemePaletteKey>(persisted?.paletteKey ?? THEME_PALETTES[0].key);
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

