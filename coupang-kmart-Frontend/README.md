# Coupang Kmart POS Login Frontend

Professional React + Vite starter focused on a POS-style login screen.

## Quick start

```bash
cd coupang-kmart-Frontend
npm install
npm run dev
```

Open the local URL shown in terminal (usually `http://localhost:5173/`).

## Project structure

- `index.html` - Vite root HTML entry.
- `src/main.jsx` - React app mount.
- `src/App.jsx` - app shell (currently renders login page).
- `src/assets/logo.jpeg` - brand logo used in login panel.
- `src/features/auth/components/BrandPanel.jsx` - left brand/metrics panel.
- `src/features/auth/components/LoginForm.jsx` - right login form card.
- `src/features/auth/pages/LoginPage.jsx` - page composition for login view.
- `src/styles/global.css` - global and login page styling.

## Notes

- The current login submit is UI-only (`preventDefault`) for frontend integration.
- You can connect backend auth by updating `onSubmit` in `LoginForm.jsx`.
