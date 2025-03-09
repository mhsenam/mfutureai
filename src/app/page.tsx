"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaXTwitter,
  FaDumbbell,
} from "react-icons/fa6";

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
  const router = useRouter();
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

  useEffect(() => {
    // Check if device is mobile on initial load
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    checkIfMobile();

    // Add resize listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
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

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-6 sm:p-8 relative z-10">
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
        `}</style>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 gradient-text text-center">
          MFuture AI
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-gray-900 mb-4 sm:mb-6 text-center">
          Made with ❤️ by Mohsen Amini
        </p>
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg transition-transform transform hover:scale-105 p-0">
          <textarea
            placeholder="Search AI..."
            className="w-full p-3 sm:p-4 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[#ced4da] focus:border-transparent bg-white resize-none overflow-y-auto scrollbar-hide text-gray-900"
            style={{ lineHeight: "1.5", maxHeight: "4.5em" }}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSearchClick();
              }
            }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            onClick={handleSearchClick}
            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 sm:p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 15.75L19.5 19.5M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
              />
            </svg>
          </button>
        </div>

        <div
          className={`relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg p-0 mt-6 sm:mt-8 transition-transform duration-300 ease-in-out transform ${
            showSearchResult
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          }`}
          style={{ maxHeight: "calc(100vh - 20px)", marginBottom: "20px" }}
        >
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
            Search Result
          </h2>
          <div
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg bg-white overflow-y-auto scrollbar-hide"
            style={{ minHeight: "120px", maxHeight: "calc(100vh - 150px)" }}
          >
            <p className="text-gray-900 scrollbar-hide text-sm sm:text-base">
              {displayedText}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 button-container">
          <button
            onClick={() => router.push("/fitness-tracker")}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors nav-button"
          >
            <FaDumbbell /> Fitness Tracker
          </button>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors nav-button"
          >
            Sign In / Register
          </button>
        </div>
      </main>

      {snackbarVisible && (
        <div
          className="fixed bottom-4 right-4 p-3 sm:p-4 bg-white text-gray-900 rounded-xl shadow-md text-sm sm:text-base"
          style={{
            transform: snackbarInitialRender
              ? "translateY(100px)"
              : snackbarAnimation === "entering" ||
                snackbarAnimation === "visible"
              ? "translateY(0)"
              : "translateY(100px)",
            opacity: snackbarInitialRender
              ? 0
              : snackbarAnimation === "entering" ||
                snackbarAnimation === "visible"
              ? 1
              : 0,
            transition: "transform 300ms ease-out, opacity 300ms ease-out",
            zIndex: 50,
          }}
        >
          Please enter a valid search query.
        </div>
      )}

      {/* Footer with social media links */}
      <footer className="w-full py-3 sm:py-4 bg-gray-100 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="flex space-x-4 sm:space-x-6 mb-2">
              <a
                href="https://github.com/mhsenam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 social-icon"
                aria-label="GitHub"
              >
                <FaGithub size={20} className="sm:w-6 sm:h-6" />
              </a>
              <a
                href="https://linkedin.com/in/mhsenam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 social-icon"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={20} className="sm:w-6 sm:h-6" />
              </a>
              <a
                href="https://instagram.com/mhsenamm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 social-icon"
                aria-label="Instagram"
              >
                <FaInstagram size={20} className="sm:w-6 sm:h-6" />
              </a>
              <a
                href="https://x.com/mhsenam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 social-icon"
                aria-label="X (Twitter)"
              >
                <FaXTwitter size={20} className="sm:w-6 sm:h-6" />
              </a>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              © {new Date().getFullYear()} MFuture AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
