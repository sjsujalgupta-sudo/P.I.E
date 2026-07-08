/**
 * MAIN SERVER FILE
 *
 * This is the core Express.js server for the Knowledge Vault Backend.
 * It handles all API endpoints for data categorization, storage, analytics,
 * and export functionality. The server uses AI (Groq API) to analyze browsing
 * data and categorize it into interests, topics, and tools.
 *
 * Key Features:
 * - Receives browsing data from the browser extension
 * - Categorizes data using AI or heuristic rules
 * - Stores data in SQLite database
 * - Provides analytics and search capabilities
 * - Exports data in CSV, PDF, and JSON formats
 * - Manages user sessions for data collection
 *
 * For beginners: This file is like the "brain" of the backend. It receives
 * requests from the extension, processes the data, and sends back responses.
 * Think of it as a restaurant server taking orders and coordinating with the kitchen.
 */

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { initDB } from "../database/database-manager.js";
import { v4 as uuidv4 } from "uuid";
import { createObjectCsvStringifier } from "csv-writer";
import PDFDocument from "pdfkit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const db = await initDB();
console.log("✅ Database ready");

// ─── Helper Functions ──────────────────────────────────────────────

/**
 * Safely parses JSON strings, returns empty array if invalid
 */
function safeJSONParse(str, fallback = []) {
  try { return JSON.parse(str); }
  catch { return fallback; }
}

/**
 * Predefined categorization rules for common domains
 * Used as fallback when AI categorization is unavailable
 */
const domainRules = {
  "github.com":       { interests: ["software development"], tools: ["git"], topics: ["programming"], sensitivity_level: "low" },
  "stackoverflow.com":{ interests: ["software development"], tools: ["developer community"], topics: ["programming"], sensitivity_level: "low" },
  "wikipedia.org":    { interests: ["education"], tools: [], topics: ["knowledge"], sensitivity_level: "low" }
};

/**
 * Determines privacy sensitivity level based on content keywords
 */
function inferSensitivityFromHeuristics(data) {
  const keywords = Array.isArray(data.keywords) ? data.keywords : [];
  const blob = `${data.url || ""} ${data.title || ""} ${keywords.join(" ")}`.toLowerCase();

  const highSignals = ["porn", "pornhub", "xxx", "adult", "sex", "hentai", "escort"];
  const mediumSignals = ["dating", "casual dating"];

  if (highSignals.some(s => blob.includes(s))) return "high";
  if (mediumSignals.some(s => blob.includes(s))) return "medium";
  return "low";
}

/**
 * Categorizes browsing data using heuristic rules (no AI required)
 * Used for quick categorization or when AI is unavailable
 */
function categorizeWithHeuristics(data) {
  const keywords = Array.isArray(data.keywords) ? data.keywords : [];
  const baseTerms = keywords
    .map(k => (typeof k === "string" ? k.trim() : ""))
    .filter(Boolean);

  const topics = new Set();
  const interests = new Set();
  const tools = new Set();

  const urlLower = `${data.url || ""}`.toLowerCase();
  const titleLower = `${data.title || ""}`.toLowerCase();
  const blobLower = `${urlLower} ${titleLower} ${baseTerms.join(" ").toLowerCase()}`;

  // Search result pages (Yahoo, etc.)
  if (urlLower.includes("/search") || blobLower.includes("search results")) {
    // Use the query terms we already extracted as topics
    baseTerms.slice(0, 6).forEach(t => topics.add(t));
    baseTerms.slice(0, 3).forEach(t => interests.add(t));
  }

  // Sports / live score sites
  if (
    blobLower.includes("football") ||
    blobLower.includes("livescore") ||
    blobLower.includes("live scores") ||
    blobLower.includes("sofascore") ||
    blobLower.includes("premier league") ||
    blobLower.includes("championship league")
  ) {
    topics.add("football");
    topics.add("live scores");
    topics.add("fixtures");

    // If we have more specific keywords, prefer them
    baseTerms.slice(0, 6).forEach(t => topics.add(t));
    interests.add("football");
    baseTerms.slice(0, 2).forEach(t => interests.add(t));
  }

  // Generic fallback: turn keywords into topics/interests
  if (topics.size === 0) {
    baseTerms.slice(0, 8).forEach(t => topics.add(t));
  }
  if (interests.size === 0) {
    baseTerms.slice(0, 4).forEach(t => interests.add(t));
  }

  // Tools are optional; keep it simple.
  // (We only add tools for obvious developer-ish signals.)
  if (blobLower.includes("git")) tools.add("git");
  if (blobLower.includes("react")) tools.add("React");
  if (blobLower.includes("vue")) tools.add("Vue");
  if (blobLower.includes("python")) tools.add("Python");

  return {
    interests: Array.from(interests).slice(0, 6),
    topics: Array.from(topics).slice(0, 10),
    tools: Array.from(tools).slice(0, 6),
    sensitivity_level: inferSensitivityFromHeuristics({
      url: data.url,
      title: data.title,
      keywords: data.keywords
    })
  };
}

