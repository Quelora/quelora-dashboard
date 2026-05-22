# quelora-dashboard

**Admin dashboard for the [Quelora](https://github.com/Quelora) platform.**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](./LICENSE)

A React 18 single-page application for managing Quelora tenants — content,
moderation, analytics, advertising, gamification, jobs and full client
configuration.

## Features

- **Content** — posts, comments, trash, nested moderation
- **Moderation** — reports, ban/unban, comment hide/unhide, toxicity testing
- **Analytics** — dashboard stats, geo distribution, post / profile / moderation analytics
- **Advertising** — campaigns, placements, pricing, advertiser profiles
- **Gamification** — rules, levels, quests, shop, user ledger
- **Administration** — RBAC, system users, 2FA, jobs scheduler
- **Multi-tenant** — god-mode client switching; per-client encrypted config
- **i18n** — 12 languages
- **Theming** — light / dark mode

## Stack

React 18 · React Router v6 · Material-UI v7 · Axios · i18next · Recharts ·
Mapbox GL · CryptoJS · Create React App

## Setup

```bash
npm install
cp .env.example .env      # set REACT_APP_API_URL
npm start                 # dev server
npm run build             # production bundle
```

## Architecture

Consumes [`quelora-dashboard-api`](https://github.com/Quelora/quelora-dashboard-api).
Client configuration is AES-encrypted per tenant; the SPA decrypts it on load.

## License

[AGPL-3.0-only](./LICENSE) — Copyright (C) 2026 Germán Zelaya.

Part of the **[Quelora](https://github.com/Quelora)** project.
