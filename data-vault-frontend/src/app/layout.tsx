/*
 * 🎭 Analogy: This file is the "Building Foundation" — it wraps
 *   every single page in the app with the HTML shell, fonts,
 *   global styles, and theme providers.
 * ✅ Safe to change:
 *    1. The font family (swap Inter for another Google Font)
 *    2. The metadata title and description (shown in browser tabs)
 *    3. Add a new global provider inside the <body> tag
 * ❌ Never touch: The `metadata` export and the `RootLayout` function
 *   signature — Next.js requires these exact names and shapes.
 */

/**
 * ROOT LAYOUT COMPONENT
 *
 * This is the main layout wrapper for the entire PIE application.
 * It provides the basic HTML structure, global styles, and context providers
 * that all pages need (authentication, theming, notifications).
 */

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { BackgroundBlobs } from "@/components/ui/background-blobs";

export const metadata: Metadata = {
    title: "PIE — Personal Intelligence Engine",
    description: "Your secure personal data treasury and intelligence engine.",
    keywords: ["PIE", "intelligence", "privacy", "data", "vault", "security"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full">
            <body className="min-h-full">
                <Providers>
                    <ThemeProvider>
                        <BackgroundBlobs />
                        {children}
                        <Toaster
                            position="bottom-right"
                            toastOptions={{
                                style: {
                                    background: "rgba(28, 28, 30, 0.95)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "#ffffff",
                                    backdropFilter: "blur(40px)",
                                    WebkitBackdropFilter: "blur(40px)",
                                    borderRadius: "16px",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                },
                            }}
                        />
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    );
}
