import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./resources/en/common";
import enCollectionCreate from "./resources/en/collectionCreate";
import zhTWCommon from "./resources/zh-TW/common";
import zhTWCollectionCreate from "./resources/zh-TW/collectionCreate";

export const SUPPORTED_LANGUAGES = ["en", "zh-TW"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const DEFAULT_LANGUAGE: SupportedLanguage = "zh-TW";

// TODO(i18n): 暫時鎖定繁中。
// 等全站主要頁面完成 i18n 遷移，並完成語言切換器後，再恢復自動偵測與 localStorage 偏好。
const LOCKED_LANGUAGE: SupportedLanguage = "zh-TW";

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      collectionCreate: enCollectionCreate,
    },
    "zh-TW": {
      common: zhTWCommon,
      collectionCreate: zhTWCollectionCreate,
    },
  },
  lng: LOCKED_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const changeLanguage = async (_language: SupportedLanguage) => {
  // TODO(i18n): 語言切換功能正式開放後，再恢復：
  // await i18n.changeLanguage(language);
  await i18n.changeLanguage(LOCKED_LANGUAGE);
};

export default i18n;
