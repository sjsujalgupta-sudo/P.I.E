/**
 * SESSION MANAGER (Background Script)
 *
 * This script runs in the background of the browser extension.
 * It manages data collection sessions, communicates with the backend server,
 * and coordinates between the popup interface and content scripts.
 *
 * Key Responsibilities:
 * - Start/stop data collection sessions
 * - Receive page data from content scripts
 * - Send data to the backend server for processing
 * - Store session state in browser storage
 * - Handle search query capture
 *
 * For beginners: This is like the manager who oversees the entire data
 * collection operation. It makes sure everything runs smoothly in the background.
 */

// background.js

// ─── Session Helpers (always read from storage) ────────────

/**
 * Gets current session status from browser storage
 */
async function getSession() {
  const stored = await chrome.storage.local.get([
    "sessionId",
    "isSessionActive"
  ]);
  return {
    sessionId: stored.sessionId || null,
    isSessionActive: stored.isSessionActive || false
  };
}

/**
 * Saves session status to browser storage
 */
async function saveSession(sessionId, isActive) {
  await chrome.storage.local.set({
    sessionId,
    isSessionActive: isActive
  });
}

// ─── Settings Helpers ──────────────────────────────────────

async function getSettings() {
  try {
    const res = await fetch("http://localhost:4000/api/settings");
    const data = await res.json();
    if (data.success) {
      await chrome.storage.local.set({ settings: data.settings });
      return data.settings;
    }
  } catch (err) {
    console.error("Failed to fetch settings:", err);
  }
  const stored = await chrome.storage.local.get("settings");
  return stored.settings || {};
}

// ─── Tab Activity Tracking ─────────────────────────────────

// Track tab creation and activation
chrome.tabs.onCreated.addListener(async (tab) => {
  const { isSessionActive } = await getSession();
  if (isSessionActive && tab.url?.startsWith('http')) {
    console.log('📑 New tab created:', tab.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { isSessionActive } = await getSession();
  if (!isSessionActive) return;
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url?.startsWith('http')) {
      console.log('🔄 Tab activated:', tab.url);
      // NOTE: We intentionally do not capture on every tab switch.
      // content.js already monitors URLs and captures page data periodically,
      // and capturing here would create many duplicate entries in the DB.
    }
  } catch (err) {
    console.error('Error getting activated tab:', err);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const { isSessionActive } = await getSession();
  if (!isSessionActive) return;
  
  // NOTE: We intentionally do not capture on URL updates here.
  // content.js handles URL changes and periodic capture. Keeping this would
  // double-log the same pages multiple times.
  if ((changeInfo.url || changeInfo.status === 'complete') && tab.url?.startsWith('http')) {
    console.log('✏️ Tab updated:', tab.url);
  }
});

// ─── Message Handler (from popup AND content script) ──────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_SESSION") {
    startSession().then(sendResponse);
    return true;
  }
  if (message.type === "STOP_SESSION") {
    stopSession().then(sendResponse);
    return true;
  }
  if (message.type === "GET_STATUS") {
    getSession().then(sendResponse);
    return true;
  }
  // Handle search query captured by content script (tab id comes from sender, not message)
  if (message.type === "SEARCH_QUERY") {
    handleSearchQuery(message.query, sender)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("SEARCH_QUERY handler:", err);
        sendResponse({ ok: false });
      });
    return true;
  }
  if (message.type === "PAGE_DATA") {
    handlePageData(message.data, sender)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("PAGE_DATA handler:", err);
        sendResponse({ ok: false });
      });
    return true;
  }
});

// ─── Search Query Handler ─────────────────────────────────

