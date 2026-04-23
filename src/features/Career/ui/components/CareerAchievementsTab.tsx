import React from "react";

const cardClass =
  "rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.96),rgba(8,7,5,0.98))] p-5 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.72)]";

const CareerAchievementsTab: React.FC = () => {
  return (
    <div className="mt-5 space-y-4">
      <section className={cardClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--mc-text)]">
              成就 / 稱號
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mc-text-muted)]">
              這裡之後會放稱號、已解鎖成就、生涯紀錄、距離下一個目標還差多少。
            </p>
          </div>

          <div className="inline-flex items-center rounded-full border border-fuchsia-300/26 bg-fuchsia-300/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-fuchsia-100">
            ACHIEVEMENTS V1
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={cardClass}>
          <div className="text-sm font-semibold tracking-[0.08em] text-[var(--mc-text)]">
            已解鎖稱號
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--mc-text-muted)]">
            例如 Combo Hunter、Accuracy Master、Top Finisher。
          </p>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold tracking-[0.08em] text-[var(--mc-text)]">
            生涯紀錄
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--mc-text-muted)]">
            例如第一名次數、前三名次數、玩過的題庫數、完成題數。
          </p>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold tracking-[0.08em] text-[var(--mc-text)]">
            下一個目標
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--mc-text-muted)]">
            例如再 2 場達成 100 場、再 1 次第一名解鎖新稱號。
          </p>
        </section>
      </div>
    </div>
  );
};

export default CareerAchievementsTab;
