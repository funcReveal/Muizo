import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

const NATIVE_REFRESH_TOKEN_KEY = "mq_native_refresh_token";

const isNativePlatform = () => Capacitor.isNativePlatform();

export const getNativeRefreshToken = async (): Promise<string | null> => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const result = await SecureStoragePlugin.get({
      key: NATIVE_REFRESH_TOKEN_KEY,
    });

    if (typeof result === "string") {
      return result;
    }

    if (result && typeof result.value === "string") {
      return result.value;
    }

    return null;
  } catch {
    return null;
  }
};

export const setNativeRefreshToken = async (token: string): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  await SecureStoragePlugin.set({
    key: NATIVE_REFRESH_TOKEN_KEY,
    value: token,
  });
};

export const clearNativeRefreshToken = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await SecureStoragePlugin.remove({
      key: NATIVE_REFRESH_TOKEN_KEY,
    });
  } catch {
    // ignore
  }
};
