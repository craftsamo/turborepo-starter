import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (
  process.env.CI ||
  process.env.HUSKY === "0" ||
  process.env.NODE_ENV === "production" ||
  !existsSync(join(repoRoot, ".git"))
) {
  process.exit(0);
}

process.chdir(repoRoot);

const husky = (await import("husky")).default;
const message = husky();

if (message) {
  throw new Error(message);
}
