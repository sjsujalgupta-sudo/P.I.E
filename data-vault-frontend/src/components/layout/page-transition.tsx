/*
 * 🎭 Analogy: This is the "Curtain Between Scenes" — when you navigate
 *    from one page to another, this component fades the old page out and
 *    the new page in, like a theater curtain between acts.
 * ✅ Safe to change:
 *    1. Change the animation duration (currently 0.36s) for faster/slower transitions
 *    2. Change the blur amount (currently blur(8px)) for a different feel
 *    3. Replace the fade with a slide by changing y: 10 to x: 20
 * ❌ Never touch: The key={pathname} prop — this is what tells Framer Motion
 *    a new page has loaded. Removing it means the animation never triggers.
 */
"use client";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                className="h-full"
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
                transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] as const }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
