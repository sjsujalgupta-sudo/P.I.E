/*
 * 🎭 Analogy: This is the "Building Blueprint" — it defines the outer shell
 *    of every logged-in page: the sidebar on the left, the main content area
 *    on the right, and the page transition animation between them.
 * ✅ Safe to change:
 *    1. Change the sidebar collapsed width (currently lg:ml-[70px])
 *    2. Change the sidebar expanded width (currently lg:ml-[240px])
 *    3. Add a global announcement banner above the main content area
 * ❌ Never touch: The flex h-screen overflow-hidden structure — this is what
 *    keeps the sidebar fixed and the content scrollable. Breaking it makes
 *    every page overflow or collapse.
 */
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { CursorGlow } from "@/components/ui/cursor-glow";
import { AIDock } from "@/components/home/AIDock";
import DynamicIslandNav from "@/components/ui/DynamicIslandNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHomePage = pathname === "/origin";

    return (
        <div className="flex h-screen overflow-hidden bg-transparent">
            <CursorGlow />
            <DynamicIslandNav />
            <div className="flex-1 flex flex-col transition-all duration-300 overflow-hidden relative">
                {/*
                 * `main` is `relative overflow-hidden` so child pages can use
                 * `position: absolute; inset: 0` to fill the full area.
                 * The padding wrapper inside handles scrolling for normal pages.
                 */}
                <main className="flex-1 overflow-hidden relative min-h-0">
                    <PageTransition>
                        {/*
                         * Normal pages scroll inside this wrapper.
                         * The History page escapes it via position:absolute on its root div.
                         */}
                        <div
                            className="w-full h-full"
                        >
                            {children}
                        </div>
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
