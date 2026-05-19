const BASE = "/api/v1";

let _token = localStorage.getItem("booking_token") || "";
let _user = JSON.parse(localStorage.getItem("booking_user") || "null");

async function call(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (_token) headers.Authorization = `Bearer ${_token}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opts);
  if (r.status === 204) return null;
  const data = await r.json();
  if (!r.ok) {
    const err = new Error(data.message || r.statusText);
    err.code = data.error || "http_error";
    err.status = r.status;
    throw err;
  }
  return data;
}

export const api = {
  hasToken: () => !!_token,
  user: () => _user,
  setSession(token, user) {
    _token = token;
    _user = user;
    localStorage.setItem("booking_token", token);
    localStorage.setItem("booking_user", JSON.stringify(user));
  },
  clearSession() {
    _token = "";
    _user = null;
    localStorage.removeItem("booking_token");
    localStorage.removeItem("booking_user");
  },

  authTg: (initData) => call("POST", "/auth/tg", { init_data: initData }),
  authDev: (tgId, name, role = "client") => {
    const qs = new URLSearchParams({
      telegram_id: String(tgId),
      first_name: name,
      role,
    });
    return call("POST", `/auth/dev-login?${qs}`);
  },

  hotelDetails(id, params = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== "" && v != null) qs.set(k, v);
    }
    return call("GET", `/public/hotels/${id}${qs.toString() ? "?" + qs : ""}`);
  },
  createBooking: (payload) => call("POST", "/c/bookings", payload),
  myBookingsAtHotel: (hid) => call("GET", `/c/bookings?hotel_id=${hid}`),
  getBooking: (code) => call("GET", `/c/bookings/${code}`),
  payInit: (code) => call("POST", `/c/bookings/${code}/pay/init`),
  payConfirm: (paymentId) => call("POST", `/c/payments/${paymentId}/mock-confirm`),
};
