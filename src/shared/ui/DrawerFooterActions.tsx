import { Button } from "@mui/material";

type DrawerFooterActionsProps = {
  cancelLabel?: string;
  confirmLabel: string;
  confirmPendingLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  cancelDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const DrawerFooterActions = ({
  cancelLabel = "取消",
  confirmLabel,
  confirmPendingLabel,
  confirmDisabled = false,
  confirmLoading = false,
  cancelDisabled = false,
  onCancel,
  onConfirm,
}: DrawerFooterActionsProps) => (
  <div className="shared-drawer-footer-actions">
    <Button
      type="button"
      variant="text"
      onClick={onCancel}
      disabled={cancelDisabled}
      className="shared-drawer-footer-actions__button shared-drawer-footer-actions__button--ghost"
    >
      {cancelLabel}
    </Button>

    <Button
      type="button"
      variant="contained"
      onClick={onConfirm}
      disabled={confirmDisabled}
      className={`shared-drawer-footer-actions__button shared-drawer-footer-actions__button--primary ${
        confirmLoading ? "is-loading" : ""
      }`}
    >
      {confirmLoading ? confirmPendingLabel ?? confirmLabel : confirmLabel}
    </Button>
  </div>
);

export default DrawerFooterActions;
