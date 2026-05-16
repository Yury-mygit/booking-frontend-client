import { api } from "../api.js";
import { t } from "../i18n.js";
import { navigate } from "../router.js";

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function parseQuery() {
  const hash = location.hash;
  const q = hash.split("?")[1] || "";
  return Object.fromEntries(new URLSearchParams(q));
}

export async function renderHotel({ id }) {
  const app = document.getElementById("app");
  const q = parseQuery();
  app.innerHTML = `<p>${t("app.loading")}</p>`;
  let hotel;
  try {
    hotel = await api.hotelDetails(id, q);
  } catch (e) {
    app.innerHTML = `<div class="error">${t("app.error", { msg: e.message })}</div>`;
    return;
  }
  const hasDates = q.check_in && q.check_out;
  app.innerHTML = `
    <p><a href="#/search">${t("hotel.back")}</a></p>
    <h1>${escapeHtml(hotel.name_ru)}</h1>
    <div class="meta">${escapeHtml(hotel.city)}${hotel.address ? " · " + escapeHtml(hotel.address) : ""}</div>
    ${hotel.description_ru ? `<p>${escapeHtml(hotel.description_ru)}</p>` : ""}
    <h2>${t("hotel.rooms")}</h2>
    ${!hasDates ? `<p class="muted">${t("hotel.no_dates")}</p>` : ""}
    <div id="rooms-list">
      ${hotel.rooms.map((r) => renderRoom(r, q, hotel.id)).join("")}
    </div>
    <div id="book-result"></div>
  `;
  app.querySelectorAll("button[data-book-room]").forEach((b) => {
    b.onclick = () => doBook(b.dataset.bookRoom, q);
  });
}

function renderRoom(r, q, hotelId) {
  const hasDates = q.check_in && q.check_out;
  const unavail = hasDates && r.available_for_dates === false;
  return `
    <div class="room ${unavail ? "unavailable" : ""}">
      <h3>${escapeHtml(r.name_ru)}</h3>
      <div class="meta">${t("hotel.capacity", { n: r.capacity })}</div>
      <div class="price">${t("hotel.price_per_night", { price: r.price_kgs })}</div>
      ${hasDates && r.total_kgs_for_dates != null ? `<div class="meta">${t("hotel.total", { total: r.total_kgs_for_dates })}</div>` : ""}
      ${hasDates ? (unavail
        ? `<button class="primary" disabled>${t("hotel.unavailable")}</button>`
        : `<button class="primary" data-book-room="${r.id}">${t("hotel.book")}</button>`)
       : ""}
    </div>
  `;
}

async function doBook(roomId, q) {
  const res = document.getElementById("book-result");
  res.innerHTML = t("app.loading");
  try {
    const b = await api.createBooking({
      room_id: Number(roomId),
      check_in: q.check_in,
      check_out: q.check_out,
      guests: Number(q.guests) || 1,
    });
    res.innerHTML = `<div class="success">${t("hotel.booked_ok", { code: b.code })}</div>
      <p><a href="#/my">${t("nav.my")} →</a></p>`;
  } catch (e) {
    res.innerHTML = `<div class="error">${t("app.error", { msg: e.message })}</div>`;
  }
}
