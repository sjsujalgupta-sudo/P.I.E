/*
 * 🎭 Analogy: This file is the "Settings Safe" — it's the API
 *   route that reads and writes the app's settings.json file
 *   on the server, like a lockbox for configuration data.
 * ✅ Safe to change:
 *    1. The default settings values returned when the file doesn't exist
 *    2. The error message text in the catch blocks
 *    3. Add new settings fields to the JSON structure
 * ❌ Never touch: The GET and POST export names — Next.js requires
 *   these exact names for API route handlers. Renaming breaks the API.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
    fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

// Default settings
const defaultSettings = {
    theme: "dark",
    accentColor: "violet",
    fontSize: "medium",
    animationsEnabled: true,
    autoCapture: true,
    includeSummaries: true,
    includeSearchQueries: true,
    sensitivityFilter: "all",
    weeklyDigest: true,
    contractAlerts: true,
};

const BACKEND_URL = "http://localhost:4000/api/settings";

export async function GET() {
    try {
        // Try to fetch from backend first
        const response = await fetch(BACKEND_URL);
        const data = await response.json();
        
        if (data.success) {
            // Update local backup
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data.settings, null, 2), "utf-8");
            return NextResponse.json(data);
        }
        
        // Fallback to local file
        if (fs.existsSync(SETTINGS_FILE)) {
            const localData = fs.readFileSync(SETTINGS_FILE, "utf-8");
            const settings = JSON.parse(localData);
            return NextResponse.json({ success: true, settings });
        }
        
        return NextResponse.json({ success: true, settings: defaultSettings });
    } catch (error) {
        console.error("Settings GET error:", error);
        // Fallback to local file on network error
        if (fs.existsSync(SETTINGS_FILE)) {
            const localData = fs.readFileSync(SETTINGS_FILE, "utf-8");
            return NextResponse.json({ success: true, settings: JSON.parse(localData) });
        }
        return NextResponse.json({ success: true, settings: defaultSettings });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        if (!body.settings) {
            return NextResponse.json(
                { success: false, error: "Settings object required" },
                { status: 400 }
            );
        }

        const settings = { ...defaultSettings, ...body.settings };
        
        // Save to backend
        try {
            const response = await fetch(BACKEND_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
        } catch (e) {
            console.error("Failed to save settings to backend:", e);
            // We'll still save locally and return success so the UI doesn't break
        }
        
        // Save to local file as backup
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
        
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
