import type { DefaultSession } from "next-auth";

// Module augmentation for both Auth.js instances (server/auth/customer.ts,
// server/auth/staff.ts) — declarations here are global to the "next-auth"
// module, not per-instance, so fields only one instance actually populates
// (mustChangePassword — staff only) are optional rather than required.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Staff instance only — never set on a customer session. */
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    /** Returned by the staff instance's authorize() only. */
    mustChangePassword?: boolean;
  }
}
