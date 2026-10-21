import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const output = "public/art/cartoon";
await mkdir(output + "/tiles", { recursive: true });
const atlas = sharp("assets/originals/cartoon-tile-atlas.png");
const meta = await atlas.metadata();
const names = [
  "strawberry",
  "cherries",
  "lemon",
  "grapes",
  "watermelon",
  "orange",
  "butterfly",
  "blossom",
];
for (let i = 0; i < 8; i++) {
  const col = i % 4,
    row = Math.floor(i / 4),
    left = Math.floor((col * meta.width) / 4),
    top = Math.floor((row * meta.height) / 2);
  const width = Math.floor(((col + 1) * meta.width) / 4) - left,
    height = Math.floor(((row + 1) * meta.height) / 2) - top;
  const cell = await atlas
    .clone()
    .extract({ left, top, width, height })
    .toBuffer();
  await sharp(cell)
    .trim()
    .resize(232, 232, { fit: "contain", background: "#00000000" })
    .extend({
      top: 12,
      left: 12,
      right: 12,
      bottom: 12,
      background: "#00000000",
    })
    .webp({ quality: 94, alphaQuality: 100 })
    .toFile(output + "/tiles/" + names[i] + ".webp");
}
await sharp("assets/originals/cartoon-orchard.png")
  .resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 88 })
  .toFile(output + "/orchard.webp");
for (const [size, file] of [
  [512, "app-512.png"],
  [192, "app-192.png"],
  [180, "apple-touch-icon.png"],
])
  await sharp("assets/originals/cartoon-app-icon.png")
    .resize(size, size)
    .png()
    .toFile("public/" + file);
await sharp("assets/originals/cartoon-app-icon.png")
  .resize(128, 128)
  .webp({ quality: 92 })
  .toFile(output + "/brand.webp");
console.log(
  "Prepared original cartoon icons, scenery, and install artwork. Transparency preserved.",
);
