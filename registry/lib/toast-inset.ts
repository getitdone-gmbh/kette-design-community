// On phones the toast sits at the bottom edge. A sticky footer of an open Sheet, Dialog or Drawer reports its height here, so the toast stays above the footer actions.
// The toast viewport reads it as --toast-inset-bottom on the document element (phones only). With several open layers the tallest footer wins.
export const TOAST_INSET_PROPERTY = '--toast-inset-bottom';

const footers = new Map<object, number>();

const publish = () => {
  if (typeof document === 'undefined') return;
  const height = Math.max(0, ...footers.values());
  if (height > 0) document.documentElement.style.setProperty(TOAST_INSET_PROPERTY, `${height}px`);
  else document.documentElement.style.removeProperty(TOAST_INSET_PROPERTY);
};

// A height of 0 releases the entry.
export function reportToastInset(owner: object, height: number) {
  if (height > 0) footers.set(owner, height);
  else footers.delete(owner);
  publish();
}
