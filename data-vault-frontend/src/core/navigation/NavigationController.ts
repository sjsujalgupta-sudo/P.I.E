import { SpatialGraph } from '../graph/SpatialGraph';
import { useNavigationStore, NavigationNode } from './NavigationStore';
import { SessionRecorder } from '../debug/SessionRecorder';

export class NavigationController {
  private static graph: SpatialGraph | null = null;

  public static setGraph(graph: SpatialGraph) {
    this.graph = graph;
  }

  public static transitionTo(nodeId: string) {
    SessionRecorder.log('NavigationController.transitionTo', { nodeId });
    if (!this.graph) {
      SessionRecorder.log('NavigationController.transitionTo - rejected', { reason: 'No graph' });
      return;
    }
    
    const node = this.graph.nodes.find(n => n.id === nodeId);
    if (!node) {
      SessionRecorder.log('NavigationController.transitionTo - rejected', { reason: 'Node not found' });
      return;
    }

    const path: NavigationNode[] = [{ id: 'root', name: 'World', level: 'overview' }];
    
    const domainName = node.group || 'Unknown Domain';
    const domainId = `domain-${domainName}`;

    if (node.nodeClass === 'Landmark') {
      path.push({ id: domainId, name: domainName, level: 'domain' });
      if (node.id !== domainId) {
        path.push({ id: node.id, name: node.title || node.id, level: 'place' });
      }
      
      SessionRecorder.log('NavigationController - state change', { level: 'place', currentNodeId: node.id, path });
      useNavigationStore.getState().setPath(path);
      useNavigationStore.getState().setLevel('place');
      useNavigationStore.getState().setCurrentNodeId(node.id);
      
    } else if (node.nodeClass === 'Normal') {
      path.push({ id: domainId, name: domainName, level: 'domain' });
      if (node.id !== domainId) {
        path.push({ id: node.id, name: node.title || node.id, level: 'trace' });
      }
      
      SessionRecorder.log('NavigationController - state change', { level: 'trace', currentNodeId: node.id, path });
      useNavigationStore.getState().setPath(path);
      useNavigationStore.getState().setLevel('trace');
      useNavigationStore.getState().setCurrentNodeId(node.id);
    }
  }

  public static navigateUp() {
    const state = useNavigationStore.getState();
    if (state.path.length > 1) {
      const newPath = [...state.path];
      newPath.pop(); // remove current
      
      const target = newPath[newPath.length - 1];
      useNavigationStore.getState().setPath(newPath);
      useNavigationStore.getState().setLevel(target.level);
      useNavigationStore.getState().setCurrentNodeId(target.id === 'root' ? null : target.id);
    }
  }

  public static transitionToOverview() {
    useNavigationStore.getState().setPath([{ id: 'root', name: 'World', level: 'overview' }]);
    useNavigationStore.getState().setLevel('overview');
    useNavigationStore.getState().setCurrentNodeId(null);
  }
}
