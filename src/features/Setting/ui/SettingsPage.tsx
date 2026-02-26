import React, { useMemo } from "react";
import {
  ArrowBackRounded,
  KeyboardRounded,
  RestartAltRounded,
  SettingsSuggestRounded,
  TuneRounded,
} from "@mui/icons-material";
import { Button, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";

import KeyBindingSettings from "./components/KeyBindingSettings";
import SettingsSectionCard from "./components/SettingsSectionCard";
import SfxSettingsPanel from "./components/SfxSettingsPanel";
import {
  DEFAULT_KEY_BINDINGS,
  useKeyBindings,
} from "./components/useKeyBindings";

const SLOT_TITLES = ["左上", "右上", "左下", "右下"] as const;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { keyBindings, setKeyBindings } = useKeyBindings();

  const previewItems = useMemo(
    () =>
      SLOT_TITLES.map((slot, idx) => ({
        slot,
        key: (keyBindings[idx] ?? "").toUpperCase() || "—",
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

  return (
    <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-0">
      <div className="relative overflow-hidden rounded-[24px] border border-slate-700/60 bg-[radial-gradient(900px_380px_at_8%_-8%,rgba(34,211,238,0.12),transparent_60%),radial-gradient(760px_340px_at_100%_0%,rgba(245,158,11,0.08),transparent_58%),linear-gradient(145deg,rgba(5,8,14,0.98),rgba(8,13,22,0.96))] p-4 shadow-[0_30px_80px_-56px_rgba(0,0,0,0.95)] sm:p-5">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(135deg,rgba(148,163,184,0.18),rgba(148,163,184,0.18)_1px,transparent_1px,transparent_7px)]" />

        <div className="relative">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                <SettingsSuggestRounded sx={{ fontSize: 14 }} />
                Settings
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
                遊戲設定
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                先調整你最常用的操作與提示音。這些設定會儲存在目前瀏覽器，下次進房會直接套用。
              </p>
            </div>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate(-1)}
              sx={{
                borderColor: "rgba(148,163,184,0.35)",
                color: "#e2e8f0",
                alignSelf: "flex-start",
              }}
            >
              返回
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="space-y-4">
              <SettingsSectionCard
                icon={<KeyboardRounded fontSize="small" />}
                title="按鍵設定"
                description="設定作答選項對應的鍵盤按鍵。建議使用單鍵（例如 Q / W / A / S），避免重複。"
                actions={
                  <>
                    <Chip
                      size="small"
                      label="自動儲存"
                      sx={{
                        color: "#d1fae5",
                        border: "1px solid rgba(16,185,129,0.28)",
                        background: "rgba(16,185,129,0.08)",
                      }}
                      variant="outlined"
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
                <KeyBindingSettings
                  keyBindings={keyBindings}
                  onChange={setKeyBindings}
                />
                <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/35 p-3">
                  <p className="text-xs font-semibold tracking-[0.08em] text-slate-300">
                    套用範圍
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-5 text-slate-400">
                    <li>房間內遊戲畫面（鍵盤作答）</li>
                    <li>重新整理後仍會保留（使用瀏覽器本機儲存）</li>
                    <li>建議避免與瀏覽器快捷鍵衝突（例如 F5、Ctrl+R）</li>
                  </ul>
                </div>
              </SettingsSectionCard>

              <SfxSettingsPanel />
            </div>

            <div className="space-y-4">
              <SettingsSectionCard
                title="目前快捷鍵"
                description="快速檢查每個選項位置對應的按鍵。"
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
                  <p className="text-xs font-semibold text-amber-100">提示</p>
                  <p className="mt-1 text-xs leading-5 text-amber-100/80">
                    如果你習慣右手操作，可以改成 I / O / K / L 等排列，減少搶答時誤按。
                  </p>
                </div>
              </SettingsSectionCard>

              <SettingsSectionCard
                icon={<TuneRounded fontSize="small" />}
                title="之後可以擴充的設定"
                description="先保留位置，之後可逐步增加，不用一次做太多。"
              >
                <ul className="space-y-2 text-sm leading-5 text-slate-300">
                  <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                    1. 顯示設定：公布階段是否顯示影片、字體大小、緊湊模式
                  </li>
                  <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                    2. 音效細項：只保留倒數 / 只保留結果 / 單獨調整音量
                  </li>
                  <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                    3. 無障礙：色弱配色、減少動畫、鍵盤提示強化
                  </li>
                  <li className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                    4. 對戰偏好：彈幕預設開關、聊天室自動捲動、訊息時間格式
                  </li>
                </ul>
              </SettingsSectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

