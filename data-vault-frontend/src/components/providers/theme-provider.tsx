"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark";
type AccentColor = "violet" | "blue" | "green" | "orange";
type FontSize = "small" | "medium" | "large";

interface StoredSettings {
    theme?: Theme;
    accentColor?: AccentColor;
    fontSize?: FontSize;
    animationsEnabled?: boolean;
}

interface ThemeContextType {
    theme: Theme;
    accentColor: AccentColor;
    fontSize: FontSize;
    animationsEnabled: boolean;
    updateTheme: (theme: Theme) => void;
    updateAccentColor: (color: AccentColor) => void;
    updateFontSize: (size: FontSize) => void;
    updateAnimations: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const accentColorMap = {
    violet: { primary: "rgb(167 139 250)", primaryRgb: "167 139 250", solid: "rgb(124 58 237)", solidRgb: "124 58 237", dim: "rgba(167, 139, 250, 0.15)" },
    blue: { primary: "rgb(59 130 246)", primaryRgb: "59 130 246", solid: "rgb(37 99 235)", solidRgb: "37 99 235", dim: "rgba(59, 130, 246, 0.15)" },
    green: { primary: "rgb(16 185 129)", primaryRgb: "16 185 129", solid: "rgb(5 150 105)", solidRgb: "5 150 105", dim: "rgba(16, 185, 129, 0.15)" },
    orange: { primary: "rgb(245 158 11)", primaryRgb: "245 158 11", solid: "rgb(217 119 6)", solidRgb: "217 119 6", dim: "rgba(245, 158, 11, 0.15)" },
};

const fontSizeMap = {
    small: "14px",
    medium: "16px",
    large: "18px",
};

const themeTokens: Record<"dark", Record<string, string>> = {
    dark: {
        "--color-background": "rgb(10 10 11)",
        "--color-foreground": "rgb(255 255 255)",
        "--rgb-background": "10 10 11",
        "--rgb-elevated": "28 28 30",
        "--rgb-accent": "167 139 250",
        "--rgb-accent-solid": "124 58 237",
        "--color-glass-bg": "rgba(255 255 255 / 0.075)",
        "--color-glass-bg-hover": "rgba(255 255 255 / 0.11)",
        "--color-glass-border": "rgba(255 255 255 / 0.13)",
        "--color-glass-border-hover": "rgba(255 255 255 / 0.2)",
        "--color-elevated": "rgb(28 28 30)",
        "--color-elevated-hover": "rgb(44 44 46)",
        "--color-grouped-bg": "rgb(18 18 20)",
        "--color-label": "rgb(255 255 255)",
        "--color-label-secondary": "rgb(174 174 178)",
        "--color-label-tertiary": "rgb(142 142 147)",
        "--color-label-quaternary": "rgb(108 108 112)",
        "--color-cyan": "rgb(34 211 238)",
        "--color-cyan-dim": "rgba(34 211 238 / 0.15)",
        "--color-emerald": "rgb(52 211 153)",
        "--color-emerald-dim": "rgba(52 211 153 / 0.15)",
        "--color-success": "rgb(48 209 88)",
        "--color-warning": "rgb(255 159 10)",
        "--color-danger": "rgb(255 69 58)",
        "--color-info": "rgb(10 132 255)",
        "--color-separator": "rgba(255 255 255 / 0.08)",
        "--color-separator-strong": "rgba(255 255 255 / 0.12)",
    },
};

function readStoredSettings(): StoredSettings {
    if (typeof window === "undefined") return {};

    try {
        const saved = localStorage.getItem("pie_settings");
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("Failed to load theme settings:", e);
        return {};
    }
}

function applyTheme() {
    const root = document.documentElement;
    const tokens = themeTokens.dark;

    Object.entries(tokens).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });

    root.classList.remove("light");
    root.classList.add("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [accentColor, setAccentColor] = useState<AccentColor>("violet");
    const [fontSize, setFontSize] = useState<FontSize>("medium");
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [mounted, setMounted] = useState(false);

    const loadSettings = () => {
        const settings = readStoredSettings();
        // Force dark theme regardless of stored settings
        setTheme("dark");
        if (settings.accentColor) setAccentColor(settings.accentColor);
        if (settings.fontSize) setFontSize(settings.fontSize);
        if (typeof settings.animationsEnabled === "boolean") setAnimationsEnabled(settings.animationsEnabled);
    };

    useEffect(() => {
        loadSettings();
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        applyTheme();
    }, [mounted]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "pie_settings") {
                loadSettings();
            }
        };

        const handleSettingsChange = () => {
            loadSettings();
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("pie_settings_changed", handleSettingsChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("pie_settings_changed", handleSettingsChange);
        };
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const colors = accentColorMap[accentColor];
        
        root.style.setProperty("--color-accent", `${colors.primary}`);
        root.style.setProperty("--color-accent-solid", `${colors.solid}`);
        root.style.setProperty("--rgb-accent", colors.primaryRgb);
        root.style.setProperty("--rgb-accent-solid", colors.solidRgb);
        root.style.setProperty("--color-accent-dim", `${colors.dim}`);
    }, [accentColor]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--font-size-base", fontSizeMap[fontSize]);
        document.body.style.fontSize = fontSizeMap[fontSize];
    }, [fontSize]);

    useEffect(() => {
        const root = document.documentElement;
        if (!animationsEnabled) {
            root.style.setProperty("--animations-disabled", "true");
            root.querySelectorAll("*").forEach(el => {
                (el as HTMLElement).style.animationDuration = "0s";
                (el as HTMLElement).style.transitionDuration = "0s";
            });
        } else {
            root.style.setProperty("--animations-disabled", "false");
        }
    }, [animationsEnabled]);

    const updateTheme = (newTheme: Theme) => {
        // Theme is now locked to dark
        setTheme("dark");
    };

    const updateAccentColor = (color: AccentColor) => {
        setAccentColor(color);
    };

    const updateFontSize = (size: FontSize) => {
        setFontSize(size);
    };

    const updateAnimations = (enabled: boolean) => {
        setAnimationsEnabled(enabled);
    };

    return (
        <ThemeContext.Provider
            value={{
                theme: "dark",
                accentColor,
                fontSize,
                animationsEnabled,
                updateTheme,
                updateAccentColor,
                updateFontSize,
                updateAnimations,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
