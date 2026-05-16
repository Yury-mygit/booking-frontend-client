import { listFavorites } from "../favorites.js";
import { t } from "../i18n.js";

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

export function renderFavorites() {
  const app = document.getElementById("app");
  const items = listFavorites();
  if (!items.length) {
    app.innerHTML = `
      <h1>${t("home.favorites")}</h1>
      <p class="muted">${t("fav.empty")}</p>
    `;
    return;
  }
  app.innerHTML = `
    <h1>${t("home.favorites")}</h1>
    ${items
      .map((h) => {
        const photo = (h.photos && h.photos[0]) || "";
        const photoHtml = photo
          ? `<div class="h-card-photo" style="background-image:url('${escapeHtml(photo)}')"></div>`
          : `<div class="h-card-photo h-card-photo-empty"></div>`;
        const price = h.min_price_kgs != null
          ? `<div class="price">${t("search.from_price", { price: h.min_price_kgs })}</div>`
          : "";
        return `
          <a class="fav-row-card" href="#/hotel/${h.id}">
            ${photoHtml}
            <div class="h-card-body">
              <h3>${escapeHtml(h.name_ru)}</h3>
              <div class="meta">${escapeHtml(h.city)}</div>
              ${price}
            </div>
          </a>`;
      })
      .join("")}
  `;
}
