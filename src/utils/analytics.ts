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
  | "help_opened"
  | "animation_created"
  | "animation_frame_added"
  | "animation_played"
  | "animation_save_failed"
  | "frame_pacing_changed"
  | "share_link_copied"
  | "ai_paste_opened"
  | "ai_paste_feedback_copied"
  | "ai_paste_abandoned"
  | "video_export_failed";

type EventParams = Record<string, string | number | boolean>;

/**
 * No-ops when gtag is absent (tests, SSR, blocked analytics), and never lets
 * an analytics failure reach the feature that reported it.
 *
 * Parameters are counts, booleans and fixed category values only; see
 * openspec/specs/usage-analytics/spec.md for what must never be sent.
 */
export function track(event: AnalyticsEvent, params?: EventParams): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
  } catch {
    // Analytics is best-effort.
  }
}
