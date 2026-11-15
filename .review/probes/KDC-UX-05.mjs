// KDC-UX-05 Nielsen 1 / WCAG 4.1.3: opening a MultiSelect list that has results must not put "Not found" into the status live region (regression of the UXR-23 fix).
import { withStory, verdict } from "./_lib-ux.mjs";
const fails = [];
await withStory("primitives-multiselect--default", {}, async (page) => {
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.__log = []; for (const s of document.querySelectorAll("[role=status]")) new MutationObserver(() => window.__log.push(s.textContent)).observe(s, { childList: true, subtree: true, characterData: true }); });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await page.locator("#storybook-root input[role=combobox]").first().click();
  await page.waitForTimeout(600);
  const opts = await page.locator("[role=option]").count();
  const log = await page.evaluate(() => window.__log.filter(Boolean));
  if (opts > 0 && log.some((t) => /not found|no matches/i.test(t))) fails.push(`list opened with ${opts} options, status announced ${JSON.stringify(log)}`);
});
verdict("KDC-UX-05", fails);
