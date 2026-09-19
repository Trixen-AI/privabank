import { createContext, useContext } from "react";

export type ToastTone = "ok" | "bad" | "info";
export type ToastInput = { tone?: ToastTone; title: string; body?: string; href?: string; hrefLabel?: string };

export const ToastContext = createContext<(t: ToastInput) => void>(() => {});

export const useToast = () => useContext(ToastContext);
