export type TraceType = 'website' | 'conversation' | 'person' | 'idea' | 'project' | 'document' | 'task';

export enum RelationType {
  VISITED_AFTER = 'VISITED_AFTER',
  VISITED_BEFORE = 'VISITED_BEFORE',
  RELATED_TO = 'RELATED_TO',
  PART_OF = 'PART_OF',
  CREATED = 'CREATED',
  REFERENCES = 'REFERENCES',
  MENTIONS = 'MENTIONS',
  DERIVED_FROM = 'DERIVED_FROM',
  BELONGS_TO = 'BELONGS_TO',
  DUPLICATE_OF = 'DUPLICATE_OF'
}

export interface Trace {
  id: string;
  type: TraceType;
  title: string;
}

export interface TraceMetadata {
  traceId: string;
  createdAt: Date;
  updatedAt: Date;
  origin: string;
  tags: string[];
  entities: string[];
  importance: number;
  confidence: number;
  lastViewed?: Date;
  color?: string;
  temperature?: number;
}

export interface TraceContent {
  traceId: string;
  text?: string;
  image?: string;
  attachmentId?: string;
  transcriptId?: string;
}

export interface MemoryRelation {
  sourceId: string;
  targetId: string;
  type: RelationType;
  weight: number;
  timestamp: Date;
}

export interface MemoryProvider {
  extract(): Promise<any[]>;
  normalize(event: any): {
    trace: Trace;
    metadata: TraceMetadata;
    content: TraceContent;
  };
  relationships(traceId: string): MemoryRelation[];
}
