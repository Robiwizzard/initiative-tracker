import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const KEY = "initiative-tracker:theme";

/** Dark by default; the user's choice is remembered in this browser. */
function stored(): Theme {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(stored);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: still switches for this session */
    }
  }, [theme]);

  return { theme, toggle };
}
