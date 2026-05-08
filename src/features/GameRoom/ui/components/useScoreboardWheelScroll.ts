import React from "react";

export function useScoreboardWheelScroll<T extends HTMLElement>() {
  const scrollRef = React.useRef<T | null>(null);

  const onWheel = React.useCallback(
    (event: React.WheelEvent<HTMLElement>) => {
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
    },
    [],
  );

  return { scrollRef, onWheel };
}
