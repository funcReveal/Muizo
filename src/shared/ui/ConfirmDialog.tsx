import type { ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  extraContent?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "確認",
  cancelLabel = "取消",
  extraContent,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Dialog
    open={open}
    onClose={onCancel}
    maxWidth="xs"
    fullWidth
    sx={{
      "& .MuiDialog-paper": {
        backgroundColor:
          "color-mix(in srgb, var(--mc-surface-strong) 45%, black)",
        color: "var(--mc-text)",
        border: "1px solid var(--mc-border)",
        borderRadius: "1rem",
        boxShadow: "0 24px 80px -40px rgba(0,0,0,0.9)",
      },
    }}
  >
    <DialogTitle className="text-[var(--mc-text)]">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText className="text-[var(--mc-text-muted)]">
        {description}
      </DialogContentText>
      {extraContent}
    </DialogContent>
    <DialogActions className="px-6 pb-5">
      <Button
        variant="outlined"
        onClick={onCancel}
        className="!border-[var(--mc-border)] !text-[var(--mc-text)] hover:!border-[var(--mc-accent)]/60"
      >
        {cancelLabel}
      </Button>
      <Button
        variant="contained"
        onClick={onConfirm}
        className="!bg-[var(--mc-accent)]/80 !text-[var(--mc-text)] hover:!bg-[var(--mc-accent)]"
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
