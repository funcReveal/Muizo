import { createContext, useContext } from "react";

import type { SfxPresetId } from "../../Room/model/sfx/gameSfxEngine";

export type KeyBindings = Record<number, string>;

export const KEY_BINDINGS_STORAGE_KEY = "mq_keybindings";
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  0: "Q",
  1: "W",
  2: "A",
  3: "S",
};

export const SFX_STORAGE_KEYS = {
  enabled: "mq_sfx_enabled",
  volume: "mq_sfx_volume",
  preset: "mq_sfx_preset",
} as const;

export const DEFAULT_SFX_ENABLED = true;
export const DEFAULT_SFX_VOLUME = 50;
export const DEFAULT_SFX_PRESET: SfxPresetId = "arcade";

export type KeyBindingSetter = (
  next: KeyBindings | ((prev: KeyBindings) => KeyBindings),
) => void;

export type SettingsModelValue = {
  keyBindings: KeyBindings;
  setKeyBindings: KeyBindingSetter;
  sfxEnabled: boolean;
  setSfxEnabled: (next: boolean) => void;
  sfxVolume: number;
  setSfxVolume: (next: number) => void;
  sfxPreset: SfxPresetId;
  setSfxPreset: (next: SfxPresetId) => void;
  resetSfxSettings: () => void;
};

export const SettingsModelContext = createContext<SettingsModelValue | null>(null);

export const useSettingsModel = () => {
  const context = useContext(SettingsModelContext);
  if (!context) {
    throw new Error("useSettingsModel must be used within SettingsProvider");
  }
  return context;
};