// ─── Grok Categorization ─────────────────────────────────

async function categorizeWithGrok(data) {
  const prompt = `You are an intelligent interest profiling system. Analyze browsing data and return a JSON object.

RULES:
- interests = broad user interest categories
  e.g. "Football", "History", "Technology"
- topics = specific subjects from this page
  e.g. "FC Bayern Munich", "Bundesliga 2026"
- tools = software/platforms used
  e.g. "Yahoo Search", "YouTube"
- sensitivity_level = "low" for sports/entertainment,
  "medium" for finance/health,
  "high" for personal/medical
- Return ONLY valid JSON. No markdown. No explanation.

Browsing data:
URL: ${data.url}
Title: ${data.title}
Search Query: ${data.searchQuery || "none"}
Page Summary: ${data.summary || "none"}

Return exactly this format:
{"interests": ["broad category 1", "broad category 2"],"topics": ["specific topic 1", "specific topic 2"],"tools": ["platform name"],"sensitivity_level": "low"}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const text = data.choices[0].message.content || "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      interests: Array.isArray(parsed.interests) ? parsed.interests.slice(0, 5) : [],
      tools:     Array.isArray(parsed.tools)     ? parsed.tools.slice(0, 5)     : [],
      topics:    Array.isArray(parsed.topics)    ? parsed.topics.slice(0, 8)    : [],
      sensitivity_level: ["low", "medium", "high"].includes(parsed.sensitivity_level)
        ? parsed.sensitivity_level
        : "low"
    };
  } catch (err) {
    console.error("Groq API error:", err.message);
    return { interests: [], tools: [], topics: [], sensitivity_level: "low" };
  }
}

// ─── Settings ─────────────────────────────────────────────

app.get("/api/settings", async (req, res) => {
  try {
    const row = await db.get("SELECT value FROM settings WHERE key = ?", "config");
    const settings = JSON.parse(row?.value || "{}");
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ success: false, error: "Missing settings" });
    
    await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "config", JSON.stringify(settings));
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Routes ───────────────────────────────────────────────

// Start a new session
app.post("/session/start", async (req, res) => {
  const sessionId = uuidv4();
  await db.run(
    "INSERT INTO sessions (id) VALUES (?)",
    sessionId
  );
  res.json({ session_id: sessionId });
});

// End a session
app.post("/session/end", async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });
  await db.run(
    "UPDATE sessions SET ended_at=datetime('now') WHERE id=?",
    session_id
  );
  res.json({ success: true });
});

// Main categorization endpoint
app.post("/categorize", async (req, res) => {
  try {
    const { url, title, timestamp, keywords, summary, searchQuery, session_id } = req.body;

    // Load settings to check filters
    const settingsRow = await db.get("SELECT value FROM settings WHERE key = ?", "config");
    const settings = JSON.parse(settingsRow?.value || "{}");

    if (!url) return res.status(400).json({ error: "Missing URL" });

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Skip browser internal pages
    if (!url.startsWith("http")) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    let result;

    const keywordsClean = Array.isArray(keywords)
      ? keywords.map(k => (typeof k === "string" ? k.trim() : "")).filter(Boolean).slice(0, 10)
      : [];
    const summaryClean = typeof summary === "string" ? summary.trim().slice(0, 400) : "";
    const titleClean = typeof title === "string" ? title : "";

    // Use cached domain rules if available
    if (domainRules[domain]) {
      result = domainRules[domain];
    } else {
      result = await categorizeWithGrok({
        url,
        title: titleClean,
        keywords: keywordsClean,
        summary: summaryClean,
        searchQuery: typeof searchQuery === "string" ? searchQuery.trim() : ""
      });
    }

    const allowedSensitivity = ["low", "medium", "high"];
    const sanitizeStringArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map(v => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean)
        .slice(0, 10);
    };

    // Final sanitation to prevent nulls sneaking into the DB.
    const resultClean = {
      interests: sanitizeStringArray(result?.interests),
      tools: sanitizeStringArray(result?.tools),
      topics: sanitizeStringArray(result?.topics),
      sensitivity_level:
        typeof result?.sensitivity_level === "string" &&
        allowedSensitivity.includes(result.sensitivity_level)
          ? result.sensitivity_level
          : "low"
    };

    // Ensure we have at least some topics/interests when we have keywords.
    if (!resultClean.topics.length && keywordsClean.length) {
      resultClean.topics = keywordsClean.slice(0, 5);
    }
    if (!resultClean.interests.length && keywordsClean.length) {
      resultClean.interests = keywordsClean.slice(0, 3);
    }

    // Sensitivity override based on deterministic signals (avoid "all low").
    const heuristicSensitivity = inferSensitivityFromHeuristics({
      url,
      title: titleClean,
      keywords: keywordsClean
    });
    const rank = { low: 0, medium: 1, high: 2 };
    if (rank[heuristicSensitivity] > rank[resultClean.sensitivity_level]) {
      resultClean.sensitivity_level = heuristicSensitivity;
    }

    // Apply sensitivity filter from settings
    if (settings.sensitivityFilter && settings.sensitivityFilter !== "all") {
      if (resultClean.sensitivity_level !== settings.sensitivityFilter) {
        return res.json({ success: true, skipped: true, reason: "sensitivity_filter" });
      }
    }

    // Handle includeSummaries setting
    if (settings.includeSummaries === false) {
      // We still keep the summary if it's already there, but we could clear it
      // For now, let's just clear it from resultClean if we want to be strict
    }

    // Handle includeSearchQueries setting
    if (settings.includeSearchQueries === false && searchQuery) {
      return res.json({ success: true, skipped: true, reason: "search_queries_disabled" });
    }

    // Deduplicate identical captures (same URL + same keywords + same summary)
    // to avoid repeated history spam in exports.
    if (session_id) {
      const newKeywordsStr = JSON.stringify(keywordsClean);
      const newSummaryStr = summaryClean || "";

      const recent = await db.get(
        "SELECT id, timestamp, keywords, summary, interests, topics FROM browsing_data WHERE session_id=? AND url=? ORDER BY timestamp DESC LIMIT 1",
        session_id,
        url
      );

      const recentTs = recent?.timestamp || 0;
      const withinWindowMs = 15000;

      if (
        recent &&
        Date.now() - recentTs < withinWindowMs &&
        recent.keywords === newKeywordsStr &&
        (recent.summary || "") === newSummaryStr
      ) {
        const recentInterests = safeJSONParse(recent.interests, []);
        const recentTopics = safeJSONParse(recent.topics, []);
        const recentHasMeaning = recentInterests.length > 0 || recentTopics.length > 0;
        const newHasMeaning = resultClean.interests.length > 0 || resultClean.topics.length > 0;

        // Only skip if the existing row already has meaningful categories.
        // If the existing row had empty topics/interests, allow inserting the improved row.
        if (recentHasMeaning || !newHasMeaning) {
          return res.json({ success: true, skipped: true, ...resultClean });
        }
      }
    }

    // Store to database
    await db.run(
      `INSERT INTO browsing_data
        (session_id, domain, url, title, keywords, summary,
         interests, tools, topics, sensitivity_level, timestamp)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      session_id || null,
      domain,
      url,
      titleClean,
      JSON.stringify(keywordsClean || []),
      summaryClean || "",
      JSON.stringify(resultClean.interests || []),
      JSON.stringify(resultClean.tools || []),
      JSON.stringify(resultClean.topics || []),
      resultClean.sensitivity_level,
      timestamp || Date.now()
    );

    // Update concept graph
    for (const topic of resultClean.topics) {
      const existing = await db.get(
        "SELECT * FROM concept_graph WHERE concept=? AND domain=?",
        topic, domain
      );
      if (existing) {
        await db.run("UPDATE concept_graph SET weight=weight+1 WHERE id=?", existing.id);
      } else {
        await db.run("INSERT INTO concept_graph (concept,domain,weight) VALUES (?,?,1)", topic, domain);
      }
    }

    res.json({ success: true, ...resultClean });

  } catch (err) {
    console.error("Categorize error:", err);
    res.status(500).json({ error: "Categorization failed" });
  }
});

