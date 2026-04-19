import React, {
  lazy,
  Suspense,
  useMemo,
} from "react";
import {
  Dialog,
  DialogContent,
  useMediaQuery,
} from "@mui/material";

const SettingsPage = lazy(() => import("@features/Setting/ui/SettingsPage"));

type EmbeddedSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

const EmbeddedSettingsDialog: React.FC<EmbeddedSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const fullScreen = useMediaQuery("(max-width: 900px)");
  const paperProps = useMemo(
    () => ({
      sx: {
        width: fullScreen ? "100vw" : "min(1400px, calc(100vw - 24px))",
        maxWidth: "unset",
        height: fullScreen ? "100dvh" : "min(920px, calc(100dvh - 24px))",
        maxHeight: fullScreen
          ? "100dvh"
          : "min(920px, calc(100dvh - 24px))",
        borderRadius: fullScreen ? 0 : { xs: 2, sm: 3 },
        m: fullScreen ? 0 : undefined,
        border: "1px solid rgba(148, 163, 184, 0.24)",
        background:
          "linear-gradient(180deg, rgba(2,6,23,0.9), rgba(2,6,23,0.84))",
        boxShadow:
          "0 24px 64px rgba(2,6,23,0.45), 0 0 0 1px rgba(34,211,238,0.06)",
        backdropFilter: "none",
      },
    }),
    [fullScreen],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xl"
      PaperProps={paperProps}
    >
      <DialogContent
        sx={{
          p: { xs: 1, sm: 1.5 },
          background: "transparent",
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Suspense fallback={null}>
          <SettingsPage embedded onRequestClose={onClose} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};

export default EmbeddedSettingsDialog;
