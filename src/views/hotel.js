import { api } from "../api.js";
import { t } from "../i18n.js";
import { getQuery } from "../router.js";
import { inTelegram, tg } from "../tg.js";

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
  const base = `hotel_${hotelId}`;
  const sp = ci && co ? `${base}_${ci}_${co}_${g || 1}` : base;
  return `https://t.me/${CLIENT_BOT}?startapp=${sp}`;
}

let _state = {
  hotel: null,
  query: {},
  guestsFilter: 1,
  activeTab: "rooms",
};

export async function renderHotel({ id }) {
  const app = document.getElementById("app");
  app.innerHTML = `<p>${t("app.loading")}</p>`;
  const q = getQuery();
  _state.query = q;
  _state.guestsFilter = Number(q.guests) || 1;
  try {
    _state.hotel = await api.hotelDetails(id, q);
  } catch (e) {
    app.innerHTML = `<div class="error">${t("app.error", { msg: e.message })}</div>`;
    return;
  }
  const h = _state.hotel;
  const photo = (h.photos && h.photos[0]) || "";
  document.getElementById("topbar-title").textContent = h.name_ru;
  app.innerHTML = `
    <div class="hotel-head-card">
      ${photo ? `<div class="hotel-head-photo" style="background-image:url('${escapeHtml(photo)}')"></div>` : ""}
      <div class="hotel-head-body">
        <h1>${escapeHtml(h.name_ru)}</h1>
        <div class="meta">${escapeHtml(h.city)}${h.address ? " · " + escapeHtml(h.address) : ""}</div>
        ${h.description_ru ? `<p>${escapeHtml(h.description_ru)}</p>` : ""}
      </div>
    </div>
    <div class="tabs">
      <button class="tab" data-tab="rooms">${t("tabs.rooms")}</button>
      <button class="tab" data-tab="my">${t("tabs.my")}</button>
      <button class="tab" data-tab="services">${t("tabs.services")}</button>
    </div>
    <div id="tab-body"></div>
  `;
  document.querySelectorAll(".tab").forEach((b) => {
    b.onclick = () => switchTab(b.dataset.tab);
  });
  switchTab(_state.activeTab);
}

function switchTab(name) {
  _state.activeTab = name;
  document.querySelectorAll(".tab").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === name),
  );
  const body = document.getElementById("tab-body");
  if (name === "rooms") return renderRooms(body);
  if (name === "my") return renderMyBookings(body);
  if (name === "services") return renderServices(body);
}

function renderRooms(body) {
  const h = _state.hotel;
  const q = _state.query;
  const g = _state.guestsFilter;
  const hasDates = q.check_in && q.check_out;
  const rooms = h.rooms.filter((r) => r.capacity >= g);
  body.innerHTML = `
    <div class="rooms-controls">
      <div class="form-row">
        <label>${t("rooms.filter.guests")}</label>
        <input id="f-guests" type="number" min="1" max="20" value="${g}" />
      </div>
    </div>
    ${!hasDates ? `<p class="muted">${t("rooms.no_dates")}</p>` : ""}
    <div id="rooms-list">
      ${rooms.length === 0
        ? `<p class="muted">${t("rooms.empty_filter")}</p>`
        : rooms.map((r) => roomCardHtml(r, hasDates)).join("")}
    </div>
    <div id="book-result"></div>
    <div id="book-modal-mount"></div>
  `;
  document.getElementById("f-guests").onchange = (e) => {
    _state.guestsFilter = Number(e.target.value) || 1;
    renderRooms(body);
  };
  body.querySelectorAll("button[data-book-room]").forEach((b) => {
    b.onclick = () => openBookModal(Number(b.dataset.bookRoom));
  });
}

function roomCardHtml(r, hasDates) {
  const unavail = hasDates && r.available_for_dates === false;
  return `
    <div class="room ${unavail ? "unavailable" : ""}">
      <h3>${escapeHtml(r.name_ru)}</h3>
      <div class="meta">${t("hotel.capacity", { n: r.capacity })}</div>
      <div class="price">${t("hotel.price_per_night", { price: r.price_kgs })}</div>
      ${hasDates && r.total_kgs_for_dates != null ? `<div class="meta">${t("hotel.total", { total: r.total_kgs_for_dates })}</div>` : ""}
      ${unavail
        ? `<button class="primary" disabled>${t("hotel.unavailable")}</button>`
        : `<button class="primary" data-book-room="${r.id}">${t("hotel.book")}</button>`}
    </div>
  `;
}

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function openBookModal(roomId) {
  const r = _state.hotel.rooms.find((x) => x.id === roomId);
  if (!r) return;
  const q = _state.query;
  const mount = document.getElementById("book-modal-mount");
  mount.innerHTML = `
    <div class="modal-bg">
      <div class="modal">
        <h2>${t("rooms.modal_title", { room: escapeHtml(r.name_ru) })}</h2>
        <div class="form-row dates-row">
          <div style="flex:1">
            <label>${t("rooms.check_in")}</label>
            <input id="m-ci" type="date" value="${q.check_in || todayPlus(1)}" />
          </div>
          <div style="flex:1">
            <label>${t("rooms.check_out")}</label>
            <input id="m-co" type="date" value="${q.check_out || todayPlus(2)}" />
          </div>
        </div>
        <div class="form-row">
          <label>${t("rooms.filter.guests")} (max ${r.capacity})</label>
          <input id="m-g" type="number" min="1" max="${r.capacity}" value="${Math.min(_state.guestsFilter, r.capacity)}" />
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="secondary" id="m-cancel">${t("app.cancel")}</button>
          <button class="primary" id="m-ok" style="margin:0;flex:1">${t("rooms.confirm")}</button>
        </div>
        <div id="m-err" class="error"></div>
      </div>
    </div>
  `;
  document.getElementById("m-cancel").onclick = () => (mount.innerHTML = "");
  document.getElementById("m-ok").onclick = () => submitBook(roomId, mount);
}

