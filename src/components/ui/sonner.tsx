"use client"

import React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Extend the toast type to include additional properties or modify existing ones
// We need to match the original types to avoid conflicts
declare module "sonner" {
  interface ToastT {
    // Use ReactNode for compatibility with the original type
    variant?: "default" | "destructive" | "success";
  }
}

// Custom Toast component that can accept a title prop
export const Toast = (props: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
}) => {
  return (
    <div className="flex flex-col gap-1">
      {props.title && <div className="font-semibold">{props.title}</div>}
      {props.description && <div>{props.description}</div>}
    </div>
  );
};

// Custom implementation of toast methods
const customToast = {
  ...toast,
  // Override the default toast method to support title, description, and variant
  default: (message: React.ReactNode, data?: { title?: React.ReactNode; description?: React.ReactNode; variant?: "default" | "destructive" | "success" }) => {
    if (typeof message === "string" && data?.title) {
      return toast(
        <Toast 
          title={data.title} 
          description={message} 
          variant={data.variant || "default"} 
        />
      );
    }
    return toast(message);
  },
  error: (message: React.ReactNode, data?: { title?: React.ReactNode; description?: React.ReactNode }) => {
    if (typeof message === "string" && data?.title) {
      return toast.error(
        <Toast 
          title={data.title} 
          description={message} 
          variant="destructive" 
        />
      );
    }
    return toast.error(message);
  },
  success: (message: React.ReactNode, data?: { title?: React.ReactNode; description?: React.ReactNode }) => {
    if (typeof message === "string" && data?.title) {
      return toast.success(
        <Toast 
          title={data.title} 
          description={message} 
          variant="success" 
        />
      );
    }
    return toast.success(message);
  },
  warning: (message: React.ReactNode, data?: { title?: React.ReactNode; description?: React.ReactNode }) => {
    if (typeof message === "string" && data?.title) {
      return toast.warning(
        <Toast 
          title={data.title} 
          description={message} 
        />
      );
    }
    return toast.warning(message);
  },
  info: (message: React.ReactNode, data?: { title?: React.ReactNode; description?: React.ReactNode }) => {
    if (typeof message === "string" && data?.title) {
      return toast.info(
        <Toast 
          title={data.title} 
          description={message} 
        />
      );
    }
    return toast.info(message);
  },
};

export { customToast as toast };

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as "light" | "dark"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          title: "group-[.toast]:text-foreground text-sm font-semibold",
          description: "group-[.toast]:text-muted-foreground text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "group toast group-[.toaster]:bg-destructive/15 group-[.toaster]:text-destructive group-[.toaster]:border-destructive",
          success:
            "group toast group-[.toaster]:bg-green-500/15 group-[.toaster]:text-green-600 dark:group-[.toaster]:text-green-400 group-[.toaster]:border-green-500/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
