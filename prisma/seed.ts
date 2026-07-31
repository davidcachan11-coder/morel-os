import { pathToFileURL } from "node:url";
import { PrismaClient, type OrderStatus } from "@prisma/client";
import { categories, products } from "@/data/catalog";
import { deliverySlots } from "@/data/delivery";
import {
  buildDemoOrder,
  type OrderStatusId,
} from "@/data/orders";
import { adminOrders, branches, customerNames } from "@/data/admin";
import { DELIVERY_FEE } from "@/constants/pricing";

// ---------------------------------------------------------------------------
// Placeholder values
//
// These fill schema-required fields that have no equivalent in today's
// Argentina-themed mock data (data/catalog.ts, data/delivery.ts,
// data/orders.ts, data/admin.ts). Each is a clearly-marked stand-in, not
// real DR data — see docs/DECISIONS.md's "Sprint 3 Phase 1 seed data"
// entry for the policy this follows, and its "initial Prisma schema"
// entry for why Customer/Driver require a linked User (identity rows are
// created below purely as placeholders too — no login credentials, no
// auth logic). A dedicated content migration to real DR products,
// pricing, addresses, and tax data is a separate, later sprint.
// ---------------------------------------------------------------------------

const PLACEHOLDER_PROVINCE = "Distrito Nacional";
const PLACEHOLDER_MUNICIPALITY = "Santo Domingo de Guzmán";
const PLACEHOLDER_SECTOR = "Sector pendiente de definir";
const PLACEHOLDER_BRANCH_ADDRESS =
  "Dirección de sucursal pendiente de definir";
const PLACEHOLDER_ORDER_ADDRESS = "Dirección de pedido pendiente de definir";
const PLACEHOLDER_EMAIL_DOMAIN = "placeholder.morel.local";

// Fixed, reproducible id for the one fully-detailed seed order (built from
// data/orders.ts's buildDemoOrder + demoOrderItems, the only mock data with
// real product/quantity-level detail). Arbitrary but stable across seed
// runs, following services/orders.ts's generateOrderId() "MO-7xxxx" format.
const DEMO_ORDER_ID = "MO-79001";

const STATUS_MAP: Record<OrderStatusId, OrderStatus> = {
  confirmado: "CONFIRMADO",
  preparando: "PREPARANDO",
  control_calidad: "CONTROL_CALIDAD",
  en_camino: "EN_CAMINO",
  entregado: "ENTREGADO",
};

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// buildSeedData — pure transformation of data/*.ts into row shapes matching
// prisma/schema.prisma. No Prisma calls here, so this half of the script can
// be exercised (and its output inspected) without a database connection.
// ---------------------------------------------------------------------------

