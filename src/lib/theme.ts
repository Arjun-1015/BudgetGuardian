"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "bg_theme";

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Reads the theme the inline no-flash script (see layout.tsx) already
 * applied before React even mounted. Called only inside useEffect, so it
 * never runs during the server-rendered pass. */
function readAppliedTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  // Same default on server and client so hydration never mismatches —
  // corrected a moment later in the effect below to whatever the inline
  // script actually applied (which itself checks localStorage / system
  // preference before paint, so there's no visible flash either way).
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(readAppliedTheme());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeClass(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
