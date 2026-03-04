import { describe, expect, it } from "vitest";

import {
  isComboMilestone,
  resolveComboBreakTier,
  resolveComboTier,
} from "../gameRoomUiUtils";

describe("GameRoomPage combo helpers", () => {
  it("resolveComboTier follows 2/4/6/8/10 split", () => {
    expect(resolveComboTier(1)).toBe(0);
    expect(resolveComboTier(2)).toBe(1);
    expect(resolveComboTier(3)).toBe(1);
    expect(resolveComboTier(4)).toBe(2);
    expect(resolveComboTier(5)).toBe(2);
    expect(resolveComboTier(6)).toBe(3);
    expect(resolveComboTier(7)).toBe(3);
    expect(resolveComboTier(8)).toBe(4);
    expect(resolveComboTier(9)).toBe(4);
    expect(resolveComboTier(10)).toBe(5);
    expect(resolveComboTier(11)).toBe(5);
  });

  it("isComboMilestone is true only for 2/4/6/8/10", () => {
    expect(isComboMilestone(1)).toBe(false);
    expect(isComboMilestone(2)).toBe(true);
    expect(isComboMilestone(3)).toBe(false);
    expect(isComboMilestone(4)).toBe(true);
    expect(isComboMilestone(6)).toBe(true);
    expect(isComboMilestone(8)).toBe(true);
    expect(isComboMilestone(10)).toBe(true);
    expect(isComboMilestone(12)).toBe(false);
  });

  it("resolveComboBreakTier maps penalty intensity to 1-4", () => {
    expect(resolveComboBreakTier(0)).toBe(0);
    expect(resolveComboBreakTier(-1)).toBe(1);
    expect(resolveComboBreakTier(-4)).toBe(1);
    expect(resolveComboBreakTier(-5)).toBe(2);
    expect(resolveComboBreakTier(-8)).toBe(2);
    expect(resolveComboBreakTier(-9)).toBe(3);
    expect(resolveComboBreakTier(-12)).toBe(3);
    expect(resolveComboBreakTier(-13)).toBe(4);
    expect(resolveComboBreakTier(-25)).toBe(4);
  });
});