// Get all vault data
app.get("/vault", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM browsing_data ORDER BY created_at DESC"
  );
  res.json(rows);
});

// Delete a single vault entry
app.delete("/vault/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const result = await db.run("DELETE FROM browsing_data WHERE id=?", id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

// Clear all vault data
app.delete("/vault", async (req, res) => {
  await db.run("DELETE FROM browsing_data");
  await db.run("DELETE FROM concept_graph");
  res.json({ success: true });
});

// Get data for a specific session
app.get("/session/:id/data", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM browsing_data WHERE session_id=? ORDER BY created_at DESC",
    req.params.id
  );
  res.json(rows);
});

// Export current session as CSV
app.get("/export/csv/:session_id", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM browsing_data WHERE session_id=? ORDER BY created_at ASC",
    req.params.session_id
  );

  if (!rows.length) {
    return res.status(404).json({ error: "No data for this session" });
  }

  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: "url", title: "URL" },
      { id: "title", title: "Title" },
      { id: "domain", title: "Domain" },
      { id: "keywords", title: "Keywords" },
      { id: "summary", title: "Summary" },
      { id: "interests", title: "Interests" },
      { id: "topics", title: "Topics" },
      { id: "tools", title: "Tools" },
      { id: "sensitivity_level", title: "Sensitivity" },
      { id: "created_at", title: "Captured At" }
    ]
  });

  const records = rows.map(r => ({
    ...r,
    keywords: safeJSONParse(r.keywords, []).join("; "),
    interests: safeJSONParse(r.interests, []).join("; "),
    topics: safeJSONParse(r.topics, []).join("; "),
    tools: safeJSONParse(r.tools, []).join("; ")
  }));

  const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="session-${req.params.session_id}.csv"`);
  res.send(csv);
});

// Export current session as PDF
app.get("/export/pdf/:session_id", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM browsing_data WHERE session_id=? ORDER BY created_at ASC",
    req.params.session_id
  );

  if (!rows.length) {
    return res.status(404).json({ error: "No data for this session" });
  }

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="session-${req.params.session_id}.pdf"`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).text("Data Vault — Session Report", { align: "center" });
  doc.fontSize(10).text(`Session ID: ${req.params.session_id}`, { align: "center" });
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(2);

  // Each entry
  rows.forEach((row, i) => {
    doc.fontSize(13).fillColor("#1a1a1a").text(`${i + 1}. ${row.title || "Untitled"}`);
    doc.fontSize(9).fillColor("#555").text(`URL: ${row.url}`);
    doc.fontSize(9).text(`Domain: ${row.domain}`);
    doc.fontSize(9).text(`Keywords: ${safeJSONParse(row.keywords, []).join(", ") || "—"}`);
    doc.fontSize(9).text(`Topics: ${safeJSONParse(row.topics, []).join(", ") || "—"}`);
    doc.fontSize(9).text(`Interests: ${safeJSONParse(row.interests, []).join(", ") || "—"}`);
    doc.fontSize(9).text(`Sensitivity: ${row.sensitivity_level}`);
    doc.fontSize(9).text(`Captured: ${row.created_at}`);
    if (row.summary) {
      doc.fontSize(9).text(`Summary: ${row.summary}`);
    }
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#ddd");
    doc.moveDown(1);
  });

  doc.end();
});

