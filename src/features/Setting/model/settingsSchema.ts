import type {
  SettingsCategoryMeta,
  SettingsSectionMeta,
} from "./settingsTypes";

export const SETTINGS_CATEGORIES: SettingsCategoryMeta[] = [
  {
    id: "controls",
    title: "操作",
    subtitle: "按鍵與作答預覽",
  },
  {
    id: "audio",
    title: "音效",
    subtitle: "提示音與音量",
  },
  {
    id: "display",
    title: "顯示",
    subtitle: "畫面密度與資訊呈現",
  },
  {
    id: "accessibility",
    title: "無障礙",
    subtitle: "視覺與動態輔助",
  },
];

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  {
    id: "keybindings",
    categoryId: "controls",
    title: "按鍵設定",
    description: "設定四個作答按鍵；輸入重複按鍵時會自動交換位置。",
    status: "ready",
  },
  {
    id: "control-preview",
    categoryId: "controls",
    title: "按鍵預覽",
    description: "快速確認目前配置與實戰使用建議。",
    status: "ready",
  },
  {
    id: "sfx",
    categoryId: "audio",
    title: "音效設定",
    description: "調整提示音開關、音量、風格與試聽。",
    status: "ready",
  },
  {
    id: "display-presets",
    categoryId: "display",
    title: "顯示偏好（規劃中）",
    description: "之後會集中管理字體大小、緊湊模式、影片顯示等視覺設定。",
    status: "planned",
  },
  {
    id: "accessibility-presets",
    categoryId: "accessibility",
    title: "無障礙偏好（規劃中）",
    description: "之後會加入高對比、減少動畫與色弱友善配色等選項。",
    status: "planned",
  },
];

