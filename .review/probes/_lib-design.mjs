// Shared helper for KDC-DR design probes: BASE=http://localhost:6106 PW=<path to playwright> node .review/probes/KDC-DR-xx.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW ?? "playwright");
export const BASE = process.env.BASE ?? "http://localhost:6006";
export async function story(id, mode, width, fn) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=mode:${mode}`);
    await page.waitForTimeout(1200);
    return await fn(page);
  } finally {
    await browser.close();
  }
}
export function verdict(id, fails) {
  for (const f of fails) console.log(`FAIL ${id} ${f}`);
  console.log(fails.length ? `FAIL ${id}` : `PASS ${id}`);
  process.exit(fails.length ? 1 : 0);
}