// Analytics
app.get("/analytics", async (req, res) => {
  const rows = await db.all("SELECT * FROM browsing_data");
  const interests = {}, topics = {}, tools = {};

  rows.forEach(row => {
    safeJSONParse(row.interests).forEach(i => { interests[i] = (interests[i] || 0) + 1; });
    safeJSONParse(row.topics).forEach(t => { topics[t] = (topics[t] || 0) + 1; });
    safeJSONParse(row.tools).forEach(t => { tools[t] = (tools[t] || 0) + 1; });
  });

  res.json({ interests, topics, tools });
});

// AI Assistant / Chat with Vault
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    // 1. Search for relevant context
    // For now, use simple keyword search on title, summary, and topics
    const keywords = question.toLowerCase().split(" ").filter(w => w.length > 3);
    let contextRows = [];

    if (keywords.length > 0) {
      const searchTerms = keywords.map(k => `%${k}%`);
      const placeholders = keywords.map(() => "(title LIKE ? OR summary LIKE ? OR topics LIKE ?)").join(" OR ");
      const params = [];
      searchTerms.forEach(t => { params.push(t, t, t); });

      contextRows = await db.all(
        `SELECT title, summary, topics, url FROM browsing_data WHERE ${placeholders} ORDER BY timestamp DESC LIMIT 10`,
        ...params
      );
    } else {
      // Fallback to most recent data
      contextRows = await db.all("SELECT title, summary, topics, url FROM browsing_data ORDER BY timestamp DESC LIMIT 5");
    }

    const context = contextRows.map(r => 
      `Page: ${r.title}\nSummary: ${r.summary}\nTopics: ${safeJSONParse(r.topics).join(", ")}\nURL: ${r.url}`
    ).join("\n\n---\n\n");

    // 2. Call Ollama
    const prompt = `You are an AI assistant for a Personal Data Vault. You have access to the user's browsing history context below.
Answer the user's question based ONLY on the provided context. If the answer is not in the context, say you don't know based on the available data.

CONTEXT:
${context || "No relevant data found in the vault."}

USER QUESTION: ${question}

ANSWER:`;

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral:7b",
        prompt,
        stream: false,
        options: { temperature: 0.3 }
      })
    });

    if (!ollamaRes.ok) throw new Error("Ollama service unavailable");

    const data = await ollamaRes.json();
    res.json({ answer: data.response });

  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({ error: "Failed to get answer from vault", message: err.message });
  }
});

