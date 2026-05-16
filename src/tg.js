export const tg = window.Telegram?.WebApp || null;
export const inTelegram = !!(tg && tg.initData);

export function initTg() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  applyTheme();
}

function applyTheme() {
  if (!tg) return;
  const p = tg.themeParams || {};
  const root = document.documentElement;
  if (p.bg_color) root.style.background = p.bg_color;
  if (p.text_color) document.body.style.color = p.text_color;
}
