export interface SessionEvent {
  time: number;
  type: string;
  payload: any;
}

class SessionRecorderClass {
  private events: SessionEvent[] = [];
  private readonly MAX_EVENTS = 5000;
  private startTime = Date.now();

  public log(type: string, payload: any = {}) {
    const time = Date.now() - this.startTime;
    this.events.push({ time, type, payload });
    
    // Circular buffer
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }
    
    console.log(`[SessionRecorder] ${time}ms | ${type}`, payload);
  }

  public exportSession() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.events, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `synapse_session_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

export const SessionRecorder = new SessionRecorderClass();
