/** Animation UI is enabled by `VITE_ENABLE_ANIMATION=true` at build time or `?animate=1`. */
export function isAnimationFeatureEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_ANIMATION === "true") return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("animate") === "1";
}
