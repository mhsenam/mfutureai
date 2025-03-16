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

    // Force a re-render by toggling a class
    root.classList.add("theme-applied");
    setTimeout(() => {
      root.classList.remove("theme-applied");
    }, 0);
  };

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true);

    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        console.log(`Initializing theme from localStorage: ${savedTheme}`);
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        // Default to system if no valid theme is found
        console.log(
          "No valid theme found in localStorage, defaulting to system"
        );
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
        console.log("System theme preference changed, updating theme");
        applyTheme("system");
      }
    };

    // Use the correct event listener method based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Re-apply theme when it changes
  useEffect(() => {
    if (mounted) {
      console.log(`Theme changed to ${theme}, applying...`);
      applyTheme(theme);
    }
  }, [theme, mounted]);

  // Provide a value that will cause consumers to re-render when the theme changes
  const contextValue = {
    theme,
    setTheme,
    resolvedTheme,
  };

  // If not mounted yet, render children without theme context to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
