"use client"

import { toast } from "sonner"

export interface EventToastOptions {
  title?: string
  description?: string
  duration?: number
}

export class EventToast {
  static success(message: string, options?: EventToastOptions) {
    return toast.success(options?.title || "Success", {
      description: message,
      duration: options?.duration || 4000,
    })
  }

  static error(message: string, options?: EventToastOptions) {
    return toast.error(options?.title || "Error", {
      description: message,
      duration: options?.duration || 6000,
    })
  }

  static warning(message: string, options?: EventToastOptions) {
    return toast.warning(options?.title || "Warning", {
      description: message,
      duration: options?.duration || 5000,
    })
  }

  static info(message: string, options?: EventToastOptions) {
    return toast.info(options?.title || "Info", {
      description: message,
      duration: options?.duration || 4000,
    })
  }

  static loading(message: string, options?: EventToastOptions) {
    return toast.loading(options?.title || "Loading", {
      description: message,
      duration: Infinity,
    })
  }

  static dismiss(toastId?: string | number) {
    return toast.dismiss(toastId)
  }

  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: EventToastOptions
  ) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  }
}

// Convenience functions for common operations
export const showSuccess = (message: string, title?: string) => 
  EventToast.success(message, { title })

export const showError = (message: string, title?: string) => 
  EventToast.error(message, { title })

export const showWarning = (message: string, title?: string) => 
  EventToast.warning(message, { title })

export const showInfo = (message: string, title?: string) => 
  EventToast.info(message, { title })

export const showLoading = (message: string, title?: string) => 
  EventToast.loading(message, { title })

export const dismissToast = (toastId?: string | number) => 
  EventToast.dismiss(toastId)
