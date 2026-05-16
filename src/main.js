import { api } from "./api.js";
import { applyStaticI18n, getLang, setLang } from "./i18n.js";
import { navigate, route, run } from "./router.js";
import { initTg, inTelegram, tg } from "./tg.js";
import { renderDevLogin } from "./views/auth.js";
import { renderHotel } from "./views/hotel.js";
import { renderMyBookings } from "./views/my_bookings.js";
import { renderSearch } from "./views/search.js";

initTg();
applyStaticI18n();

document.querySelectorAll("#lang-switch button").forEach((b) => {
  b.onclick = () => setLang(b.dataset.lang);
});

window.addEventListener("langchange", () => {
  applyStaticI18n();
  run();
});

route("/", renderSearch);
route("/search", renderSearch);
route("/hotel/{id}", renderHotel);
route("/my", renderMyBookings);
route("/login", () => renderDevLogin(() => navigate("/search")));

// Parse Telegram WebApp `start_param` deep-link (from t.me/BOT?startapp=hotel_5...).
// Supported formats:
//   hotel_{id}                          → /#/hotel/{id}
//   hotel_{id}_{ci}_{co}_{guests}       → /#/hotel/{id}?check_in=...&check_out=...&guests=...
function applyStartParam(sp) {
  if (!sp) return false;
  const m = sp.match(/^hotel_(\d+)(?:_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})_(\d+))?$/);
  if (!m) return false;
  const [, id, ci, co, g] = m;
  const q = ci ? `?check_in=${ci}&check_out=${co}&guests=${g}` : "";
  location.hash = `#/hotel/${id}${q}`;
  return true;
}

async function bootstrap() {
  // In TG: try to consume start_param BEFORE the (likely-empty) hash takes effect.
  if (inTelegram) {
    const sp = tg.initDataUnsafe?.start_param;
    if (sp && !location.hash) applyStartParam(sp);
  }
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
