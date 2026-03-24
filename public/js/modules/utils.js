/* ── Shared utilities ── */
export const $   = s => document.querySelector(s);
export const $$  = s => [...document.querySelectorAll(s)];
export const raf = requestAnimationFrame.bind(window);
export const on  = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
