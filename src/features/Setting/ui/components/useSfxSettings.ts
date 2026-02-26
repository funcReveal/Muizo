import { useEffect, useMemo, useState } from "react";

import {
  parseStoredSfxPreset,
  type SfxPresetId,
} from "../../../Room/model/sfx/gameSfxEngine";

export const SFX_STORAGE_KEYS = {
  enabled: "mq_sfx_enabled",
  volume: "mq_sfx_volume",
  preset: "mq_sfx_preset",
} as const;

export const DEFAULT_SFX_ENABLED = true;
export const DEFAULT_SFX_VOLUME = 50;
export const DEFAULT_SFX_PRESET: SfxPresetId = "arcade";

const clampVolume = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_SFX_VOLUME;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const readBool = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  return fallback;
};

const readNumber = (key: string, fallback: number) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  const parsed = Number(raw);
  return clampVolume(parsed);
};

export const SFX_PRESET_OPTIONS: Array<{
  id: SfxPresetId;
  label: string;
  hint: string;
}> = [
  { id: "arcade", label: "Arcade", hint: "清楚俐落，回饋感明顯" },
  { id: "focus", label: "Focus", hint: "節制乾淨，適合專注作答" },
  { id: "soft", label: "Soft", hint: "柔和低刺激，長時間遊玩舒適" },
];

export const useSfxSettings = () => {
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() =>
    readBool(SFX_STORAGE_KEYS.enabled, DEFAULT_SFX_ENABLED),
  );
  const [sfxVolume, setSfxVolume] = useState<number>(() =>
    readNumber(SFX_STORAGE_KEYS.volume, DEFAULT_SFX_VOLUME),
  );
  const [sfxPreset, setSfxPreset] = useState<SfxPresetId>(() => {
    if (typeof window === "undefined") return DEFAULT_SFX_PRESET;
    return parseStoredSfxPreset(
      window.localStorage.getItem(SFX_STORAGE_KEYS.preset),
    );
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SFX_STORAGE_KEYS.enabled, sfxEnabled ? "1" : "0");
  }, [sfxEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SFX_STORAGE_KEYS.volume,
      String(clampVolume(sfxVolume)),
    );
  }, [sfxVolume]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SFX_STORAGE_KEYS.preset, sfxPreset);
  }, [sfxPreset]);

  const resetSfxSettings = useMemo(
    () => () => {
      setSfxEnabled(DEFAULT_SFX_ENABLED);
      setSfxVolume(DEFAULT_SFX_VOLUME);
      setSfxPreset(DEFAULT_SFX_PRESET);
    },
    [],
  );

  return {
    sfxEnabled,
    setSfxEnabled,
    sfxVolume,
    setSfxVolume: (value: number) => setSfxVolume(clampVolume(value)),
    sfxPreset,
    setSfxPreset,
    resetSfxSettings,
  } as const;
};

