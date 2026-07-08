/**
 * EMBEDDINGS GENERATOR
 *
 * This file handles the creation of vector embeddings for browsing data.
 * Embeddings are numerical representations of text that allow for semantic
 * search - finding content based on meaning rather than exact keywords.
 *
 * Uses the Xenova/transformers library with the all-MiniLM-L6-v2 model,
 * which runs locally in the browser/Node.js without requiring API calls.
 *
 * For beginners: Think of embeddings as "meaning fingerprints" for your data.
 * Similar content will have similar fingerprints, enabling smart search.
 */

import { pipeline } from "@xenova/transformers";

let embedder;

export async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return embedder;
}
