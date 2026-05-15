import { useCallback, useEffect, useRef } from "react";

export const useAutoHideScrollbar = <T extends HTMLElement>(
  inactiveDelayMs = 720,
) => {
  const cleanupRef = useRef<(() => void) | null>(null);

  const attachRef = useCallback(
    (node: T | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;

      if (!node || typeof window === "undefined") {
        return;
      }

      node.classList.remove("is-scrolling");

      let initialResetFrame: number | null = window.requestAnimationFrame(
        () => {
          node.classList.remove("is-scrolling");
          initialResetFrame = null;
        },
      );

      let hideTimer: number | null = null;

      const clearHideTimer = () => {
        if (hideTimer !== null) {
          window.clearTimeout(hideTimer);
          hideTimer = null;
        }
      };

      const hideScrollbar = () => {
        node.classList.remove("is-scrolling");
        hideTimer = null;
      };

      const markScrolling = () => {
        node.classList.add("is-scrolling");
        clearHideTimer();
        hideTimer = window.setTimeout(hideScrollbar, inactiveDelayMs);
      };

      node.addEventListener("scroll", markScrolling, { passive: true });

      cleanupRef.current = () => {
        node.removeEventListener("scroll", markScrolling);

        if (initialResetFrame !== null) {
          window.cancelAnimationFrame(initialResetFrame);
          initialResetFrame = null;
        }

        clearHideTimer();
        node.classList.remove("is-scrolling");
      };
    },
    [inactiveDelayMs],
  );

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return attachRef;
};

export default useAutoHideScrollbar;
