import { router } from "@/server/trpc/trpc";

/**
 * Intentionally empty. Domain routers (server/trpc/routers/*.ts, per
 * docs/BACKEND_ARCHITECTURE.md's folder structure) land in PR 5+. This
 * file exists now only so app/api/trpc/[trpc]/route.ts has a router
 * instance to serve — it is not itself a router with any procedures.
 */
export const appRouter = router({});

export type AppRouter = typeof appRouter;