export function buildSeedData() {
  const categoryRows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    gradient: c.gradient,
  }));

  const brandNames = Array.from(
    new Set(
      products
        .map((p) => p.brand)
        .filter((b): b is string => typeof b === "string")
    )
  );
  const brandRows = brandNames.map((name) => ({
    id: `brand-${slugify(name)}`,
    name,
  }));

  const productRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    brandId: p.brand ? `brand-${slugify(p.brand)}` : null,
    categoryId: p.category,
    price: p.price,
    unit: p.unit,
    description: p.description,
    substitutable: p.substitutable,
    discountPct: p.discountPct ?? null,
    emoji: p.emoji,
    gradient: p.gradient,
    popular: p.popular ?? false,
  }));

  const deliverySlotRows = deliverySlots.map((s) => ({
    id: s.id,
    dayLabel: s.dayLabel,
    dateLabel: s.dateLabel,
    timeRange: s.timeRange,
    capacity: s.capacity,
    spotsLeft: s.spotsLeft,
    totalSpots: s.totalSpots,
    express: s.express ?? false,
  }));

  // Placeholder: province/municipality/address have no equivalent on
  // data/admin.ts's branch name strings.
  const branchRows = branches.map((name) => ({
    id: `branch-${slugify(name)}`,
    name,
    province: PLACEHOLDER_PROVINCE,
    municipality: PLACEHOLDER_MUNICIPALITY,
    address: PLACEHOLDER_BRANCH_ADDRESS,
  }));

  // Every Customer/Driver requires a linked User (see docs/DECISIONS.md's
  // schema-scope entry) — these are placeholder identity rows only, no
  // credentials and no auth logic attached.
  const customerUserRows = customerNames.map((name) => ({
    id: `user-customer-${slugify(name)}`,
    email: `${slugify(name)}@${PLACEHOLDER_EMAIL_DOMAIN}`,
    name,
    role: "CUSTOMER" as const,
  }));

  const customerRows = customerNames.map((name) => ({
    id: `customer-${slugify(name)}`,
    userId: `user-customer-${slugify(name)}`,
  }));

  // The one real address in the mock data: data/orders.ts's demo order
  // address, for its customer ("Camila Ferreyra"). The street portion is
  // preserved verbatim; sector/municipality/province are DR-specific
  // fields the source string never had, so they're placeholders. The
  // other 19 customers have no address data anywhere in the mock data —
  // no Address row is fabricated for them.
  const demoOrder = buildDemoOrder(DEMO_ORDER_ID);
  const demoCustomerId = `customer-${slugify(demoOrder.customerName)}`;

  const addressRows = [
    {
      id: `address-${demoCustomerId}-1`,
      customerId: demoCustomerId,
      street: demoOrder.address,
      sector: PLACEHOLDER_SECTOR,
      municipality: PLACEHOLDER_MUNICIPALITY,
      province: PLACEHOLDER_PROVINCE,
      referencePoint: null as string | null,
      postalCode: null as string | null,
      lat: null as number | null,
      lng: null as number | null,
      isDefault: true,
    },
  ];

  // The fully-detailed demo order — every field here is real, computed
  // directly from data/orders.ts's buildDemoOrder/demoOrderItems, except
  // branchId (buildDemoOrder has no branch field at all; placeholder:
  // assigned to the first seeded branch).
  const demoOrderRow = {
    id: demoOrder.id,
    customerId: demoCustomerId,
    branchId: branchRows[0].id,
    deliverySlotId: demoOrder.slot.id,
    address: demoOrder.address,
    subtotal: demoOrder.subtotal,
    deliveryFee: demoOrder.deliveryFee,
    total: demoOrder.total,
    createdAt: new Date(demoOrder.createdAt),
  };

  const demoOrderItemRows = demoOrder.items.map((item, index) => ({
    id: `orderitem-${demoOrder.id}-${index}`,
    orderId: demoOrder.id,
    productId: item.product.id,
    quantity: item.quantity,
    neverSubstitute: item.neverSubstitute,
  }));

  const demoOrderStatusEventRows = [
    {
      id: `statusevent-${demoOrder.id}-1`,
      orderId: demoOrder.id,
      status: "CONFIRMADO" as OrderStatus,
      createdAt: new Date(demoOrder.createdAt),
    },
  ];

  // The 20 admin-dashboard orders (data/admin.ts's adminOrders). These only
  // ever carried summary fields (itemCount, total) — never real line
  // items — so no OrderItem rows are created for them; fabricating
  // specific products/quantities that never existed in the mock data
  // would be inventing business data, not filling a documented
  // placeholder. deliverySlotId and address are placeholders for the same
  // reason: adminOrders has neither field. subtotal is derived (not
  // fabricated) from the real total minus the real DELIVERY_FEE constant.
  const adminOrderRows = adminOrders.map((order) => {
    const minutesAgo = parseInt(order.placedAgo, 10);
    const createdAt = new Date(Date.now() - minutesAgo * 60_000);
    return {
      id: order.id,
      customerId: `customer-${slugify(order.customerName)}`,
      branchId: `branch-${slugify(order.branch)}`,
      deliverySlotId: deliverySlotRows[0].id,
      address: PLACEHOLDER_ORDER_ADDRESS,
      subtotal: order.total - DELIVERY_FEE,
      deliveryFee: DELIVERY_FEE,
      total: order.total,
      createdAt,
    };
  });

  const adminOrderStatusEventRows = adminOrders.map((order) => {
    const minutesAgo = parseInt(order.placedAgo, 10);
    const createdAt = new Date(Date.now() - minutesAgo * 60_000);
    return {
      id: `statusevent-${order.id}-1`,
      orderId: order.id,
      status: STATUS_MAP[order.status],
      createdAt,
    };
  });

  return {
    categoryRows,
    brandRows,
    productRows,
    deliverySlotRows,
    branchRows,
    customerUserRows,
    customerRows,
    addressRows,
    orderRows: [demoOrderRow, ...adminOrderRows],
    orderItemRows: demoOrderItemRows,
    orderStatusEventRows: [
      ...demoOrderStatusEventRows,
      ...adminOrderStatusEventRows,
    ],
  };
}

