import { readFile, writeFile } from "node:fs/promises";

// The standalone landing page is copied as an asset, outside Angular's router.
const file = new URL(
  "../dist/form-factory/browser/landing.html",
  import.meta.url,
);
const html = await readFile(file, "utf8");
await writeFile(
  file,
  html.replace(/href="\.\/templates"/g, 'href="./#/templates"'),
);
