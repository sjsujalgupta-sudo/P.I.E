/**
 * LOGIN PAGE
 *
 * Public page — no sidebar, no auth required.
 * Uses liquid-glass card material from globals.css.
 *
 * File location: app/login/page.tsx
 * (or app/(auth)/login/page.tsx if you prefer a separate auth group)
 */

"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Fingerprint } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

/* ── tiny 3-D tilt hook ── */
function use3DTilt(ref: React.RefObject<HTMLDivElement | null>, intensity = 8) {
    const [t, setT] = useState({ rotateX: 0, rotateY: 0 });
    const move = useCallback((e: MouseEvent) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
        const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
        setT({ rotateX: -dy * intensity, rotateY: dx * intensity });
    }, [ref, intensity]);
    const leave = useCallback(() => setT({ rotateX: 0, rotateY: 0 }), []);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
    }, [ref, move, leave]);
    return t;
}

/* ── ripple effect ── */
function RippleEffect({ x, y }: { x: number; y: number }) {
    return (
        <motion.div
            className="absolute pointer-events-none rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ left: x - 20, top: y - 20, width: 40, height: 40 }}
        />
    );
}

/* ── animated background blobs ── */
function BackgroundBlobs() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <motion.div
                className="absolute top-1/4 -left-48 w-[600px] h-[600px] rounded-full blur-[180px] bg-accent/10"
                animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-1/4 -right-48 w-[600px] h-[600px] rounded-full blur-[180px] bg-cyan/8"
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.3, 0.5] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-3/4 left-1/4 w-[300px] h-[300px] rounded-full blur-[120px] bg-emerald/5"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            />
        </div>
    );
}

export default function LoginPage() {
    const router   = useRouter();
    const { data: session, status } = useSession();

    const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
    const cardRef = useRef<HTMLDivElement>(null);
    const tilt    = use3DTilt(cardRef, 8);

    /* redirect if already authenticated */
    useEffect(() => {
        if (status === "authenticated") router.replace("/dashboard");
    }, [status, router]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const id   = Date.now();
        setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    };

    const handleSignIn = async (
        e: React.MouseEvent<HTMLButtonElement>,
        provider: string,
        credentials?: Record<string, string>,
    ) => {
        addRipple(e);
        setLoadingMethod(provider);
        if (credentials) {
            await signIn("credentials", { ...credentials, callbackUrl: "/dashboard" });
        } else {
            await signIn(provider, { callbackUrl: "/dashboard" });
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
            <BackgroundBlobs />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative z-10 w-full max-w-[420px]"
                style={{ perspective: "1000px" }}
            >
                {/* Outer glow ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-accent/10 via-transparent to-cyan/10 rounded-[42px] blur-xl" />

                {/* Liquid glass card */}
                <motion.div
                    ref={cardRef}
                    className="liquid-glass p-8 md:p-10 relative overflow-hidden"
                    style={{
                        transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                        transition: "transform 0.1s ease-out",
                    }}
                >
                    {/* Time */}
                    <div className="flex justify-center mb-6">
                        <span className="text-footnote tracking-wider">
                            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                    </div>

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br from-accent/30 to-cyan/30 flex items-center justify-center border border-accent/20 mb-5 shadow-sm">
                            <Shield className="w-10 h-10 text-accent" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-[32px] font-bold text-label tracking-tight text-center">DataVault</h1>
                        <p className="text-[15px] font-medium text-label-secondary mt-2 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5" />
                            Your Private Data Cloud
                        </p>
                    </div>

                    {/* Auth buttons */}
                    <div className="space-y-3 relative z-10">
                        {/* Google */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={(e) => handleSignIn(e, "google")}
                            disabled={!!loadingMethod}
                            className="w-full relative overflow-hidden flex items-center justify-center gap-3 px-4 py-3.5 rounded-[14px] bg-white text-gray-900 font-semibold text-[13px] border border-gray-200 shadow-sm disabled:opacity-60 transition-opacity"
                        >
                            <AnimatePresence>{ripples.map(r => <RippleEffect key={r.id} x={r.x} y={r.y} />)}</AnimatePresence>
                            {loadingMethod === "google" ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            )}
                            Continue with Google
                        </motion.button>

                        {/* Apple */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={(e) => handleSignIn(e, "apple")}
                            disabled={!!loadingMethod}
                            className="w-full relative overflow-hidden flex items-center justify-center gap-3 px-4 py-3.5 rounded-[14px] bg-black text-white font-semibold text-[13px] border border-white/10 shadow-md disabled:opacity-60 transition-opacity"
                        >
                            <AnimatePresence>{ripples.map(r => <RippleEffect key={r.id} x={r.x} y={r.y} />)}</AnimatePresence>
                            {loadingMethod === "apple" ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                            )}
                            Continue with Apple
                        </motion.button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex-1 h-px bg-separator" />
                            <span className="text-footnote uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-separator" />
                        </div>

                        {/* Demo login */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={(e) =>
                                handleSignIn(e, "credentials", {
                                    email: "demo@datavault.test",
                                    password: "demo",
                                })
                            }
                            disabled={!!loadingMethod}
                            className="w-full relative overflow-hidden flex items-center justify-center gap-3 px-4 py-3.5 rounded-[14px] bg-accent-dim text-accent font-semibold text-[13px] border border-accent/20 hover:bg-accent/20 transition-colors disabled:opacity-60"
                        >
                            {loadingMethod === "credentials" ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                                    Securing session…
                                </>
                            ) : (
                                <>
                                    <Fingerprint className="w-5 h-5" />
                                    Try Demo (No Data)
                                </>
                            )}
                        </motion.button>
                    </div>

                    {/* Privacy footer */}
                    <div className="mt-10 pt-6 border-t border-separator">
                        <div className="flex items-start gap-3 px-4 py-3 rounded-[12px] bg-white/[0.03]">
                            <Lock className="w-4 h-4 text-emerald mt-0.5 flex-shrink-0" />
                            <p className="text-footnote leading-relaxed text-label-secondary">
                                <span className="text-label font-semibold">End-to-end encrypted.</span>
                                <br />
                                Your data stays yours. We never see or sell your information.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-footnote text-[var(--color-label-tertiary)] opacity-50">
                    © 2026 DataVault — Precision &amp; Privacy
                </p>
            </div>
        </div>
    );
}
