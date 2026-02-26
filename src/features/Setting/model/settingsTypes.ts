export type SettingsCategoryId =
  | "controls"
  | "audio"
  | "display"
  | "accessibility";

export type SettingsSectionId =
  | "keybindings"
  | "control-preview"
  | "sfx"
  | "display-presets"
  | "accessibility-presets";

export type SettingsSectionStatus = "ready" | "planned";

export interface SettingsCategoryMeta {
  id: SettingsCategoryId;
  title: string;
  subtitle: string;
}

export interface SettingsSectionMeta {
  id: SettingsSectionId;
  categoryId: SettingsCategoryId;
  title: string;
  description: string;
  status: SettingsSectionStatus;
}

