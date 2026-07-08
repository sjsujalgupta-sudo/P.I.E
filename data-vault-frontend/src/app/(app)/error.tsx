/*
 * 🎭 Analogy: This file is the "Emergency Exit Sign" — it's the
 *   page shown when something crashes inside the (app) section,
 *   giving users a friendly error message and a retry button.
 * ✅ Safe to change:
 *    1. The error message text shown to users
 *    2. The "Try Again" button label and styling
 *    3. The icon used in the error display
 * ❌ Never touch: The `"use client"` directive and the `error`/`reset`
 *   props — Next.js requires this exact signature for error boundaries.
 */

"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <GlassCard className="max-w-md w-full text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-danger/15 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-danger" />
                </div>
                <h2 className="text-xl font-bold text-white">Something went wrong</h2>
                <p className="text-sm text-muted-light leading-relaxed">
                    An unexpected error occurred. Please try again or contact support if the issue persists.
                </p>
                {error.message && (
                    <p className="text-xs text-muted bg-white/5 px-3 py-2 rounded-lg font-mono">
                        {error.message}
                    </p>
                )}
                <button onClick={reset} className="btn-primary flex items-center gap-2 mx-auto">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </GlassCard>
        </div>
    );
}