// ─── Profile Builder Helper ────────────────────────────────

function buildProfile(rows, sessionId) {
  // De-duplicate identical rapid captures so exports don't repeat the same
  // page/search many times (especially from periodic polling).
  const dedupWindowMs = 15000;
  const lastSeen = new Map();
  const dedupedRows = [];
  for (const row of rows) {
    const ts = Number(row.timestamp || 0) || 0;
    const key = `${row.url}|${row.keywords}|${row.summary}`;
    const prevTs = lastSeen.get(key);

    if (prevTs === undefined || (ts && ts - prevTs > dedupWindowMs)) {
      dedupedRows.push(row);
      lastSeen.set(key, ts);
    }
  }

  rows = dedupedRows;

  const interests = {};
  const topics = {};
  const tools = {};
  const searchQueries = [];
  const domains = new Set();

  // Search queries can come from:
  // 1) a real search URL parameter (q/query/search)
  // 2) our SEARCH_QUERY event payload (summary/title heuristics), even if navigation
  //    hasn't happened yet.
  function extractSearchQuery(row) {
    // 1) Extract from URL query params
    try {
      const urlObj = new URL(row.url);
      const q =
        urlObj.searchParams.get("q") ||
        urlObj.searchParams.get("query") ||
        urlObj.searchParams.get("search");
      if (q && typeof q === "string") return q;
    } catch {}

    // 2) Extract from the stored payload summary
    if (typeof row.summary === "string") {
      const m = row.summary.match(/^User searched for:\s*(.+)\s*$/i);
      if (m?.[1]) return m[1];
    }

    // 3) Extract from the stored payload title
    if (typeof row.title === "string") {
      const m = row.title.match(/^Search:\s*(.+)\s*$/i);
      if (m?.[1]) return m[1];
    }

    return null;
  }

  rows.forEach(row => {
    domains.add(row.domain);

    safeJSONParse(row.interests).forEach(i => {
      interests[i] = (interests[i] || 0) + 1;
    });
    safeJSONParse(row.topics).forEach(t => {
      topics[t] = (topics[t] || 0) + 1;
    });
    safeJSONParse(row.tools).forEach(t => {
      tools[t] = (tools[t] || 0) + 1;
    });

    const extracted = extractSearchQuery(row);
    if (extracted) searchQueries.push(extracted);
  });

  // Sort by frequency
  const sortByFreq = (obj) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

  // Data quality score (0-100)
  const hasKeywords   = rows.some(r => safeJSONParse(r.keywords).length > 0);
  const hasSummaries  = rows.some(r => r.summary?.length > 0);
  const hasSearches   = searchQueries.length > 0;
  const pageCount     = rows.length;
  const domainCount   = domains.size;

  let score = 0;
  if (pageCount >= 3)   score += 20;
  if (pageCount >= 8)   score += 15;
  if (domainCount >= 3) score += 15;
  if (hasKeywords)      score += 20;
  if (hasSummaries)     score += 15;
  if (hasSearches)      score += 15;

  const sensitivityCounts = {};
  rows.forEach(r => {
    const lvl = r.sensitivity_level;
    if (lvl === "high" || lvl === "medium" || lvl === "low") {
      sensitivityCounts[lvl] = (sensitivityCounts[lvl] || 0) + 1;
    }
  });
  const overallSensitivity =
    sensitivityCounts["high"]   ? "high"   :
    sensitivityCounts["medium"] ? "medium" : "low";

  return {
    session_id: sessionId,
    generated_at: new Date().toISOString(),
    consent: {
      user_approved: false,
      data_categories: ["interests", "topics", "search_queries", "domains"],
      sensitivity_level: overallSensitivity
    },
    profile: {
      top_interests:    sortByFreq(interests).slice(0, 5),
      top_topics:       sortByFreq(topics).slice(0, 8),
      top_tools:        sortByFreq(tools).slice(0, 5),
      search_queries:   [...new Set(searchQueries)].slice(0, 10),
      domains_visited:  [...domains],
      pages_analyzed:   pageCount,
      data_quality_score: Math.min(score, 100)
    }
  };
}

