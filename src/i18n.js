import ru from "../locales/ru.json";
import ky from "../locales/ky.json";
import en from "../locales/en.json";

const dicts = { ru, ky, en };
let lang = localStorage.getItem("booking_lang") || "ru";

export function t(key, vars = {}) {
  const tmpl = dicts[lang][key] ?? dicts.ru[key] ?? key;
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ""));
}

export function getLang() {
  return lang;
}

export function setLang(l) {
  if (!dicts[l]) return;
  lang = l;
  localStorage.setItem("booking_lang", l);
  window.dispatchEvent(new CustomEvent("langchange"));
}

export function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("#lang-switch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
}
