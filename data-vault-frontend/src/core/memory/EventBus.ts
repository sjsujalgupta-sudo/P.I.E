export type EventType = 
  | 'TRACE_ADDED' 
  | 'TRACE_UPDATED' 
  | 'RELATION_ADDED'
  | 'GRAPH_REBUILD_REQUIRED';

type EventHandler = (payload?: any) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<EventType, Set<EventHandler>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe(eventType: EventType, handler: EventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  public publish(eventType: EventType, payload?: any) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`Error in event handler for ${eventType}:`, e);
        }
      });
    }
  }
}

export const eventBus = EventBus.getInstance();
