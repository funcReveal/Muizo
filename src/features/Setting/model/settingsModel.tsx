import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  parseStoredSfxPreset,
  type SfxPresetId,
} from "../../Room/model/sfx/gameSfxEngine";
import {
  DEFAULT_KEY_BINDINGS,
  DEFAULT_SFX_ENABLED,
  DEFAULT_SFX_PRESET,
  DEFAULT_SFX_VOLUME,
  KEY_BINDINGS_STORAGE_KEY,
  SFX_STORAGE_KEYS,
  SettingsModelContext,
  type KeyBindingSetter,
  type KeyBindings,
  type SettingsModelValue,
} from "./settingsContext";

const clampVolume = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_SFX_VOLUME;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const normalizeKey = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toUpperCase().replace(/\s+/g, "").slice(0, 1)
    : "";

const sanitizeBindings = (
  candidate: Partial<KeyBindings> | null | undefined,
): KeyBindings => {
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

const readStoredBindings = (): KeyBindings => {
  if (typeof window === "undefined") return DEFAULT_KEY_BINDINGS;
  try {
    const saved = window.localStorage.getItem(KEY_BINDINGS_STORAGE_KEY);
    if (saved) {
      return sanitizeBindings(JSON.parse(saved) as KeyBindings);
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_KEY_BINDINGS };
};

const readStoredBool = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  return fallback;
};

const readStoredNumber = (key: string, fallback: number) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  return clampVolume(Number(raw));
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [keyBindings, setKeyBindingsState] = useState<KeyBindings>(
    readStoredBindings,
  );
  const [sfxEnabled, setSfxEnabledState] = useState<boolean>(() =>
    readStoredBool(SFX_STORAGE_KEYS.enabled, DEFAULT_SFX_ENABLED),
  );
  const [sfxVolume, setSfxVolumeState] = useState<number>(() =>
    readStoredNumber(SFX_STORAGE_KEYS.volume, DEFAULT_SFX_VOLUME),
  );
  const [sfxPreset, setSfxPresetState] = useState<SfxPresetId>(() => {
    if (typeof window === "undefined") return DEFAULT_SFX_PRESET;
    return parseStoredSfxPreset(
      window.localStorage.getItem(SFX_STORAGE_KEYS.preset),
    );
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        KEY_BINDINGS_STORAGE_KEY,
        JSON.stringify(keyBindings),
      );
    } catch {
      // ignore storage errors
    }
  }, [keyBindings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SFX_STORAGE_KEYS.enabled, sfxEnabled ? "1" : "0");
  }, [sfxEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SFX_STORAGE_KEYS.volume, String(sfxVolume));
  }, [sfxVolume]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SFX_STORAGE_KEYS.preset, sfxPreset);
  }, [sfxPreset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key === KEY_BINDINGS_STORAGE_KEY && event.newValue) {
        try {
          setKeyBindingsState(
            sanitizeBindings(JSON.parse(event.newValue) as KeyBindings),
          );
        } catch {
          // ignore parse errors
        }
        return;
      }
      if (event.key === SFX_STORAGE_KEYS.enabled) {
        setSfxEnabledState(readStoredBool(SFX_STORAGE_KEYS.enabled, DEFAULT_SFX_ENABLED));
        return;
      }
      if (event.key === SFX_STORAGE_KEYS.volume) {
        setSfxVolumeState(readStoredNumber(SFX_STORAGE_KEYS.volume, DEFAULT_SFX_VOLUME));
        return;
      }
      if (event.key === SFX_STORAGE_KEYS.preset) {
        setSfxPresetState(
          parseStoredSfxPreset(window.localStorage.getItem(SFX_STORAGE_KEYS.preset)),
        );
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setKeyBindings: KeyBindingSetter = useCallback((next) => {
    setKeyBindingsState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      return sanitizeBindings(resolved);
    });
  }, []);

  const setSfxEnabled = useCallback((next: boolean) => {
    setSfxEnabledState(Boolean(next));
  }, []);

  const setSfxVolume = useCallback((next: number) => {
    setSfxVolumeState(clampVolume(next));
  }, []);

  const setSfxPreset = useCallback((next: SfxPresetId) => {
    setSfxPresetState(next);
  }, []);

  const resetSfxSettings = useCallback(() => {
    setSfxEnabledState(DEFAULT_SFX_ENABLED);
    setSfxVolumeState(DEFAULT_SFX_VOLUME);
    setSfxPresetState(DEFAULT_SFX_PRESET);
  }, []);

  const value = useMemo<SettingsModelValue>(
    () => ({
      keyBindings,
      setKeyBindings,
      sfxEnabled,
      setSfxEnabled,
      sfxVolume,
      setSfxVolume,
      sfxPreset,
      setSfxPreset,
      resetSfxSettings,
    }),
    [
      keyBindings,
      setKeyBindings,
      sfxEnabled,
      setSfxEnabled,
      sfxVolume,
      setSfxVolume,
      sfxPreset,
      setSfxPreset,
      resetSfxSettings,
    ],
  );

  return (
    <SettingsModelContext.Provider value={value}>
      {children}
    </SettingsModelContext.Provider>
  );
};
