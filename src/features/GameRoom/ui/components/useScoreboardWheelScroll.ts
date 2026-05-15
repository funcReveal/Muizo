import React from "react";
import useAutoHideScrollbar from "@shared/hooks/useAutoHideScrollbar";

export function useScoreboardWheelScroll<T extends HTMLElement>(
  inactiveDelayMs = 720,
) {
  const scrollRef = React.useRef<T | null>(null);
  const attachAutoHideScrollbar = useAutoHideScrollbar<T>(inactiveDelayMs);

  const setScrollNodeRef = React.useCallback(
    (node: T | null) => {
      scrollRef.current = node;
      attachAutoHideScrollbar(node);
    },
    [attachAutoHideScrollbar],
  );

  const onWheel = React.useCallback((event: React.WheelEvent<HTMLElement>) => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || event.deltaY === 0) return;

    const target = event.target;
    if (target instanceof Node && scrollElement.contains(target)) {
      return;
    }

    const maxScrollTop =
      scrollElement.scrollHeight - scrollElement.clientHeight;

    if (maxScrollTop <= 0) return;

    const nextScrollTop = Math.max(
      0,
      Math.min(maxScrollTop, scrollElement.scrollTop + event.deltaY),
    );

    if (nextScrollTop === scrollElement.scrollTop) return;

    scrollElement.scrollTop = nextScrollTop;
    event.preventDefault();
  }, []);

  return {
    scrollRef,
    setScrollNodeRef,
    onWheel,
  };
}
