export interface RawSurfingData {
  url: string;
  title: string;
  timestamp: string;
  timeSpentSeconds: number;
  category?: string;
}

export interface ProcessedChunk {
  id: string;
  text: string;
  metadata: {
    timestamp: string;
    category: string;
  };
}

export class SurfingPreprocessor {
  /**
   * Processes raw browsing history into highly readable summaries for the LLM.
   * This removes unnecessary URL clutter and focuses on user intent and behavior.
   */
  static processData(rawData: RawSurfingData[]): ProcessedChunk[] {
    return rawData.map((data, index) => {
      // Analyze if this was a distraction or productive based on time and category
      const category = data.category || 'Unknown';
      const isLikelyDistraction = category === 'Entertainment' || category === 'Social Media';
      const durationStr = this.formatDuration(data.timeSpentSeconds);

      // Create a semantic text block for the LLM to understand context
      const semanticText = `User visited "${data.title}" at ${new Date(data.timestamp).toLocaleString()}. 
They spent ${durationStr} on this site. 
Category: ${category}. 
Behavioral Insight: This appears to be a ${isLikelyDistraction ? 'distraction' : 'productive task'}. 
URL Reference: ${data.url}`;

      return {
        id: `chunk_${Date.now()}_${index}`,
        text: semanticText,
        metadata: {
          timestamp: data.timestamp,
          category: category,
        },
      };
    });
  }

  private static formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    return `${Math.round(seconds / 60)} minutes`;
  }
}