// ─── Preview Endpoint (user sees before approving) ─────────

app.get("/preview/:session_id", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM browsing_data WHERE session_id=? ORDER BY created_at ASC",
    req.params.session_id
  );

  if (!rows.length) {
    return res.status(404).json({ error: "No data for this session" });
  }

  const profile = buildProfile(rows, req.params.session_id);
  res.json(profile);
});

// ─── Aggregated JSON Profile (what companies get) ──────────

app.get("/export/profile/:session_id", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM browsing_data WHERE session_id=? ORDER BY created_at ASC",
    req.params.session_id
  );

  if (!rows.length) {
    return res.status(404).json({ error: "No data for this session" });
  }

  const profile = buildProfile(rows, req.params.session_id);
  profile.consent.user_approved = true;

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="profile-${req.params.session_id}.json"`
  );
  res.json(profile);
});

// ─── PDF Export (replace your existing /export/pdf) ────────

app.get("/export/pdf/:session_id", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM browsing_data WHERE session_id=? ORDER BY created_at ASC",
    req.params.session_id
  );

  if (!rows.length) {
    return res.status(404).json({ error: "No data for this session" });
  }

  const profile = buildProfile(rows, req.params.session_id);
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="profile-${req.params.session_id}.pdf"`
  );
  doc.pipe(res);

  // ── Cover ──
  doc.fontSize(24).fillColor("#111").text("Personal Data Profile", { align: "center" });
  doc.fontSize(11).fillColor("#666")
     .text("Privacy-First Data Treasury", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor("#999")
     .text(`Session: ${req.params.session_id}`, { align: "center" });
  doc.fontSize(9)
     .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(2);

  // ── Quality Score ──
  const score = profile.profile.data_quality_score;
  doc.fontSize(14).fillColor("#111").text("Data Quality Score", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(32).fillColor(
    score >= 70 ? "#2e7d32" : score >= 40 ? "#f57c00" : "#c62828"
  ).text(`${score} / 100`, { align: "center" });
  doc.moveDown(1);

  // ── Top Interests ──
  doc.fontSize(13).fillColor("#111").text("Top Interests", { underline: true });
  doc.moveDown(0.3);
  profile.profile.top_interests.forEach(i => {
    doc.fontSize(10).fillColor("#333")
       .text(`• ${i.name}  (signal strength: ${i.count})`);
  });
  doc.moveDown(1);

  // ── Top Topics ──
  doc.fontSize(13).fillColor("#111").text("Top Topics", { underline: true });
  doc.moveDown(0.3);
  profile.profile.top_topics.forEach(t => {
    doc.fontSize(10).fillColor("#333")
       .text(`• ${t.name}  (signal strength: ${t.count})`);
  });
  doc.moveDown(1);

  // ── Search Queries ──
  if (profile.profile.search_queries.length > 0) {
    doc.fontSize(13).fillColor("#111").text("Search Queries", { underline: true });
    doc.moveDown(0.3);
    profile.profile.search_queries.forEach(q => {
      doc.fontSize(10).fillColor("#333").text(`• ${q}`);
    });
    doc.moveDown(1);
  }

  // ── Domains Visited ──
  doc.fontSize(13).fillColor("#111").text("Domains Visited", { underline: true });
  doc.moveDown(0.3);
  profile.profile.domains_visited.forEach(d => {
    doc.fontSize(10).fillColor("#333").text(`• ${d}`);
  });
  doc.moveDown(1);

  // ── Consent Block ──
  doc.fontSize(13).fillColor("#111").text("Consent & Privacy", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#333")
     .text(`Sensitivity Level: ${profile.consent.sensitivity_level}`);
  doc.fontSize(10)
     .text(`Data Categories: ${profile.consent.data_categories.join(", ")}`);
  doc.fontSize(10)
     .text(`Pages Analyzed: ${profile.profile.pages_analyzed}`);
  doc.fontSize(10).fillColor("#2e7d32")
     .text("✓ User consented to share this data");
  doc.moveDown(1);

  // ── Raw Data Table ──
  doc.fontSize(13).fillColor("#111").text("Raw Session Log", { underline: true });
  doc.moveDown(0.3);
  rows.forEach((row, i) => {
    doc.fontSize(9).fillColor("#111").text(`${i + 1}. ${row.title || "Untitled"}`);
    doc.fontSize(8).fillColor("#666").text(`   ${row.url}`);
    doc.fontSize(8).fillColor("#888")
       .text(`   Keywords: ${safeJSONParse(row.keywords).join(", ") || "—"}`);
    doc.moveDown(0.4);
  });

  doc.end();
});


// ─── Send to Frontend ──────────────────────────────────────

app.get("/send-to-frontend/:session_id", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM browsing_data WHERE session_id=? ORDER BY created_at DESC",
    req.params.session_id
  );

  if (!rows.length) {
    return res.status(404).json({ error: "No data for this session" });
  }

  const parse = (str) => { try { return JSON.parse(str); } catch { return []; } };

  const allInterests = {};
  const allTopics = {};
  const allTools = {};
  const searchQueries = [];
  const domains = new Set();

  rows.forEach(row => {
    domains.add(row.domain);
    parse(row.interests).forEach(i => { allInterests[i] = (allInterests[i] || 0) + 1; });
    parse(row.topics).forEach(t => { allTopics[t] = (allTopics[t] || 0) + 1; });
    parse(row.tools).forEach(t => { allTools[t] = (allTools[t] || 0) + 1; });
    try {
      const q =
        new URL(row.url).searchParams.get("q") ||
        new URL(row.url).searchParams.get("p");
      if (q) searchQueries.push(q);
    } catch {}
  });

  const sortByCount = (obj) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

  res.json({
    dashboard: {
      total_pages: rows.length,
      total_domains: domains.size,
      top_interests: sortByCount(allInterests).slice(0, 5),
      top_topics: sortByCount(allTopics).slice(0, 5),
      recent_activity: rows.slice(0, 10).map(r => ({
        title: r.title,
        url: r.url,
        domain: r.domain,
        sensitivity: r.sensitivity_level,
        captured_at: r.created_at
      }))
    },
    vault: rows.map(r => ({
      id: r.id,
      session_id: r.session_id,
      title: r.title,
      url: r.url,
      domain: r.domain,
      keywords: parse(r.keywords),
      topics: parse(r.topics),
      interests: parse(r.interests),
      tools: parse(r.tools),
      sensitivity: r.sensitivity_level,
      captured_at: r.created_at
    })),
    deposit: {
      quality_score: Math.min(
        (rows.length >= 5 ? 40 : 20) +
        (searchQueries.length > 0 ? 20 : 0) +
        (domains.size >= 3 ? 20 : 10) +
        (Object.keys(allInterests).length > 2 ? 20 : 0),
        100
      ),
      top_interests: sortByCount(allInterests).slice(0, 5),
      top_topics: sortByCount(allTopics).slice(0, 8),
      search_queries: [...new Set(searchQueries)].slice(0, 10),
      domains_visited: [...domains],
      sensitivity_level:
        rows.some(r => r.sensitivity_level === "high") ? "high" :
        rows.some(r => r.sensitivity_level === "medium") ? "medium" : "low"
    },
    profile: {
      interests_chart: sortByCount(allInterests),
      topics_tags: Object.keys(allTopics),
      tools_used: Object.keys(allTools),
      domains_visited: [...domains],
      search_queries: [...new Set(searchQueries)]
    },
    logs: rows.map(r => ({
      type: "Page Captured",
      title: r.title,
      url: r.url,
      domain: r.domain,
      timestamp: r.created_at
    }))
  });
});

app.listen(PORT, () => console.log(`✅ AI Server running on port ${PORT}`));