type LoadingPageProps = {
  title?: string;
  subtitle?: string;
};

const LoadingPage = ({
  title = "載入中",
  subtitle = "正在準備內容，請稍候...",
}: LoadingPageProps) => (
  <div className="min-h-[70vh] w-full rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]">
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--mc-border)] border-t-[var(--mc-accent)]" />
      <div className="text-xs uppercase tracking-[0.35em] text-[var(--mc-text-muted)]">
        Loading
      </div>
      <div className="text-lg font-semibold text-[var(--mc-text)]">{title}</div>
      <div className="text-sm text-[var(--mc-text-muted)]">{subtitle}</div>
    </div>
  </div>
);

export default LoadingPage;