async function handleSearchQuery(query, sender) {
  const { isSessionActive, sessionId } = await getSession();
  const settings = await getSettings();
  
  if (!isSessionActive || !sessionId || !query) return;
  if (settings.includeSearchQueries === false) return;

  const tab = sender?.tab;
  if (!tab?.id) {
    console.warn("SEARCH_QUERY: no tab on sender (unexpected for content script)");
    return;
  }

  try {
    const payload = {
      url: tab.url || '',
      title: tab.title || `Search: ${query}`,
      timestamp: Date.now(),
      keywords: [query],
      summary: `User searched for: ${query}`,
      session_id: sessionId
    };

    await fetch("http://localhost:4000/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log('✅ Captured search query:', query);
  } catch (err) {
    console.error('Search query error:', err);
  }
}

// ─── Page Data Handler ─────────────────────────────────────

async function handlePageData(data, sender) {
  const { isSessionActive, sessionId } = await getSession();
  const settings = await getSettings();

  if (!isSessionActive || !sessionId) return;
  if (settings.autoCapture === false) return; // Respect auto-capture setting

  const tab = sender?.tab;
  if (!tab?.id) {
    console.warn("PAGE_DATA: no tab on sender");
    return;
  }

  try {
    const payload = {
      url: tab.url || '',
      title: tab.title || '',
      timestamp: Date.now(),
      keywords: data.keywords || [],
      summary: data.summary || '',
      searchQuery: data.searchQuery || '',
      session_id: sessionId
    };

    await fetch("http://localhost:4000/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log('✅ Captured page data:', tab.url);
  } catch (err) {
    console.error('Page data error:', err);
  }
}

// ─── Capture Tab Data Helper ───────────────────────────────

async function captureTabData(tabId, url, title, isActivation = false) {
  const { isSessionActive, sessionId } = await getSession();
  const settings = await getSettings();

  if (!isSessionActive || !sessionId) return;
  if (settings.autoCapture === false) return;

  try {
    if (!url || !url.startsWith('http')) return;

    // Extract keywords + summary from the page
    let pageData = { keywords: [], summary: '' };

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: extractPageData
      });
      if (results?.[0]?.result) {
        pageData = results[0].result;
      }
    } catch (e) {
      console.warn('Script injection blocked on:', url);
    }

    const payload = {
      url,
      title: title || '',
      timestamp: Date.now(),
      keywords: pageData.keywords,
      summary: pageData.summary,
      searchQuery: pageData.searchQuery || '',
      session_id: sessionId
    };

    await fetch('http://localhost:4000/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (isActivation) {
      console.log('✅ Captured activated tab:', url);
    }
  } catch (err) {
    console.error('Capture error:', err);
  }
}

async function startSession() {
  try {
    const res = await fetch("http://localhost:4000/session/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();

    await saveSession(data.session_id, true);

    // Capture the currently active tab once, so the user immediately gets
    // context even if content.js already ran earlier.
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs?.[0];
      if (tab?.id && tab.url?.startsWith("http")) {
        captureTabData(tab.id, tab.url, tab.title, false).catch(() => {});
      }
    } catch (e) {
      console.warn("startSession: could not capture active tab", e);
    }

    return { success: true, sessionId: data.session_id };
  } catch (err) {
    console.error("Failed to start session:", err);
    return { success: false };
  }
}

// ─── Stop Session ──────────────────────────────────────────

async function stopSession() {
  try {
    const { sessionId } = await getSession();

    if (sessionId) {
      await fetch("http://localhost:4000/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      });
    }

    await saveSession(sessionId, false);

    return { success: true, sessionId };
  } catch (err) {
    console.error("Failed to stop session:", err);
    return { success: false };
  }
}

// ─── Page Data Extractor (runs inside the page) ───────────

function extractPageData() {
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery =
    searchParams.get("q") ||
    searchParams.get("p") ||
    searchParams.get("query") ||
    searchParams.get("search") || "";

  const skipPatterns = [
    "see results about",
    "explore more",
    "top searched",
    "accessibility",
    "filters and topics",
    "search results",
    "loading",
    "related links",
    "ai overview"
  ];

  function isJunk(text) {
    const lower = text.toLowerCase();
    return skipPatterns.some(p => lower.includes(p));
  }

  const keywords = [];
  if (searchQuery) keywords.push(searchQuery);

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords?.content) {
    metaKeywords.content.split(",").map(k => k.trim())
      .filter(k => k.length > 2 && !isJunk(k))
      .slice(0, 5)
      .forEach(k => keywords.push(k));
  }

  const contentHeadings = Array.from(
    document.querySelectorAll("article h1, article h2, main h1, main h2")
  )
    .map(h => h.innerText?.trim())
    .filter(h => h && h.length > 5 && h.length < 80 && !isJunk(h))
    .slice(0, 3);

  keywords.push(...contentHeadings);

  const metaDesc = document.querySelector('meta[name="description"]');
  let summary = "";
  if (metaDesc?.content?.length > 20) {
    summary = metaDesc.content.slice(0, 300);
  } else {
    const paragraphs = Array.from(
      document.querySelectorAll("article p, main p, .content p, p")
    )
      .map(p => p.innerText?.trim())
      .filter(p => p && p.length > 50 && !isJunk(p));
    if (paragraphs.length > 0) {
      summary = paragraphs[0].slice(0, 300);
    }
  }

  return {
    keywords: [...new Set(keywords)].slice(0, 8),
    summary,
    searchQuery
  };
}

