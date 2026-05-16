const KEY = "favorite_hotels";
const LIMIT = 50;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
}

export function listFavorites() {
  return load();
}

export function isFavorite(id) {
  return load().some((h) => h.id === Number(id));
}

export function toggleFavorite(hotel) {
  if (!hotel || !hotel.id) return false;
  const list = load();
  const idx = list.findIndex((h) => h.id === hotel.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    save(list);
    return false;
  }
  list.unshift({
    id: hotel.id,
    name_ru: hotel.name_ru,
    city: hotel.city,
    photos: hotel.photos || [],
    min_price_kgs: hotel.min_price_kgs ?? null,
    ts: Date.now(),
  });
  save(list);
  return true;
}

export function refreshSnapshot(hotel) {
  if (!hotel || !hotel.id) return;
  const list = load();
  const idx = list.findIndex((h) => h.id === hotel.id);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    name_ru: hotel.name_ru,
    city: hotel.city,
    photos: hotel.photos || list[idx].photos || [],
    min_price_kgs: hotel.min_price_kgs ?? list[idx].min_price_kgs ?? null,
  };
  save(list);
}
