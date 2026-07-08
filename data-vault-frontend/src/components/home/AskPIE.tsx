"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Play, ArrowRight } from "lucide-react";
import { useState } from "react";

interface AskPIEProps {
    onModeChange: (mode: "neural" | "focus" | "privacy" | "value") => void;
}

export function AskPIE({ onModeChange }: AskPIEProps) {
    const [focused, setFocused] = useState(false);
    const [query, setQuery] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            const q = query.toLowerCase();
            if (q.includes("focus") || q.includes("productivity") || q.includes("work")) {
                onModeChange("focus");
            } else if (q.includes("privacy") || q.includes("exposure") || q.includes("secure")) {
                onModeChange("privacy");
            } else if (q.includes("value") || q.includes("money") || q.includes("earn")) {
                onModeChange("value");
            } else {
                onModeChange("neural");
            }
            setQuery("");
            setFocused(false);
            // Optionally blur the input
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-xl mx-auto"
        >
            <div className={`
                relative flex items-center transition-all duration-500 rounded-[18px] px-4 py-2.5
                ${focused 
                    ? "bg-white/[0.08] border-white/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] w-[500px]" 
                    : "bg-white/[0.03] border-white/10 w-[420px]"
                }
                border backdrop-blur-3xl
            `}>
                <Sparkles className={`w-4 h-4 mr-3 transition-colors ${focused ? "text-blue-400" : "text-label-tertiary"}`} />
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask PIE anything... (Try 'privacy' or 'focus')"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-white placeholder:text-label-tertiary font-medium"
                />
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-label-tertiary bg-white/5 px-2 py-1 rounded-md border border-white/5">⌘ K</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-500 transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                </div>
            </div>
            
            {/* Suggested Explorations Dropdown */}
            <AnimatePresence>
                {focused && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                        transition={{ duration: 0.4 }}
                        className="absolute top-full left-0 right-0 mt-4 p-4 rounded-[24px] bg-[#0a0a0f]/90 border border-white/10 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                        
                        <div className="relative space-y-6">
                            {/* Suggested Explorations */}
                            <div>
                                <h3 className="text-[10px] font-bold text-label-tertiary uppercase tracking-[0.2em] mb-3 px-2">Suggested Exploration</h3>
                                <div className="space-y-1">
                                    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                        <span className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors">Why was I productive yesterday?</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors" />
                                    </button>
                                    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                        <span className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors">Which habits correlate with focus?</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors" />
                                    </button>
                                    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                        <span className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors">What generated the most value this week?</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors" />
                                    </button>
                                </div>
                            </div>

                            {/* Replay Mode */}
                            <div>
                                <h3 className="text-[10px] font-bold text-purple-400/70 uppercase tracking-[0.2em] mb-3 px-2">Active Tasks</h3>
                                <div className="space-y-1">
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors group text-left">
                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <Play className="w-2.5 h-2.5 text-purple-400 ml-0.5" />
                                        </div>
                                        <span className="text-[13px] font-medium text-purple-200">Replay highest-focus session</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
