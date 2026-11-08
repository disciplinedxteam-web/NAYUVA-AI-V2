/** Counted body scroll lock so nested overlays never leave the page stuck unscrollable. */
let count = 0;
export function lockScroll(): () => void {
  if (typeof document === 'undefined') return () => {};
  count += 1;
  document.body.style.overflow = 'hidden';
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count = Math.max(0, count - 1);
    if (count === 0) document.body.style.overflow = '';
  };
}
