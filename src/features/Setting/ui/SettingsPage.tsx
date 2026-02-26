import React, { useEffect, useMemo } from "react";
import {
  AccessibilityNewRounded,
  ArrowBackRounded,
  KeyboardRounded,
  RestartAltRounded,
  SettingsSuggestRounded,
  TuneRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { Button, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useSettingsState } from "../model/useSettingsState";
import type { SettingsSectionId } from "../model/settingsTypes";
import KeyBindingSettings from "./components/KeyBindingSettings";
import SettingsContentPane from "./components/SettingsContentPane";
import SettingsLayoutShell from "./components/SettingsLayoutShell";
import SettingsSectionCard from "./components/SettingsSectionCard";
import SettingsSidebarNav from "./components/SettingsSidebarNav";
import SfxSettingsPanel from "./components/SfxSettingsPanel";
import {
  DEFAULT_KEY_BINDINGS,
  useKeyBindings,
} from "./components/useKeyBindings";

const SLOT_TITLES = ["左上", "右上", "左下", "右下"] as const;

type SettingsPageProps = {
  embedded?: boolean;
  onRequestClose?: () => void;
};

const SettingsPage: React.FC<SettingsPageProps> = ({
  embedded = false,
  onRequestClose,
}) => {
  const navigate = useNavigate();
  const { keyBindings, setKeyBindings } = useKeyBindings();
  const {
    activeCategory,
    activeCategoryId,
    setActiveCategoryId,
    activeAnchorId,
    setActiveAnchorId,
    categorySections,
    categories,
    jumpToSection,
  } = useSettingsState();

  useEffect(() => {
    if (!activeAnchorId) {
      const first = categorySections[0]?.id ?? null;
      if (first) setActiveAnchorId(first);
    }
  }, [activeAnchorId, categorySections, setActiveAnchorId]);

  const previewItems = useMemo(
    () =>
      SLOT_TITLES.map((slot, idx) => ({
        slot,
        key: (keyBindings[idx] ?? "").toUpperCase() || "未設定",
      })),
    [keyBindings],
  );

  const isDefaultBindings = useMemo(
    () =>
      Object.entries(DEFAULT_KEY_BINDINGS).every(
        ([idx, key]) => (keyBindings[Number(idx)] ?? "") === key,
      ),
    [keyBindings],
  );

  const renderSection = (sectionId: SettingsSectionId) => {
    switch (sectionId) {
      case "keybindings":
        return (
          <SettingsSectionCard
            key={sectionId}
            id={sectionId}
            icon={<KeyboardRounded fontSize="small" />}
            title="按鍵設定"
            description="設定四個作答選項的快捷鍵。若輸入已被使用的按鍵，系統會自動交換位置，避免重複設定。"
            actions={
              <>
                <Chip
                  size="small"
                  label="自動交換"
                  variant="outlined"
                  sx={{
                    color: "#d1fae5",
                    border: "1px solid rgba(16,185,129,0.28)",
                    background: "rgba(16,185,129,0.08)",
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<RestartAltRounded />}
                  onClick={() => setKeyBindings({ ...DEFAULT_KEY_BINDINGS })}
                  disabled={isDefaultBindings}
                  sx={{
                    borderColor: "rgba(148,163,184,0.3)",
                    color: "#e2e8f0",
                  }}
                >
                  重設預設
                </Button>
              </>
            }
          >
            <KeyBindingSettings keyBindings={keyBindings} onChange={setKeyBindings} />
          </SettingsSectionCard>
        );

      case "control-preview":
        return (
          <SettingsSectionCard
            key={sectionId}
            id={sectionId}
            icon={<TuneRounded fontSize="small" />}
            title="按鍵預覽"
            description="確認目前鍵位配置與實戰使用建議。"
          >
            <div className="grid grid-cols-2 gap-2">
              {previewItems.map((item) => (
                <div
                  key={item.slot}
                  className="rounded-xl border border-slate-700/60 bg-slate-950/45 p-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {item.slot}
                  </p>
                  <p className="mt-2 text-2xl font-black leading-none text-cyan-100">
                    {item.key}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-400/5 p-3">
              <p className="text-xs font-semibold text-amber-100">使用建議</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-50/85">
                <li>保持左右手分工，減少連續跨區按鍵。</li>
                <li>
                  直播或錄影時，避免使用瀏覽器常用快捷鍵（例如 F5、Ctrl+R）。
                </li>
                <li>
                  若改成 I / O / K / L，請同步確認你對鍵位位置的肌肉記憶。
                </li>
              </ul>
            </div>
          </SettingsSectionCard>
        );

      case "sfx":
        return <SfxSettingsPanel key={sectionId} sectionId={sectionId} />;

      case "display-presets":
        return (
          <SettingsSectionCard
            key={sectionId}
            id={sectionId}
            icon={<VisibilityRounded fontSize="small" />}
            title="顯示偏好（規劃中）"
            description="這一區先預留結構，後續會將遊戲內顯示偏好集中到設定頁管理。"
          >
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                字體大小（標準 / 放大）與回饋卡緊湊模式。
              </li>
              <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                公布答案階段影片顯示與縮圖顯示偏好。
              </li>
              <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                題目資訊顯示密度（精簡 / 標準 / 完整）。
              </li>
            </ul>
          </SettingsSectionCard>
        );

      case "accessibility-presets":
        return (
          <SettingsSectionCard
            key={sectionId}
            id={sectionId}
            icon={<AccessibilityNewRounded fontSize="small" />}
            title="無障礙偏好（規劃中）"
            description="提供不同視覺與動態需求的輔助設定。"
          >
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                高對比模式（標準 / 高對比 / 柔和高對比）。
              </li>
              <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                減少動畫與強閃爍效果，降低視覺負擔。
              </li>
              <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                色弱友善配色（特別是答對 / 答錯 / 正解標示）。
              </li>
            </ul>
          </SettingsSectionCard>
        );

      default:
        return null;
    }
  };

  const handleCloseOrBack = () => {
    if (embedded) {
      onRequestClose?.();
      return;
    }
    navigate(-1);
  };

  return (
    <div
      className={`${
        embedded
          ? "h-full w-full"
          : "mx-auto w-full max-w-[1320px] px-2 sm:px-0"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-[24px] border border-slate-700/60 bg-[radial-gradient(900px_380px_at_8%_-8%,rgba(34,211,238,0.12),transparent_60%),radial-gradient(760px_340px_at_100%_0%,rgba(245,158,11,0.08),transparent_58%),linear-gradient(145deg,rgba(5,8,14,0.98),rgba(8,13,22,0.96))] shadow-[0_30px_80px_-56px_rgba(0,0,0,0.95)] ${
          embedded
            ? "flex h-full min-h-0 flex-col p-3 sm:p-4"
            : "mx-auto h-[calc(100dvh-12px)] p-3 sm:h-[min(900px,calc(100dvh-20px))] sm:min-h-[620px] sm:p-5"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(135deg,rgba(148,163,184,0.18),rgba(148,163,184,0.18)_1px,transparent_1px,transparent_7px)]" />

        <div className="relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                <SettingsSuggestRounded sx={{ fontSize: 14 }} />
                Control Deck
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
                設定
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                集中管理按鍵、提示音與未來的顯示偏好。設定頁採固定版面與內部捲動，
                在遊戲中開啟時也不會因內容長短讓視窗忽大忽小。
              </p>
            </div>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackRounded />}
              onClick={handleCloseOrBack}
              sx={{
                borderColor: "rgba(148,163,184,0.35)",
                color: "#e2e8f0",
                alignSelf: "flex-start",
              }}
            >
              {embedded ? "關閉" : "返回"}
            </Button>
          </div>

          <div className="min-h-0">
            <SettingsLayoutShell
              sidebar={
                <SettingsSidebarNav
                  categories={categories}
                  activeCategoryId={activeCategoryId}
                  onCategoryChange={setActiveCategoryId}
                  activeAnchorId={activeAnchorId}
                  categorySections={categorySections}
                  onAnchorClick={jumpToSection}
                />
              }
            >
              <SettingsContentPane
                title={activeCategory?.title ?? "設定分類"}
                subtitle={activeCategory?.subtitle ?? "選擇左側分類與區段"}
              >
                {categorySections.map((section) => renderSection(section.id))}
              </SettingsContentPane>
            </SettingsLayoutShell>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
