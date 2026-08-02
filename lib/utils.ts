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

// Extracted here once a second call site needed it (components/admin/orders'
// table) — was previously inlined only in recent-activity-list.tsx.
export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}
