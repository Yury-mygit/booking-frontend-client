const routes = [];

export function route(pattern, handler) {
  const regex = new RegExp(
    "^" + pattern.replace(/\{(\w+)\}/g, "(?<$1>[^/]+)") + "$",
  );
  routes.push({ regex, handler });
}

export function navigate(hash) {
  if (location.hash === "#" + hash) {
    run();
  } else {
    location.hash = hash;
  }
}

function isTgInternalHash(raw) {
  // Telegram WebApp on mobile injects `#tgWebAppData=...` into the hash
  // (it's their initData transport). Treat any tgWebApp* hash as empty.
  return raw.startsWith("tgWebApp");
}

export function run() {
  const raw = location.hash.replace(/^#/, "");
  const full = !raw || isTgInternalHash(raw) ? "/" : raw;
  const [path, query = ""] = full.split("?");
  const q = Object.fromEntries(new URLSearchParams(query));
  for (const { regex, handler } of routes) {
    const m = path.match(regex);
    if (m) {
      handler({ ...(m.groups || {}), _query: q });
      return;
    }
  }
  document.getElementById("app").textContent = "404: " + path;
}

export function getQuery() {
  const raw = location.hash.replace(/^#/, "");
  if (isTgInternalHash(raw)) return {};
  const q = raw.split("?")[1] || "";
  return Object.fromEntries(new URLSearchParams(q));
}

window.addEventListener("hashchange", run);