// ---------------------------------------------------------------------------
// main — writes buildSeedData()'s output to the database, in dependency
// order. skipDuplicates makes this safe to re-run against a database that
// already has this seed applied. PrismaClient is only instantiated inside
// main(), and main() only runs when this file is executed directly (see
// the entrypoint guard at the bottom) — so buildSeedData() can be imported
// and exercised on its own, with no database connection attempted, e.g. in
// a plain `tsx`/`node` script for verification.
// ---------------------------------------------------------------------------

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDatabase(prisma: PrismaClient) {
  const data = buildSeedData();

  // createMany's returned `count` is how many rows this call actually
  // inserted — not data.length, which is how many rows were *attempted*.
  // On a fresh database the two match; on a re-run against an
  // already-seeded database, skipDuplicates means every row conflicts on
  // its primary key and count comes back 0 for every table. Logging the
  // real count (not data.length) makes that distinction visible instead
  // of silently implying a re-run inserted data it actually skipped.
  const categoryResult = await prisma.category.createMany({
    data: data.categoryRows,
    skipDuplicates: true,
  });
  const brandResult = await prisma.brand.createMany({
    data: data.brandRows,
    skipDuplicates: true,
  });
  const productResult = await prisma.product.createMany({
    data: data.productRows,
    skipDuplicates: true,
  });
  const deliverySlotResult = await prisma.deliverySlot.createMany({
    data: data.deliverySlotRows,
    skipDuplicates: true,
  });
  const branchResult = await prisma.branch.createMany({
    data: data.branchRows,
    skipDuplicates: true,
  });
  const userResult = await prisma.user.createMany({
    data: data.customerUserRows,
    skipDuplicates: true,
  });
  const customerResult = await prisma.customer.createMany({
    data: data.customerRows,
    skipDuplicates: true,
  });
  const addressResult = await prisma.address.createMany({
    data: data.addressRows,
    skipDuplicates: true,
  });
  const orderResult = await prisma.order.createMany({
    data: data.orderRows,
    skipDuplicates: true,
  });
  const orderItemResult = await prisma.orderItem.createMany({
    data: data.orderItemRows,
    skipDuplicates: true,
  });
  const orderStatusEventResult = await prisma.orderStatusEvent.createMany({
    data: data.orderStatusEventRows,
    skipDuplicates: true,
  });

  console.log("Seed complete — rows newly inserted (0 means already seeded):", {
    categories: `${categoryResult.count}/${data.categoryRows.length}`,
    brands: `${brandResult.count}/${data.brandRows.length}`,
    products: `${productResult.count}/${data.productRows.length}`,
    deliverySlots: `${deliverySlotResult.count}/${data.deliverySlotRows.length}`,
    branches: `${branchResult.count}/${data.branchRows.length}`,
    users: `${userResult.count}/${data.customerUserRows.length}`,
    customers: `${customerResult.count}/${data.customerRows.length}`,
    addresses: `${addressResult.count}/${data.addressRows.length}`,
    orders: `${orderResult.count}/${data.orderRows.length}`,
    orderItems: `${orderItemResult.count}/${data.orderItemRows.length}`,
    orderStatusEvents: `${orderStatusEventResult.count}/${data.orderStatusEventRows.length}`,
  });
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
