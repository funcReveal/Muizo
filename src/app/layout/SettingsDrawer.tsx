import React, {
  lazy,
  Suspense,
} from "react";
import { Drawer } from "@mui/material";

const SettingsPage = lazy(() => import("@features/Setting/ui/SettingsPage"));

type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  onClose,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        className:
          "!h-dvh !w-screen !max-w-none !overflow-hidden !rounded-none !bg-slate-950 !shadow-none md:!w-[min(1040px,calc(100vw-24px))] md:!border-l md:!border-slate-700/40 md:!shadow-2xl md:!shadow-slate-950/80",
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <div className="flex h-full min-h-0 overflow-hidden bg-slate-950 p-1 sm:p-1.5">
        <Suspense fallback={null}>
          <SettingsPage onRequestClose={onClose} />
        </Suspense>
      </div>
    </Drawer>
  );
};

export default SettingsDrawer;
