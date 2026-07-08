/**
 * AI EMBEDDINGS MANAGER
 *
 * This file handles AI-powered text embeddings for semantic search.
 * Embeddings are vector representations of text that allow for
 * meaning-based search rather than just keyword matching.
 *
 * Uses the Xenova/transformers library with the all-MiniLM-L6-v2 model,
 * which runs locally in the browser/node environment (no API calls needed).
 *
 * For beginners: Think of embeddings as "meaning fingerprints" for text.
 * Similar meanings have similar fingerprints, enabling smart search.
 */

import { pipeline } from "@xenova/transformers";

let embedder;

export async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return embedder;
}
