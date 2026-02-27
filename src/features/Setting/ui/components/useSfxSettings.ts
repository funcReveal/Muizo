import type { SfxPresetId } from "../../../Room/model/sfx/gameSfxEngine";
import {
  DEFAULT_SFX_ENABLED,
  DEFAULT_SFX_PRESET,
  DEFAULT_SFX_VOLUME,
  SFX_STORAGE_KEYS,
  useSettingsModel,
} from "../../model/settingsContext";

export {
  DEFAULT_SFX_ENABLED,
  DEFAULT_SFX_PRESET,
  DEFAULT_SFX_VOLUME,
  SFX_STORAGE_KEYS,
};

export const SFX_PRESET_OPTIONS: Array<{
  id: SfxPresetId;
  label: string;
  hint: string;
}> = [
  { id: "arcade", label: "Arcade", hint: "競技感明顯，提示清楚" },
  { id: "focus", label: "Focus", hint: "更專注、干擾更少" },
  { id: "soft", label: "Soft", hint: "柔和不刺耳，適合長時間" },
];

export const useSfxSettings = () => {
  const {
    sfxEnabled,
    setSfxEnabled,
    sfxVolume,
    setSfxVolume,
    sfxPreset,
    setSfxPreset,
    resetSfxSettings,
  } = useSettingsModel();

  return {
    sfxEnabled,
    setSfxEnabled,
    sfxVolume,
    setSfxVolume,
    sfxPreset,
    setSfxPreset,
    resetSfxSettings,
  } as const;
};
