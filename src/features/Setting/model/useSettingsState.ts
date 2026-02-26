import { useCallback, useMemo, useState } from "react";

import {
  SETTINGS_CATEGORIES,
  SETTINGS_SECTIONS,
} from "./settingsSchema";
import type { SettingsCategoryId, SettingsSectionId } from "./settingsTypes";

const sectionById = new Map(SETTINGS_SECTIONS.map((section) => [section.id, section]));

export const useSettingsState = () => {
  const [activeCategoryId, setActiveCategoryId] = useState<SettingsCategoryId>(
    SETTINGS_CATEGORIES[0]?.id ?? "controls",
  );
  const [activeAnchorId, setActiveAnchorId] = useState<SettingsSectionId | null>(
    null,
  );

  const categorySections = useMemo(
    () =>
      SETTINGS_SECTIONS.filter((section) => section.categoryId === activeCategoryId),
    [activeCategoryId],
  );

  const activeCategory = useMemo(
    () =>
      SETTINGS_CATEGORIES.find((category) => category.id === activeCategoryId) ??
      SETTINGS_CATEGORIES[0],
    [activeCategoryId],
  );

  const changeCategory = useCallback((nextCategoryId: SettingsCategoryId) => {
    setActiveCategoryId(nextCategoryId);
    const firstSection = SETTINGS_SECTIONS.find(
      (section) => section.categoryId === nextCategoryId,
    );
    setActiveAnchorId(firstSection?.id ?? null);
  }, []);

  const jumpToSection = useCallback((sectionId: SettingsSectionId) => {
    setActiveAnchorId(sectionId);
    if (typeof document === "undefined") return;
    const node = document.getElementById(sectionId);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const selectSection = useCallback((sectionId: SettingsSectionId) => {
    const section = sectionById.get(sectionId);
    if (!section) return;
    if (section.categoryId !== activeCategoryId) {
      setActiveCategoryId(section.categoryId);
    }
    jumpToSection(sectionId);
  }, [activeCategoryId, jumpToSection]);

  return {
    categories: SETTINGS_CATEGORIES,
    sections: SETTINGS_SECTIONS,
    activeCategory,
    activeCategoryId,
    setActiveCategoryId: changeCategory,
    activeAnchorId,
    setActiveAnchorId,
    categorySections,
    jumpToSection,
    selectSection,
  } as const;
};

