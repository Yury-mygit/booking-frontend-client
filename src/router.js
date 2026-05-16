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

export function run() {
  const full = location.hash.replace(/^#/, "") || "/";
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
  const q = (location.hash.split("?")[1] || "");
  return Object.fromEntries(new URLSearchParams(q));
}

window.addEventListener("hashchange", run);