async function submitBook(roomId, mount) {
  const ci = document.getElementById("m-ci").value;
  const co = document.getElementById("m-co").value;
  const g = Number(document.getElementById("m-g").value) || 1;
  const err = document.getElementById("m-err");
  if (!ci || !co) {
    err.textContent = t("rooms.dates_required");
    return;
  }

  if (!inTelegram && !api.hasToken()) {
    const link = buildTelegramDeepLink(_state.hotel.id, ci, co, g);
    mount.innerHTML = `
      <div class="modal-bg"><div class="modal" style="text-align:center">
        <p>${t("book.need_telegram")}</p>
        <a class="primary" style="text-decoration:none;display:inline-block;padding:10px 16px;background:var(--accent);color:var(--accent-text);border-radius:4px"
           href="${link}">${t("book.open_in_telegram")}</a>
      </div></div>`;
    return;
  }
  if (!api.hasToken() && inTelegram) {
    try {
      const r = await api.authTg(tg.initData);
      api.setSession(r.token, r.user);
    } catch (e) {
      err.textContent = t("app.error", { msg: e.message });
      return;
    }
  }

  err.textContent = t("app.loading");
  try {
    const b = await api.createBooking({
      room_id: Number(roomId),
      check_in: ci,
      check_out: co,
      guests: g,
    });
    mount.innerHTML = "";
    document.getElementById("book-result").innerHTML =
      `<div class="success">${t("hotel.booked_ok", { code: b.code })}</div>`;
    _state.hotel = await api.hotelDetails(_state.hotel.id, _state.query);
    switchTab(_state.activeTab);
  } catch (e) {
    err.textContent = t("app.error", { msg: e.message });
  }
}

async function renderMyBookings(body) {
  const h = _state.hotel;
  if (!api.hasToken()) {
    body.innerHTML = `<p class="muted">${t("my.need_auth")}<a href="#/login">${t("my.dev_login")}</a></p>`;
    return;
  }
  body.innerHTML = `<p>${t("app.loading")}</p>`;
  try {
    const items = await api.myBookingsAtHotel(h.id);
    if (!items.length) {
      body.innerHTML = `<p class="muted">${t("my.empty_for_hotel")}</p>`;
      return;
    }
    body.innerHTML = items.map((b) => `
      <div class="card">
        <div class="meta">${t("my.code", { code: b.code })}</div>
        <div>${t("my.dates", { ci: b.check_in, co: b.check_out })} · ${t("my.guests", { n: b.guests })}</div>
        <div class="price">${t("my.total", { total: b.total_kgs })}</div>
        <div class="meta">${t("my.status." + b.status)}</div>
      </div>
    `).join("");
  } catch (e) {
    body.innerHTML = `<div class="error">${t("app.error", { msg: e.message })}</div>`;
  }
}

function renderServices(body) {
  const h = _state.hotel;
  if (!h.services || !h.services.length) {
    body.innerHTML = `<p class="muted">${t("services.empty")}</p>`;
    return;
  }
  body.innerHTML = h.services.map((s) => `
    <div class="card">
      <h3>${escapeHtml(s.name_ru)}</h3>
      <div class="price">${s.price_kgs != null ? t("hotel.price_per_night", { price: s.price_kgs }).replace("/ночь", "").replace("/night", "").replace("/түнгө", "") : t("services.free")}</div>
    </div>
  `).join("");
}

async function doBook(roomId) {
  const res = document.getElementById("book-result");
  const q = _state.query;
  const h = _state.hotel;

  if (!inTelegram && !api.hasToken()) {
    const link = buildTelegramDeepLink(h.id, q.check_in, q.check_out, q.guests);
    res.innerHTML = `
      <div class="card" style="text-align:center">
        <p>${t("book.need_telegram")}</p>
        <a class="primary" style="text-decoration:none;display:inline-block;padding:10px 16px;background:var(--accent);color:var(--accent-text);border-radius:4px"
           href="${link}">${t("book.open_in_telegram")}</a>
      </div>`;
    return;
  }

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
    res.innerHTML = `<div class="success">${t("hotel.booked_ok", { code: b.code })}</div>`;
    // Refresh details (availability changed) and stay on rooms tab.
    _state.hotel = await api.hotelDetails(h.id, q);
    switchTab(_state.activeTab);
  } catch (e) {
    res.innerHTML = `<div class="error">${t("app.error", { msg: e.message })}</div>`;
  }
}
