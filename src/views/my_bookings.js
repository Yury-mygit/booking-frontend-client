import { api } from "../api.js";
import { t } from "../i18n.js";

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

export async function renderMyBookings() {
  const app = document.getElementById("app");
  app.innerHTML = `<h1>${t("my.title")}</h1><div id="list">${t("app.loading")}</div>`;
  if (!api.hasToken()) {
    document.getElementById("list").innerHTML =
      `<p class="muted">${t("book.need_telegram")} <a href="#/login">${t("book.dev_login")}</a></p>`;
    return;
  }
  try {
    const items = await api.myBookings();
    const list = document.getElementById("list");
    if (!items.length) {
      list.innerHTML = `<p class="muted">${t("my.empty")}</p>`;
      return;
    }
    list.innerHTML = items
      .map(
        (b) => `
        <div class="card">
          <h3>${escapeHtml(b.hotel_name_ru)}</h3>
          <div class="meta">${t("my.code", { code: b.code })}</div>
          <div class="meta">${t("my.dates", { ci: b.check_in, co: b.check_out })} · ${t("my.guests", { n: b.guests })}</div>
          <div class="price">${t("my.total", { total: b.total_kgs })}</div>
          <div class="meta">${t("my.status." + b.status)}</div>
        </div>
      `,
      )
      .join("");
  } catch (e) {
    document.getElementById("list").innerHTML =
      `<div class="error">${t("app.error", { msg: e.message })}</div>`;
  }
}
