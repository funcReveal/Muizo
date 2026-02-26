import { useEffect, useState } from "react";
import {
  parseStoredSfxPreset,
  type SfxPresetId,
} from "../../../Room/model/sfx/gameSfxEngine";

export const SFX_STORAGE_KEYS = {
  enabled: "mq_sfx_enabled",
  volume: "mq_sfx_volume",
  preset: "mq_sfx_preset",
} as const;

const clampVolume = (value: number) => {
  if (!Number.isFinite(value)) return 70;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const readBool = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === "0") return false;
  if (raw === "1") return true;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
};

const readNumber = (key: string, fallback: number) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  return clampVolume(Number.isFinite(parsed) ? parsed : fallback);
};

export const SFX_PRESET_OPTIONS: Array<{
  id: SfxPresetId;
  label: string;
  hint: string;
}> = [
  { id: "arcade", label: "Arcade", hint: "清脆、競技感較強" },
  { id: "focus", label: "Focus", hint: "較穩定、偏中性" },
  { id: "soft", label: "Soft", hint: "較柔和、較不干擾" },
];

export const useSfxSettings = () => {
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() =>
    readBool(SFX_STORAGE_KEYS.enabled, true),
  );
  const [sfxVolume, setSfxVolume] = useState<number>(() =>
    readNumber(SFX_STORAGE_KEYS.volume, 70),
  );
  const [sfxPreset, setSfxPreset] = useState<SfxPresetId>(() => {
    if (typeof window === "undefined") return "arcade";
    return parseStoredSfxPreset(window.localStorage.getItem(SFX_STORAGE_KEYS.preset));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SFX_STORAGE_KEYS.enabled, sfxEnabled ? "1" : "0");
  }, [sfxEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SFX_STORAGE_KEYS.volume, String(clampVolume(sfxVolume)));
  }, [sfxVolume]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SFX_STORAGE_KEYS.preset, sfxPreset);
  }, [sfxPreset]);

  return {
    sfxEnabled,
    setSfxEnabled,
    sfxVolume,
    setSfxVolume: (value: number) => setSfxVolume(clampVolume(value)),
    sfxPreset,
    setSfxPreset,
  } as const;
};

