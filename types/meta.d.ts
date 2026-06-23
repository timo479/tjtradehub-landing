interface FbqFn {
  (action: "init", pixelId: string): void;
  (action: "track", event: string, params?: Record<string, unknown>): void;
  (action: "trackCustom", event: string, params?: Record<string, unknown>): void;
  (action: "consent", state: "grant" | "revoke"): void;
  (...args: unknown[]): void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

export {};
