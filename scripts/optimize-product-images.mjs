import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const destination = path.resolve("public/images");
await mkdir(destination, { recursive: true });

const images = [
  {
    source: "C:/Users/user/Desktop/exec-2fde63b2-f2cd-4a86-afc1-090b9b3a8889.png",
    output: "noire-hero.png",
    width: 1600,
  },
  {
    source:
      "C:/Users/user/.codex/generated_images/01a1648a-a8ce-7343-8bf0-667ea1a03776/exec-9632876a-361b-4e19-8698-a672bef61037.png",
    output: "noire-pedestal.png",
    width: 1100,
  },
  {
    source:
      "C:/Users/user/.codex/generated_images/01a1648a-a8ce-7343-8bf0-667ea1a03776/exec-145dae70-1df4-46fc-9e08-47f7d8d1d706.png",
    output: "noire-notes.png",
    width: 1400,
  },
  {
    source:
      "C:/Users/user/.codex/generated_images/01a1648a-a8ce-7343-8bf0-667ea1a03776/exec-9e27c3fa-0d77-4c99-99c7-6e9d15e3d761.png",
    output: "noire-stone.png",
    width: 1100,
  },
];

for (const image of images) {
  await sharp(image.source)
    .resize({ width: image.width, withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 90 })
    .toFile(path.join(destination, image.output));
}

console.log(`Optimized ${images.length} PNG images in ${destination}`);
