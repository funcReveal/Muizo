import React from "react";

type SettingsContentPaneProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
};

const SettingsContentPane: React.FC<SettingsContentPaneProps> = ({
  title,
  subtitle,
  children,
  scrollContainerRef,
}) => {
  return (
    <section className="h-full min-h-0 min-w-0">
      <div ref={scrollContainerRef} className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="space-y-4 pb-1">
          <div className="rounded-2xl border border-slate-700/70 bg-[linear-gradient(180deg,rgba(8,12,20,0.96),rgba(6,10,16,0.92))] p-4 shadow-[0_18px_48px_-38px_rgba(2,6,23,0.95)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              目前分類
            </p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-100 sm:text-2xl">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
          </div>
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </section>
  );
};

export default SettingsContentPane;
