const CHUNK_RELOAD_STORAGE_KEY = `muizo_chunk_reload:${__APP_BUILD_ID__}`;

const chunkErrorPatterns = [
  "ChunkLoadError",
  "Loading chunk",
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
  "Unable to preload CSS",
];

const toErrorText = (value: unknown): string => {
  if (value instanceof Error) {
    return `${value.name} ${value.message}`.trim();
  }
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [record.name, record.message, record.reason, record.type]
      .filter((item): item is string => typeof item === "string")
      .join(" ");
  }
  return "";
};

export const isChunkLoadError = (value: unknown) => {
  const text = toErrorText(value);
  if (!text) return false;
  return chunkErrorPatterns.some((pattern) =>
    text.toLowerCase().includes(pattern.toLowerCase()),
  );
};

const sessionStorageGet = (key: string) => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const sessionStorageSet = (key: string, value: string) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures; reloading once is still safer than a blank app.
  }
};

export const reloadOnceForChunkError = () => {
  if (typeof window === "undefined") return false;
  if (sessionStorageGet(CHUNK_RELOAD_STORAGE_KEY) === "1") return false;
  sessionStorageSet(CHUNK_RELOAD_STORAGE_KEY, "1");
  window.location.reload();
  return true;
};

export const installChunkLoadRecovery = () => {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    const target = event.target;
    const isScriptOrLinkFailure =
      target instanceof HTMLScriptElement || target instanceof HTMLLinkElement;
    if (!isScriptOrLinkFailure && !isChunkLoadError(event.error ?? event.message)) {
      return;
    }
    reloadOnceForChunkError();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) return;
    reloadOnceForChunkError();
  });
};
