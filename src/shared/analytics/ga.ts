declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const hasRuntimeGtag = () =>
  typeof window !== "undefined" && typeof window.gtag === "function";

export const isGaEnabled = () => hasRuntimeGtag();

export const trackGaPageView = (path: string, title?: string) => {
  if (!hasRuntimeGtag()) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
  });
};

export const trackGaEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) => {
  if (!hasRuntimeGtag()) return;
  window.gtag?.("event", eventName, params);
};
