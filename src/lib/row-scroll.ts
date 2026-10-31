// Scroll target for an item in a horizontally scrolling row with edge fades. The first item scrolls fully to the start and the last one fully to the end (the fade on that side then disappears). Any other item is centred (`centre`) or moved the least that shows it whole, and in both cases kept `pad` (the fade width) clear of both edges.
export const rowScrollTarget = (row: { scrollLeft: number; clientWidth: number; scrollWidth: number }, item: { left: number; width: number; edge?: 'start' | 'end' }, pad: number, centre: boolean): number => {
  const max = Math.max(0, row.scrollWidth - row.clientWidth);
  if (item.edge === 'start') return 0;
  if (item.edge === 'end') return max;
  let target = centre ? item.left + item.width / 2 - row.clientWidth / 2 : row.scrollLeft;
  if (item.left < target + pad) target = item.left - pad;
  else if (item.left + item.width > target + row.clientWidth - pad) target = item.left + item.width - row.clientWidth + pad;
  return Math.min(max, Math.max(0, target));
};
