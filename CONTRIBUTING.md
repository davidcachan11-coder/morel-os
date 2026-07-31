# Contributing to Morel OS

This document defines how work gets done on this repository: code style,
folder conventions, commit/branch naming, and what a pull request needs
before it merges. If you're unsure how to structure something new, match
what's already here rather than inventing a new pattern — consistency
matters more than any individual preference, including the ones below.

## Coding Conventions

- **TypeScript, strict, no `any`.** `tsconfig.json` has `strict: true`.
  Every domain concept gets a named, exported `interface`/`type` (see
  `data/*.ts` for the pattern). If you're reaching for `any`, you're
  probably missing a type, not avoiding one. See
  `docs/ENGINEERING_STANDARDS.md` §3 for the full type-safety standard
  (Zod-at-boundaries, `interface` vs. `type` usage) — this bullet is the
  quick version.
- **Components are functions, not classes.** Standard React function
  components throughout; no class components exist in this codebase.
- **Server Components by default, `"use client"` only when needed.** A
  page/component should only be a Client Component if it actually uses
  hooks, event handlers, or browser APIs. Compose Server Component pages
  out of Client Component leaves (see `app/admin/page.tsx` for the
  pattern), don't reflexively mark whole files client-side.
- **Styling is Tailwind utility classes, composed with `cn()`.** Import
  `cn` from `@/lib/utils` for any conditional/merged className logic —
  never hand-concatenate class strings or use a second styling system.
  Design tokens live in `app/globals.css`'s `@theme inline` block; if you
  need a new color/spacing value, add a token there, don't hardcode a raw
  value in a component.
- **No inline styles unless there's no Tailwind equivalent** (e.g. passing
  a CSS custom property to a third-party chart library). If you write
  `style={{...}}`, leave a comment saying why Tailwind couldn't do it.
- **File naming: kebab-case.** `order-tracker.tsx`, `cart-store.ts`,
  `use-order-progress.ts` — not `OrderTracker.tsx` or `cartStore.ts`.
- **Exported component/type naming: PascalCase.** `export function
  OrderTracker()`, `export interface Product`. The file is kebab-case, the
  things it exports are PascalCase — this pairing is consistent throughout
  the codebase.
- **No dead code.** No commented-out blocks, no unused exports left "just
  in case," no `console.log` debugging left in. If something is
  legitimately deferred, write it into `docs/ROADMAP.md` or
  `docs/DECISIONS.md`, not as a code comment.
- **Comments explain *why*, not *what*.** Well-named code doesn't need a
  comment restating it. Comment a genuinely non-obvious constraint, a
  workaround, or (as seen in `hooks/use-order-progress.ts`) why a
  deliberately simplified approach was chosen.

## Folder Conventions

See `docs/ARCHITECTURE.md` for the full breakdown. Quick reference for
"where does this go":

| If you're adding... | It goes in... |
|---|---|
| A new route | `app/` (file-convention only — no logic beyond composing components) |
| A component used by one route/feature | `components/<feature>/` |
| A component used globally (header, footer, etc.) | `components/` (root) |
| A shadcn/ui primitive | `components/ui/` — via the shadcn CLI, never hand-written |
| Static/mock domain data + its types | `data/<domain>.ts` |
| A primitive literal constant | `constants/` |
| Structured, composed app configuration | `config/` |
| A custom React hook | `hooks/` |
| Read/write access to persisted or remote data | `services/` |
| A cross-cutting utility function | `lib/utils.ts` |
| A React context provider | `providers/` |
| A type shared across more than one `data/` domain | `types/` |

If none of these fit, that's a signal to raise it (in a PR description or
`docs/DECISIONS.md`) rather than guessing — the folder structure is meant
to stay this legible.

## Commit Naming

Use [Conventional Commits](https://www.conventionalcommits.org/) for
everyday work:

```
feat: add express delivery slot to checkout
fix: correct ETA rounding in order tracking
chore: bump framer-motion to 12.44
docs: add DASHBOARD_SPEC.md
refactor: extract quantity stepper into a shared component
```

**Exception:** sprint/milestone commits use a plain, capitalized title with
no prefix, matching the pattern already in this repo's history (`Demo V1 -
Client Presentation`, `Sprint 1 - Project Foundation`) — these mark a
deliberate checkpoint, not a routine change, and are intentionally visually
distinct in `git log`.

Keep the subject line under ~70 characters. Use the body for the "why" if
it's not obvious from the subject — see the git log on this repo for
examples of appropriately terse vs. appropriately detailed messages.

## Branch Strategy

- **`main`** — the frozen demo. Tagged `demo-v1`. **Never commit directly
  to `main`.** It exists purely as a permanent, reproducible reference to
  what was shown to the client.
- **`production-v1`** — the active development trunk. All current and
  future work happens here (or on feature branches merged into it) unless
  a future milestone explicitly calls for a new `production-vN` branch.
- **Feature branches** (once the team grows beyond single-session work):
  branch off `production-v1`, name as `feat/<short-description>` or
  `fix/<short-description>`, merge back via PR.
- **Tags** mark permanent checkpoints worth being able to return to
  exactly (e.g. `demo-v1`). Don't tag routine progress — tag things that
  someone might reasonably need to check out again by name.

## Pull Request Standards

Every PR should include:

1. **What changed and why** — one or two sentences is enough if the commit
   messages are good; link to `docs/DECISIONS.md` if the PR represents a
   decision worth recording there.
2. **Confirmation that `npm run build` and `npm run lint` both pass
   clean.** Paste the output or state it explicitly — don't make a
   reviewer re-run it to find out.
3. **What was manually verified**, especially for anything touching
   shared state (`lib/cart-store.ts`), persistence (`services/orders.ts`),
   or the order-tracking timer (`hooks/use-order-progress.ts`). Screenshots
   or a short description of the flow walked through is enough; this
   codebase has no automated UI tests yet (see `docs/ROADMAP.md` Sprint 7),
   so manual verification is the only safety net until then.
4. **Scope discipline** — a PR should do one thing. If you notice
   something unrelated that needs fixing while working, note it (in the PR
   description, or as a new `docs/ROADMAP.md` item) rather than folding it
   into the same change.

## Review Checklist

Before approving/merging, confirm:

- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero errors or warnings
- [ ] No `any`, no `console.log`, no commented-out code left in
- [ ] New files follow the naming/folder conventions above
- [ ] No hardcoded value was added that duplicates something already in
      `constants/`/`config/` (and if a genuinely new shared value was
      added, it went into one of those, not inline)
- [ ] UI changes were manually verified at mobile (375px), tablet, and
      desktop widths, with the browser console checked for errors
- [ ] Any change to shared state, persistence, or the order-tracking timer
      was walked through end-to-end, not just unit-checked in isolation
- [ ] If the change touches `/admin` or anything that will eventually need
      auth, it doesn't quietly assume auth already exists
- [ ] Commit messages follow the conventions above
- [ ] `docs/` was updated if the change affects architecture, status, or
      a decision worth recording — documentation debt is still debt
