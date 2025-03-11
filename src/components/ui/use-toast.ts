
// Define toast types
export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
}

// Create a simple toast hook
export const useToast = () => {
  const toast = ({ title, description, variant = "default" }: Omit<ToastProps, 'action'>) => {
    // Placeholder for actual toast implementation
    console.log(`Toast: ${variant} - ${title}: ${description}`);
  };

  return {
    toast
  };
};
