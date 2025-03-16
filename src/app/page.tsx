"use client";

import { useEffect, useState } from "react";
import { FaGithub, FaLinkedin, FaInstagram, FaXTwitter } from "react-icons/fa6";

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

interface Testimonial {
  text: string;
  className: string;
}

export default function Home() {
  const [shuffledTestimonials, setShuffledTestimonials] = useState<
    Testimonial[]
  >([]);
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [snackbarAnimation, setSnackbarAnimation] = useState<
    "entering" | "visible" | "exiting" | "hidden"
  >("hidden");
  const [snackbarInitialRender, setSnackbarInitialRender] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if device is mobile on initial load
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    checkIfMobile();

    // Add resize listener
    window.addEventListener("resize", checkIfMobile);

    // Check dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    // Check initially
    checkDarkMode();

    // Create a mutation observer to watch for class changes on the html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const testimonials: Testimonial[] = [
      {
        text: '"Amazing AI experience!" - User A',
        className: "testimonial-left",
      },
      {
        text: '"Revolutionary technology!" - User B',
        className: "testimonial-right",
      },
      {
        text: '"Incredible AI tools!" - User C',
        className: "testimonial-left",
      },
      { text: '"A game changer!" - User D', className: "testimonial-right" },
      { text: '"Highly recommend!" - User E', className: "testimonial-left" },
      { text: '"Fantastic support!" - User F', className: "testimonial-right" },
      { text: '"Very intuitive!" - User G', className: "testimonial-left" },
      {
        text: '"Exceeded expectations!" - User H',
        className: "testimonial-right",
      },
    ];
    setShuffledTestimonials(shuffleArray(testimonials));
  }, []);

  useEffect(() => {
    if (showSearchResult) {
      // Reset displayed text immediately
      setDisplayedText("");

      // Use setTimeout to ensure state update completes before starting animation
      setTimeout(() => {
        let index = 0;

        const interval = setInterval(() => {
          if (index <= fullText.length) {
            setDisplayedText(fullText.substring(0, index));
            index++;
          } else {
            clearInterval(interval);
          }
        }, 10);

        // Cleanup function
        return () => clearInterval(interval);
      }, 50);
    }
  }, [showSearchResult, fullText]);

  const handleSearchClick = () => {
    if (!searchInput.trim()) {
      setSnackbarInitialRender(false);
      setSnackbarAnimation("entering");
      setSnackbarVisible(true);

      setTimeout(() => {
        setSnackbarAnimation("visible");
      }, 300);

      setTimeout(() => {
        setSnackbarAnimation("exiting");

        setTimeout(() => {
          setSnackbarVisible(false);
          setSnackbarAnimation("hidden");
        }, 300);
      }, 3000);

      return;
    }
    setDisplayedText("");
    setShowSearchResult(false);
    setTimeout(() => {
      setShowSearchResult(true);
    }, 0);
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Dotted pattern background - visible on all devices */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="dotted-pattern absolute inset-0" />
      </div>

      {/* Hide testimonials on mobile devices */}
      {!isMobile && (
        <div className="background-pattern hidden md:block">
          {shuffledTestimonials.map((testimonial, index) => (
            <div key={index} className={`testimonial ${testimonial.className}`}>
              {testimonial.text}
            </div>
          ))}
        </div>
      )}

      <div className="flex-grow flex flex-col dark:bg-dark-primary">
        <main className="flex-grow flex flex-col items-center justify-center px-4 py-6 sm:p-8 relative z-10 dark:bg-dark-primary">
          <style jsx>{`
            @keyframes gradient-rotate {
              0% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
              100% {
                background-position: 0% 50%;
              }
            }

            .gradient-text {
              background: linear-gradient(90deg, #212529, #dee2e6);
              background-size: 200% 200%;
              animation: gradient-rotate 10s linear infinite;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }

            /* Dark mode gradient text */
            :global(.dark) .gradient-text {
              background: linear-gradient(90deg, #e2e8f0, #94a3b8);
              background-size: 200% 200%;
              animation: gradient-rotate 10s linear infinite;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }

            .snackbar {
              position: fixed;
              bottom: 1rem;
              right: 1rem;
              background-color: #333;
              color: #fff;
              padding: 0.5rem 1rem;
              border-radius: 0.25rem;
              display: inline-block;
              animation: slideInRight 0.3s ease-in-out;
              z-index: 1000;
            }

            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }

            .scrollbar-hide {
              -ms-overflow-style: none; /* IE and Edge */
              scrollbar-width: none; /* Firefox */
            }

            .social-icon {
              transition: transform 0.2s ease-in-out, color 0.2s ease-in-out;
            }

            .social-icon:hover {
              transform: translateY(-3px);
              color: #6c757d;
            }

            :global(.dark) .social-icon:hover {
              color: #f1f5f9;
            }

            /* Responsive testimonials */
            @media (max-width: 768px) {
              .background-pattern {
                display: none;
              }
            }

            /* Improve placeholder color for better readability */
            ::placeholder {
              color: #495057;
              opacity: 1;
            }

            :global(.dark) ::placeholder {
              color: #94a3b8;
              opacity: 1;
            }

            .button-container {
              position: relative;
              z-index: 20;
              pointer-events: auto;
            }

            .nav-button {
              cursor: pointer;
              user-select: none;
              -webkit-tap-highlight-color: transparent;
            }

            .dotted-pattern {
              background-image: radial-gradient(#212529 1px, transparent 1px);
              background-size: 24px 24px;
              opacity: 0.1;
            }

            :global(.dark) .dotted-pattern {
              background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
              opacity: 0.05;
            }
          `}</style>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 gradient-text text-center">
            FitAmIn
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 text-center">
            Made with ❤️ by Mohsen Amini
          </p>
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg transition-transform transform hover:scale-105 p-0">
            <textarea
              placeholder="Search AI..."
              className="w-full p-3 sm:p-4 pr-10 sm:pr-12 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[#ced4da] dark:focus:ring-[#3b82f6] focus:border-transparent bg-white dark:bg-dark-lighter resize-none overflow-y-auto scrollbar-hide text-gray-900 dark:text-gray-100"
              style={{ height: "50px" }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchClick();
                }
              }}
            ></textarea>
            <button
              onClick={handleSearchClick}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none transition-colors"
              aria-label="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </button>
          </div>

          {showSearchResult && (
            <div className="mt-6 p-4 bg-white dark:bg-dark-lighter rounded-lg shadow-md w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg text-gray-900 dark:text-gray-100">
              <p>{displayedText}</p>
            </div>
          )}

          <div className="mt-8 sm:mt-12 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Welcome to Your Fitness Journey
            </h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Track your workouts, monitor your weight progress, and achieve
              your fitness goals. Use the navigation menu to access the fitness
              tracker.
            </p>
          </div>
        </main>

        <footer
          className={`w-full py-6 px-4 border-t border-gray-200 dark:border-gray-800 shadow-md dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3),0_-2px_4px_-1px_rgba(0,0,0,0.2)]`}
          style={{ backgroundColor: isDarkMode ? "#0f172a" : "#f3f4f6" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center">
            <div className="flex space-x-6 mb-4">
              <a
                href="https://github.com/mhsenam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white social-icon"
                aria-label="GitHub"
              >
                <FaGithub size={24} />
              </a>
              <a
                href="https://linkedin.com/in/mhsenam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white social-icon"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={24} />
              </a>
              <a
                href="https://instagram.com/mhsenamm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white social-icon"
                aria-label="Instagram"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="https://twitter.com/mhsenam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white social-icon"
                aria-label="Twitter"
              >
                <FaXTwitter size={24} />
              </a>
            </div>
            <div className="text-gray-700 dark:text-gray-300 text-sm">
              © 2025 FitAmIn. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      {snackbarVisible && (
        <div
          className={`snackbar ${
            snackbarInitialRender ? "" : snackbarAnimation
          }`}
        >
          Please enter a search term
        </div>
      )}
    </div>
  );
}
