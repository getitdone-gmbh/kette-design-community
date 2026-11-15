// KDC-UX-03 WCAG 2.4.3 / ISO Steuerbarkeit: removing a MultiSelect chip by keyboard must keep focus in the field (pre-existing since 0.5.0), and a mouse pick must leave typing in the search field.
import { withStory, verdict } from "./_lib-ux.mjs";
const fails = [];
await withStory("primitives-multiselect--multiple", {}, async (page) => {
  const rm = page.locator('#storybook-root button[aria-label^="Remove"]').first();
  await rm.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const tag = await page.evaluate(() => document.activeElement?.tagName);
  if (tag === "BODY") fails.push("focus falls to BODY after removing a chip with Enter");
});
await withStory("primitives-multiselect--default", {}, async (page) => {
  const inp = page.locator("#storybook-root input[role=combobox]").first();
  await inp.click();
  await page.waitForTimeout(300);
  await page.locator("[role=option]:not([aria-disabled=true])").nth(1).click();
  await page.waitForTimeout(250);
  await page.keyboard.type("a");
  await page.waitForTimeout(200);
  if ((await inp.inputValue()) !== "a") fails.push("after a mouse pick focus sits on the listbox, typed text does not reach the search field");
});
verdict("KDC-UX-03", fails);
