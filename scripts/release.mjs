import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const releaseFile = join(root, "release.json");
const release = JSON.parse(await readFile(releaseFile, "utf8"));
const pattern = /^(\d{4})\.(\d{2})\.(\d{2})\.(\d{2,})$/;
const previous = pattern.exec(release.version);
if (!previous)
  throw new Error(
    "release.json must use year.month.day.revision, for example 2026.10.20.03",
  );

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const files = [
  ...(await filesIn(join(root, "src"))),
  ...(await filesIn(join(root, "public"))),
  ...(await filesIn(join(root, "scripts"))),
  ...[
    "index.html",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "prepare-assets.mjs",
    ".github/workflows/pages.yml",
  ].map((path) => join(root, path)),
].sort((a, b) =>
  relative(root, a)
    .replaceAll("\\", "/")
    .localeCompare(relative(root, b).replaceAll("\\", "/"), "en"),
);

const hash = createHash("sha256");
for (const path of files) {
  const name = relative(root, path).replaceAll("\\", "/");
  const raw = await readFile(path);
  // Windows checkouts and Linux Pages builds must fingerprint the same sources.
  const content = /\.(?:ts|js|mjs|css|json|html|yml|svg|txt)$/.test(name)
    ? Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"))
    : raw;
  hash
    .update(name)
    .update("\0")
    .update(String(content.length))
    .update("\0")
    .update(content)
    .update("\0");
}
const fingerprint = hash.digest("hex");
if (release.fingerprint === fingerprint) {
  process.stdout.write(`App unchanged: ${release.version}\n`);
} else {
  if (release.fingerprint) {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Edmonton",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const value = (part) => date.find((item) => item.type === part).value;
    release.version = `${value("year")}.${value("month")}.${value("day")}.${String(Number(previous[4]) + 1).padStart(2, "0")}`;
  }
  release.fingerprint = fingerprint;
  await writeFile(releaseFile, JSON.stringify(release, null, 2) + "\n");
  process.stdout.write(`App release: ${release.version}\n`);
}
