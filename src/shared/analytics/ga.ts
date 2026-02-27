declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "";
const ANALYTICS_ENABLED =
  Boolean(GA_MEASUREMENT_ID) && !import.meta.env.DEV;

let gaInitialized = false;

const ensureDataLayer = () => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
};

export const isGaEnabled = () => ANALYTICS_ENABLED;

export const initGa = () => {
  if (!ANALYTICS_ENABLED || typeof document === "undefined" || gaInitialized) {
    return;
  }

  ensureDataLayer();

  if (!document.querySelector(`script[data-ga-id="${GA_MEASUREMENT_ID}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.dataset.gaId = GA_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  window.gtag?.("js", new Date());
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  });
  gaInitialized = true;
};

export const trackGaPageView = (path: string, title?: string) => {
  if (!ANALYTICS_ENABLED) return;
  initGa();
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
  if (!ANALYTICS_ENABLED) return;
  initGa();
  window.gtag?.("event", eventName, params);
};

export { GA_MEASUREMENT_ID };
