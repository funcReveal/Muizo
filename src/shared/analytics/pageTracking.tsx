import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackGaPageView } from "./ga";

const normalizePathname = (pathname: string) => {
  if (/^\/rooms\/[^/]+$/.test(pathname)) {
    return "/rooms/:roomId";
  }
  if (/^\/collections\/[^/]+\/edit$/.test(pathname)) {
    return "/collections/:collectionId/edit";
  }
  if (/^\/invited\/[^/]+$/.test(pathname)) {
    return "/invited/:roomId";
  }
  return pathname;
};

const AnalyticsPageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const path = normalizePathname(location.pathname);
    trackGaPageView(path, document.title);
  }, [location.pathname]);

  return null;
};

export default AnalyticsPageTracker;
