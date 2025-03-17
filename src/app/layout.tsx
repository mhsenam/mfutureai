import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitAmIn - Fitness Tracker",
  description: "Track your fitness journey with FitAmIn",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        {/* Script to prevent theme flicker on load */}
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const savedTheme = localStorage.getItem('theme');
                const themeColor = savedTheme === 'dark' || 
                  (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) 
                  ? '#0f172a' : '#ffffff';
                
                // Set the theme class
                if (savedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (savedTheme === 'light') {
                  document.documentElement.classList.add('light');
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.add('light');
                }
                
                // Update theme-color meta tag if it exists, or create it if it doesn't
                let metaThemeColor = document.querySelector('meta[name="theme-color"]');
                if (!metaThemeColor) {
                  metaThemeColor = document.createElement('meta');
                  metaThemeColor.name = 'theme-color';
                  document.head.appendChild(metaThemeColor);
                }
                metaThemeColor.setAttribute('content', themeColor);
              } catch (e) {
                console.error('Failed to apply theme:', e);
              }
            })();
          `}
        </Script>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            {children}
            <Analytics />
            <Toaster position="bottom-center" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
