import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TRPCError } from "@trpc/server";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/server/auth/staff";
import { ORDERS_STAFF_ROLES } from "@/server/orders/status";
import { createServerCaller } from "@/server/trpc/caller";
import { cn, formatCurrency, formatQuantity } from "@/lib/utils";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS } from "@/components/admin/order-status-ui";
import { AdvanceStatusButton } from "@/components/admin/orders/advance-status-button";
import { AdminStatusSelect } from "@/components/admin/orders/admin-status-select";
import { OrderStatusTimeline } from "@/components/admin/orders/order-status-timeline";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.role || !ORDERS_STAFF_ROLES.includes(session.user.role)) {
    redirect("/admin");
  }

  const { id } = await params;
  const trpc = await createServerCaller();

  let order;
  try {
    order = await trpc.orders.staff.getDetail({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const currentStatus = order.statusEvents[order.statusEvents.length - 1]?.status ?? null;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/admin/pedidos"
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a pedidos
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Pedido #{order.orderNumber}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.createdAt.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}{" "}
                · {order.branch.name}
              </p>
            </div>
            {currentStatus && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  ORDER_STATUS_BADGE_CLASS[currentStatus]
                )}
              >
                {ORDER_STATUS_LABELS[currentStatus]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Productos</h2>
            <div className="flex flex-col divide-y divide-border/70">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xl",
                      item.product.gradient
                    )}
                  >
                    {item.product.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatQuantity(Number(item.quantity), item.product.unit)}
                      {item.neverSubstitute && " · Nunca sustituir"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatCurrency(Number(item.product.price) * Number(item.quantity))}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-1 border-t border-border/70 pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Envío</span>
                <span>{formatCurrency(Number(order.deliveryFee))}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Historial de estado</h2>
            <OrderStatusTimeline events={order.statusEvents} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Acción</h2>
            {currentStatus && (
              <div className="flex flex-col gap-4">
                <AdvanceStatusButton orderId={order.id} currentStatus={currentStatus} />
                {session.user.role === "ADMIN" && (
                  <AdminStatusSelect orderId={order.id} currentStatus={currentStatus} />
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Cliente</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Nombre</dt>
                <dd className="text-foreground">
                  {order.customer.user.name ?? order.customer.user.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="text-foreground">{order.customer.user.email}</dd>
              </div>
              {order.customer.user.phone && (
                <div>
                  <dt className="text-xs text-muted-foreground">Teléfono</dt>
                  <dd className="text-foreground">{order.customer.user.phone}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Entrega</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Dirección</dt>
                <dd className="text-foreground">{order.address}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Franja horaria</dt>
                <dd className="text-foreground">
                  {order.deliverySlot.dayLabel} · {order.deliverySlot.timeRange}
                  {order.deliverySlot.express && " · Express"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
