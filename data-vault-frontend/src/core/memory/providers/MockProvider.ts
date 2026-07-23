import { Trace, TraceMetadata, TraceContent, MemoryProvider, MemoryRelation, RelationType } from '../types';
import { memoryStore } from '../MemoryStore';
import { eventBus } from '../EventBus';

export class MockProvider implements MemoryProvider {
  private deterministicData = [
    { category: 'Programming', domain: 'github.com', hubs: [
        { title: 'Python', traces: ['Django', 'FastAPI', 'Pandas', 'NumPy'] },
        { title: 'React', traces: ['Next.js', 'Hooks', 'Fiber', 'Zustand'] },
        { title: 'TypeScript', traces: ['Interfaces', 'Generics', 'Utility Types'] }
    ]},
    { category: 'Finance', domain: 'cnbc.com', hubs: [
        { title: 'Investing', traces: ['Stocks', 'Bonds', 'ETFs'] },
        { title: 'Taxes', traces: ['Deductions', 'Capital Gains', 'W2'] },
        { title: 'Banking', traces: ['Savings', 'Checking', 'Routing Numbers'] }
    ]},
    { category: 'Science', domain: 'wikipedia.org', hubs: [
        { title: 'Physics', traces: ['Quantum Mechanics', 'Relativity', 'Thermodynamics'] },
        { title: 'Biology', traces: ['Genetics', 'Evolution', 'Cell Structure', 'Photosynthesis'] }
    ]},
    { category: 'Entertainment', domain: 'youtube.com', hubs: [
        { title: 'Movies', traces: ['Sci-Fi', 'Action', 'Drama', 'Inception', 'Dune'] },
        { title: 'Games', traces: ['RPG', 'FPS', 'Strategy', 'Elden Ring'] }
    ]}
  ];

  public async extract(): Promise<any[]> {
    const events = [];
    let idCounter = 1;
    const baseTime = new Date('2026-01-01T10:00:00Z').getTime();

    for (const domain of this.deterministicData) {
      // Domain root
      const domainId = `domain-${domain.category}`;
      events.push({
        id: domainId,
        rawTitle: domain.category,
        rawType: 'website',
        category: domain.category,
        timestamp: baseTime + idCounter++ * 1000,
        isDomain: true
      });

      for (const hub of domain.hubs) {
        const hubId = `hub-${hub.title.toLowerCase()}`;
        events.push({
          id: hubId,
          rawTitle: hub.title,
          rawType: 'document',
          category: domain.category,
          timestamp: baseTime + idCounter++ * 1000,
          parentId: domainId
        });

        for (const traceName of hub.traces) {
          events.push({
            id: `trace-${traceName.toLowerCase().replace(/\s+/g, '-')}`,
            rawTitle: traceName,
            rawType: 'document',
            category: domain.category,
            timestamp: baseTime + idCounter++ * 1000,
            parentId: hubId
          });
        }
      }
    }

    return events;
  }

  public normalize(event: any): { trace: Trace; metadata: TraceMetadata; content: TraceContent } {
    const trace: Trace = {
      id: event.id,
      type: event.rawType as any,
      title: event.rawTitle,
    };

    const metadata: TraceMetadata = {
      traceId: event.id,
      createdAt: new Date(event.timestamp),
      updatedAt: new Date(event.timestamp),
      origin: 'mock',
      tags: event.category ? [event.category] : [],
      entities: [],
      // Domain = 1.0, Hub = 0.9, Trace = 0.5
      importance: event.isDomain ? 1.0 : (event.parentId && event.parentId.startsWith('domain') ? 0.9 : 0.5),
      confidence: 1.0,
    };

    const content: TraceContent = {
      traceId: event.id,
    };

    return { trace, metadata, content };
  }

  public relationships(traceId: string): MemoryRelation[] {
    return [];
  }

  public async runPipeline() {
    console.log("Starting deterministic mock data extraction...");
    const rawEvents = await this.extract();
    
    // 1. Normalize and Add to Store
    const normalizedMemories = rawEvents.map(event => ({
      ...this.normalize(event),
      rawEvent: event,
    }));

    normalizedMemories.forEach(({ trace, metadata, content }) => {
      memoryStore.addTrace(trace, metadata, content);
    });

    // 2. Build Relationships
    normalizedMemories.forEach(({ trace, rawEvent }) => {
      if (rawEvent.parentId) {
        memoryStore.addRelation({
          sourceId: trace.id,
          targetId: rawEvent.parentId,
          type: RelationType.BELONGS_TO,
          weight: 1.0,
          timestamp: new Date(rawEvent.timestamp),
        });

        memoryStore.addRelation({
          sourceId: rawEvent.parentId,
          targetId: trace.id,
          type: RelationType.RELATED_TO,
          weight: 0.5,
          timestamp: new Date(rawEvent.timestamp),
        });
      }
    });
    
    console.log(`Pipeline complete: ${memoryStore.getAllTraces().length} traces generated.`);
    eventBus.publish('GRAPH_REBUILD_REQUIRED');
  }
}
