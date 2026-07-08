/**
 * DATABASE MANAGER
 *
 * This file handles all database operations for the Knowledge Vault.
 * It uses SQLite to store browsing data, user sessions, settings, and
 * concept graphs. The database is designed to be local and private.
 *
 * Tables:
 * - browsing_data: Stores individual page visits with AI categorization
 * - sessions: Tracks user data collection sessions
 * - concept_graph: Knowledge graph of concepts and their frequency
 * - settings: User preferences and configuration
 *
 * For beginners: This is like a filing cabinet for your data. It organizes
 * and stores all the information collected from your browsing so you can
 * search and analyze it later.
 */

import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function initDB() {
  const db = await open({
    filename: "./vault.db",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS browsing_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      domain TEXT,
      url TEXT,
      title TEXT,
      keywords TEXT,
      summary TEXT,
      interests TEXT,
      tools TEXT,
      topics TEXT,
      sensitivity_level TEXT,
      embedding TEXT,
      timestamp INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      exported INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS concept_graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept TEXT,
      domain TEXT,
      weight INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_domain ON browsing_data(domain);
    CREATE INDEX IF NOT EXISTS idx_session ON browsing_data(session_id);
    CREATE INDEX IF NOT EXISTS idx_concept ON concept_graph(concept);
  `);

  // Initialize default settings if not present
  const count = await db.get("SELECT COUNT(*) as count FROM settings");
  if (count.count === 0) {
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
    await db.run("INSERT INTO settings (key, value) VALUES (?, ?)", "config", JSON.stringify(defaultSettings));
  }

  return db;
}