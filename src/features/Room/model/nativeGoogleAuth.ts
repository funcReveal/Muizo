import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export type NativeGoogleLoginResult = {
  idToken: string | null;
  serverAuthCode: string | null;
  email: string | null;
  displayName: string | null;
  imageUrl: string | null;
};

let initialized = false;

const GOOGLE_SCOPES = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/youtube.readonly",
];

const ensureInitialized = async () => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      "Google native sign-in is only available on native platform",
    );
  }

  if (initialized) {
    return;
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const serverClientId =
    import.meta.env.VITE_GOOGLE_SERVER_CLIENT_ID ?? clientId;

  if (!clientId) {
    throw new Error("尚未設定 VITE_GOOGLE_CLIENT_ID");
  }

  await GoogleAuth.initialize({
    clientId,
    serverClientId,
    scopes: GOOGLE_SCOPES,
    grantOfflineAccess: true,
  } as never);

  initialized = true;
};

export const startNativeGoogleLogin =
  async (): Promise<NativeGoogleLoginResult> => {
    await ensureInitialized();

    const user = (await GoogleAuth.signIn()) as {
      email?: string;
      name?: string;
      imageUrl?: string;
      serverAuthCode?: string;
      authentication?: {
        idToken?: string;
        accessToken?: string;
      };
    };

    const idToken = user.authentication?.idToken ?? null;
    const serverAuthCode = user.serverAuthCode ?? null;

    if (!serverAuthCode) {
      throw new Error(
        "Google native sign-in did not return serverAuthCode. 請確認 Google Console 與 plugin 的 offline access 設定。",
      );
    }

    return {
      idToken,
      serverAuthCode,
      email: user.email ?? null,
      displayName: user.name ?? null,
      imageUrl: user.imageUrl ?? null,
    };
  };

export const signOutNativeGoogle = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await GoogleAuth.signOut();
  } catch {
    // ignore
  }
};
