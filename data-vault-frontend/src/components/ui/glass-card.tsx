/*
 * 🎭 Analogy: This is the "Frosted Glass Panel" — a reusable card component
 *    that gives every dashboard card its signature glass-blur look. Drop it
 *    anywhere and the content inside gets the glass treatment automatically.
 * ✅ Safe to change:
 *    1. Change the border-radius in the glass CSS class (currently 18px)
 *    2. Add a new variant prop (e.g., variant="solid") for non-glass cards
 *    3. Change the default padding (currently p-6)
 * ❌ Never touch: The glass and liquid-glass CSS class names — these are
 *    defined in globals.css and used by 30+ components. Renaming them
 *    removes the glass effect from the entire app.
 */
"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    hover?: boolean;
    small?: boolean;
    variant?: "default" | "liquid";
    metal?: "silver" | "titanium" | "platinum" | "chromium";
    shine?: boolean;
    brushed?: boolean;
    onClick?: () => void;
}

export function GlassCard({ 
    children, 
    className, 
    style, 
    hover = false, 
    small = false, 
    variant = "default", 
    metal,
    shine = false,
    brushed = false,
    onClick 
}: GlassCardProps) {
    const baseClass = variant === "liquid" ? "liquid-glass" : (small ? "glass-sm" : "glass");
    
    const metalClass = metal ? {
        silver: "metal-border-silver",
        titanium: "metal-border-titanium",
        platinum: "metal-border-platinum",
        chromium: "metal-border-chromium"
    }[metal] : "";

    const effectsClasses = cn(
        metalClass,
        shine && "metal-shine",
        brushed && "metal-brushed"
    );

    const easing = [0.32, 0.72, 0, 1] as const;

    if (hover) {
        const hoverClass = variant === "liquid" ? "liquid-glass-hover" : "glass-hover";
        return (
            <motion.div
                className={cn(baseClass, hoverClass, effectsClasses, "p-6 cursor-pointer", className)}
                style={style}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.995 }}
                transition={{ duration: 0.28, ease: easing }}
                onClick={onClick}
                role={onClick ? "button" : undefined}
                tabIndex={onClick ? 0 : undefined}
                onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            className={cn(baseClass, effectsClasses, "p-6", className)}
            style={style}
            onClick={onClick}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: easing }}
        >
            {children}
        </motion.div>
    );
}
