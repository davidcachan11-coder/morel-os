import { createServerCaller } from "@/server/trpc/caller";
import { CustomerSearchBar } from "@/components/admin/clientes/customer-search-bar";
import { CustomersTable } from "@/components/admin/clientes/customers-table";
import { Pagination } from "@/components/admin/orders/pagination";

const PAGE_SIZE = 20;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const page = Math.max(Number(params.page) || 1, 1);

  const trpc = await createServerCaller();
  const { customers, total, pageSize } = await trpc.customers.list({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (page !== 1) next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/clientes?${next.toString()}`;
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Clientes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Base de clientes — quién compra, con qué frecuencia y su historial completo.
            </p>
          </div>
          <CustomerSearchBar initialValue={search} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <CustomersTable customers={customers} />
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          buildHref={(p) => buildHref({ page: p === 1 ? undefined : String(p) })}
          itemLabel="clientes"
        />
      </div>
    </div>
  );
}
