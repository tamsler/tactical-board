import type { Easing } from "./model";

/**
 * Progress along a move at time fraction `u` (0..1). A missing easing is linear.
 * easeInOut is 6u⁵ − 15u⁴ + 10u³, which starts and stops more gently than 3u² − 2u³.
 */
export function ease(u: number, easing?: Easing): number {
  return easing === "easeInOut" ? u * u * u * (u * (6 * u - 15) + 10) : u;
}
