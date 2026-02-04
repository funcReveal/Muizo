type StatusRowProps = {
  collectionsLoading: boolean;
  itemsLoading: boolean;
  collectionsError: string | null;
  itemsError: string | null;
  loadingLabel: string;
};

const StatusRow = ({
  collectionsLoading,
  itemsLoading,
  collectionsError,
  itemsError,
  loadingLabel,
}: StatusRowProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      {collectionsLoading && (
        <span className="rounded-full border border-[var(--mc-border)] px-2 py-0.5 text-[var(--mc-text-muted)]">
          {loadingLabel}
        </span>
      )}
      {itemsLoading && (
        <span className="rounded-full border border-[var(--mc-border)] px-2 py-0.5 text-[var(--mc-text-muted)]">
          {loadingLabel}
        </span>
      )}
      {collectionsError && (
        <span className="rounded-full border border-rose-500/40 px-2 py-0.5 text-rose-300">
          {collectionsError}
        </span>
      )}
      {itemsError && (
        <span className="rounded-full border border-rose-500/40 px-2 py-0.5 text-rose-300">
          {itemsError}
        </span>
      )}
    </div>
  );
};

export default StatusRow;
