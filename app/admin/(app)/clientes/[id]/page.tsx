import { notFound } from "next/navigation";
import Link from "next/link";
import { TRPCError } from "@trpc/server";
import { ArrowLeft } from "lucide-react";
import { createServerCaller } from "@/server/trpc/caller";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS } from "@/components/admin/order-status-ui";
import { SEGMENT_BADGE_CLASS, SEGMENT_LABELS } from "@/components/admin/customer-segment-ui";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await createServerCaller();

  let customer;
  try {
    customer = await trpc.customers.getDetail({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/admin/clientes"
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a clientes
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {customer.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Cliente desde {customer.memberSince.toLocaleDateString("es-AR", { dateStyle: "medium" })}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                SEGMENT_BADGE_CLASS[customer.segment]
              )}
            >
              {SEGMENT_LABELS[customer.segment]}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Historial de pedidos</h2>
            {customer.orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Este cliente todavía no tiene pedidos.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/70">
                {customer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-medium text-brand-navy hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {order.branchName} · {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                    {order.status && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          ORDER_STATUS_BADGE_CLASS[order.status]
                        )}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    )}
                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Resumen</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Pedidos totales</dt>
                <dd className="text-foreground">{customer.orderCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Gasto histórico</dt>
                <dd className="font-semibold text-foreground">
                  {formatCurrency(customer.lifetimeSpend)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Ticket promedio</dt>
                <dd className="text-foreground">
                  {customer.averageOrderValue !== null
                    ? formatCurrency(customer.averageOrderValue)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Último pedido</dt>
                <dd className="text-foreground">
                  {customer.lastOrderAt ? formatRelativeTime(customer.lastOrderAt) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Preferencia de sustitución</dt>
                <dd className="text-foreground">
                  {customer.neverSubstitutePct !== null
                    ? `${customer.neverSubstitutePct.toFixed(0)}% de sus productos marcados "nunca sustituir"`
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Contacto</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="text-foreground">{customer.email}</dd>
              </div>
              {customer.phone && (
                <div>
                  <dt className="text-xs text-muted-foreground">Teléfono</dt>
                  <dd className="text-foreground">{customer.phone}</dd>
                </div>
              )}
            </dl>
          </div>

          {customer.addresses.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Direcciones</h2>
              <div className="flex flex-col gap-2 text-sm">
                {customer.addresses.map((address, i) => (
                  <div key={i} className="text-foreground">
                    {address.street}, {address.sector}, {address.municipality}
                    {address.isDefault && (
                      <span className="ml-1.5 text-[11px] text-muted-foreground">(principal)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
