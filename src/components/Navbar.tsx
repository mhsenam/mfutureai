"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FaDumbbell,
  FaUser,
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaDesktop,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaBug,
} from "react-icons/fa";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const desktopThemeDropdownRef = useRef<HTMLDivElement>(null);
  const mobileThemeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);

    // Add event listener to close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isDesktopDropdownClicked =
        desktopThemeDropdownRef.current?.contains(target);
      const isMobileDropdownClicked =
        mobileThemeDropdownRef.current?.contains(target);

      if (!isDesktopDropdownClicked && !isMobileDropdownClicked) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Theme handlers
  const setLightTheme = () => {
    console.log("Setting light theme");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    setTheme("light");
    setShowThemeMenu(false);
  };

  const setDarkTheme = () => {
    console.log("Setting dark theme");
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    setTheme("dark");
    setShowThemeMenu(false);
  };

  const setSystemTheme = () => {
    console.log("Setting system theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(systemTheme);
    setTheme("system");
    setShowThemeMenu(false);
  };

  // Debug function to log theme state
  const debugTheme = () => {
    console.log("Current theme state:", {
      themeContext: theme,
      resolvedTheme,
      documentClasses: document.documentElement.classList.toString(),
      mediaQuery: window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
      localStorage: localStorage.getItem("theme"),
    });
  };

  const toggleThemeMenu = () => {
    console.log("Toggling theme menu, current state:", !showThemeMenu);
    setShowThemeMenu(!showThemeMenu);
  };

  const getThemeIcon = () => {
    if (theme === "system") return <FaDesktop />;
    return resolvedTheme === "dark" ? <FaMoon /> : <FaSun />;
  };

  const getThemeText = () => {
    if (theme === "system") return "System";
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <nav className="bg-white dark:bg-dark-primary shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span
                className={`text-xl font-bold transition-colors ${
                  pathname === "/fitness-tracker"
                    ? " text-gray-700 dark:text-gray-200 transition-colors"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                FitAmIn
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/fitness-tracker"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/fitness-tracker"
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20"
              }`}
            >
              <span className="flex items-center gap-2">
                <FaDumbbell /> Fitness Tracker
              </span>
            </Link>

            {isClient &&
              (currentUser ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <FaSignOutAlt /> Sign Out
                  </span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/login"
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FaUser /> Sign In
                  </span>
                </Link>
              ))}

            {/* Theme dropdown */}
            <div className="relative" ref={desktopThemeDropdownRef}>
              <button
                onClick={toggleThemeMenu}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors"
                aria-label="Theme options"
                type="button"
              >
                <span className="flex items-center gap-2">
                  {getThemeIcon()} {getThemeText()}{" "}
                  <FaChevronDown
                    className={`transition-transform ${
                      showThemeMenu ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-lighter ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={setLightTheme}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "light"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200"
                      } hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaSun /> Light
                      </span>
                    </button>
                    <button
                      onClick={setDarkTheme}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "dark"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200"
                      } hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaMoon /> Dark
                      </span>
                    </button>
                    <button
                      onClick={setSystemTheme}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "system"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200"
                      } hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaDesktop /> System
                      </span>
                    </button>
                    <button
                      onClick={debugTheme}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-lightest/50 transition-colors border-t border-gray-200 dark:border-gray-700"
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaBug /> Debug Theme
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            {/* Mobile theme dropdown */}
            <div className="relative mr-2" ref={mobileThemeDropdownRef}>
              <button
                onClick={toggleThemeMenu}
                className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors"
                aria-label="Theme options"
                type="button"
              >
                {getThemeIcon()}
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-dark-lighter ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={setLightTheme}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "light"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200"
                      } hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaSun /> Light
                      </span>
                    </button>
                    <button
                      onClick={setDarkTheme}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "dark"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200"
                      } hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaMoon /> Dark
                      </span>
                    </button>
                    <button
                      onClick={setSystemTheme}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "system"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200"
                      } hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaDesktop /> System
                      </span>
                    </button>
                    <button
                      onClick={debugTheme}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-200 dark:border-gray-700"
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaBug /> Debug
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-colors"
              aria-label="Open menu"
              type="button"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-dark-primary border-t border-gray-200 dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/fitness-tracker"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === "/fitness-tracker"
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <FaDumbbell /> Fitness Tracker
              </span>
            </Link>
            {isClient &&
              (currentUser ? (
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <FaSignOutAlt /> Sign Out
                  </span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === "/login"
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-blue-900/20"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <FaUser /> Sign In
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
}
