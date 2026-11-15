// KDC-DR-01 konsistenz.md gleiche Darstellung: Command bar stories keep their 456px frame (0.6.0 collapsed it to content width, 236px, after CommandInput got min-w-0)
import { story, verdict } from "./_lib-design.mjs";
const fails = [];
for (const id of ["primitives-command-bar--actions", "primitives-command-bar--users-stacked"]) {
  const w = await story(id, "light", 1440, (p) => p.evaluate(() => Math.round(document.querySelector("[cmdk-root]").getBoundingClientRect().width)));
  if (w < 450) fails.push(`${id}: command bar ${w}px wide, frame asks for 456`);
}
verdict("KDC-DR-01", fails);
