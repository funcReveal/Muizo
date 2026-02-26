import React from "react";

interface SettingsSectionCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSectionCard: React.FC<SettingsSectionCardProps> = ({
  icon,
  title,
  description,
  actions,
  children,
}) => {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-700/70 bg-[linear-gradient(180deg,rgba(9,14,24,0.95),rgba(6,10,18,0.92))] p-4 shadow-[0_24px_60px_-44px_rgba(2,6,23,0.95)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <div className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/5 text-cyan-200">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-100">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
};

export default SettingsSectionCard;

