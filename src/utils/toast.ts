export type ToastTone = "success" | "error";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const DURATION_MS = { success: 4000, error: 8000 } as const;
const MAX_VISIBLE = 3;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function dismissToast(id: number): void {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

/** Shows a short, auto-dismissing confirmation. Safe to call from anywhere. */
export function showToast(message: string, tone: ToastTone = "success"): void {
  const id = nextId++;
  toasts = [...toasts, { id, message, tone }].slice(-MAX_VISIBLE);
  emit();
  setTimeout(() => dismissToast(id), DURATION_MS[tone]);
}

export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => toasts,
};
