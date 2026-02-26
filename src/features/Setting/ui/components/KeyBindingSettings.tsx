import React, { useMemo } from "react";
import type { KeyBindings } from "./useKeyBindings";

interface KeyBindingSettingsProps {
  keyBindings: KeyBindings;
  onChange: (next: KeyBindings) => void;
  disabled?: boolean;
}

const SLOT_LABELS = ["左上選項", "右上選項", "左下選項", "右下選項"] as const;

const normalizeKeyInput = (raw: string) => {
  const chars = raw.trim().toUpperCase().replace(/\s+/g, "");
  return chars.slice(0, 1);
};

const KeyBindingSettings: React.FC<KeyBindingSettingsProps> = ({
  keyBindings,
  onChange,
  disabled = false,
}) => {
  const duplicateKeys = useMemo(() => {
    const counter = new Map<string, number>();
    Object.values(keyBindings).forEach((value) => {
      const normalized = normalizeKeyInput(value ?? "");
      if (!normalized) return;
      counter.set(normalized, (counter.get(normalized) ?? 0) + 1);
    });
    return new Set(
      Array.from(counter.entries())
        .filter(([, count]) => count > 1)
        .map(([key]) => key),
    );
  }, [keyBindings]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 text-xs text-slate-200 sm:grid-cols-2">
        {SLOT_LABELS.map((label, idx) => {
          const current = normalizeKeyInput(keyBindings[idx] ?? "");
          const isDuplicate = Boolean(current && duplicateKeys.has(current));
          return (
            <label
              key={`${label}-${idx}`}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition ${
                isDuplicate
                  ? "border-rose-400/45 bg-rose-900/15"
                  : "border-slate-700/60 bg-slate-950/45"
              }`}
            >
              <span className="min-w-0">
                <span className="block text-[11px] text-slate-400">{label}</span>
                <span className="block text-[12px] text-slate-300">
                  選項 {idx + 1}
                </span>
              </span>
              <input
                aria-label={`${label} 快捷鍵`}
                value={current}
                maxLength={1}
                disabled={disabled}
                onChange={(e) => {
                  const nextValue = normalizeKeyInput(e.target.value);
                  onChange({
                    ...keyBindings,
                    [idx]: nextValue || (keyBindings[idx] ?? ""),
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Tab") return;
                  if (e.key === "Backspace" || e.key === "Delete") {
                    e.preventDefault();
                    onChange({ ...keyBindings, [idx]: "" });
                    return;
                  }
                  if (e.key.length !== 1) return;
                  e.preventDefault();
                  const nextValue = normalizeKeyInput(e.key);
                  if (!nextValue) return;
                  onChange({ ...keyBindings, [idx]: nextValue });
                }}
                className={`h-10 w-14 rounded-lg border bg-slate-900/80 px-2 text-center text-lg font-black tracking-[0.08em] outline-none transition ${
                  isDuplicate
                    ? "border-rose-400/60 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.12)]"
                    : "border-slate-600 text-cyan-100 focus:border-cyan-400/70 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                } disabled:opacity-60`}
              />
            </label>
          );
        })}
      </div>
      {duplicateKeys.size > 0 && (
        <p className="text-xs text-rose-200">
          快捷鍵有重複：{Array.from(duplicateKeys).join("、")}。建議每個選項使用不同按鍵。
        </p>
      )}
    </div>
  );
};

export default KeyBindingSettings;

