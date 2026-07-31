import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { settings } from "@/config/settings"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(settings.locale, {
    style: "currency",
    currency: settings.currency,
    maximumFractionDigits: settings.currencyMaxFractionDigits,
  }).format(value);
}

export function formatQuantity(qty: number, unit: string): string {
  const isWeight = unit === "kg";
  return isWeight ? `${qty.toLocaleString(settings.locale)} kg` : `${qty} ${unit === "unidad" ? "un." : unit}`;
}
