// KDC-DR-02 ui-gesetze.md Fitts/stable layout: the maxSelected hint must not push the rows of the open MultiSelect list (29px jump at 390)
import { story, verdict } from "./_lib-design.mjs";
const fails = [];
for (const [mode, width] of [["light", 1440], ["dark", 390]]) {
  const shift = await story("primitives-multiselect--max-selected", mode, width, async (p) => {
    await p.locator('input[role="combobox"]').first().click();
    await p.waitForTimeout(400);
    await p.locator('[role="option"][aria-checked="true"]').first().click();
    await p.waitForTimeout(250);
    const row = p.locator('[role="option"]').last();
    const before = await row.evaluate((e) => e.getBoundingClientRect().top);
    await p.locator('[role="option"][aria-checked="false"]:not([aria-disabled="true"])').first().click();
    await p.waitForTimeout(250);
    return Math.round((await row.evaluate((e) => e.getBoundingClientRect().top)) - before);
  });
  if (Math.abs(shift) > 1) fails.push(`${mode} ${width}: rows moved ${shift}px when the limit was reached`);
}
verdict("KDC-DR-02", fails);
