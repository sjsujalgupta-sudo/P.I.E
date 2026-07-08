/**
 * AUTHENTICATED LAYOUT
 *
 * Wraps every page inside the app (dashboard, vault, insights, etc.)
 * with the persistent sidebar. Unauthenticated users are redirected
 * to /login by middleware.tsx (see that file).
 *
 * File location:  app/(app)/layout.tsx
 * The (app) route group means this layout does NOT apply to /login.
 */

import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            {/* Page content */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                {/* Top padding on mobile to clear the hamburger button */}
                <div className="lg:hidden h-16" />

                <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
