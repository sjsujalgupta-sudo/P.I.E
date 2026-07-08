// PAGE MONITOR CONTENT SCRIPT
//
// This script runs on every web page and monitors user activity.
// It extracts page content, detects search queries, and sends data
// to the background service for processing.
//
// Key features:
// - Monitors search input fields for queries
// - Extracts page keywords and summaries
// - Detects URL changes (for single-page apps)
// - Tracks user activity to know when to capture data
//
// For beginners: This is like a "spy" that watches what you're doing
// on web pages and reports back useful information to build your profile.

// content.js - Active monitoring script

// ─── Configuration ─────────────────────────────────────────
const CONFIG = {
  // Debounce time for search queries (ms)
  SEARCH_DEBOUNCE: 900,
  // Interval for capturing page data (ms)
  PAGE_CAPTURE_INTERVAL: 15000,
  // Minimum time between same-page captures (ms)
  CAPTURE_COOLDOWN: 12000
};

let lastCaptureTime = 0;
let lastSentSignature = null;
let lastSentAt = 0;
let searchQueryTimer = null;
let currentSearchQuery = '';
const searchInputsAttached = new WeakSet();
let searchObserverTimer = null;

// ─── Search Query Monitor ──────────────────────────────────

function attachSearchInputListeners(input) {
  if (!(input instanceof HTMLInputElement) || searchInputsAttached.has(input)) {
    return;
  }
  searchInputsAttached.add(input);

  // Listen for input events
  input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      // Clear previous timer
      if (searchQueryTimer) clearTimeout(searchQueryTimer);
      
      // Only capture if query is meaningful and changed
      if (query && query !== currentSearchQuery && query.length > 2) {
        // Debounce to avoid capturing every keystroke
        searchQueryTimer = setTimeout(() => {
          currentSearchQuery = query;
          chrome.runtime.sendMessage({
            type: 'SEARCH_QUERY',
            query: query
          });
        }, CONFIG.SEARCH_DEBOUNCE);
      }
    });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query && query.length > 2) {
        chrome.runtime.sendMessage({
          type: 'SEARCH_QUERY',
          query: query
        });
      }
    }
  });
}

function monitorSearchInputs() {
  const searchSelectors = [
    'input[type="text"]',
    'input[type="search"]',
    'input[name="q"]',
    'input[name="query"]',
    'input[role="searchbox"]',
    '#search-input',
    '.search-input'
  ];

  document
    .querySelectorAll(searchSelectors.join(','))
    .forEach((el) => attachSearchInputListeners(el));
}

function setupSearchInputObserver() {
  const observer = new MutationObserver(() => {
    if (searchObserverTimer) clearTimeout(searchObserverTimer);
    searchObserverTimer = setTimeout(() => monitorSearchInputs(), 400);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

// ─── URL Change Detection ──────────────────────────────────

let lastCapturedUrl = window.location.href;

function monitorURLChanges() {
  // Check if URL has changed significantly
  const currentUrl = window.location.href;
  
  if (currentUrl !== lastCapturedUrl) {
    // Wait a bit for page to stabilize
    setTimeout(() => {
      capturePageData();
      lastCapturedUrl = window.location.href;
    }, 1000);
  }
}

// Use History API to detect SPA navigation
(function() {
  let lastHref = location.href;
  
  const observeURLChange = () => {
    if (lastHref !== location.href) {
      lastHref = location.href;
      console.log('🔄 URL changed detected');
      monitorURLChanges();
    }
  };
  
  // Override pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    observeURLChange();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    observeURLChange();
  };
  
  // Listen for popstate (back/forward buttons)
  window.addEventListener('popstate', observeURLChange);
})();

// ─── Page Data Capture ─────────────────────────────────────

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

function capturePageData(force = false) {
  const now = Date.now();
  
  // Respect cooldown unless forced
  if (!force && now - lastCaptureTime < CONFIG.CAPTURE_COOLDOWN) {
    return;
  }
  
  try {
    const pageData = extractPageData();
    
    // Only send if we have meaningful data
    const summaryTrim = (pageData.summary || '').trim();
    if (pageData.keywords.length > 0 || summaryTrim.length > 0) {
      const signature = JSON.stringify({
        url: window.location.href,
        keywords: pageData.keywords,
        summary: summaryTrim.slice(0, 200)
      });

      // Avoid inserting repeated identical captures
      if (!force && signature === lastSentSignature) {
        return;
      }

      chrome.runtime.sendMessage({
        type: 'PAGE_DATA',
        data: pageData
      });
      lastCaptureTime = now;
      lastSentSignature = signature;
      lastSentAt = now;
    }
  } catch (err) {
    console.error('Error capturing page data:', err);
  }
}

// ─── User Activity Monitoring ──────────────────────────────

let idleTime = 0;
let activityTimer = null;

function resetIdleTimer() {
  idleTime = 0;
  
  if (activityTimer) clearInterval(activityTimer);
  
  activityTimer = setInterval(() => {
    idleTime += 1000;
    
    // Capture page data every 30 seconds of activity
    if (idleTime % 30000 < 1000) {
      capturePageData();
    }
  }, 1000);
}

// Track various user activities
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keypress', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);
document.addEventListener('scroll', resetIdleTimer);

// ─── Initialization ────────────────────────────────────────

function init() {
  console.log('🔍 Content script initialized');
  
  monitorSearchInputs();
  setupSearchInputObserver();
  resetIdleTimer();
  
  // Initial page capture after a short delay
  setTimeout(() => {
    capturePageData(true); // Force initial capture
  }, 2000);
  
  // Periodic capture interval
  setInterval(() => {
    capturePageData();
  }, CONFIG.PAGE_CAPTURE_INTERVAL);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
