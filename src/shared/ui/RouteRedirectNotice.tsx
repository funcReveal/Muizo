type RouteRedirectNoticeProps = {
  title?: string;
  subtitle?: string;
  fullHeight?: boolean;
};

const RouteRedirectNotice = ({
  title = "正在返回登入頁",
  subtitle = "尚未登入，系統正在帶你回到首頁。",
  fullHeight = false,
}: RouteRedirectNoticeProps) => {
  const outerHeightClass = fullHeight
    ? "min-h-[calc(100dvh-170px)]"
    : "min-h-[56vh]";
  const innerHeightClass = fullHeight
    ? "min-h-[calc(100dvh-202px)]"
    : "min-h-[56vh]";

  return (
    <div className={`w-full rounded-2xl p-4 ${outerHeightClass}`}>
      <div
        className={`relative flex h-full items-center justify-center overflow-hidden rounded-xl ${innerHeightClass}`}
      >
        <div className="relative flex max-w-lg flex-col items-center gap-4 px-6 text-center">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-[var(--mc-border)] border-t-[var(--mc-accent)]" />
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--mc-text-muted)]">
            Redirecting
          </div>
          <h2 className="text-xl font-semibold text-[var(--mc-text)]">
            {title}
          </h2>
          <p className="text-xl font-semibold text-[var(--mc-text-muted)]">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RouteRedirectNotice;
