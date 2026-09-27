import React, { useEffect, useRef, useState } from "react";
import { Film, X } from "lucide-react";
import type { AnimationFrame } from "../../animation/model";
import type { VideoFormat, VideoView } from "../../animation/videoExport";
import { downloadBlob, slugify } from "../../utils/fileAccess";
import { track } from "../../utils/analytics";

interface VideoExportDialogProps {
  format: VideoFormat;
  frames: AnimationFrame[];
  view: VideoView;
  title: string;
  onClose: () => void;
}

/** Runs the export on mount; closing or cancelling aborts it. */
export const VideoExportDialog: React.FC<VideoExportDialogProps> = ({
  format,
  frames,
  view,
  title,
  onClose,
}) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef({ frames, view, format, title });
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const controller = new AbortController();
    const job = started.current;
    (async () => {
      try {
        const { exportAnimationVideo } =
          await import("../../animation/videoExport");
        const blob = await exportAnimationVideo({
          frames: job.frames,
          view: job.view,
          format: job.format,
          signal: controller.signal,
          onProgress: setProgress,
        });
        downloadBlob(blob, `${slugify(job.title, "tactics")}.${job.format}`);
        track("export", { format: job.format });
        onCloseRef.current();
      } catch (e) {
        if (controller.signal.aborted) return;
        setError((e as Error).message || "The video could not be created.");
      }
    })();
    return () => controller.abort();
  }, []);

  const percent = Math.round(progress * 100);

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-title"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-3 text-slate-200 text-xs"
      >
        <div className="flex items-center justify-between">
          <h2
            id="video-title"
            className="flex items-center gap-2 font-bold text-base text-slate-100"
          >
            <Film className="w-5 h-5 text-emerald-400" />
            Export video ({format.toUpperCase()})
          </h2>
          <button
            type="button"
            onClick={onClose}
            title={error ? "Close" : "Cancel export"}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">{error ? "Close" : "Cancel export"}</span>
          </button>
        </div>

        {error ? (
          <p role="alert" className="text-rose-400">
            {error}
          </p>
        ) : (
          <>
            <div
              role="progressbar"
              aria-label="Export progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-2 rounded-full bg-slate-800 overflow-hidden"
            >
              <div
                className="h-full bg-emerald-500 transition-[width]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Rendering frames… {percent}%</span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
