import type { DefaultSession } from "next-auth";

// Module augmentation for the customer Auth.js instance's jwt/session
// callbacks (server/auth/customer.ts), which attach the database User id
// onto the session — not present in Auth.js's default Session["user"]
// shape.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
