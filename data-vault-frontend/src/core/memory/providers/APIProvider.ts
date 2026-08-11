import { Trace, TraceMetadata, TraceContent, MemoryProvider, MemoryRelation, RelationType } from '../types';
import { memoryStore } from '../MemoryStore';
import { eventBus } from '../EventBus';

export class APIProvider implements MemoryProvider {
  private backendUrl = 'http://localhost:4000';

  public async extract(): Promise<any[]> {
    try {
      const res = await fetch(`${this.backendUrl}/vault`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data; // Array of browsing_data rows
    } catch (err) {
      console.error("Failed to fetch from backend:", err);
      return [];
    }
  }

  public normalize(event: any): { trace: Trace; metadata: TraceMetadata; content: TraceContent } {
    const trace: Trace = {
      id: event.id.toString(), // DB uses integer IDs typically
      type: 'website',
      title: event.title || event.url,
    };

    let topics = [];
    try {
      topics = JSON.parse(event.topics || "[]");
    } catch (e) {}

    const metadata: TraceMetadata = {
      traceId: trace.id,
      createdAt: new Date(event.timestamp || event.created_at),
      updatedAt: new Date(event.timestamp || event.created_at),
      origin: 'extension',
      tags: topics,
      entities: [],
      // For real data, we can assign importance based on if it's a domain or page.
      // But in our pipeline, we will generate domain traces manually from the events.
      importance: 0.5,
      confidence: 1.0,
    };

    const content: TraceContent = {
      traceId: trace.id,
      text: event.summary,
    };

    return { trace, metadata, content };
  }

  public relationships(traceId: string): MemoryRelation[] {
    return [];
  }

  public async runPipeline() {
    console.log("Fetching live data from extension backend...");
    
    // Clear existing store if we want a fresh load, but MemoryStore doesn't have a clear method.
    // For now, it will just overwrite or append based on ID.
    
    const rawEvents = await this.extract();
    
    if (rawEvents.length === 0) {
      console.log("No data found or backend is down.");
      eventBus.publish('GRAPH_REBUILD_REQUIRED');
      return;
    }

    const domains = new Set<string>();

    // 1. Process all pages
    const normalizedMemories = rawEvents.map(event => {
      if (event.domain) domains.add(event.domain);
      return {
        ...this.normalize(event),
        rawEvent: event,
      };
    });

    // 2. Create Domain Root nodes
    domains.forEach(domain => {
      const domainId = `domain-${domain}`;
      memoryStore.addTrace(
        { id: domainId, type: 'project', title: domain },
        { traceId: domainId, createdAt: new Date(), updatedAt: new Date(), origin: 'system', tags: [], entities: [], importance: 1.0, confidence: 1.0 },
        { traceId: domainId }
      );
    });

    // 3. Add Page Nodes and Relationships
    normalizedMemories.forEach(({ trace, metadata, content, rawEvent }) => {
      // Set importance higher if the page has a high sensitivity or many topics
      metadata.importance = rawEvent.sensitivity_level === 'high' ? 0.8 : 0.6;
      
      memoryStore.addTrace(trace, metadata, content);

      // Link page to its domain
      if (rawEvent.domain) {
        const domainId = `domain-${rawEvent.domain}`;
        memoryStore.addRelation({
          sourceId: domainId,
          targetId: trace.id,
          type: RelationType.BELONGS_TO,
          weight: 1.0,
          timestamp: metadata.createdAt,
        });
      }
    });
    
    console.log(`Pipeline complete: ${memoryStore.getAllTraces().length} traces populated from live data.`);
    eventBus.publish('GRAPH_REBUILD_REQUIRED');
  }
}
