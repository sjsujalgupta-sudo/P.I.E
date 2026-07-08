/*
 * 🎭 Analogy: This file is the "Telephone Operator" — every time
 *   the app needs to talk to the backend server, it goes through
 *   this file. It dials the right number, waits for an answer,
 *   and hands back the result.
 * ✅ Safe to change:
 *    1. Add a new fetch function (e.g., fetchUserProfile) by copying the pattern of fetchVaultData()
 *    2. Edit error messages inside the ApiError class
 *    3. Add new fields to VaultRow or AnalyticsItem types if the backend sends new data
 * ❌ Never touch: The `requestProxy` function and `API_PROXY_BASE` constant —
 *   all fetch calls route through these. Changing them breaks every single API call in the app.
 */
const API_PROXY_BASE = (process.env.NEXT_PUBLIC_API_URL || "/api/proxy").replace(/\/$/, "");

export class ApiError extends Error {
    offline: boolean;

    constructor(message: string, offline = false) {
        super(message);
        this.name = "ApiError";
        this.offline = offline;
    }
}

export type SensitivityLevel = "low" | "medium" | "high";

export type VaultRow = {
    id: number;
    session_id: string;
    domain: string;
    url: string;
    title: string;
    keywords: string[];
    summary: string;
    interests: string[];
    tools: string[];
    topics: string[];
    sensitivity_level: SensitivityLevel;
    timestamp: string;
    created_at: string;
};

export type AnalyticsResponse = {
    interests: Record<string, number>;
    topics: Record<string, number>;
    tools: Record<string, number>;
};

export type AnalyticsItem = {
    name: string;
    count: number;
};

export type AnalyticsView = {
    interests: AnalyticsItem[];
    topics: AnalyticsItem[];
    tools: AnalyticsItem[];
};

export type PreviewResponse = {
    session_id: string;
    generated_at: string;
    consent: {
        user_approved: boolean;
        data_categories: string[];
        sensitivity_level: SensitivityLevel;
    };
    profile: {
        top_interests: { name: string; count: number }[];
        top_topics: { name: string; count: number }[];
        top_tools: { name: string; count: number }[];
        search_queries: string[];
        domains_visited: string[];
        pages_analyzed: number;
        data_quality_score: number;
    };
};

type RawVaultRow = Omit<VaultRow, "keywords" | "interests" | "tools" | "topics"> & {
    keywords: string;
    interests: string;
    tools: string;
    topics: string;
};

async function requestProxy<T>(path: string, init?: RequestInit): Promise<T> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    try {
        const response = await fetch(`${API_PROXY_BASE}${normalizedPath}`, {
            ...init,
            cache: "no-store",
        });

        if (!response.ok) {
            if (response.status === 503) {
                throw new ApiError("Server offline", true);
            }
            const message = await response.text();
            throw new ApiError(message || `Request failed with status ${response.status}`);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError("Server offline", true);
    }
}

export function safeParse<T>(value: string | null | undefined, fallback: T): T {
    if (!value) {
        return fallback;
    }
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

function toSortedAnalyticsItems(data: Record<string, number>): AnalyticsItem[] {
    return Object.entries(data || {})
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

function parseVaultRow(row: RawVaultRow): VaultRow {
    return {
        ...row,
        keywords: safeParse<string[]>(row.keywords, []),
        interests: safeParse<string[]>(row.interests, []),
        tools: safeParse<string[]>(row.tools, []),
        topics: safeParse<string[]>(row.topics, []),
    };
}

export async function startSession() {
    return requestProxy<{ session_id: string }>("/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
    });
}

export async function endSession(sessionId: string) {
    return requestProxy<{ success: boolean }>("/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
    });
}

export async function fetchVaultData() {
    const rows = await requestProxy<RawVaultRow[]>("/vault");
    return Array.isArray(rows) ? rows.map(parseVaultRow) : [];
}

export async function fetchSessionData(sessionId: string) {
    const rows = await requestProxy<RawVaultRow[]>(`/session/${encodeURIComponent(sessionId)}/data`);
    return Array.isArray(rows) ? rows.map(parseVaultRow) : [];
}

export async function fetchPreview(sessionId: string) {
    return requestProxy<PreviewResponse>(`/preview/${encodeURIComponent(sessionId)}`);
}

export async function fetchAnalyticsRaw() {
    return requestProxy<AnalyticsResponse>("/analytics");
}

export async function fetchAnalytics() {
    const analytics = await fetchAnalyticsRaw();
    return {
        interests: toSortedAnalyticsItems(analytics.interests),
        topics: toSortedAnalyticsItems(analytics.topics),
        tools: toSortedAnalyticsItems(analytics.tools),
    } satisfies AnalyticsView;
}

export async function deleteVaultEntry(id: number) {
    return requestProxy<{ success: boolean }>(`/vault/${id}`, { method: "DELETE" });
}

export async function clearVault() {
    return requestProxy<{ success: boolean }>("/vault", { method: "DELETE" });
}

export function getExportCsvUrl(sessionId: string) {
    return `${API_PROXY_BASE}/export/csv/${encodeURIComponent(sessionId)}`;
}

export function getExportPdfUrl(sessionId: string) {
    return `${API_PROXY_BASE}/export/pdf/${encodeURIComponent(sessionId)}`;
}

export function getExportProfileUrl(sessionId: string) {
    return `${API_PROXY_BASE}/export/profile/${encodeURIComponent(sessionId)}`;
}
