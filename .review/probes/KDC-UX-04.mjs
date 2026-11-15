// KDC-UX-04 Nielsen 9 / ISO Selbstbeschreibungsfähigkeit: the default limit text of MultiSelect maxSelected must say how to go on (remove one), not only "Maximum of N selected".
import { withStory, verdict } from "./_lib-ux.mjs";
const fails = [];
await withStory("primitives-multiselect--max-selected", {}, async (page) => {
  if (!(await page.$("[cmdk-root]"))) { await page.locator("#storybook-root input[role=combobox]").first().click(); await page.waitForTimeout(300); }
  const txt = await page.evaluate(() => document.querySelector("[cmdk-root]")?.innerText ?? "");
  const line = (txt.match(/^.*(Maximum of|You can choose up to).*$/im) || [""])[0].trim();
  if (!/remove|deselect|entfern/i.test(line)) fails.push(`limit text "${line}" names no way forward`);
});
verdict("KDC-UX-04", fails);
