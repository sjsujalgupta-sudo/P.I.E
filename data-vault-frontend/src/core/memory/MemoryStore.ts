import { Trace, TraceMetadata, TraceContent, MemoryRelation } from './types';
import { eventBus } from './EventBus';

export class MemoryStore {
  private traces: Map<string, Trace> = new Map();
  private metadata: Map<string, TraceMetadata> = new Map();
  private contents: Map<string, TraceContent> = new Map();
  private relations: Map<string, MemoryRelation[]> = new Map(); // Keyed by sourceId

  // Add or update a Trace and its pieces
  public addTrace(trace: Trace, metadata: TraceMetadata, content: TraceContent) {
    const isNew = !this.traces.has(trace.id);
    
    this.traces.set(trace.id, trace);
    this.metadata.set(trace.id, metadata);
    this.contents.set(trace.id, content);

    if (isNew) {
      eventBus.publish('TRACE_ADDED', { traceId: trace.id });
    } else {
      eventBus.publish('TRACE_UPDATED', { traceId: trace.id });
    }
  }

  // Add a relationship between two Traces
  public addRelation(relation: MemoryRelation) {
    if (!this.relations.has(relation.sourceId)) {
      this.relations.set(relation.sourceId, []);
    }
    
    const sourceRels = this.relations.get(relation.sourceId)!;
    // Simple deduplication based on targetId and type
    const exists = sourceRels.find(r => r.targetId === relation.targetId && r.type === relation.type);
    
    if (!exists) {
      sourceRels.push(relation);
      eventBus.publish('RELATION_ADDED', { relation });
    }
  }

  public getTrace(id: string): Trace | undefined {
    return this.traces.get(id);
  }

  public getMetadata(id: string): TraceMetadata | undefined {
    return this.metadata.get(id);
  }

  public getContent(id: string): TraceContent | undefined {
    return this.contents.get(id);
  }

  public getAllTraces(): Trace[] {
    return Array.from(this.traces.values());
  }

  public getRelations(sourceId: string): MemoryRelation[] {
    return this.relations.get(sourceId) || [];
  }

  public getAllRelations(): MemoryRelation[] {
    const allRels: MemoryRelation[] = [];
    for (const rels of this.relations.values()) {
      allRels.push(...rels);
    }
    return allRels;
  }
}

export const memoryStore = new MemoryStore();
