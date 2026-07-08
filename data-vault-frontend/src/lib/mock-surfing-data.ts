/*
 * 🎭 Analogy: This file is the "Fake Surfing Log" — it generates
 *   500 random website visits with timestamps, durations, and
 *   device types so the Surfing Analytics page has data to show.
 * ✅ Safe to change:
 *    1. The DOMAINS array — add/remove websites and their categories
 *    2. The count parameter default (500) — generate more or fewer rows
 *    3. The peak hour logic — adjust when "active" hours occur
 * ❌ Never touch: The SurfingSession type and generateMockSurfingData
 *   function name — the surfing dashboard imports these exact names.
 */

export type SurfingSession = {
    timestamp: Date;
    user_id: string;
    url: string;
    domain: string;
    category: string;
    duration_seconds: number;
    device_type: "Desktop" | "Mobile" | "Tablet";
    referrer_url: string;
    data_transferred_mb: number;
};

const DOMAINS = [
    { name: "youtube.com", cat: "Entertainment" },
    { name: "github.com", cat: "Work" },
    { name: "stackoverflow.com", cat: "Work" },
    { name: "reddit.com", cat: "Social Media" },
    { name: "twitter.com", cat: "Social Media" },
    { name: "amazon.com", cat: "E-commerce" },
    { name: "nytimes.com", cat: "News" },
    { name: "netflix.com", cat: "Entertainment" },
    { name: "gmail.com", cat: "Communication" },
    { name: "notion.so", cat: "Work" },
    { name: "slack.com", cat: "Communication" },
    { name: "medium.com", cat: "Education" },
];

const REFERRERS = [
    "google.com",
    "bing.com",
    "facebook.com",
    "Direct",
    "Twitter",
    "Newsletter",
];

export function generateMockSurfingData(count: number = 500): SurfingSession[] {
    const data: SurfingSession[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const domainObj = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
        const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        // Randomize hour to create patterns (more active 9-11am and 8-11pm)
        let hour = Math.floor(Math.random() * 24);
        if (Math.random() > 0.5) {
            hour = Math.random() > 0.5 ? 9 + Math.floor(Math.random() * 3) : 20 + Math.floor(Math.random() * 4);
        }
        timestamp.setHours(hour, Math.floor(Math.random() * 60));

        data.push({
            timestamp,
            user_id: "user_123",
            url: `https://${domainObj.name}/page/${Math.floor(Math.random() * 100)}`,
            domain: domainObj.name,
            category: domainObj.cat,
            duration_seconds: Math.floor(Math.random() * 1200) + 30, // 30s to 20m
            device_type: Math.random() > 0.6 ? "Desktop" : Math.random() > 0.7 ? "Tablet" : "Mobile",
            referrer_url: REFERRERS[Math.floor(Math.random() * REFERRERS.length)],
            data_transferred_mb: parseFloat((Math.random() * 50).toFixed(2)),
        });
    }

    return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
