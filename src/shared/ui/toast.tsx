import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      richColors
      closeButton
      expand={false}
      toastOptions={{
        style: {
          background:
            "linear-gradient(180deg, rgba(12,18,30,0.96), rgba(8,12,22,0.98))",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          color: "var(--mc-text, #f8fafc)",
          boxShadow: "0 18px 48px rgba(0, 0, 0, 0.28)",
        },
      }}
    />
  );
}
