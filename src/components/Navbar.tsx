"use client";

import { useState, useEffect } from "react";
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
} from "react-icons/fa";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Add event listener to close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-theme-dropdown]")) {
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
  const handleThemeClick = (newTheme: "light" | "dark" | "system") => {
    console.log(`Setting theme to: ${newTheme}`);
    setTheme(newTheme);
    setShowThemeMenu(false);
  };

  const toggleThemeMenu = () => {
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
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                MFuture AI
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/fitness-tracker"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/fitness-tracker"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FaUser /> Sign In
                  </span>
                </Link>
              ))}

            {/* Theme dropdown */}
            <div className="relative" data-theme-dropdown>
              <button
                onClick={toggleThemeMenu}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleThemeClick("light")}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "light"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaSun /> Light
                      </span>
                    </button>
                    <button
                      onClick={() => handleThemeClick("dark")}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "dark"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaMoon /> Dark
                      </span>
                    </button>
                    <button
                      onClick={() => handleThemeClick("system")}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "system"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaDesktop /> System
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
            <div className="relative mr-2" data-theme-dropdown>
              <button
                onClick={toggleThemeMenu}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Theme options"
                type="button"
              >
                {getThemeIcon()}
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleThemeClick("light")}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "light"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaSun /> Light
                      </span>
                    </button>
                    <button
                      onClick={() => handleThemeClick("dark")}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "dark"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaMoon /> Dark
                      </span>
                    </button>
                    <button
                      onClick={() => handleThemeClick("system")}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        theme === "system"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                      role="menuitem"
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <FaDesktop /> System
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg transition-colors">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/fitness-tracker"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === "/fitness-tracker"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <FaSignOutAlt /> Sign Out
                  </span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    pathname === "/login"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
