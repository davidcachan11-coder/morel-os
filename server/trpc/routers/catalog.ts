import "server-only";

import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc/trpc";

/**
 * Read-only. Catalog browsing is public in the real app (no login is
 * required to browse /tienda), so publicProcedure is the correct choice
 * here, not a stand-in for auth that isn't ready yet. Mutations (creating/
 * editing products, categories) are out of scope for this router.
 */
export const catalogRouter = router({
  listCategories: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.category.findMany({
      // name has no uniqueness constraint — id as a secondary sort key
      // guarantees a stable order even if two categories ever share a name.
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  }),

  listProducts: publicProcedure
    .input(
      z
        .object({
          categoryId: z.string().min(1).optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.product.findMany({
        where: input?.categoryId ? { categoryId: input.categoryId } : undefined,
        // Same stability reasoning as listCategories above.
        orderBy: [{ name: "asc" }, { id: "asc" }],
      });
    }),

  getProductById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => {
      return ctx.prisma.product.findUnique({
        where: { id: input.id },
      });
    }),
});
