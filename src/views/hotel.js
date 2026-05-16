import { api } from "../api.js";
import { t } from "../i18n.js";
import { getQuery, navigate } from "../router.js";
import { inTelegram, tg } from "../tg.js";
import { rememberViewed } from "./home.js";

// Username клиентского бота. Должен совпадать с tg-username
// `@rforge_stay_bot` (см. notes/secrets.md).
const CLIENT_BOT = "rforge_stay_bot";

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function buildTelegramDeepLink(hotelId, ci, co, g) {
  // start_param: hotel_5 OR hotel_5_2026-06-01_2026-06-03_2.
  const base = `hotel_${hotelId}`;
  const sp = ci && co ? `${base}_${ci}_${co}_${g || 1}` : base;
  return `https://t.me/${CLIENT_BOT}?startapp=${sp}`;
}

export async function renderHotel({ id }) {
  const app = document.getElementById("app");
  const q = getQuery();
  app.innerHTML = `<p>${t("app.loading")}</p>`;
  let hotel;
  try {
    hotel = await api.hotelDetails(id, q);
  } catch (e) {
    app.innerHTML = `<div class="error">${t("app.error", { msg: e.message })}</div>`;
    return;
  }
  rememberViewed(hotel);
  const hasDates = q.check_in && q.check_out;
  app.innerHTML = `
    <p><a href="#/search">${t("hotel.back")}</a></p>
    <h1>${escapeHtml(hotel.name_ru)}</h1>
    <div class="meta">${escapeHtml(hotel.city)}${hotel.address ? " · " + escapeHtml(hotel.address) : ""}</div>
    ${hotel.description_ru ? `<p>${escapeHtml(hotel.description_ru)}</p>` : ""}
    <h2>${t("hotel.rooms")}</h2>
    ${!hasDates ? `<p class="muted">${t("hotel.no_dates")}</p>` : ""}
    <div id="rooms-list">
      ${hotel.rooms.map((r) => renderRoom(r, q)).join("")}
    </div>
    <div id="book-result"></div>
  `;
  app.querySelectorAll("button[data-book-room]").forEach((b) => {
    b.onclick = () => doBook(b.dataset.bookRoom, id, q);
  });
}

function renderRoom(r, q) {
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

async function doBook(roomId, hotelId, q) {
  const res = document.getElementById("book-result");

  // Out of Telegram and no session → bounce to Telegram bot deep-link.
  // The user lands in the bot, hits /start, and the WebApp opens with
  // start_param=hotel_{id}_{ci}_{co}_{guests}.
  if (!inTelegram && !api.hasToken()) {
    const link = buildTelegramDeepLink(hotelId, q.check_in, q.check_out, q.guests);
    res.innerHTML = `
      <div class="card" style="text-align:center">
        <p>${t("book.need_telegram")}</p>
        <a class="primary" style="text-decoration:none;display:inline-block;padding:10px 16px;background:#1a73e8;color:#fff;border-radius:4px"
           href="${link}">${t("book.open_in_telegram")}</a>
        <p class="muted" style="margin-top:10px">${t("book.or_dev_login")}
          <a href="#/login">${t("book.dev_login")}</a></p>
      </div>`;
    return;
  }

  // Inside Telegram but no token yet (auth failed silently in bootstrap) → retry.
  if (!api.hasToken() && inTelegram) {
    try {
      const r = await api.authTg(tg.initData);
      api.setSession(r.token, r.user);
    } catch (e) {
      res.innerHTML = `<div class="error">${t("app.error", { msg: e.message })}</div>`;
      return;
    }
  }

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
