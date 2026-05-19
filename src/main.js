import { api } from "./api.js";
import { applyStaticI18n, cycleLang, t } from "./i18n.js";
import { navigate, route, run } from "./router.js";
import { applyTheme, watchTheme } from "./theme.js";
import { initTg, inTelegram, tg } from "./tg.js";
import { renderDevLogin } from "./views/auth.js";
import { renderHotel, renderHotelMap } from "./views/hotel.js";
import { renderPay } from "./views/pay.js";

initTg();
applyTheme();
watchTheme();
applyStaticI18n();

document.getElementById("lang-cycle").onclick = cycleLang;

window.addEventListener("langchange", () => {
  applyStaticI18n();
  run();
});

function renderNoHotel() {
  document.getElementById("topbar-title").textContent = "";
  document.getElementById("app").innerHTML = `<p class="muted">${t("app.no_hotel")}</p>`;
}

route("/", renderNoHotel);
route("/hotel/{id}", renderHotel);
route("/hotel/{id}/map", renderHotelMap);
route("/pay/{code}", renderPay);
route("/login", () => renderDevLogin(() => {
  if (location.hash.startsWith("#/hotel/")) run();
  else navigate("/");
}));

// Deep-link transports:
//   1. ?hotel=5&check_in=...&check_out=...&guests=N (used by bot's web_app button URL).
//   2. Telegram WebApp start_param hotel_5[_ci_co_g] (Mini App / startapp= deep-link).
function applyStartParam(sp) {
  if (!sp) return false;
  // Try full form first: hotel_<slug>_<ci>_<co>_<guests>
  let m = sp.match(/^hotel_(.+)_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})_(\d+)$/);
  if (m) {
    const [, id, ci, co, g] = m;
    location.hash = `#/hotel/${id}?check_in=${ci}&check_out=${co}&guests=${g}`;
    return true;
  }
  m = sp.match(/^hotel_(.+)$/);
  if (!m) return false;
  location.hash = `#/hotel/${m[1]}`;
  return true;
}

function applyQueryParams() {
  const sp = new URLSearchParams(location.search);
  const hid = sp.get("hotel");
  if (!hid) return false;
  const ci = sp.get("check_in");
  const co = sp.get("check_out");
  const g = sp.get("guests");
  const q = ci ? `?check_in=${ci}&check_out=${co}&guests=${g || 1}` : "";
  location.hash = `#/hotel/${hid}${q}`;
  return true;
}

async function bootstrap() {
  const fromQuery = applyQueryParams();
  const fromStart =
    !fromQuery &&
    inTelegram &&
    tg.initDataUnsafe?.start_param &&
    applyStartParam(tg.initDataUnsafe.start_param);

  // Cold start in Telegram without a deep-link → no hotel context.
  // Don't try to preserve previous-session hash inside TG.
  if (!fromQuery && !fromStart && inTelegram) {
    const raw = location.hash.replace(/^#/, "");
    if (raw && !raw.startsWith("tgWebApp")) {
      location.hash = "";
    }
  }

  if (!api.hasToken() && inTelegram) {
    try {
      const r = await api.authTg(tg.initData);
      api.setSession(r.token, r.user);
    } catch {
      // public hotel page still works
    }
  }
  run();
}

bootstrap();
