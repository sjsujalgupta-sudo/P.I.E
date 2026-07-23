import { GraphNode, GraphEdge } from '../graph/types';
import { SpatialGraph } from '../graph/SpatialGraph';
import { LayoutStrategy } from './LayoutStrategy';

export class LayoutEngine {
  private strategy: LayoutStrategy | null = null;
  private onUpdateCallback: ((graph: SpatialGraph) => void) | null = null;

  public setStrategy(strategy: LayoutStrategy) {
    if (this.strategy) {
      this.strategy.terminate();
    }
    this.strategy = strategy;
    if (this.onUpdateCallback) {
      this.strategy.setOnUpdate(this.onUpdateCallback);
    }
  }

  public setOnUpdate(callback: (graph: SpatialGraph) => void) {
    this.onUpdateCallback = callback;
    if (this.strategy) {
      this.strategy.setOnUpdate(callback);
    }
  }

  public initLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    if (this.strategy) {
      this.strategy.init(nodes, edges);
    }
  }

  public terminate() {
    if (this.strategy) {
      this.strategy.terminate();
    }
  }
}
