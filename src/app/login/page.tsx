"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [resetSent, setResetSent] = useState(false);

  const { login, signup, resetPassword } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }

      router.push("/fitness-tracker");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    try {
      setError("");
      setLoading(true);

      if (!email) {
        throw new Error("Please enter your email address");
      }

      await resetPassword(email);
      setResetSent(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Dotted pattern background - visible on all devices */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="dotted-pattern absolute inset-0" />
      </div>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-6 sm:p-8 relative z-10">
        <style jsx>{`
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

        <div className="bg-white/80 dark:bg-dark-primary/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mt-2">
              {isLogin
                ? "Sign in to access your fitness tracker"
                : "Sign up to start tracking your fitness journey"}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
              Password reset email sent. Please check your inbox.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-lighter text-gray-900 dark:text-gray-100"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-lighter text-gray-900 dark:text-gray-100"
                  placeholder={isLogin ? "Your password" : "Create a password"}
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <FaUser className="mr-2" />
              )}
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full py-3 sm:py-4 bg-gray-100/80 dark:bg-dark-primary backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 mt-auto relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
              © {new Date().getFullYear()} FitAmIn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
