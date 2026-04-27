import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useMediaQuery } from "@mui/material";

import AppHeader from "./AppHeader";
import EmbeddedSettingsDialog from "./EmbeddedSettingsDialog";
import IdentityProfileDialog from "./IdentityProfileDialog";
import { useRoomAwareNavigationGuards } from "./useRoomAwareNavigationGuards";
import { useAuth } from "@shared/auth/AuthContext";
import { useRoomGame, useRoomSession } from "@features/RoomSession";

const RoomAwareLayoutShell: React.FC = () => {
  const location = useLocation();
  const {
    authLoading,
    authUser,
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

  const { statusNotification, setStatusText, currentRoom } = useRoomSession();
  const { gameState } = useRoomGame();
  const [inRoomSettingsOpen, setInRoomSettingsOpen] = useState(false);
  const isMobileViewport = useMediaQuery("(max-width: 1023.95px)");

  const navigationGuards = useRoomAwareNavigationGuards({
    onOpenSettings: () => setInRoomSettingsOpen(true),
  });

  useEffect(() => {
    if (!statusNotification) return;
    setStatusText(null);
  }, [setStatusText, statusNotification]);

  const isGameMode = Boolean(currentRoom && gameState);
  const isRoomsHubPage = location.pathname === "/rooms";
  const isRoomsEntryGatePage = isRoomsHubPage && !username;
  const shouldShowDesktopRoomFooter = !currentRoom || isMobileViewport;

  const roomsOutletClassName = isRoomsEntryGatePage
    ? [
        "min-h-0 flex-1",
        "overflow-y-auto overflow-x-hidden",
        "pb-[calc(88px+env(safe-area-inset-bottom))]",
        "[-webkit-overflow-scrolling:touch]",
        "overscroll-y-contain",
        "[&>*]:!h-auto",
        "[&>*]:!min-h-full",
        "[&>*]:!overflow-visible",
      ].join(" ")
    : "min-h-0 flex-1 overflow-hidden pb-2";

  return (
    <div
      className={`flex bg-[var(--mc-bg)] text-[var(--mc-text)] justify-center items-start ${
        isRoomsHubPage ? "h-dvh overflow-hidden" : "min-h-screen"
      }`}
    >
      <div
        className={`flex w-full min-w-0 ${
          isGameMode ? "max-w-none px-3 pt-3 xl:px-5" : "max-w-[1600px] p-4"
        } flex-col ${isRoomsHubPage ? "space-y-2" : "space-y-4"}${
          currentRoom && isMobileViewport ? " pb-4" : ""
        } ${isRoomsHubPage ? "h-full min-h-0" : ""}`}
      >
        <AppHeader
          displayUsername={displayUsername}
          hasGuestIdentity={Boolean(username)}
          authUser={authUser}
          authLoading={authLoading}
          onLogin={navigationGuards.handleLoginRequest}
          onLogout={navigationGuards.handleLogoutRequest}
          onEditProfile={openProfileEditor}
          onNavigateRooms={navigationGuards.handleNavigateRooms}
          onNavigateCollections={navigationGuards.handleNavigateCollections}
          onNavigateHistory={navigationGuards.handleNavigateHistory}
          onNavigateSettings={navigationGuards.handleNavigateSettings}
        />

        {isRoomsHubPage ? (
          <div className={roomsOutletClassName}>
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}

        {shouldShowDesktopRoomFooter ? (
          <footer
            className={`flex m-0 shrink-0 items-center justify-center gap-4 pb-[env(safe-area-inset-bottom)] text-xs text-[var(--mc-text-muted)] ${
              currentRoom && isMobileViewport
                ? "game-room-mobile-legal-footer"
                : ""
            }`}
          >
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
              onClick={navigationGuards.handlePrivacyRequest}
            >
              隱私權政策
            </button>

            <span className="text-[var(--mc-border)]">‧</span>

            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
              onClick={navigationGuards.handleTermsRequest}
            >
              服務條款
            </button>
          </footer>
        ) : null}

        {navigationGuards.dialogs}

        <EmbeddedSettingsDialog
          open={inRoomSettingsOpen}
          onClose={() => setInRoomSettingsOpen(false)}
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

export default RoomAwareLayoutShell;
