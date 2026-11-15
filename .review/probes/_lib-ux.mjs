// Shared helper for KDC-UX-* probes: BASE=http://localhost:6106 PW=<path to playwright> node .review/probes/KDC-UX-xx.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const BASE = process.env.BASE ?? "http://localhost:6006";
export async function withStory(id, opts, fn) {
  const { chromium } = require(process.env.PW ?? "playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: opts.width ?? 1280, height: opts.height ?? 900 } });
    await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
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
