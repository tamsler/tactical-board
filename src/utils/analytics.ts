declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | "export"
  | "import_tactics"
  | "formation_applied"
  | "match_format_changed"
  | "pitch_layout_changed"
  | "board_reset"
  | "drawings_cleared"
  | "help_opened";

type EventParams = Record<string, string | number | boolean>;

/** No-ops when gtag is absent (tests, SSR, blocked analytics). */
export function track(event: AnalyticsEvent, params?: EventParams): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, params);
}
