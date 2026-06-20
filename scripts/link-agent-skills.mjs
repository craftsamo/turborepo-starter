// Creates the cross-tool agent-skill links that point at the canonical
// `.opencode/skills` directory, so Claude Code, Codex, Gemini CLI, and Copilot
// all discover the same skills without duplicating their content.
//
// - POSIX (macOS/Linux): relative symlink (e.g. `../.opencode/skills`).
// - Windows: directory junction — works WITHOUT Administrator/Developer Mode,
//   unlike a real symlink. (Git for Windows disables `core.symlinks` by default,
//   so committing symlinks is unreliable; we generate them on install instead.)
//
// Idempotent and safe to re-run. Wired into `postinstall` (see package.json) so
// every clone gets working links after `pnpm install`. Run manually with
// `nps link` or `node scripts/link-agent-skills.mjs`.

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = join(repoRoot, ".opencode", "skills");

// Tool-native skill directories that should mirror the canonical source.
const LINKS = [".agents/skills", ".claude/skills"];

if (!existsSync(canonical)) {
  // e.g. a pruned CI workspace — nothing to link, never fail the install.
  console.warn("[link-agent-skills] .opencode/skills not found; skipping.");
  process.exit(0);
}

const isWindows = process.platform === "win32";

for (const rel of LINKS) {
  const linkPath = join(repoRoot, rel);
  mkdirSync(dirname(linkPath), { recursive: true });

  // Already the correct link (symlink or junction)? Leave it untouched.
  try {
    if (resolve(dirname(linkPath), readlinkSync(linkPath)) === resolve(canonical)) {
      continue;
    }
  } catch {
    // not a readable link — fall through and (re)create it
  }

  // Remove anything stale: a wrong link, a leftover dir, or a text file that a
  // symlink-less Windows checkout materialized.
  if (existsSync(linkPath) || isLstatable(linkPath)) {
    rmSync(linkPath, { recursive: true, force: true });
  }

  if (isWindows) {
    symlinkSync(canonical, linkPath, "junction");
  } else {
    symlinkSync(relative(dirname(linkPath), canonical), linkPath);
  }
  console.log(`[link-agent-skills] linked ${rel} -> .opencode/skills`);
}

function isLstatable(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}
