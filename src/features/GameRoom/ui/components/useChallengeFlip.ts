/**
 * useChallengeFlip
 *
 * FLIP animation for the challenge leaderboard.
 * When rows change position (e.g. after an answer reveal updates rankings),
 * each row animates smoothly from its previous DOM position to the new one
 * using the Web Animations API.
 *
 * FLIP steps:
 *   1. Read current getBoundingClientRect().top for every tracked element.
 *   2. Compare against positions stored from the previous settled render.
 *   3. For any element that moved, animate translateY(delta → 0).
 *
 * Critical invariant — bail out while animating:
 *   getBoundingClientRect() includes CSS transforms applied by the WAAPI. A
 *   mid-animation read returns the visual (transformed) position, not the
 *   layout position. If we compare that against prevTopMap (layout positions)
 *   we compute a bogus delta, call cancelAll(), and restart a wrong animation
 *   on every score-update re-render. The fix is a simple early return: skip
 *   the entire effect body while any animation is in progress.
 *
 * Stable ref callbacks (callbackCache):
 *   refFor(key) must return the SAME function reference across renders for a
 *   given key. If a new reference is returned, React treats it as a new ref:
 *   it calls the old callback with null (cleanup), which deletes the key from
 *   prevTopMap, destroying the position history before useLayoutEffect runs.
 *   callbackCache keeps one callback per key, created once and reused.
 *
 * Only rows present in BOTH the previous and current settled render are
 * animated. Newly added / removed rows appear/disappear without animation.
 * Placeholder rows must NOT be wrapped — they are visual spacers only.
 */

import { useRef, useLayoutEffect, useCallback, useEffect } from "react";

const FLIP_BASE_MS   = 550;
const FLIP_MAX_MS    = 950;
const FLIP_ROW_PX    = 44;   // approximate row height used for duration scaling
const FLIP_MIN_DELTA = 2;    // ignore sub-pixel noise

export function useChallengeFlip() {
  const elementMap    = useRef(new Map<string, HTMLElement>());
  const prevTopMap    = useRef(new Map<string, number>());
  const animsRef      = useRef<Animation[]>([]);
  const callbackCache = useRef(new Map<string, (node: HTMLElement | null) => void>());

  const cancelAll = useCallback(() => {
    animsRef.current.forEach((a) => a.cancel());
    animsRef.current = [];
  }, []);

  useLayoutEffect(() => {
    // getBoundingClientRect() includes WAAPI transforms, so mid-animation reads
    // return the visual position, not the layout position. Reading now would
    // produce bogus deltas that cancel the running animation and start a wrong
    // counter-animation on every re-render. Wait until all animations settle.
    if (animsRef.current.length > 0) return;

    // 1. Capture current layout positions (no transforms active at this point)
    const nextTop = new Map<string, number>();
    elementMap.current.forEach((el, key) => {
      nextTop.set(key, el.getBoundingClientRect().top);
    });

    // 2. Animate rows that moved since the last settled render
    if (prevTopMap.current.size > 0) {
      const moves: Array<{ el: HTMLElement; deltaY: number }> = [];

      nextTop.forEach((top, key) => {
        const prev = prevTopMap.current.get(key);
        if (prev === undefined) return; // newly added row — skip
        const deltaY = prev - top;
        if (Math.abs(deltaY) < FLIP_MIN_DELTA) return;
        const el = elementMap.current.get(key);
        if (!el) return;
        moves.push({ el, deltaY });
      });

      if (moves.length > 0) {
        moves.forEach(({ el, deltaY }) => {
          const distRows  = Math.max(1, Math.min(6, Math.abs(deltaY) / FLIP_ROW_PX));
          const dur       = Math.min(FLIP_MAX_MS, Math.round(FLIP_BASE_MS + (distRows - 1) * 130));
          const overshoot = deltaY > 0 ? -6 : 6;

          const anim = el.animate(
            [
              { transform: `translateY(${deltaY}px)`, opacity: 0.7 },
              { transform: `translateY(${Math.round(deltaY * 0.5)}px)`, opacity: 1, offset: 0.45 },
              { transform: `translateY(${overshoot}px)`,               opacity: 1, offset: 0.85 },
              { transform: "translateY(0)",                             opacity: 1 },
            ],
            {
              duration: dur,
              easing:   "cubic-bezier(0.25, 0.8, 0.25, 1)",
              fill:     "both",
            },
          );

          const cleanup = () => {
            animsRef.current = animsRef.current.filter((a) => a !== anim);
          };
          anim.onfinish = cleanup;
          anim.oncancel = cleanup;
          animsRef.current.push(anim);
        });
      }
    }

    // 3. Store settled positions for the next comparison
    prevTopMap.current = nextTop;
  });

  useEffect(
    () => () => {
      cancelAll();
      prevTopMap.current.clear();
      callbackCache.current.clear();
    },
    [cancelAll],
  );

  /**
   * Returns a stable ref callback for the given key.
   *
   * The same function reference is returned for the same key on every render,
   * preventing React from triggering ref cleanup/setup cycles that would
   * destroy the position history stored in prevTopMap.
   *
   * Pass the same string as the React `key` prop on the wrapper div.
   * Do NOT use for placeholder rows.
   */
  const refFor = useCallback((key: string) => {
    let cb = callbackCache.current.get(key);
    if (!cb) {
      cb = (node: HTMLElement | null) => {
        if (node) {
          elementMap.current.set(key, node);
        } else {
          elementMap.current.delete(key);
          // Remove stale position so a re-mounted element won't animate from
          // the old spot.
          prevTopMap.current.delete(key);
          callbackCache.current.delete(key);
        }
      };
      callbackCache.current.set(key, cb);
    }
    return cb;
  }, []);

  return { refFor };
}
