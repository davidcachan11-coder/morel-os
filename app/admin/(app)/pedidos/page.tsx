import { redirect } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { auth } from "@/server/auth/staff";
import { ORDERS_STAFF_ROLES } from "@/server/orders/status";
import { createServerCaller } from "@/server/trpc/caller";
import { OrderSearchBar } from "@/components/admin/orders/order-search-bar";
import { OrderStatusFilter } from "@/components/admin/orders/order-status-filter";
import { BranchSelector } from "@/components/admin/branch-selector";
import { ViewToggle, type OrdersView } from "@/components/admin/orders/view-toggle";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import { OrdersBoard } from "@/components/admin/orders/orders-board";
import { Pagination } from "@/components/admin/orders/pagination";
import { ORDER_STATUS_SEQUENCE } from "@/components/admin/order-status-ui";

const PAGE_SIZE = 20;
// Board mode isn't paginated — it shows everything currently in flight —
// so it fetches a larger batch instead of a page. Capped at the same 100
// orders.staff.list enforces as its own pageSize maximum (not raised for
// board mode specifically — 100 is already generous at today's order
// volume); would need real cursor-based fetching if this cap were ever hit.
const BOARD_FETCH_SIZE = 100;

function parseStatus(value: string | undefined): OrderStatus | undefined {
  return value && (ORDER_STATUS_SEQUENCE as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : undefined;
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    branch?: string;
    view?: string;
    page?: string;
  }>;
}) {
  // Defense in depth on top of orders.staff.*'s own protectedProcedure
  // gate — app/admin/(app)/layout.tsx only checks "is staff," not which
  // module; without this check a disallowed role would reach this page's
  // markup before its data-fetching calls failed server-side.
  const session = await auth();
  if (!session?.user?.role || !ORDERS_STAFF_ROLES.includes(session.user.role)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const view: OrdersView = params.view === "board" ? "board" : "list";
  const search = params.search?.trim() ?? "";
  const status = parseStatus(params.status);
  const branchId = params.branch || undefined;
  const page = Math.max(Number(params.page) || 1, 1);

  const trpc = await createServerCaller();
  const [{ orders, total, pageSize }, branches] = await Promise.all([
    trpc.orders.staff.list({
      search: search || undefined,
      status,
      branchId,
      page: view === "board" ? 1 : page,
      pageSize: view === "board" ? BOARD_FETCH_SIZE : PAGE_SIZE,
    }),
    trpc.analytics.listBranches(),
  ]);

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (status) next.set("status", status);
    if (branchId) next.set("branch", branchId);
    if (view !== "list") next.set("view", view);
    if (page !== 1) next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/pedidos?${next.toString()}`;
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Pedidos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Búsqueda, filtros y flujo de fulfillment — operá el negocio pedido por pedido.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <OrderSearchBar initialValue={search} />
            <OrderStatusFilter />
            <BranchSelector branches={branches} />
            <ViewToggle
              current={view}
              buildHref={(v) => buildHref({ view: v === "list" ? undefined : v, page: undefined })}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {view === "list" ? (
          <>
            <OrdersTable orders={orders} />
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              buildHref={(p) => buildHref({ page: p === 1 ? undefined : String(p) })}
            />
          </>
        ) : (
          <OrdersBoard orders={orders} />
        )}
      </div>
    </div>
  );
}
