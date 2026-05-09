const CollectionPreviewLoadingRow = ({ index }: { index: number }) => (
  <div className="flex h-full items-center gap-3 border-b border-white/8 px-2 py-3 last:border-b-0 sm:px-3">
    <div className="h-10 w-16 shrink-0 rounded-lg bg-white/8" />
    <div className="min-w-0 flex-1 space-y-2">
      <div
        className="h-3 rounded-full bg-white/10"
        style={{ width: `${72 - (index % 5) * 7}%` }}
      />
      <div
        className="h-2.5 rounded-full bg-white/6"
        style={{ width: `${40 + (index % 5) * 5}%` }}
      />
    </div>
    <span className="shrink-0 text-xs font-medium text-slate-500">
      #{index + 1}
    </span>
  </div>
);

export default CollectionPreviewLoadingRow;
