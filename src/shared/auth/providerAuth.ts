type ProviderErrorPayload = {
  error?: string | null;
  error_code?: string | null;
};

export const isGoogleReauthRequired = (
  payload?: ProviderErrorPayload | null,
) => {
  const errorCode = String(payload?.error_code ?? "").trim().toLowerCase();
  if (errorCode === "google_reauth_required") {
    return true;
  }
  const message = String(payload?.error ?? "").trim().toLowerCase();
  return (
    message.includes("需要重新授權 google") ||
    message.includes("missing refresh token") ||
    message.includes("failed to refresh access token") ||
    message.includes("insufficient authentication scopes") ||
    message.includes("insufficientpermissions")
  );
};

export const toGoogleReauthMessage = (
  payload?: ProviderErrorPayload | null,
  fallback = "需要重新授權 Google",
) => (isGoogleReauthRequired(payload) ? "需要重新授權 Google" : fallback);
