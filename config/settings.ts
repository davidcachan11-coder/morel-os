import { DELIVERY_FEE } from "@/constants/pricing";
import { STORAGE_KEYS } from "@/constants/storage";

/**
 * App-wide business/runtime settings. Composes the primitive values in
 * constants/ with locale and currency configuration.
 */
export const settings = {
  locale: "es-AR",
  currency: "ARS",
  currencyMaxFractionDigits: 0,
  deliveryFee: DELIVERY_FEE,
  storageKeys: STORAGE_KEYS,
} as const;
