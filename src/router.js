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
  const path = location.hash.replace(/^#/, "") || "/";
  for (const { regex, handler } of routes) {
    const m = path.match(regex);
    if (m) {
      handler(m.groups || {});
      return;
    }
  }
  document.getElementById("app").textContent = "404: " + path;
}

window.addEventListener("hashchange", run);
