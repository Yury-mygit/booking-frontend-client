import { api } from "../api.js";
import { listFavorites } from "../favorites.js";
import { t } from "../i18n.js";

const VIEWED_KEY = "viewed_hotels";
const VIEWED_LIMIT = 10;

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function loadViewed() {
  try {
    return JSON.parse(localStorage.getItem(VIEWED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function rememberViewed(hotel) {
  if (!hotel || !hotel.id) return;
  const list = loadViewed().filter((h) => h.id !== hotel.id);
  list.unshift({
    id: hotel.id,
    name_ru: hotel.name_ru,
    city: hotel.city,
    photos: hotel.photos || [],
    min_price_kgs: hotel.min_price_kgs ?? null,
    ts: Date.now(),
  });
  localStorage.setItem(VIEWED_KEY, JSON.stringify(list.slice(0, VIEWED_LIMIT)));
}

function cardHtml(h) {
  const photo = (h.photos && h.photos[0]) || "";
  const photoHtml = photo
    ? `<div class="h-card-photo" style="background-image:url('${escapeHtml(photo)}')"></div>`
    : `<div class="h-card-photo h-card-photo-empty"></div>`;
  const price = h.min_price_kgs != null
    ? `<div class="price">${t("search.from_price", { price: h.min_price_kgs })}</div>`
    : "";
  return `
    <a class="h-card" href="#/hotel/${h.id}">
      ${photoHtml}
      <div class="h-card-body">
        <h3>${escapeHtml(h.name_ru)}</h3>
        <div class="meta">${escapeHtml(h.city)}</div>
        ${price}
      </div>
    </a>`;
}

export async function renderHome() {
  const app = document.getElementById("app");
  const favorites = listFavorites();
  app.innerHTML = `
    ${favorites.length ? `
      <h2 style="margin-top:0">${t("home.favorites")}</h2>
      <div class="carousel">${favorites.map(cardHtml).join("")}</div>
    ` : ""}
    <h1>${t("home.title")}</h1>
    <div id="carousel-mount">${t("app.loading")}</div>
    <h2>${t("home.viewed")}</h2>
    <div id="viewed-mount"></div>
  `;

  try {
    const hotels = await api.searchHotels({});
    const mount = document.getElementById("carousel-mount");
    if (!hotels.length) {
      mount.innerHTML = `<p class="muted">${t("home.empty")}</p>`;
    } else {
      mount.innerHTML = `<div class="carousel">${hotels.map(cardHtml).join("")}</div>`;
    }
  } catch (e) {
    document.getElementById("carousel-mount").innerHTML =
      `<div class="error">${t("app.error", { msg: e.message })}</div>`;
  }

  const viewed = loadViewed();
  const vmount = document.getElementById("viewed-mount");
  if (!viewed.length) {
    vmount.innerHTML = `<p class="muted">${t("home.viewed_empty")}</p>`;
  } else {
    vmount.innerHTML = `<div class="carousel">${viewed.map(cardHtml).join("")}</div>`;
  }
}
