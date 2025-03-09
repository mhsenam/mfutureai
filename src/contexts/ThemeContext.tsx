"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Function to set theme with side effects
  const setTheme = (newTheme: Theme) => {
    console.log(`ThemeProvider: Setting theme to ${newTheme}`);
    setThemeState(newTheme);

    // Save to localStorage
    try {
      localStorage.setItem("theme", newTheme);
    } catch (e) {
      console.error("Failed to save theme to localStorage:", e);
    }

    // Apply theme to document
    applyTheme(newTheme);
  };

  // Function to apply theme to document
  const applyTheme = (themeToApply: Theme) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (themeToApply === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
    } else {
      root.classList.add(themeToApply);
      setResolvedTheme(themeToApply);
    }
  };

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true);

    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        // Default to system if no valid theme is found
        applyTheme("system");
      }
    } catch (e) {
      console.error("Failed to get theme from localStorage:", e);
      applyTheme("system");
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Re-apply theme when it changes
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
