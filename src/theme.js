import { inTelegram, tg } from "./tg.js";

function detect() {
  if (inTelegram && tg.colorScheme) return tg.colorScheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme() {
  document.documentElement.setAttribute("data-theme", detect());
}

export function watchTheme() {
  if (inTelegram && tg.onEvent) {
    tg.onEvent("themeChanged", applyTheme);
  }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!inTelegram) applyTheme();
  });
}
