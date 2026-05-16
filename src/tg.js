export const tg = window.Telegram?.WebApp || null;
export const inTelegram = !!(tg && tg.initData);

export function initTg() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  // Theme is owned by ./theme.js — do not override colors here.
}
