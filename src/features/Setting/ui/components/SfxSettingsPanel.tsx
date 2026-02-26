import React, { useMemo } from "react";
import {
  CampaignRounded,
  GraphicEqRounded,
  NotificationsActiveRounded,
  TuneRounded,
} from "@mui/icons-material";
import { Button, Slider, Switch } from "@mui/material";

import {
  resolveCorrectResultSfxEvent,
  type GameSfxEvent,
} from "../../../Room/model/sfx/gameSfxEngine";
import { useGameSfx } from "../../../Room/ui/hooks/useGameSfx";
import SettingsSectionCard from "./SettingsSectionCard";
import { SFX_PRESET_OPTIONS, useSfxSettings } from "./useSfxSettings";

const SAMPLE_BUTTONS: Array<{
  label: string;
  event: GameSfxEvent;
  tone: "neutral" | "good" | "warn" | "hot";
}> = [
  { label: "鎖定作答", event: "lock", tone: "neutral" },
  { label: "答對（一般）", event: "correct", tone: "good" },
  { label: "答錯", event: "wrong", tone: "warn" },
  { label: "尾端倒數", event: "deadlineFinal", tone: "hot" },
];

const sampleButtonClassByTone: Record<
  (typeof SAMPLE_BUTTONS)[number]["tone"],
  string
> = {
  neutral:
    "border-slate-600/70 bg-slate-900/55 text-slate-100 hover:border-cyan-300/40 hover:bg-cyan-400/5",
  good:
    "border-emerald-400/25 bg-emerald-500/5 text-emerald-100 hover:border-emerald-300/40 hover:bg-emerald-400/10",
  warn:
    "border-rose-400/25 bg-rose-500/5 text-rose-100 hover:border-rose-300/40 hover:bg-rose-400/10",
  hot:
    "border-amber-400/25 bg-amber-500/5 text-amber-100 hover:border-amber-300/40 hover:bg-amber-400/10",
};

const comboTierEvents = [4, 8, 12, 16, 20].map((comboBonusPoints) => ({
  comboBonusPoints,
  event: resolveCorrectResultSfxEvent(comboBonusPoints),
}));

const SfxSettingsPanel: React.FC = () => {
  const {
    sfxEnabled,
    setSfxEnabled,
    sfxVolume,
    setSfxVolume,
    sfxPreset,
    setSfxPreset,
  } = useSfxSettings();

  const { playGameSfx, primeSfxAudio } = useGameSfx({
    enabled: sfxEnabled,
    volume: sfxVolume,
    preset: sfxPreset,
  });

  const selectedPresetMeta = useMemo(
    () => SFX_PRESET_OPTIONS.find((item) => item.id === sfxPreset) ?? SFX_PRESET_OPTIONS[0],
    [sfxPreset],
  );

  const playSample = (event: GameSfxEvent) => {
    primeSfxAudio();
    playGameSfx(event);
  };

  return (
    <SettingsSectionCard
      icon={<CampaignRounded fontSize="small" />}
      title="音效設定"
      description="調整遊戲提示音（倒數、作答、對錯、連對）開關與音量。設定完成後會套用到之後的對戰。"
      actions={
        <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-2 py-1">
          <span className="text-xs text-slate-300">啟用</span>
          <Switch
            size="small"
            color="info"
            checked={sfxEnabled}
            onChange={(e) => setSfxEnabled(e.target.checked)}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/35 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraphicEqRounded sx={{ fontSize: 18, color: "#67e8f9" }} />
              <p className="text-sm font-semibold text-slate-100">音量</p>
            </div>
            <span className="rounded-full border border-slate-700/60 bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-cyan-100">
              {sfxVolume}%
            </span>
          </div>
          <Slider
            value={sfxVolume}
            min={0}
            max={100}
            step={1}
            disabled={!sfxEnabled}
            onChange={(_, value) => setSfxVolume(Array.isArray(value) ? value[0] : value)}
            sx={{
              color: "#22d3ee",
              "& .MuiSlider-thumb": {
                boxShadow: "0 0 0 4px rgba(34,211,238,0.16)",
              },
            }}
          />
          <p className="mt-1 text-xs text-slate-400">
            建議先從 35%~60% 開始，避免影響作答專注。
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-950/35 p-3">
          <div className="mb-3 flex items-center gap-2">
            <TuneRounded sx={{ fontSize: 18, color: "#c4b5fd" }} />
            <p className="text-sm font-semibold text-slate-100">音色風格</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SFX_PRESET_OPTIONS.map((preset) => {
              const active = preset.id === sfxPreset;
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!sfxEnabled}
                  onClick={() => setSfxPreset(preset.id)}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? "border-cyan-300/45 bg-cyan-400/8 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                      : "border-slate-700/60 bg-slate-900/45 hover:border-slate-500/70"
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {preset.label}
                    </span>
                    {active && (
                      <span className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
                        使用中
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-4 text-slate-400">
                    {preset.hint}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            目前風格：<span className="text-slate-200">{selectedPresetMeta.label}</span>（
            {selectedPresetMeta.hint}）
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-950/35 p-3">
          <div className="mb-3 flex items-center gap-2">
            <NotificationsActiveRounded
              sx={{ fontSize: 18, color: "#fcd34d" }}
            />
            <p className="text-sm font-semibold text-slate-100">試聽</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_BUTTONS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                disabled={!sfxEnabled}
                onClick={() => playSample(sample.event)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${sampleButtonClassByTone[sample.tone]}`}
              >
                {sample.label}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-slate-700/60 bg-slate-900/45 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-200">
                連對升階音（5 段）
              </p>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                disabled={!sfxEnabled}
                onClick={() => {
                  primeSfxAudio();
                  comboTierEvents.forEach((item, idx) => {
                    playGameSfx(item.event, idx * 0.22);
                  });
                }}
                sx={{
                  borderColor: "rgba(148,163,184,0.35)",
                  color: "#e2e8f0",
                  minWidth: 0,
                  px: 1.2,
                }}
              >
                連續試聽
              </Button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {comboTierEvents.map((item, idx) => (
                <button
                  key={item.comboBonusPoints}
                  type="button"
                  disabled={!sfxEnabled}
                  onClick={() => playSample(item.event)}
                  className="rounded-lg border border-amber-300/20 bg-amber-400/5 px-2 py-1.5 text-center text-[11px] font-bold text-amber-100 transition hover:border-amber-300/35 hover:bg-amber-400/10 disabled:opacity-50"
                  title={`Combo加成 +${item.comboBonusPoints}`}
                >
                  T{idx + 1}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-slate-400">
              T1~T5 對應後端 Combo 加成 `+4 / +8 / +12 / +16 / +20`。
            </p>
          </div>
        </div>
      </div>
    </SettingsSectionCard>
  );
};

export default SfxSettingsPanel;

