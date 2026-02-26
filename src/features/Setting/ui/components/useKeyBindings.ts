import { useEffect, useState } from "react";

export type KeyBindings = Record<number, string>;

const STORAGE_KEY = "mq_keybindings";
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  0: "Q",
  1: "W",
  2: "A",
  3: "S",
};

const normalizeKey = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toUpperCase().replace(/\s+/g, "").slice(0, 1)
    : "";

const sanitizeBindings = (candidate: Partial<KeyBindings> | null | undefined): KeyBindings => {
  const used = new Set<string>();
  const next: KeyBindings = { ...DEFAULT_KEY_BINDINGS };

  for (const slot of [0, 1, 2, 3] as const) {
    const raw = normalizeKey(candidate?.[slot]);
    if (raw && !used.has(raw)) {
      next[slot] = raw;
      used.add(raw);
      continue;
    }
    const fallback = normalizeKey(DEFAULT_KEY_BINDINGS[slot]);
    if (!used.has(fallback)) {
      next[slot] = fallback;
      used.add(fallback);
      continue;
    }
    next[slot] = "";
  }

  return next;
};

const readBindings = (): KeyBindings => {
  if (typeof window === "undefined") return DEFAULT_KEY_BINDINGS;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return sanitizeBindings(JSON.parse(saved) as KeyBindings);
    }
  } catch {
    /* ignore parse errors */
  }
  return { ...DEFAULT_KEY_BINDINGS };
};

const useKeyBindings = () => {
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(readBindings);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(keyBindings),
      );
    } catch {
      /* ignore */
    }
  }, [keyBindings]);

  return { keyBindings, setKeyBindings } as const;
};

export { useKeyBindings };
