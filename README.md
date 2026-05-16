# booking-frontend-client

Telegram WebApp клиентский фронт для бронирования отелей.

## Стек
- vite 5 + ванильный JS, без runtime framework
- i18n: ru/ky/en, переключатель в шапке, выбор в `localStorage`
- TG WebApp SDK: `https://telegram.org/js/telegram-web-app.js`; вне Telegram — dev-форма входа (только когда backend поднят с `DEV_MODE=true`)

## Локально
```bash
docker compose up -d --build
# открыть http://localhost:5188/
```

`vite.config.js` проксирует `/api/*` на `http://booking_dev_app:8000` через docker network `shared`.

## Структура
```
src/
├── main.js              — bootstrap (init tg, auth, run router)
├── api.js               — fetch wrapper + token storage
├── i18n.js              — t(key, vars), setLang
├── router.js            — hash-routing
├── tg.js                — Telegram.WebApp wrapper
├── styles.css
└── views/
    ├── auth.js          — dev-login форма
    ├── search.js        — список отелей с фильтрами
    ├── hotel.js         — карточка + booking-flow inline
    └── my_bookings.js   — мои брони
locales/{ru,ky,en}.json
```
