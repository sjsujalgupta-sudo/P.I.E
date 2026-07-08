"use client";

/**
 * PROVIDERS
 *
 * Client component that wraps the app with NextAuth's SessionProvider.
 * Add any other global providers here (theme, query client, etc.)
 *
 * File location: app/providers.tsx
 */

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}
