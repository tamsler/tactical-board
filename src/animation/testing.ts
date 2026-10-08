import type { PlaybackClock } from "./playback";

/** Deterministic clock for tests: time only moves when `advance` is called. */
export function createFakeClock() {
  let now = 0;
  let nextHandle = 1;
  const callbacks = new Map<number, (ts: number) => void>();
  const clock: PlaybackClock = {
    now: () => now,
    requestFrame: (cb) => {
      callbacks.set(nextHandle, cb);
      return nextHandle++;
    },
    cancelFrame: (h) => {
      callbacks.delete(h);
    },
  };
  return {
    clock,
    pending: () => callbacks.size,
    /** Advances the clock and runs one animation frame. */
    advance(ms: number) {
      now += ms;
      const due = [...callbacks.values()];
      callbacks.clear();
      due.forEach((cb) => cb(now));
    },
  };
}

const legacyPlayer = (x: number, y: number) => ({
  id: "p1",
  team: "A",
  number: "9",
  x,
  y,
  color: "#ff0000",
  textColor: "#ffffff",
});

const legacyFrame = (id: string, x: number, holdMs: number) => ({
  id,
  title: "",
  players: [legacyPlayer(x, 300)],
  balls: [{ id: "b1", x: x + 20, y: 300 }],
  equipments: [],
  lines: [],
  shapes: [],
  texts: [],
  holdMs,
  durationMs: 1500,
});

const legacySettings = {
  pitchType: "full",
  matchFormat: "11v11",
  halfPitchTeam: "B",
};

/**
 * Documents as earlier builds wrote them, kept as literal JSON so a change to
 * the current writer cannot alter them. Version 3 (1.4.0 to 1.8.0) has curves.
 */
export const V3_DOCUMENT = {
  kind: "tactical-board-document",
  schemaVersion: 3,
  title: "Overlap",
  settings: legacySettings,
  frames: [
    { ...legacyFrame("f1", 100, 400), paths: { p1: { x: 300, y: 120 } } },
    legacyFrame("f2", 500, 800),
  ],
};

/** Version 2 documents predate curved paths. */
export const V2_DOCUMENT = {
  kind: "tactical-board-document",
  schemaVersion: 2,
  title: "Overlap",
  settings: legacySettings,
  frames: [legacyFrame("f1", 100, 400), legacyFrame("f2", 500, 800)],
};

/**
 * A share link produced by 1.8.0 (schema version 3) for
 * docs/agent/examples/minimal-wall-pass.tacticalboard. Never regenerate it:
 * it stands for the links coaches have already sent.
 */
export const V3_SHARE_FRAGMENT =
  "#share=1.7ZTLbhMxFIZfZXTYgORBc3GTxqxaRHdIVYVgUWXhjJ2OVY892J40Icq7o2Nn6IRSISFggfDKx_p9rp-9h3tlBDAIvAmq4TpfWe5ELmwzdNIEIOCbVnb8o3ReWQOsJhBU0BIYfOJaZz33HlUyBGXuPLA99Co07Yddj5qV5uYeCHQ8NO2VdR0PwGC-mQOBluv1ddRK3gGDy-hHyyZIkaTKmuixLDdliZsgeXcBDGhe5zWQaF9Gm-YVHAgsNouprs6rE12d10mHGUx0VV7n5Ymuyks4HA4E1o530gO73YPCTkU7iY99uE4t6DXfSTdR9qNHYHABBMzQraTD8tHgHd69GYyRDghsgdVFQWAHjNKCQGO1Re0LuaaU0uhpG96Op-u4gIDjQg0eWDk_kDFu9UzcxWNcnF2KenaMWp3_WtQlgRXXelI3mrFBWFM1e6zJqy8SWFniHfl5UD0iNrnYWHPsbIIn2tZxcydPc6V1gT60MtPJIIrT60c0e6vGKJgQpclFRbFhW2D0vEoNWMzQafOk2AclQhvJ92EXJy64b6UAAtw5-_AuvqC4BfTgW97HvJapfcetsQFPIy6ZMsFmoZXZQ3xEEZ3X-CasFu89sHOsVAwuvgE8KIui-DbhxGA1YfBmMBk3InMyDM78p_HHNI7e62L252j8OQGpzVkzuI30GXd2MCLCgCGyl7gTci2NkO7Vm-8pyTTf-XiIlT2C5AYzBah6AlBMt-ehTZ90_E8nVZzNCvzvTgirJ4RdKaN8-zvImv-DZM3_xj_3PFnj1NOQn_wby8NX";
