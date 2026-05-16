import { api } from "./api.js";
import { applyStaticI18n, getLang, setLang } from "./i18n.js";
import { route, run } from "./router.js";
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

async function bootstrap() {
  if (api.hasToken()) {
    run();
    return;
  }
  if (inTelegram) {
    try {
      const r = await api.authTg(tg.initData);
      api.setSession(r.token, r.user);
      run();
    } catch (e) {
      document.getElementById("app").innerHTML =
        `<div class="error">Auth failed: ${e.message}</div>`;
    }
  } else {
    renderDevLogin(() => {
      if (!location.hash) location.hash = "#/search";
      run();
    });
  }
}

bootstrap();
