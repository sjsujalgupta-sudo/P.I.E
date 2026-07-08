/*
 * 🎭 Analogy: This is the "Atlas Entrance" — the /atlas URL route. It's
 *    intentionally minimal: just a fullscreen container that holds the
 *    entire ExplorationCanvas system inside it.
 * ✅ Safe to change:
 *    1. Add a loading skeleton before ExplorationCanvas mounts
 *    2. Add an error boundary wrapper around ExplorationCanvas
 *    3. Add a "Welcome to Atlas" first-visit overlay
 * ❌ Never touch: The absolute inset-0 div — this is what makes Atlas
 *    fullscreen by escaping the layout's padding. Removing it adds
 *    unwanted padding around the entire canvas.
 */
"use client";

import { useEffect, useState, Suspense } from "react";
import { ExplorationCanvas } from "@/components/dashboard/exploration-canvas/ExplorationCanvas";
import { ApiError, fetchVaultData } from "@/lib/api";
import { applyVaultRowsToAtlas } from "@/lib/captured-data-adapters";

/**
 * /atlas — Behavioral Exploration System
 *
 * Fullscreen immersive route. Escapes the layout padding wrapper
 * using position:absolute + inset-0 (same technique as History page).
 */
function AtlasPageInner() {
    const [dataVersion, setDataVersion] = useState(0);
    const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
    const [message, setMessage] = useState("Loading captured browsing data...");

    useEffect(() => {
        let mounted = true;
        async function loadCapturedData() {
            try {
                const rows = await fetchVaultData();
                if (!mounted) return;
                applyVaultRowsToAtlas(rows);
                setDataVersion((version) => version + 1);
                setStatus(rows.length ? "ready" : "empty");
                setMessage(rows.length ? "" : "No captured browsing data yet.");
            } catch (error) {
                if (!mounted) return;
                applyVaultRowsToAtlas([]);
                setDataVersion((version) => version + 1);
                setStatus("error");
                setMessage(
                    error instanceof ApiError && error.offline
                        ? "Backend server is offline."
                        : "Could not load captured browsing data."
                );
            }
        }

        loadCapturedData();
        return () => { mounted = false; };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden">
            {status === "loading" ? (
                <div className="h-full w-full flex items-center justify-center bg-background">
                    <div className="text-body">{message}</div>
                </div>
            ) : (
                <>
                    <ExplorationCanvas key={dataVersion} />
                    {(status === "empty" || status === "error") && (
                        <div className="absolute left-1/2 top-20 z-[80] -translate-x-1/2 rounded-[14px] border border-white/10 bg-background/80 px-4 py-2 text-[12px] text-label-secondary backdrop-blur-xl">
                            {message}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function AtlasPage() {
    return (
        <Suspense fallback={null}>
            <AtlasPageInner />
        </Suspense>
    );
}
