import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

type UseNativeAuthCallbackOptions = {
  onCodeReceived: (code: string) => void;
  onError: (message: string) => void;
};

export const useNativeAuthCallback = ({
  onCodeReceived,
  onError,
}: UseNativeAuthCallbackOptions) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isActive = true;

    const listenerPromise = App.addListener("appUrlOpen", async ({ url }) => {
      if (!isActive) return;

      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("code");
        const error = parsed.searchParams.get("error");

        await Browser.close().catch(() => null);

        if (error) {
          onError(error);
          return;
        }

        if (!code) {
          onError("登入回呼缺少 code");
          return;
        }

        onCodeReceived(code);
      } catch {
        onError("登入回呼解析失敗");
      }
    });

    return () => {
      isActive = false;
      void listenerPromise.then((listener) => listener.remove());
    };
  }, [onCodeReceived, onError]);
};
