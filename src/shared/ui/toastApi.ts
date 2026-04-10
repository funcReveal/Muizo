import { toast } from "sonner";

type AppToastOptions = {
  id?: string;
};

export const appToast = {
  success: (message: string, options?: AppToastOptions) =>
    toast.success(message, {
      duration: 2600,
      id: options?.id,
    }),
  error: (message: string, options?: AppToastOptions) =>
    toast.error(message, {
      duration: 3600,
      id: options?.id,
    }),
  warning: (message: string, options?: AppToastOptions) =>
    toast.warning(message, {
      duration: 3200,
      id: options?.id,
    }),
  info: (message: string, options?: AppToastOptions) =>
    toast(message, {
      duration: 2800,
      id: options?.id,
    }),
};
