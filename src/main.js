import { api } from "./api.js";
import { applyStaticI18n, cycleLang } from "./i18n.js";
import { navigate, route, run } from "./router.js";
import { applyTheme, watchTheme } from "./theme.js";
import { initTg, inTelegram, tg } from "./tg.js";
import { renderDevLogin } from "./views/auth.js";
import { renderHotel } from "./views/hotel.js";
import { renderMyBookings } from "./views/my_bookings.js";
import { renderSearch } from "./views/search.js";

initTg();
applyTheme();
watchTheme();
applyStaticI18n();

document.getElementById("lang-cycle").onclick = cycleLang;

window.addEventListener("langchange", () => {
  applyStaticI18n();
  run();
});

route("/", renderSearch);
route("/search", renderSearch);
route("/hotel/{id}", renderHotel);
route("/my", renderMyBookings);
route("/login", () => renderDevLogin(() => navigate("/search")));

// Two transports for the deep-link to a specific hotel:
//   1. Telegram WebApp start_param (from t.me/BOT?startapp=hotel_5) — Mini App only.
//   2. Query string `?hotel=5&check_in=...` — used by the bot's inline web_app button URL.
// The bot uses query string because Telegram mobile overwrites the page hash
// with its own #tgWebAppData=... initData transport, so a hash like #/hotel/5
// from the bot would be lost.
function applyStartParam(sp) {
  if (!sp) return false;
  const m = sp.match(/^hotel_(\d+)(?:_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})_(\d+))?$/);
  if (!m) return false;
  const [, id, ci, co, g] = m;
  const q = ci ? `?check_in=${ci}&check_out=${co}&guests=${g}` : "";
  location.hash = `#/hotel/${id}${q}`;
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
  // Order matters: query-string deep-link wins over start_param wins over user-set hash.
  applyQueryParams() ||
    (inTelegram &&
      tg.initDataUnsafe?.start_param &&
      applyStartParam(tg.initDataUnsafe.start_param));

  // Best-effort silent auth. Failure is NOT fatal — public routes still render.
  if (!api.hasToken() && inTelegram) {
    try {
      const r = await api.authTg(tg.initData);
      api.setSession(r.token, r.user);
    } catch {
      // ignore — user can still browse public pages
    }
  }
  run();
}

bootstrap();
