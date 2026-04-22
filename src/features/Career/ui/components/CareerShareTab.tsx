import React from "react";

const cardClass =
  "rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.96),rgba(8,7,5,0.98))] p-5 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.72)]";

const CareerShareTab: React.FC = () => {
  return (
    <div className="mt-5 space-y-4">
      <section className={cardClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--mc-text)]">
              分享
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mc-text-muted)]">
              這版先保留分享能力入口，下一步再把實際圖片輸出與文案生成完整接上。
            </p>
          </div>

          <div className="inline-flex items-center rounded-full border border-emerald-300/26 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-emerald-100">
            SHARE V1
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={cardClass}>
          <div className="text-sm font-semibold tracking-[0.08em] text-[var(--mc-text)]">
            分享卡預覽
          </div>

          <div className="mt-4 rounded-[24px] border border-sky-300/18 bg-[linear-gradient(135deg,rgba(11,24,49,0.98),rgba(6,12,24,0.98))] p-5">
            <div className="text-3xl font-bold tracking-tight text-white">
              Muizo
            </div>
            <div className="mt-2 text-sm font-semibold text-sky-300">
              Career Snapshot
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] border border-sky-300/14 bg-white/5 p-4">
                <div className="text-[11px] tracking-[0.12em] text-slate-300">
                  對戰數
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  128
                </div>
              </div>
              <div className="rounded-[18px] border border-sky-300/14 bg-white/5 p-4">
                <div className="text-[11px] tracking-[0.12em] text-slate-300">
                  最佳名次
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  1/8
                </div>
              </div>
              <div className="rounded-[18px] border border-sky-300/14 bg-white/5 p-4">
                <div className="text-[11px] tracking-[0.12em] text-slate-300">
                  最高分
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  9,820
                </div>
              </div>
              <div className="rounded-[18px] border border-sky-300/14 bg-white/5 p-4">
                <div className="text-[11px] tracking-[0.12em] text-slate-300">
                  最高 Combo
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  x17
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <section className={cardClass}>
            <div className="text-sm font-semibold tracking-[0.08em] text-[var(--mc-text)]">
              快速動作
            </div>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                className="rounded-[18px] border border-sky-300/30 bg-sky-300/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-300/45 hover:bg-sky-300/16"
              >
                下載 PNG
              </button>
              <button
                type="button"
                className="rounded-[18px] border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-300/16"
              >
                複製分享文案
              </button>
            </div>
          </section>

          <section className={cardClass}>
            <div className="text-sm font-semibold tracking-[0.08em] text-[var(--mc-text)]">
              文案方向
            </div>
            <div className="mt-4 rounded-[18px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4 text-sm leading-6 text-[var(--mc-text-muted)]">
              我最近在 Muizo 持續刷新自己的戰績，最高分來到 9,820，最佳名次打到
              1/8， 還在繼續往更穩定的綜合表現前進。
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default CareerShareTab;
