import { api } from "../api.js";
import { t } from "../i18n.js";
import { navigate } from "../router.js";

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function renderSearch() {
  const app = document.getElementById("app");
  const params = JSON.parse(localStorage.getItem("booking_search") || "{}");
  app.innerHTML = `
    <h1>${t("search.title")}</h1>
    <div class="form-row">
      <label>${t("search.city")}</label>
      <input id="f-city" placeholder="${t("search.city_ph")}" value="${params.city || ""}" />
    </div>
    <div class="form-row" style="display:flex;gap:8px">
      <div style="flex:1">
        <label>${t("search.check_in")}</label>
        <input id="f-ci" type="date" value="${params.check_in || todayPlus(1)}" />
      </div>
      <div style="flex:1">
        <label>${t("search.check_out")}</label>
        <input id="f-co" type="date" value="${params.check_out || todayPlus(3)}" />
      </div>
    </div>
    <div class="form-row">
      <label>${t("search.guests")}</label>
      <input id="f-g" type="number" min="1" max="20" value="${params.guests || 2}" />
    </div>
    <button class="primary" id="f-go">${t("search.go")}</button>
    <div id="results" style="margin-top:16px"></div>
  `;

  document.getElementById("f-go").onclick = doSearch;
  // Auto-search on render if we have prior params.
  if (params.city || params.check_in) doSearch();
}

async function doSearch() {
  const city = document.getElementById("f-city").value.trim();
  const ci = document.getElementById("f-ci").value;
  const co = document.getElementById("f-co").value;
  const g = Number(document.getElementById("f-g").value) || 1;
  const params = { city, check_in: ci, check_out: co, guests: g };
  localStorage.setItem("booking_search", JSON.stringify(params));

  const results = document.getElementById("results");
  results.innerHTML = t("app.loading");
  try {
    const hotels = await api.searchHotels(params);
    if (!hotels.length) {
      results.innerHTML = `<p class="muted">${t("search.empty")}</p>`;
      return;
    }
    results.innerHTML = hotels
      .map(
        (h) => `
        <a class="card-link" href="#/hotel/${h.id}?check_in=${ci}&check_out=${co}&guests=${g}">
          <div class="card">
            <h3>${escapeHtml(h.name_ru)}</h3>
            <div class="meta">${escapeHtml(h.city)}${h.address ? " · " + escapeHtml(h.address) : ""}</div>
            ${h.min_price_kgs != null ? `<div class="price">${t("search.from_price", { price: h.min_price_kgs })}</div>` : ""}
          </div>
        </a>
      `,
      )
      .join("");
    results.querySelectorAll(".card-link").forEach((a) => {
      a.style.textDecoration = "none";
      a.style.color = "inherit";
    });
  } catch (e) {
    results.innerHTML = `<div class="error">${t("app.error", { msg: e.message })}</div>`;
  }
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
