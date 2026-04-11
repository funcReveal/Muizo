import { useCallback, useEffect, useRef } from "react";

export const useAutoHideScrollbar = <T extends HTMLElement>(
  inactiveDelayMs = 720,
) => {
  const cleanupRef = useRef<(() => void) | null>(null);

  const attachRef = useCallback((node: T | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!node || typeof window === "undefined") {
      return;
    }

    let hideTimer: number | null = null;

    const clearHideTimer = () => {
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const markScrolling = () => {
      node.classList.add("is-scrolling");
      clearHideTimer();
      hideTimer = window.setTimeout(() => {
        node.classList.remove("is-scrolling");
        hideTimer = null;
      }, inactiveDelayMs);
    };

    node.addEventListener("scroll", markScrolling, { passive: true });

    cleanupRef.current = () => {
      node.removeEventListener("scroll", markScrolling);
      clearHideTimer();
      node.classList.remove("is-scrolling");
    };
  }, [inactiveDelayMs]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return attachRef;
};

export default useAutoHideScrollbar;
