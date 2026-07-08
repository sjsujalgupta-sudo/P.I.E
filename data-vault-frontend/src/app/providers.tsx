/*
 * 🎭 Analogy: This is the "Electrical Panel" — it wraps the entire app
 *    with global providers (theme, auth, etc.) so every page has access
 *    to shared context without importing it individually.
 * ✅ Safe to change:
 *    1. Add a new provider (e.g., <ToastProvider>) inside the return
 *    2. Add global error boundary wrapping
 *    3. Add analytics initialization here
 * ❌ Never touch: The children prop passthrough — removing it means no
 *    page content renders. The whole app goes blank.
 */
"use client";

import { AuthProvider } from "@/components/providers/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
