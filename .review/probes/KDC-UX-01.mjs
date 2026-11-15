// KDC-UX-01 WCAG 2.4.7 / ISO Selbstbeschreibungsfähigkeit: a Sheet opened by keyboard with focusOnOpen={false} focuses the SheetBody (a tab stop); that focus needs a visible indicator.
import { withStory, verdict } from "./_lib-ux.mjs";
const fails = [];
await withStory("primitives-sheet--focus-on-open-false-scroll-body", {}, async (page) => {
  if (await page.$("[role=dialog]")) { await page.keyboard.press("Escape"); await page.waitForTimeout(400); }
  await page.locator("#storybook-root button:visible").first().focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(700);
  const s = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); const ring = /\d+px [1-9]/.test(cs.boxShadow.replace(/0px 0px 0px 0px/g, "")); const outline = cs.outlineStyle !== "none" && !/rgba\(0, 0, 0, 0\)/.test(cs.outlineColor); return { tab: a.tabIndex, ring, outline, fv: a.matches(":focus-visible") }; });
  if (s.tab === 0 && s.fv && !s.ring && !s.outline) fails.push("keyboard-opened sheet focuses the SheetBody (tabIndex 0, :focus-visible) without ring or outline");
});
verdict("KDC-UX-01", fails);
