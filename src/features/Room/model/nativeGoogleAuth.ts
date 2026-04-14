import { Browser } from "@capacitor/browser";

type StartNativeGoogleLoginOptions = {
  authBaseUrl: string;
  callbackUrl: string;
};

export const startNativeGoogleLogin = async ({
  authBaseUrl,
  callbackUrl,
}: StartNativeGoogleLoginOptions) => {
  const url = new URL("/auth/google/start", authBaseUrl);
  url.searchParams.set("redirect_uri", callbackUrl);

  await Browser.open({
    url: url.toString(),
  });
};
