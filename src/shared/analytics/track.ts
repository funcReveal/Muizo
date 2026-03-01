import { trackGaEvent } from "./ga";

type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export const trackEvent = (eventName: string, params?: AnalyticsParams) => {
  trackGaEvent(eventName, params);
};
