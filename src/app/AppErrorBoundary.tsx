import React from "react";

import { isChunkLoadError, reloadOnceForChunkError } from "./runtimeRecovery";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (isChunkLoadError(error)) {
      reloadOnceForChunkError();
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--mc-bg)] p-5 text-[var(--mc-text)]">
        <div className="w-full max-w-md rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-6 text-center shadow-[0_24px_70px_-42px_rgba(0,0,0,0.8)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/24 bg-amber-300/12 text-lg font-black text-amber-100">
            !
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[var(--mc-text)]">
            頁面需要重新載入
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--mc-text-muted)]">
            可能剛完成部署，手機仍保留舊版本頁面。重新整理後會載入最新版本。
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-amber-300/28 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/18"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
