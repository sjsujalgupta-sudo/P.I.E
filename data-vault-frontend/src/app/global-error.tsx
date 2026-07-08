/*
 * 🎭 Analogy: This is the "Emergency Exit Sign" — if the entire app crashes
 *    at the root level, this component catches the error and shows a friendly
 *    message instead of a blank white screen.
 * ✅ Safe to change:
 *    1. Edit the error message text shown to users
 *    2. Add a "Report Bug" button that sends the error to a logging service
 *    3. Change the styling of the error card
 * ❌ Never touch: The "use client" directive and the error/reset props —
 *    Next.js requires these exact prop names for global error boundaries.
 */
"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
                <GlassCard className="max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[rgba(239,68,68,0.15)] flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8" style={{ color: "#ef4444" }} />
                    </div>
                    <h2 className="text-xl font-bold" style={{ color: "white" }}>Critical Error</h2>
                    <p className="text-sm" style={{ color: "#9ca3af" }}>
                        The application encountered a critical error. Please refresh the page.
                    </p>
                    <button onClick={reset} className="btn-primary flex items-center gap-2 mx-auto">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </GlassCard>
            </body>
        </html>
    );
}
