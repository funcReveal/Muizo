import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { USERNAME_MAX } from "@domain/room/constants";

type IdentityProfileDialogProps = {
  needsNicknameConfirm: boolean;
  isProfileEditorOpen: boolean;
  nicknameDraft: string;
  setNicknameDraft: (value: string) => void;
  confirmNickname: () => void;
  closeProfileEditor: () => void;
};

const IdentityProfileDialog: React.FC<IdentityProfileDialogProps> = ({
  needsNicknameConfirm,
  isProfileEditorOpen,
  nicknameDraft,
  setNicknameDraft,
  confirmNickname,
  closeProfileEditor,
}) => (
  <Dialog
    open={needsNicknameConfirm || isProfileEditorOpen}
    onClose={() => {
      if (!needsNicknameConfirm) {
        closeProfileEditor();
      }
    }}
  >
    <DialogTitle>
      {needsNicknameConfirm ? "請設定暱稱" : "編輯個人資料"}
    </DialogTitle>
    <DialogContent>
      <p className="text-sm text-[var(--mc-text-muted)] mb-2">
        {needsNicknameConfirm
          ? "你已使用 Google 登入，請設定顯示暱稱。之後可在個人資料中修改。"
          : "請更新顯示暱稱。"}
      </p>
      <input
        className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--mc-surface-strong)] border border-[var(--mc-border)] outline-none focus:border-[var(--mc-accent)] focus:ring-1 focus:ring-[var(--mc-glow)]"
        placeholder="請輸入顯示暱稱"
        value={nicknameDraft}
        onChange={(e) =>
          setNicknameDraft(e.target.value.slice(0, USERNAME_MAX))
        }
        maxLength={USERNAME_MAX}
      />
    </DialogContent>
    <DialogActions>
      {!needsNicknameConfirm && (
        <Button onClick={closeProfileEditor} variant="outlined">
          取消
        </Button>
      )}
      <Button onClick={confirmNickname} variant="contained">
        確認
      </Button>
    </DialogActions>
  </Dialog>
);

export default IdentityProfileDialog;
