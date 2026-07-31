#!/usr/bin/env node
// Enforces `npm audit --audit-level=high` with a narrow, advisory-ID-scoped
// allowlist. Every ID below must have a matching entry in docs/DECISIONS.md
// explaining why it's currently unreachable and why no non-breaking fix
// exists — see the "Sprint 3 CI: npm audit exceptions" entry.
//
// This is NOT a package-level exception: it matches on the advisory's
// public GHSA ID, extracted from the advisory URL that `npm audit --json`
// reports for each finding. A new advisory on any of these same packages,
// or on any other package, carries a different GHSA ID and is NOT
// covered — it fails the build exactly as it would without this script.
//
// GHSA IDs are the primary key because they're stable, public, and are
// what docs/DECISIONS.md's entry is written against. npm's internal
// numeric advisory `source` id is kept only as a secondary fallback below,
// in case a future advisory's URL doesn't expose a parseable GHSA id — if
// that fallback path is ever exercised, the script prints a warning so it
// doesn't pass silently.

import { execSync } from "node:child_process";

const ALLOWED_ADVISORIES = {
  "GHSA-mh99-v99m-4gvg": {
    npmSource: 1124334, // cross-reference only, see header comment — not used for matching unless the GHSA id can't be parsed
    note: "brace-expansion DoS — ESLint devDependency chain, exercised only against developer-authored lint-config glob patterns, never shipped or reachable by external input.",
  },
  "GHSA-qx2v-qp2m-jg93": {
    npmSource: 1117015,
    note: "postcss XSS via unescaped </style> (moderate) — Next.js's private nested postcss copy, build-time only, no user-supplied CSS in this app.",
  },
  "GHSA-6g55-p6wh-862q": {
    npmSource: 1124252,
    note: "postcss arbitrary file read via sourceMappingURL — same nested postcss copy, same reasoning.",
  },
  "GHSA-r28c-9q8g-f849": {
    npmSource: 1124288,
    note: "postcss path traversal via sourceMappingURL — same nested postcss copy, same reasoning.",
  },
  "GHSA-f88m-g3jw-g9cj": {
    npmSource: 1124066,
    note: "sharp inherited libvips CVEs — powers next/image, which is not used anywhere in this codebase (confirmed by grep; the app uses emoji + CSS gradients instead of photography).",
  },
};

// Secondary mapping only: npm internal source id -> GHSA id. Derived from
// the table above so there is exactly one place to edit when the allowlist
// changes. Used only as a fallback when a GHSA id can't be extracted from
// an advisory's URL.
const SOURCE_ID_FALLBACK = Object.fromEntries(
  Object.entries(ALLOWED_ADVISORIES).map(([ghsaId, info]) => [
    info.npmSource,
    ghsaId,
  ])
);

function extractGhsaId(url) {
  // GHSA ids are case-sensitive in practice (uppercase "GHSA" prefix,
  // lowercase alphanumeric segments, e.g. GHSA-mh99-v99m-4gvg) — the match
  // is returned as-is, not normalized, since ALLOWED_ADVISORIES's keys use
  // that same casing straight from the advisory URLs.
  const match = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/.exec(url ?? "");
  return match ? match[0] : null;
}

let report;
try {
  const raw = execSync("npm audit --audit-level=high --json", {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
  report = JSON.parse(raw);
} catch (err) {
  // `npm audit` exits non-zero the moment it finds anything at/above
  // --audit-level=high; the JSON report is still on stdout in that case.
  if (!err.stdout) {
    console.error("npm audit did not produce a parseable report:");
    console.error(err.message);
    process.exit(1);
  }
  report = JSON.parse(err.stdout);
}

const unallowed = [];
const fallbackMatches = [];

for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  if (vuln.severity !== "high" && vuln.severity !== "critical") continue;

  // Only entries carrying an actual advisory record (an object with a
  // `source` id and a `url`) introduce risk of their own — pure
  // pass-through entries (a package flagged only because it depends
  // on/is depended on by a vulnerable package) are covered when the loop
  // reaches the package that actually carries the advisory.
  const advisories = (vuln.via ?? []).filter(
    (v) => typeof v === "object" && v.source !== undefined
  );

  for (const advisory of advisories) {
    const ghsaId = extractGhsaId(advisory.url);
    let matchedId = ghsaId && ghsaId in ALLOWED_ADVISORIES ? ghsaId : null;

    if (!matchedId && advisory.source in SOURCE_ID_FALLBACK) {
      matchedId = SOURCE_ID_FALLBACK[advisory.source];
      fallbackMatches.push({
        package: vuln.name,
        matchedId,
        source: advisory.source,
        url: advisory.url,
      });
    }

    if (!matchedId) {
      unallowed.push({
        package: vuln.name,
        source: advisory.source,
        url: advisory.url,
        title: advisory.title,
      });
    }
  }
}

if (fallbackMatches.length > 0) {
  console.warn(
    "Warning: matched the following advisories via npm's internal source id, not a parsed GHSA id — verify the advisory URL still contains the expected GHSA id:"
  );
  for (const item of fallbackMatches) {
    console.warn(
      `  - ${item.package}: matched ${item.matchedId} via source ${item.source} (url: ${item.url})`
    );
  }
}

if (unallowed.length > 0) {
  console.error(
    "npm audit found high/critical advisories that are NOT in the documented exception list:\n"
  );
  for (const item of unallowed) {
    console.error(`  - ${item.package}: ${item.title}`);
    console.error(`    ${item.url} (source ${item.source})`);
  }
  console.error(
    "\nEither fix these, or add a scoped, documented exception per the process in docs/DECISIONS.md."
  );
  process.exit(1);
}

console.log("npm audit: no unexpected high/critical advisories.");
console.log("Documented exceptions currently in effect (docs/DECISIONS.md):");
for (const [ghsaId, info] of Object.entries(ALLOWED_ADVISORIES)) {
  console.log(`  - [${ghsaId}] ${info.note}`);
}
