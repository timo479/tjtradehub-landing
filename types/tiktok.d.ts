interface TiktokPixel {
  page: () => void;
  track: (event: string, params?: Record<string, unknown>) => void;
  holdConsent: () => void;
  grantConsent: () => void;
  revokeConsent: () => void;
  load: (pixelId: string) => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    ttq?: TiktokPixel;
  }
}

export {};
