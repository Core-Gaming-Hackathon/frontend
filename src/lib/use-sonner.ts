import { toast } from "sonner";

type ToastType = "default" | "success" | "error" | "warning" | "info";

export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: ToastType;
  duration?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

/**
 * A simple wrapper around sonner toast for consistent usage
 */
export const useToast = () => {
  return { toast };
};

export default useToast;
