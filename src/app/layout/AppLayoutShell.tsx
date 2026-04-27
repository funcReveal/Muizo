import React, { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import AppHeader from "./AppHeader";
import EmbeddedSettingsDialog from "./EmbeddedSettingsDialog";
import IdentityProfileDialog from "./IdentityProfileDialog";
import { useAuth } from "@shared/auth/AuthContext";

type NavigationTarget = "rooms" | "collections" | "history" | "settings";

const getNavigationPath = (target: NavigationTarget) => {
  switch (target) {
    case "rooms":
      return "/rooms";
    case "collections":
      return "/collections";
    case "history":
      return "/history";
    case "settings":
      return "/settings";
    default:
      return "/rooms";
  }
};

const AppLayoutShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    authLoading,
    authUser,
    loginWithGoogle,
    logout,
    needsNicknameConfirm,
    nicknameDraft,
    setNicknameDraft,
    confirmNickname,
    isProfileEditorOpen,
    openProfileEditor,
    closeProfileEditor,
    displayUsername,
    username,
  } = useAuth();

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isRoomsHubPage = location.pathname === "/rooms";

  const handleLoginRequest = useCallback(() => {
    if (authLoading) return;
    loginWithGoogle();
  }, [authLoading, loginWithGoogle]);

  const handleNavigateRequest = useCallback(
    (target: NavigationTarget) => {
      if (target === "settings") {
        setSettingsOpen(true);
        return;
      }

      navigate(getNavigationPath(target));
    },
    [navigate],
  );

  return (
    <div
      className={`flex bg-[var(--mc-bg)] text-[var(--mc-text)] justify-center items-start ${
        isRoomsHubPage
          ? "min-h-dvh overflow-x-hidden lg:h-dvh lg:overflow-hidden"
          : "min-h-screen"
      }`}
    >
      <div
        className={`flex w-full min-w-0 max-w-[1600px] p-4 flex-col ${
          isRoomsHubPage
            ? "space-y-2 min-h-dvh lg:h-full lg:min-h-0"
            : "space-y-4"
        }`}
      >
        <AppHeader
          displayUsername={displayUsername}
          hasGuestIdentity={Boolean(username)}
          authUser={authUser}
          authLoading={authLoading}
          onLogin={handleLoginRequest}
          onLogout={() => setLogoutConfirmOpen(true)}
          onEditProfile={openProfileEditor}
          onNavigateRooms={() => handleNavigateRequest("rooms")}
          onNavigateCollections={() => handleNavigateRequest("collections")}
          onNavigateHistory={() => handleNavigateRequest("history")}
          onNavigateSettings={() => handleNavigateRequest("settings")}
        />

        {isRoomsHubPage ? (
          <div className="min-h-0 pb-2 lg:flex-1 lg:overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}

        <footer className="flex m-0 shrink-0 items-center justify-center gap-4 pb-[env(safe-area-inset-bottom)] text-xs text-[var(--mc-text-muted)]">
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
            onClick={() => navigate("/privacy")}
          >
            隱私權政策
          </button>

          <span className="text-[var(--mc-border)]">‧</span>

          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
            onClick={() => navigate("/terms")}
          >
            服務條款
          </button>
        </footer>

        <Dialog
          open={logoutConfirmOpen}
          onClose={() => setLogoutConfirmOpen(false)}
        >
          <DialogTitle>確定要登出？</DialogTitle>

          <DialogContent>
            <p className="text-sm text-[var(--mc-text-muted)]">
              你將登出目前帳號。
            </p>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setLogoutConfirmOpen(false)}
              variant="outlined"
            >
              取消
            </Button>

            <Button
              onClick={() => {
                setLogoutConfirmOpen(false);
                logout();
              }}
              variant="contained"
            >
              確認登出
            </Button>
          </DialogActions>
        </Dialog>

        <EmbeddedSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        <IdentityProfileDialog
          needsNicknameConfirm={needsNicknameConfirm}
          isProfileEditorOpen={isProfileEditorOpen}
          nicknameDraft={nicknameDraft}
          setNicknameDraft={setNicknameDraft}
          confirmNickname={confirmNickname}
          closeProfileEditor={closeProfileEditor}
        />
      </div>
    </div>
  );
};

export default AppLayoutShell;
