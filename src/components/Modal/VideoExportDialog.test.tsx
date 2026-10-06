import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { VideoView } from "../../animation/videoExport";
import { recordEvents, stopRecording } from "../../utils/analyticsRecorder";
import { dismissToast, toastStore } from "../../utils/toast";
import { VideoExportDialog } from "./VideoExportDialog";

const exporter = vi.hoisted(() => {
  class VideoExportUnsupportedError extends Error {}
  return { VideoExportUnsupportedError, exportAnimationVideo: vi.fn() };
});
vi.mock("../../animation/videoExport", () => exporter);

const renderDialog = (format: "mp4" | "mov", onClose = () => {}) =>
  render(
    <VideoExportDialog
      format={format}
      frames={[]}
      view={{} as VideoView}
      title="U12 Lions"
      onClose={onClose}
    />,
  );

describe("VideoExportDialog", () => {
  beforeEach(() => {
    exporter.exportAnimationVideo.mockReset();
    toastStore.getSnapshot().forEach((t) => dismissToast(t.id));
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    stopRecording();
    vi.restoreAllMocks();
  });

  it("reports a browser that cannot encode video", async () => {
    exporter.exportAnimationVideo.mockRejectedValue(
      new exporter.VideoExportUnsupportedError("This browser cannot encode"),
    );
    const events = recordEvents();
    renderDialog("mp4");

    await screen.findByRole("alert");
    expect(events).toEqual([
      {
        name: "video_export_failed",
        params: { format: "mp4", reason: "unsupported" },
      },
    ]);
  });

  it("reports any other failure as an error, without its message", async () => {
    exporter.exportAnimationVideo.mockRejectedValue(
      new Error("encoder crashed on U12 Lions"),
    );
    const events = recordEvents();
    renderDialog("mov");

    await screen.findByRole("alert");
    expect(events).toEqual([
      { name: "video_export_failed", params: { format: "mov", reason: "error" } },
    ]);
  });

  it("reports nothing for a cancelled export", async () => {
    exporter.exportAnimationVideo.mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise((_, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const events = recordEvents();
    const { unmount } = renderDialog("mp4");
    await waitFor(() =>
      expect(exporter.exportAnimationVideo).toHaveBeenCalled(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    unmount(); // closing the dialog unmounts it, which aborts the export
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(events).toEqual([]);
  });

  it("reports a finished export as an export, not a failure", async () => {
    exporter.exportAnimationVideo.mockResolvedValue(new Blob(["video"]));
    const events = recordEvents();
    const onClose = vi.fn();
    renderDialog("mov", onClose);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(events).toEqual([{ name: "export", params: { format: "mov" } }]);
  });
});
