/*
 * 🎭 Analogy: This is the "Control Panel Room" — the /settings page where
 *    users configure their PIE preferences, API connections, and
 *    privacy settings.
 * ✅ Safe to change:
 *    1. Add a new settings section by copying an existing section block
 *    2. Change the default toggle states
 *    3. Edit the section labels and descriptions
 * ❌ Never touch: The settings API calls (fetch to /api/settings) —
 *    these save and load user preferences. Breaking them means settings
 *    won't persist between sessions.
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSelect } from "@/components/ui/glass-select";
import { Shield, Database, Bell, Info, Trash2, AlertTriangle, ChevronRight, Palette, Monitor, Type, Sparkles, Moon, Sun, Laptop } from "lucide-react";
import { toast } from "sonner";
import { clearVault } from "@/lib/api";
import { cn } from "@/lib/utils";

type SettingsState = {
    autoCapture: boolean;
    includeSummaries: boolean;
    includeSearchQueries: boolean;
    sensitivityFilter: "all" | "low" | "medium" | "high";
    weeklyDigest: boolean;
    contractAlerts: boolean;
    theme: "dark";
    accentColor: "violet" | "blue" | "green" | "orange";
    fontSize: "small" | "medium" | "large";
    animationsEnabled: boolean;
};

const SETTINGS_KEY = "pie_settings";

const defaultSettings: SettingsState = {
    autoCapture: true,
    includeSummaries: true,
    includeSearchQueries: true,
    sensitivityFilter: "all",
    weeklyDigest: true,
    contractAlerts: true,
    theme: "dark",
    accentColor: "violet",
    fontSize: "medium",
    animationsEnabled: true,
};

const sensitivityOptions = [
    { value: "all", label: "Capture All" },
    { value: "low", label: "Low Only" },
    { value: "medium", label: "Medium Only" },
    { value: "high", label: "High Only" },
];

const sections = [
    { id: "appearance", label: "Appearance", icon: Palette, color: "violet" as const },
    { id: "privacy", label: "Privacy", icon: Shield, color: "cyan" as const },
    { id: "data", label: "Data Management", icon: Database, color: "emerald" as const },
    { id: "notifications", label: "Notifications", icon: Bell, color: "amber" as const },
    { id: "about", label: "About", icon: Info, color: "slate" as const },
];

const sectionColors = {
    violet: { icon: "icon-container-violet", text: "text-accent" },
    cyan: { icon: "icon-container-cyan", text: "text-cyan" },
    emerald: { icon: "icon-container-emerald", text: "text-emerald" },
    amber: { icon: "bg-amber-400/15 text-amber-400 border border-amber-400/20", text: "text-amber-400" },
    slate: { icon: "bg-white/[0.06] text-label-secondary border border-white/[0.08]", text: "text-label-secondary" },
};

function Toggle({
    enabled,
    onChange,
    label,
}: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
}) {
    return (
        <div className="flex items-center justify-between py-3">
            <span className="text-body">{label}</span>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${enabled ? "bg-accent" : "bg-white/[0.1]"}`}
                role="switch"
                aria-checked={enabled}
                aria-label={label}
            >
                <motion.div
                    className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm"
                    animate={{ x: enabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
            </button>
        </div>
    );
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsState>(defaultSettings);
    const [loaded, setLoaded] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [activeSection, setActiveSection] = useState("appearance");
    const [applying, setApplying] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalSettings, setOriginalSettings] = useState<SettingsState>(defaultSettings);

    // Load settings from API on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch("/api/settings");
                const data = await response.json();
                if (data.success) {
                    const merged = { ...defaultSettings, ...data.settings };
                    setSettings(merged);
                    setOriginalSettings(merged);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
                // Fallback to localStorage
                try {
                    const saved = localStorage.getItem(SETTINGS_KEY);
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        const merged = { ...defaultSettings, ...parsed };
                        setSettings(merged);
                        setOriginalSettings(merged);
                    }
                } catch {
                    setSettings(defaultSettings);
                    setOriginalSettings(defaultSettings);
                }
            } finally {
                setLoaded(true);
            }
        };
        loadSettings();
    }, []);

    // Track changes
    useEffect(() => {
        if (loaded) {
            const isChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
            setHasChanges(isChanged);
        }
    }, [settings, originalSettings, loaded]);

    // Apply changes to backend and localStorage
    const handleApplyChanges = async () => {
        setApplying(true);
        try {
            // Save to backend
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings }),
            });
            const data = await response.json();
            
            if (data.success) {
                // Also save to localStorage for immediate client-side access
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
                
                setOriginalSettings(settings);
                setHasChanges(false);
                
                // Dispatch event to notify theme provider
                window.dispatchEvent(new Event("pie_settings_changed"));
                
                toast.success("Settings applied successfully!");
                setHasChanges(false);
                
                // Reload page to apply all changes
                setTimeout(() => window.location.reload(), 500);
            } else {
                toast.error("Failed to apply settings");
            }
        } catch (error) {
            console.error("Failed to apply settings:", error);
            toast.error("Failed to apply settings");
        } finally {
            setApplying(false);
        }
    };

    const handleClearData = async () => {
        setShowClearModal(false);
        try {
            await clearVault();
            toast.success("All vault data cleared.");
        } catch {
            toast.error("Failed to clear vault data. Is the server running?");
        }
    };

    if (!loaded) {
        return (
            <div className="space-y-5 max-w-2xl relative z-10">
                <div className="skeleton h-8 w-40" />
                <div className="skeleton h-40 rounded-[18px]" />
                <div className="skeleton h-40 rounded-[18px]" />
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto px-4 py-6 md:px-8 lg:px-10 relative z-10">
            {/* Settings Header */}
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] font-bold tracking-tight text-label">Settings</h1>
                    <p className="text-[14px] text-label-tertiary mt-1 max-w-md">Customize your PIE experience. Changes are applied when you click the button below.</p>
                </div>
                <div className="flex items-center gap-4">
                    {hasChanges && (
                        <div className="flex items-center gap-2 text-label-secondary animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                             <span className="text-[13px] font-medium">Unsaved Changes</span>
                        </div>
                    )}
                    <motion.button
                        onClick={handleApplyChanges}
                        disabled={!hasChanges || applying}
                        className={cn(
                            "px-6 py-2.5 rounded-[14px] font-bold text-[14px] transition-all duration-300 flex items-center gap-2 shadow-sm border",
                            hasChanges && !applying
                                ? "bg-accent/15 border-accent/30 text-accent hover:bg-accent/20 hover:scale-105 active:scale-95"
                                : "bg-white/[0.04] border-white/[0.05] text-label-tertiary cursor-not-allowed"
                        )}
                    >
                        {applying ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        Apply Changes
                    </motion.button>
                </div>
            </div>

            {/* Main Settings Container */}
            <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
                {/* Left Sidebar */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="space-y-1.5">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3.5 px-3 py-3 rounded-[16px] text-[14px] font-semibold transition-all duration-300 group",
                                        isActive
                                            ? "bg-white/45 dark:bg-white/10 shadow-sm text-label"
                                            : "text-label-tertiary hover:text-label hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                        isActive
                                            ? "bg-white/80 dark:bg-white/15 border-white shadow-sm"
                                            : "bg-black/[0.04] dark:bg-white/[0.06] group-hover:scale-105"
                                    )}>
                                        <Icon className={cn(
                                            "w-[17px] h-[17px] transition-colors duration-300",
                                            isActive ? "text-accent" : "text-label-tertiary"
                                        )} strokeWidth={isActive ? 2 : 1.5} />
                                    </div>
                                    <span className="flex-1 text-left">{section.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 bg-white/20 dark:bg-black/10 backdrop-blur-2xl rounded-[32px] border border-white/30 dark:border-white/5 shadow-2xl overflow-hidden p-8">
                    <AnimatePresence mode="wait">
                        {activeSection === "appearance" && (
                            <motion.div
                                key="appearance"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-10"
                            >
                                <div>
                                    <h2 className="text-[20px] font-bold text-label">Appearance</h2>
                                    <p className="text-[13px] text-label-tertiary mt-1">Customize your visual experience</p>
                                </div>


                                {/* Accent Color */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[15px] font-bold text-label">Accent Color</p>
                                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/10">
                                            <Sparkles className="w-5 h-5 text-violet-500" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <p className="text-[13px] text-label-tertiary">Personalize your interface color</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                        {[
                                            { value: "violet", label: "Violet", color: "bg-violet-500" },
                                            { value: "blue", label: "Blue", color: "bg-blue-500" },
                                            { value: "green", label: "Green", color: "bg-emerald-500" },
                                            { value: "orange", label: "Orange", color: "bg-orange-500" },
                                        ].map((accent) => {
                                            const isSelected = settings.accentColor === accent.value;
                                            return (
                                                <motion.button
                                                    key={accent.value}
                                                    onClick={() => setSettings((c) => ({ ...c, accentColor: accent.value as SettingsState["accentColor"] }))}
                                                    className={cn(
                                                        "flex flex-col items-center gap-4 p-6 rounded-[24px] border transition-all duration-500",
                                                        isSelected
                                                            ? "bg-white/40 dark:bg-white/10 border-accent shadow-xl settings-selection-glow"
                                                            : "bg-white/10 dark:bg-white/5 border-white/10 hover:bg-white/20 dark:hover:bg-white/10"
                                                    )}
                                                    whileHover={{ y: -4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className={cn("w-12 h-12 rounded-full shadow-lg ring-4 ring-white/10", accent.color)} />
                                                    <p className="text-[13px] font-bold text-label">{accent.label}</p>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "privacy" && (
                            <motion.div
                                key="privacy"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-[20px] font-bold text-label">Privacy</h2>
                                    <p className="text-[13px] text-label-tertiary mt-1">Control your data capture preferences</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { id: "autoCapture", label: "Auto-capture", desc: "Automatically capture data when session starts", icon: Shield },
                                        { id: "includeSummaries", label: "Page Summaries", desc: "Include AI-generated summaries of visited pages", icon: Database },
                                        { id: "includeSearchQueries", label: "Search Queries", desc: "Capture search queries from browsing sessions", icon: Shield },
                                    ].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-5 bg-white/10 dark:bg-white/5 rounded-[20px] border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-white/20 dark:bg-white/10 flex items-center justify-center shadow-sm">
                                                    <item.icon className="w-5 h-5 text-label-secondary" strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-label">{item.label}</p>
                                                    <p className="text-[11px] text-label-tertiary mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSettings((c) => ({ ...c, [item.id]: !c[item.id as keyof SettingsState] }))}
                                                className={cn(
                                                    "relative w-12 h-7 rounded-full transition-all duration-300",
                                                    settings[item.id as keyof SettingsState] ? "bg-accent shadow-[0_0_12px_rgba(139,92,246,0.3)]" : "bg-white/10"
                                                )}
                                            >
                                                <motion.div
                                                    className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md"
                                                    animate={{ x: settings[item.id as keyof SettingsState] ? 20 : 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "data" && (
                            <motion.div
                                key="data"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-[20px] font-bold text-label">Data Management</h2>
                                    <p className="text-[13px] text-label-tertiary mt-1">Manage your captured data</p>
                                </div>

                                <div className="p-8 bg-red-500/5 rounded-[24px] border border-red-500/20 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                            <Trash2 className="w-6 h-6 text-red-500" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-label">Clear All Data</p>
                                            <p className="text-[12px] text-label-tertiary mt-1">This action is permanent and will delete all browsing captures.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowClearModal(true)}
                                        className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-[14px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        Clear Vault Data
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "notifications" && (
                            <motion.div
                                key="notifications"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-[20px] font-bold text-label">Notifications</h2>
                                    <p className="text-[13px] text-label-tertiary mt-1">Manage your alerts and digests</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { id: "weeklyDigest", label: "Weekly Digest", desc: "Receive a summary of your activities every week", icon: Bell },
                                        { id: "contractAlerts", label: "Contract Alerts", desc: "Notifications when new contracts are detected", icon: Shield },
                                    ].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-5 bg-white/10 dark:bg-white/5 rounded-[20px] border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-white/20 dark:bg-white/10 flex items-center justify-center shadow-sm">
                                                    <item.icon className="w-5 h-5 text-label-secondary" strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-label">{item.label}</p>
                                                    <p className="text-[11px] text-label-tertiary mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSettings((c) => ({ ...c, [item.id]: !c[item.id as keyof SettingsState] }))}
                                                className={cn(
                                                    "relative w-12 h-7 rounded-full transition-all duration-300",
                                                    settings[item.id as keyof SettingsState] ? "bg-accent shadow-[0_0_12px_rgba(139,92,246,0.3)]" : "bg-white/10"
                                                )}
                                            >
                                                <motion.div
                                                    className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md"
                                                    animate={{ x: settings[item.id as keyof SettingsState] ? 20 : 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Clear Modal */}
            <AnimatePresence>
                {showClearModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
                            onClick={() => setShowClearModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-[32px] border border-white/20 shadow-2xl max-w-sm w-full space-y-6">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-[24px] bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                        <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-[20px] font-bold text-label">Clear All Data</h3>
                                        <p className="text-[14px] text-label-tertiary mt-2">This will permanently delete all captured browsing data. This action cannot be undone.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleClearData} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-[14px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Delete Everything</button>
                                    <button onClick={() => setShowClearModal(false)} className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-label font-bold text-[14px] hover:bg-white/[0.1] transition-colors">Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
