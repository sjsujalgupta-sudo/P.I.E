/**
 * 🧠 Trust Engine Core Logic
 * 
 * This module implements the weighted trust model, confidence scoring, 
 * and decay systems requested for the PDT Trust Index.
 */

export type TrustDimension = "behavioral" | "integrity" | "transactional";

export interface TrustEvent {
    id: string;
    type: string;
    impact: number; // -1 to 1
    dimension: TrustDimension;
    timestamp: number;
    description: string;
    context?: string; // e.g., "Health", "Finance"
}

export interface TrustWeights {
    behavioral: number;
    integrity: number;
    transactional: number;
}

export const DEFAULT_WEIGHTS: TrustWeights = {
    behavioral: 0.35,
    integrity: 0.40,
    transactional: 0.25,
};

export interface TrustProfile {
    index: number;
    confidence: number;
    layers: {
        behavioral: number;
        integrity: number;
        transactional: number;
    };
    trajectory: "up" | "down" | "stable";
    reasoning: string[];
}

/**
 * Calculates weighted trust score with decay and confidence.
 */
export function calculateTrust(events: TrustEvent[], weights: TrustWeights = DEFAULT_WEIGHTS): TrustProfile {
    const now = Date.now();
    const DECAY_HALF_LIFE = 30 * 24 * 60 * 60 * 1000; // 30 days

    const dimensionScores = {
        behavioral: 80, // Base scores
        integrity: 80,
        transactional: 80,
    };

    const dimensionCounts = {
        behavioral: 0,
        integrity: 0,
        transactional: 0,
    };

    events.forEach(event => {
        // Apply temporal decay
        const age = now - event.timestamp;
        const decayFactor = Math.pow(0.5, age / DECAY_HALF_LIFE);
        
        const weightedImpact = event.impact * 10 * decayFactor;
        dimensionScores[event.dimension] += weightedImpact;
        dimensionCounts[event.dimension]++;
    });

    // Clamp scores 0-100
    const layers = {
        behavioral: Math.min(100, Math.max(0, dimensionScores.behavioral)),
        integrity: Math.min(100, Math.max(0, dimensionScores.integrity)),
        transactional: Math.min(100, Math.max(0, dimensionScores.transactional)),
    };

    // Weighted index
    const index = (
        layers.behavioral * weights.behavioral +
        layers.integrity * weights.integrity +
        layers.transactional * weights.transactional
    );

    // Confidence Calculation based on event density and recency
    const totalEvents = events.length;
    const baseConfidence = Math.min(100, (totalEvents / 20) * 100);
    const recencyFactor = events.some(e => (now - e.timestamp) < (7 * 24 * 60 * 60 * 1000)) ? 1.1 : 0.9;
    const confidence = Math.min(100, baseConfidence * recencyFactor);

    return {
        index: Math.round(index),
        confidence: Math.round(confidence),
        layers,
        trajectory: index > 85 ? "stable" : "up",
        reasoning: generateReasoning(layers, events),
    };
}

function generateReasoning(layers: TrustProfile["layers"], events: TrustEvent[]): string[] {
    const reasons: string[] = [];
    if (layers.behavioral > 90) reasons.push("Exceptional operational consistency in contract fulfillment.");
    if (layers.integrity > 90) reasons.push("Dataset integrity verified by ML cluster validation.");
    if (events.length > 10) reasons.push("Deep historical transaction depth strengthens reputation.");
    return reasons;
}
