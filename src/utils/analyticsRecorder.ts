// Test helper: stands in for Google Analytics and keeps what `track` sent.
export interface RecordedEvent {
  name: string;
  params?: Record<string, unknown>;
}

export function recordEvents(): RecordedEvent[] {
  const events: RecordedEvent[] = [];
  window.gtag = (_command, name, params) => {
    events.push({ name: name as string, params: params as RecordedEvent["params"] });
  };
  return events;
}

export function stopRecording(): void {
  delete window.gtag;
}
