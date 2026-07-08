"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    CheckCircle2,
    Fingerprint,
    KeyRound,
    Loader2,
    Lock,
    Mail,
    RadioTower,
    Shield,
    Sparkles,
    Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";

const signalNodes = [
    { label: "Identity", value: "Encrypted", color: "text-cyan" },
    { label: "Consent", value: "On-chain", color: "text-emerald" },
    { label: "Vault", value: "Private", color: "text-accent" },
];

const assuranceItems = [
    { icon: Fingerprint, text: "Biometric-ready access" },
    { icon: CheckCircle2, text: "Zero-knowledge vault routing" },
    { icon: Shield, text: "Data sovereignty by default" },
];

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"signin" | "signup">("signin");

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading("credentials");

        setTimeout(() => {
            signIn("credentials", { email, password, callbackUrl: "/origin" });
            setIsLoading(null);
        }, 1500);
    };

    const handleSocialAuth = (provider: string) => {
        setIsLoading(provider);
        signIn(provider, { callbackUrl: "/origin" });
    };

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#050507] text-white">
            <CyberpunkField />

            <section className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
                <div className="grid w-full max-w-[1180px] grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="hidden min-h-[640px] flex-col justify-between lg:flex"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[18px] border border-white/15 bg-white/10 shadow-[0_0_36px_rgba(34,211,238,0.22)]">
                                <Image
                                    src="/pie-brand-logo.png"
                                    alt="PIE Logo"
                                    width={52}
                                    height={52}
                                    className="object-contain"
                                    priority
                                />
                                <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_20%,rgba(255,255,255,0.32)_48%,transparent_72%)] opacity-70" />
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-[0.36em] text-white/45">PIE</p>
                                <p className="text-xs font-medium text-white/45">Personal Intelligence Economy</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan-dim px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan">
                                <RadioTower className="h-4 w-4" />
                                Live vault handshake
                            </div>

                            <div className="space-y-5">
                                <h1 className="max-w-2xl text-[clamp(3.25rem,5.6vw,6.2rem)] font-black leading-[0.88] tracking-normal">
                                    Enter your
                                    <span className="block bg-[linear-gradient(115deg,#67e8f9_0%,#a78bfa_42%,#34d399_78%,#fb7185_100%)] bg-clip-text text-transparent">
                                        living vault.
                                    </span>
                                </h1>
                                <p className="max-w-xl text-lg leading-8 text-label-secondary">
                                    A fluid command layer for your browsing memory, consent trails, and monetizable data signals.
                                </p>
                            </div>

                            <div className="grid max-w-xl grid-cols-3 gap-3">
                                {signalNodes.map((node, index) => (
                                    <motion.div
                                        key={node.label}
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + index * 0.08 }}
                                        className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl"
                                    >
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{node.label}</p>
                                        <p className={`mt-2 text-sm font-bold ${node.color}`}>{node.value}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {assuranceItems.map((item, index) => (
                                <motion.div
                                    key={item.text}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.35 + index * 0.08 }}
                                    className="flex items-center gap-3 text-sm font-semibold text-label-tertiary"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-cyan">
                                        <item.icon className="h-4 w-4" />
                                    </span>
                                    {item.text}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 22, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="mx-auto w-full max-w-[500px]"
                    >
                        <GlassCard className="relative overflow-hidden border-white/15 bg-[#101014]/55 p-5 shadow-[0_36px_110px_rgba(0,0,0,0.55)] backdrop-blur-3xl sm:p-7" shine>
                            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.85),rgba(167,139,250,0.7),transparent)]" />
                            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(34,211,238,0.1),transparent_32%,rgba(52,211,153,0.06)_62%,rgba(251,113,133,0.08))]" />

                            <div className="relative z-10">
                                <div className="mb-7 flex items-start justify-between gap-5">
                                    <div className="lg:hidden">
                                        <div className="mb-5 flex items-center gap-3">
                                            <Image src="/pie-brand-logo.png" alt="PIE Logo" width={42} height={42} priority />
                                            <div>
                                                <p className="text-sm font-bold tracking-[0.28em] text-white/55">PIE</p>
                                                <p className="text-xs text-white/40">Living data vault</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden rounded-full border border-emerald/20 bg-emerald-dim px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald sm:inline-flex">
                                        Synced
                                    </div>
                                </div>

                                <div className="mb-7">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                                        <Waves className="h-3.5 w-3.5 text-cyan" />
                                        Fluid identity layer
                                    </div>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={mode}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.22 }}
                                        >
                                            <h2 className="text-3xl font-black tracking-normal text-white sm:text-4xl">
                                                {mode === "signin" ? "Welcome back" : "Create your vault"}
                                            </h2>
                                            <p className="mt-3 text-sm leading-6 text-label-tertiary">
                                                {mode === "signin"
                                                    ? "Authenticate into your private intelligence workspace."
                                                    : "Start owning your digital trails with a private vault identity."}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div className="mb-6 grid grid-cols-2 gap-3">
                                    <AuthProviderButton
                                        provider="google"
                                        label="Google"
                                        isLoading={isLoading}
                                        onClick={handleSocialAuth}
                                    />
                                    <AuthProviderButton
                                        provider="apple"
                                        label="Apple"
                                        isLoading={isLoading}
                                        onClick={handleSocialAuth}
                                    />
                                </div>

                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#121217] px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                                            Vault credentials
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleEmailAuth} className="space-y-4">
                                    <AuthInput
                                        icon={Mail}
                                        label="Email address"
                                        type="email"
                                        value={email}
                                        onChange={setEmail}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                    />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-label-tertiary">
                                                Password
                                            </label>
                                            {mode === "signin" && (
                                                <button
                                                    type="button"
                                                    className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan transition-colors hover:text-white"
                                                >
                                                    Forgot?
                                                </button>
                                            )}
                                        </div>
                                        <AuthInput
                                            icon={Lock}
                                            type="password"
                                            value={password}
                                            onChange={setPassword}
                                            placeholder="••••••••"
                                            autoComplete={mode === "signin" ? "current-password" : "new-password"}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!!isLoading}
                                        className="group mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-cyan/30 bg-[linear-gradient(115deg,rgba(34,211,238,0.9),rgba(167,139,250,0.86)_48%,rgba(52,211,153,0.86))] px-5 text-sm font-black text-[#030407] shadow-[0_0_42px_rgba(34,211,238,0.26)] transition-all hover:shadow-[0_0_58px_rgba(52,211,153,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isLoading === "credentials" ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <KeyRound className="h-5 w-5" />
                                                {mode === "signin" ? "Access Vault" : "Create Account"}
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-7 text-center">
                                    <p className="text-sm text-label-tertiary">
                                        {mode === "signin" ? "New to PIE?" : "Already have access?"}{" "}
                                        <button
                                            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                                            className="font-bold text-cyan underline-offset-4 transition-colors hover:text-white hover:underline"
                                        >
                                            {mode === "signin" ? "Create a vault" : "Sign in"}
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </GlassCard>

                        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] font-bold uppercase tracking-[0.18em] text-label-tertiary">
                            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
                            <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
                            <Link href="/support" className="transition-colors hover:text-white">Support</Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

