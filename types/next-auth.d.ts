import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Module augmentation for both Auth.js instances (server/auth/customer.ts,
// server/auth/staff.ts) — declarations here are global to the "next-auth"
// module, not per-instance, so fields only one instance actually populates
// (mustChangePassword, role — staff only) are optional rather than
// required. Customer sessions never set role here; server/trpc/context.ts
// hardcodes CUSTOMER for a customer session instead, since that's
// structurally guaranteed by server/auth/customer.ts's own adapter
// (customerAdapter().createUser always sets role: "CUSTOMER") rather than
// something worth threading through the customer session too.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Staff instance only — never set on a customer session. */
      mustChangePassword?: boolean;
      /** Staff instance only — never set on a customer session. */
      role?: Role;
      /** Staff instance only — never set on a customer session. */
      mfaEnabled?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    /** Returned by the staff instance's authorize() only. */
    mustChangePassword?: boolean;
    /** Returned by the staff instance's authorize() only. */
    role?: Role;
    /** Returned by the staff instance's authorize() only. */
    mfaEnabled?: boolean;
  }
}
