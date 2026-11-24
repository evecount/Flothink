import { useEffect, useState } from "react";

export type FlothinkTheme = "ember" | "slate";

const STORAGE_KEY = "flothink-theme";
const EVENT_NAME = "flothink-theme-change";

function readStoredTheme(): FlothinkTheme {
  if (typeof window === "undefined") return "ember";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "slate" ? "slate" : "ember";
}

export function useFlothinkTheme() {
  const [theme, setThemeState] = useState<FlothinkTheme>("ember");

  useEffect(() => {
    const apply = (next: FlothinkTheme) => {
      setThemeState(next);
      document.documentElement.dataset.theme = next;
    };
    apply(readStoredTheme());
    const onSync = () => apply(readStoredTheme());
    window.addEventListener(EVENT_NAME, onSync);
    return () => window.removeEventListener(EVENT_NAME, onSync);
  }, []);

  const setTheme = (next: FlothinkTheme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.dataset.theme = next;
    setThemeState(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  return { theme, setTheme };
}
