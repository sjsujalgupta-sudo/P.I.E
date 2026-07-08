"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassSelectOption {
    value: string;
    label: string;
}

interface GlassSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: GlassSelectOption[];
    placeholder?: string;
    label?: string;
    className?: string;
}

export function GlassSelect({ value, onChange, options, placeholder = "Select...", label, className }: GlassSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (!open) return;
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    return (
        <div ref={ref} className={cn("relative", className)}>
            {label && <span className="text-footnote mb-1.5 block text-label-secondary">{label}</span>}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "w-full flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl text-[13px] text-label transition-all duration-300",
                    "glass-sm border-white/10 hover:border-accent/40 hover:bg-white/[0.04]",
                    open && "ring-2 ring-accent/15 border-accent/40 bg-white/[0.06]"
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={cn(!selected && "text-label-tertiary")}>{selected?.label || placeholder}</span>
                <ChevronDown className={cn("w-4 h-4 text-label-tertiary transition-transform duration-200", open && "rotate-180")} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] as const }}
                        className="absolute z-50 mt-2 w-full min-w-[200px] glass-dropdown p-2 max-h-72 overflow-y-auto"
                        role="listbox"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                role="option"
                                aria-selected={value === option.value}
                                onClick={() => { onChange(option.value); setOpen(false); }}
                                className={cn(
                                    "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-200",
                                    value === option.value
                                        ? "text-accent bg-accent-dim font-medium shadow-sm"
                                        : "text-label-secondary hover:text-label hover:bg-surface-hover"
                                )}
                            >
                                <span>{option.label}</span>
                                {value === option.value && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                    >
                                        <Check className="w-4 h-4 text-accent" />
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
