import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logoPath = join(root, "public", "logo.png");

const appDir = join(root, "src", "app");
const publicDir = join(root, "public");

mkdirSync(appDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const logo512 = await sharp(logoPath)
  .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toBuffer();

const logo180 = await sharp(logoPath)
  .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toBuffer();

writeFileSync(join(appDir, "icon.png"), logo512);
writeFileSync(join(appDir, "apple-icon.png"), logo180);

const faviconSizes = await Promise.all(
  [16, 32, 48].map(async (size) =>
    sharp(logoPath)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer()
  )
);
writeFileSync(join(appDir, "favicon.ico"), await toIco(faviconSizes));

const logoOg = await sharp(logoPath)
  .resize(320, 320, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: { r: 248, g: 250, b: 252, alpha: 1 },
  },
})
  .composite([{ input: logoOg, gravity: "center" }])
  .png()
  .toFile(join(publicDir, "og-image.png"));

console.log("Brand assets generated: app/icon.png, app/apple-icon.png, app/favicon.ico, public/og-image.png");
