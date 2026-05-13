import { TextField } from "@mui/material";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";

type AnswerPanelProps = {
  title: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
  maxLength?: number;
  actionLabel?: string;
  actionDisabled?: boolean;
  onActionClick?: () => void;
};

const AnswerPanel = ({
  title,
  value,
  placeholder,
  onChange,
  disabled,
  maxLength,
  actionLabel,
  actionDisabled,
  onActionClick,
}: AnswerPanelProps) => {
  const lengthHint =
    typeof maxLength === "number" ? `${value.length}/${maxLength}` : null;

  return (
    <section className="space-y-2 py-2 px-1">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--mc-text)]">{title}</h3>
        {lengthHint ? (
          <span className="shrink-0 text-[11px] text-[var(--mc-text-muted)]">
            {lengthHint}
          </span>
        ) : null}
      </header>

      <TextField
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth
        variant="outlined"
        slotProps={{
          htmlInput: {
            maxLength,
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "0.875rem",
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            color: "rgb(241 245 249)",
            fontSize: "14px",
            "&:hover fieldset": {
              borderColor: "rgba(100, 116, 139, 0.85)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "rgba(148, 163, 184, 0.95)",
            },
            "&.Mui-disabled": {
              opacity: 0.6,
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: "12px 14px",
          },
          "& .MuiOutlinedInput-input::placeholder": {
            color: "rgb(148 163 184)",
            opacity: 1,
          },
        }}
      />

      {actionLabel && onActionClick ? (
        <footer className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onActionClick}
            disabled={actionDisabled}
            className="relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--mc-accent)]/70 bg-[var(--mc-accent)]/18 px-4 py-2.5 pr-5 text-xs font-semibold text-[var(--mc-text)] shadow-[0_14px_34px_-22px_var(--mc-glow)] transition hover:border-[var(--mc-accent)] hover:bg-[var(--mc-accent)]/26 disabled:cursor-not-allowed disabled:border-[var(--mc-border)] disabled:bg-[var(--mc-surface-strong)]/45 disabled:text-[var(--mc-text-muted)]"
          >
            <span className="absolute -right-1.5 -top-2 rounded-full bg-[var(--mc-accent)] px-1.5 py-0.5 text-[9px] font-bold leading-none text-slate-950 shadow-[0_8px_18px_-12px_var(--mc-glow)]">
              推薦
            </span>
            <AutoFixHighOutlined sx={{ fontSize: 17 }} />
            {actionLabel}
          </button>
        </footer>
      ) : null}
    </section>
  );
};

export default AnswerPanel;
