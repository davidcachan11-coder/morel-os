"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import type { AppRouter } from "@/server/trpc/root";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Lock,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  useCartStore,
  cartLinesArray,
  cartSubtotal,
  type CartLine,
} from "@/lib/cart-store";
import { useCheckoutStore } from "@/lib/checkout-store";
import { deliverySlots } from "@/data/delivery";
import { CheckoutSummary } from "@/components/tienda/checkout-summary";
import { DELIVERY_FEE } from "@/constants/pricing";
import { saveOrder, type StoredOrder } from "@/services/orders";
import { cn, formatCurrency, formatQuantity } from "@/lib/utils";

const steps = ["Sustituciones", "Entrega", "Pago", "Confirmación"];

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const toggleNeverSubstitute = useCartStore((s) => s.toggleNeverSubstitute);
  const clearCart = useCartStore((s) => s.clearCart);

  const linesArray = useMemo(() => cartLinesArray(lines), [lines]);
  const subtotal = cartSubtotal(lines);

  const ensureIdempotencyKey = useCheckoutStore((s) => s.ensureIdempotencyKey);
  const clearIdempotencyKey = useCheckoutStore((s) => s.clearIdempotencyKey);

  const [currentStep, setCurrentStep] = useState(0);
  const [address, setAddress] = useState("Av. Belgrano 1248, San Miguel de Tucumán");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<StoredOrder | null>(null);

  // Generated once per checkout session and persisted across a refresh —
  // PR 4 reads this when it wires saveOrder's real idempotencyKey input.
  useEffect(() => {
    ensureIdempotencyKey();
  }, [ensureIdempotencyKey]);

  const selectedSlot = deliverySlots.find((s) => s.id === selectedSlotId) ?? null;

  const customerValid =
    customerName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) &&
    customerPhone.trim().length > 0;

  const paymentValid =
    cardName.trim().length > 2 &&
    cardNumber.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
    cardCvv.length >= 3;

  function handleCardNumberChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
  }

  function handleExpiryChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) {
      setCardExpiry(digits);
    } else {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    }
  }

  async function handlePay() {
    if (!paymentValid || !selectedSlot) return;
    setIsSubmitting(true);
    try {
      const result = await saveOrder({
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        deliverySlotId: selectedSlot.id,
        address,
        items: linesArray.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          neverSubstitute: line.neverSubstitute,
        })),
        idempotencyKey: ensureIdempotencyKey(),
      });
      const order: StoredOrder = {
        id: result.id,
        orderNumber: result.orderNumber,
        createdAt: result.createdAt,
        items: linesArray.map((line) => ({
          quantity: line.quantity,
          neverSubstitute: line.neverSubstitute,
          product: {
            id: line.product.id,
            name: line.product.name,
            unit: line.product.unit,
            price: line.product.price,
            emoji: line.product.emoji,
            gradient: line.product.gradient,
          },
        })),
        subtotal,
        deliveryFee: DELIVERY_FEE,
        total: subtotal + DELIVERY_FEE,
        address,
        slot: selectedSlot,
        customerName,
        // saveOrder's transaction creates exactly one status event
        // (confirmado) atomically alongside the order itself.
        statusEvents: [{ status: "confirmado", createdAt: result.createdAt }],
      };
      setConfirmedOrder(order);
      setCurrentStep(3);
      clearCart();
      // A successful order consumed this key; the next checkout (new cart,
      // new order) must start with a fresh one, not reuse this one.
      clearIdempotencyKey();
    } catch (error) {
      // Deliberately does not clear the idempotency key — a retry with the
      // same key is exactly what saveOrder's idempotency check is for, and
      // this stays on the Pago step so the same click naturally becomes
      // that retry.
      //
      // Only a deliberate business-rule TRPCError (BAD_REQUEST, CONFLICT —
      // e.g. "Selected delivery slot is full.") is safe to show verbatim.
      // INTERNAL_SERVER_ERROR (or anything else unexpected — a dropped
      // connection, a genuine bug) can carry raw internal detail in its
      // message and must never reach the customer as-is.
      const isSafeToShow =
        error instanceof TRPCClientError &&
        error.data?.code !== undefined &&
        error.data.code !== "INTERNAL_SERVER_ERROR";
      const message = isSafeToShow
        ? (error as TRPCClientError<AppRouter>).message
        : "No pudimos procesar tu pedido. Intentá de nuevo.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (linesArray.length === 0 && !confirmedOrder) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <PackageCheck className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Tu carrito está vacío</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Agregá productos desde la tienda antes de continuar con el pedido.
        </p>
        <Link href="/tienda">
          <Button className="mt-2 rounded-full">Ir a la tienda</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Finalizar pedido
          </h1>
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    i < currentStep
                      ? "bg-brand-green text-white"
                      : i === currentStep
                      ? "bg-brand-navy text-white"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-sm font-medium",
                    i <= currentStep ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                {i < steps.length - 1 && (
                  <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid grid-cols-1 gap-8",
            currentStep < 3 && "lg:grid-cols-[1fr_320px]"
          )}
        >
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                  <div className="flex items-start gap-3 rounded-xl bg-brand-orange/10 p-3.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange-dark" />
                    <p className="text-xs leading-relaxed text-brand-orange-dark">
                      Marcá los productos que <strong>nunca</strong> querés que sustituyamos.
                      Para el resto, si falta stock, elegimos el reemplazo más parecido.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col divide-y divide-border">
                    {linesArray.map((line) => (
                      <SubstitutionRow
                        key={line.product.id}
                        line={line}
                        onToggle={() => toggleNeverSubstitute(line.product.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    size="lg"
                    className="rounded-full bg-brand-navy px-8 text-white hover:bg-brand-navy-light"
                    onClick={() => setCurrentStep(1)}
                  >
                    Continuar
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <form
                  className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <p className="text-sm font-medium text-foreground">Tus datos de contacto</p>
                  <div className="mt-3 flex flex-col gap-4">
                    <div>
                      <Label htmlFor="customerName">Nombre completo</Label>
                      <div className="relative mt-1.5">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          autoComplete="name"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="customerEmail">Correo electrónico</Label>
                        <div className="relative mt-1.5">
                          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="customerEmail"
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            autoComplete="email"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Teléfono</Label>
                        <div className="relative mt-1.5">
                          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="customerPhone"
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            autoComplete="tel"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Label htmlFor="address" className="mt-6 block text-sm font-medium text-foreground">
                    Dirección de entrega
                  </Label>
                  <div className="relative mt-2">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      autoComplete="street-address"
                      className="pl-10"
                    />
                  </div>

                  <p className="mb-3 mt-6 text-sm font-medium text-foreground">
                    Elegí un horario de entrega
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {deliverySlots.map((slot) => {
                      const disabled = slot.spotsLeft === 0;
                      const selected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          disabled={disabled}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={cn(
                            "flex flex-col items-start rounded-xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                            selected
                              ? "border-brand-navy bg-brand-navy/5 shadow-soft"
                              : "border-border hover:border-brand-navy/40"
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">
                              {slot.dayLabel}
                              {slot.express && (
                                <span className="ml-1.5 rounded-full bg-brand-green/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-green-dark">
                                  Express
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{slot.dateLabel}</span>
                          </div>
                          <span className="mt-1 text-sm text-muted-foreground">{slot.timeRange}</span>
                          <span
                            className={cn(
                              "mt-2 text-[11px] font-medium",
                              disabled
                                ? "text-destructive"
                                : slot.capacity === "baja"
                                ? "text-brand-orange-dark"
                                : "text-brand-green-dark"
                            )}
                          >
                            {disabled
                              ? "Sin turnos disponibles"
                              : `${slot.spotsLeft} de ${slot.totalSpots} turnos libres`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </form>

                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={() => setCurrentStep(0)}>
                    Atrás
                  </Button>
                  <Button
                    size="lg"
                    disabled={!selectedSlotId || !customerValid}
                    className="rounded-full bg-brand-navy px-8 text-white hover:bg-brand-navy-light"
                    onClick={() => setCurrentStep(2)}
                  >
                    Continuar
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Lock className="h-4 w-4 text-brand-green-dark" />
                    Pago simulado — no se procesa ningún cobro real
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                      <Input
                        id="cardName"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Camila Ferreyra"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Número de tarjeta</Label>
                      <Input
                        id="cardNumber"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                        className="mt-1.5 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardExpiry">Vencimiento</Label>
                        <Input
                          id="cardExpiry"
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="MM/AA"
                          inputMode="numeric"
                          className="mt-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                          }
                          placeholder="123"
                          inputMode="numeric"
                          className="mt-1.5 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                    Atrás
                  </Button>
                  <Button
                    size="lg"
                    disabled={!paymentValid || isSubmitting}
                    onClick={handlePay}
                    className="rounded-full bg-brand-navy px-8 text-white hover:bg-brand-navy-light"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Procesando…
                      </>
                    ) : (
                      <>Pagar {formatCurrency(subtotal + DELIVERY_FEE)}</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && confirmedOrder && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="lg:col-span-2"
              >
                <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-border/70 bg-card px-6 py-12 text-center shadow-soft-lg">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/15"
                  >
                    <CheckCircle2 className="h-8 w-8 text-brand-green-dark" />
                  </motion.div>
                  <h2 className="mt-5 text-2xl font-semibold text-foreground">
                    ¡Pedido confirmado!
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tu pedido <span className="font-semibold text-foreground">#{confirmedOrder.orderNumber}</span>{" "}
                    está en camino a preparación.
                  </p>

                  <div className="mt-6 flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 p-4 text-left">
                    <Truck className="h-5 w-5 shrink-0 text-brand-navy" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {confirmedOrder.slot.dayLabel} · {confirmedOrder.slot.timeRange}
                      </p>
                      <p className="text-xs text-muted-foreground">{confirmedOrder.address}</p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="w-full text-left">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      {confirmedOrder.items.length} productos · {formatCurrency(confirmedOrder.total)}
                    </p>
                    <div className="flex flex-col gap-2">
                      {confirmedOrder.items.slice(0, 4).map((line) => (
                        <div key={line.product.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{line.product.emoji}</span>
                          <span className="flex-1 truncate">{line.product.name}</span>
                          <span>{formatQuantity(line.quantity, line.product.unit)}</span>
                        </div>
                      ))}
                      {confirmedOrder.items.length > 4 && (
                        <p className="text-xs text-muted-foreground">
                          +{confirmedOrder.items.length - 4} productos más
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                    <Link href="/tienda" className="w-full">
                      <Button variant="outline" className="w-full rounded-full">
                        Volver a la tienda
                      </Button>
                    </Link>
                    <Button
                      className="w-full rounded-full bg-brand-navy text-white hover:bg-brand-navy-light"
                      onClick={() => router.push(`/pedido/${confirmedOrder.id}`)}
                    >
                      Ver seguimiento en vivo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentStep < 3 && (
            <div>
              <CheckoutSummary lines={linesArray} slot={selectedSlot} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubstitutionRow({
  line,
  onToggle,
}: {
  line: CartLine;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xl ${line.product.gradient}`}
      >
        {line.product.emoji}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{line.product.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatQuantity(line.quantity, line.product.unit)} · {formatCurrency(line.product.price)} /{" "}
          {line.product.unit}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Nunca sustituir</span>
        <Switch
          checked={line.neverSubstitute}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-brand-orange"
        />
      </div>
    </div>
  );
}
