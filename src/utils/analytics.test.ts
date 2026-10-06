import { describe, it, expect, afterEach, vi } from "vitest";
import { track } from "./analytics";
import { stopRecording } from "./analyticsRecorder";

describe("track", () => {
  afterEach(stopRecording);

  it("forwards the event and its parameters to gtag", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    track("export", { format: "png" });
    expect(gtag).toHaveBeenCalledWith("event", "export", { format: "png" });
  });

  it("does nothing when analytics is not loaded", () => {
    expect(() => track("help_opened")).not.toThrow();
  });

  it("does not let an analytics failure reach the caller", () => {
    window.gtag = () => {
      throw new Error("blocked");
    };
    expect(() => track("help_opened")).not.toThrow();
  });
});