function CyberpunkField() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0.82),rgba(5,5,7,0.92)_48%,#020203_100%)]" />
            <motion.div
                animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                transition={{ duration: 28, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                className="absolute inset-0 opacity-55"
                style={{
                    backgroundImage:
                        "linear-gradient(115deg, rgba(34,211,238,0.18), transparent 28%, rgba(167,139,250,0.16) 48%, transparent 66%, rgba(52,211,153,0.14)), linear-gradient(70deg, transparent, rgba(251,113,133,0.09), transparent)",
                    backgroundSize: "160% 160%",
                }}
            />
            <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:72px_72px]" />
            <motion.div
                animate={{ y: ["0%", "-8%", "0%"], opacity: [0.2, 0.36, 0.2] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-[-10%] bottom-[-18%] h-[52%] bg-[linear-gradient(0deg,rgba(34,211,238,0.18),rgba(167,139,250,0.08)_44%,transparent_78%)] blur-3xl"
            />
            <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 1440 900">
                <motion.path
                    d="M-120 620 C 180 470, 320 750, 620 570 S 1040 430, 1560 580"
                    fill="none"
                    stroke="url(#loginPulse)"
                    strokeWidth="2"
                    strokeDasharray="12 26"
                    animate={{ strokeDashoffset: [0, -152] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                />
                <motion.path
                    d="M-80 280 C 260 170, 450 390, 760 250 S 1080 90, 1510 220"
                    fill="none"
                    stroke="url(#loginPulseSoft)"
                    strokeWidth="1.5"
                    strokeDasharray="8 22"
                    animate={{ strokeDashoffset: [0, 132] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
                <defs>
                    <linearGradient id="loginPulse" x1="0" x2="1">
                        <stop stopColor="#22d3ee" stopOpacity="0" />
                        <stop offset="0.45" stopColor="#22d3ee" />
                        <stop offset="0.72" stopColor="#a78bfa" />
                        <stop offset="1" stopColor="#34d399" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="loginPulseSoft" x1="0" x2="1">
                        <stop stopColor="#fb7185" stopOpacity="0" />
                        <stop offset="0.5" stopColor="#a78bfa" />
                        <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.72)_100%)]" />
        </div>
    );
}

function AuthProviderButton({
    provider,
    label,
    isLoading,
    onClick,
}: {
    provider: string;
    label: string;
    isLoading: string | null;
    onClick: (provider: string) => void;
}) {
    return (
        <button
            onClick={() => onClick(provider)}
            disabled={!!isLoading}
            className="group flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-bold text-white/70 transition-all hover:border-cyan/30 hover:bg-white/[0.09] hover:text-white disabled:opacity-50"
        >
            {isLoading === provider ? (
                <Loader2 className="h-5 w-5 animate-spin text-white/50" />
            ) : provider === "google" ? (
                <>
                    <Sparkles className="h-4 w-4 text-cyan transition-colors group-hover:text-emerald" />
                    {label}
                </>
            ) : (
                <>
                    <Fingerprint className="h-4 w-4 text-accent transition-colors group-hover:text-cyan" />
                    {label}
                </>
            )}
        </button>
    );
}

function AuthInput({
    icon: Icon,
    label,
    type,
    value,
    onChange,
    placeholder,
    autoComplete,
}: {
    icon: LucideIcon;
    label?: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    autoComplete: string;
}) {
    return (
        <div className={label ? "space-y-2" : ""}>
            {label && (
                <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-label-tertiary">
                    {label}
                </label>
            )}
            <div className="group relative">
                <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/32 transition-colors group-focus-within:text-cyan" />
                <input
                    type={type}
                    required
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.055] py-3 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/24 focus:border-cyan/45 focus:bg-white/[0.085] focus:shadow-[0_0_0_4px_rgba(34,211,238,0.09)]"
                />
            </div>
        </div>
    );
}
