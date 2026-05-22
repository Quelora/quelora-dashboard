# quelora-dashboard — Developer Overview

**Stack:** React 18 · React Router v6 · Material-UI v7 · Axios · i18next · Recharts · Mapbox GL · CryptoJS
**Role in monorepo:** Admin SPA that consumes `quelora-dashboard-api`. Provides content management, analytics, moderation, advertising, gamification, job scheduling, and full client configuration.
**Build tooling:** Create React App (react-scripts 5) · Dev proxy via `setupProxy.js`

---

## Directory Tree

```
quelora-dashboard/
├── public/
│   └── data/countries.geo.json         # Mapbox GeoJSON for geo charts
├── src/
│   ├── App.js                          # Route definitions + theme setup
│   ├── index.js                        # React root + console error filtering
│   ├── i18n.js                         # i18next config (12 languages, 26 modules each)
│   ├── setupProxy.js                   # CRA dev proxy: /api → REACT_APP_API_URL
│   │
│   ├── api/                            # Axios modules (one per domain)
│   │   ├── axiosConfig.js              # Interceptors, auth headers, decompression
│   │   ├── auth.js
│   │   ├── posts.js, campaigns.js, surveys.js, placements.js
│   │   ├── gamification.js, jobs.js, users.js, reports.js
│   │   ├── stats.js, profile.js, admin.js
│   │   ├── systemUsers.js, vapid.js, email.js
│   │   ├── moderation.js, reputation.js, toxicity.js, resilience.js
│   │   ├── media.js, logs.js, setup.js
│   │   ├── advertiserProfiles.js, placementPricing.js
│   │   └── ...
│   │
│   ├── assets/
│   │   ├── css/                        # Global styles, Login.css
│   │   └── locales/
│   │       └── {en,pt,he,de}/          # 26 JSON translation files per language
│   │
│   ├── components/
│   │   ├── DashboardLayout.jsx         # Main shell: AppBar, Sidebar, Outlet
│   │   ├── EmbedLayout.jsx             # Minimal layout for /embed/* routes
│   │   ├── Sidebar.jsx                 # Collapsible nav with RBAC filtering
│   │   ├── Auth/                       # Login, PrivateRoute, LanguageSelector
│   │   ├── Dashboard/                  # StatsCharts, GeoChart, HourlyChart, etc.
│   │   ├── Client/                     # Client config modals (VAPID, Email, Reputation, ModulesConfigModal, EntityConfig, etc.)
│   │   │   └── EntityConfig.jsx        # entityConfig editor: standard & deterministic modes, goTo, hrefAttribute
│   │   ├── Campaign/, Post/, Survey/   # Feature-specific forms and tables
│   │   ├── Console/                    # ConsoleDrawer debug log viewer
│   │   └── Common/                     # FileUpload, DateRange, ThemeSwitcher, PaginatedTable
│   │
│   ├── contexts/
│   │   └── UserContext.js              # Global user state + profile management
│   │
│   ├── hooks/
│   │   ├── useEnterprise.js            # Enterprise feature gate checks
│   │   ├── useDashboardStats.js        # Polling loop + real-time toggle
│   │   ├── useClient.js                # Client CRUD + config dialog state
│   │   ├── useCampaignModal.js         # Campaign form state
│   │   ├── usePlacementModal.js        # Placement form state
│   │   ├── usePostModal.js / usePostForm.js  # Post editor state
│   │   ├── useSurveyModal.js / useSurveyForm.js
│   │   └── usePaginatedList.js         # Pagination state + data fetching
│   │
│   ├── pages/                          # Route-level components (18+)
│   │   ├── Dashboard.jsx
│   │   ├── LoginPage.jsx, RegisterPage.jsx
│   │   ├── ClientPostsPage.jsx, PostPage.jsx, TrashPage.jsx
│   │   ├── CampaignsPage.jsx, PlacementsPage.jsx, PlacementPricingPage.jsx
│   │   ├── AdvertiserProfilesPage.jsx, SurveysPage.jsx
│   │   ├── GamificationPage.jsx, JobsPage.jsx
│   │   ├── UserPage.jsx, ReportsPage.jsx, PostCommentsPage.jsx
│   │   ├── SystemUsersPage.jsx, ProfilePage.jsx
│   │   └── PostStatsPage.jsx, ProfileAnalyticsPage.jsx, ModerationAnalyticsPage.jsx
│   │
│   └── utils/
│       ├── permissions.js              # ROUTE_PERMISSIONS, SECTION_PERMISSIONS, role levels
│       ├── embedStorage.js             # Storage abstraction (dashboard ↔ embed context)
│       └── crypto.js                   # AES-CBC encrypt/decrypt for client configs
│
├── .env / .env.example
├── package.json
└── Dockerfile / DockerfileDashboard
```

---

## Startup & Build

```bash
npm start          # CRA dev server, /api proxied to REACT_APP_API_URL
npm start:https    # HTTPS on 0.0.0.0:445
npm run build      # Production bundle → /build
```

**Dev proxy** (`setupProxy.js`): `/api` → `REACT_APP_API_URL` (avoids CORS during development)

**Environment variable:**
```env
REACT_APP_API_URL=https://api-dashboard.quelora.dev
```

---

## Routing

```
App.js
  /login                → LoginPage             (no layout)
  /register             → RegisterPage          (no layout)
  /embed/post/:entityId → PostPage (embed mode) (EmbedLayout)
  /                     → DashboardLayout
    /dashboard          → Dashboard
    /profile            → ProfilePage
    /client             → ClientPage
    /posts              → ClientPostsPage
    /post/:entity?      → PostPage
    /trash              → TrashPage
    /users              → UserPage
    /reports            → ReportsPage
    /post/:postId/comments → PostCommentsPage
    /surveys            → SurveysPage
    /campaigns          → CampaignsPage
    /placements         → PlacementsPage
    /placement-pricing  → PlacementPricingPage
    /advertiser-profiles → AdvertiserProfilesPage
    /post-stats         → PostStatsPage
    /profile-analytics  → ProfileAnalyticsPage
    /moderation-analytics → ModerationAnalyticsPage
    /system-users       → SystemUsersPage
    /gamification       → GamificationPage
    /jobs               → JobsPage
```

**`PrivateRoute`** wraps all dashboard routes — checks token expiry and role against `ROUTE_PERMISSIONS`. Unauthorized users are redirected to their role's default route.

---

## Authentication & Session

### Login flow

```
POST /auth/generate-token  (username, password)
  → { token, clients[], user, expiresIn, role }      ← normal login
  → { requires2FA: true, token: preAuthJWT }          ← 2FA required

POST /auth/verify-2fa  (totpToken, tempToken)
  → { token, clients[], user, expiresIn, role }
```

Token expiration stored as **absolute timestamp** (`Date.now() + expiresIn`) so offline expiry checks work without knowing when the token was issued.

### Storage strategy (`embedStorage.js`)

| Context | Primary store | Mirror | Read from |
|---------|-------------|--------|-----------|
| Dashboard (`/dashboard`, etc.) | sessionStorage | localStorage (auth keys) | sessionStorage only |
| Embed (`/embed/*`) | localStorage | — | localStorage only |

Keys stored: `token`, `clients`, `user`, `userKey`, `tokenExpiration`, `currentCid`

The localStorage mirror lets embed popup windows reuse an active dashboard session without re-login. `removeItem()` and `clear()` always clean **both** storages — logout is symmetric.

### Session hydration

On app load `UserContext` calls `loadUserFromStorage()`:
1. Decrypts user object from storage
2. Checks `tokenExpiration` — clears and redirects if expired
3. Falls back to `GET /user/profile` if storage is empty

### Client configs (multi-tenancy)

The login response includes an array of `clients`, each AES-encrypted per-CID. `getDecryptedClient(client)` decrypts config, vapid, email, postConfig, turn, nostr, p2p, resilience sub-objects, and passes through plain arrays `enterpriseModules` and `communityPlugins`. The active client's `cid` is stored as `currentCid` and sent on every request as `X-Client-Id`.

### God-mode client switching

1. God user picks a client from `GodClientSelector` in the AppBar
2. `POST /admin/set` → sets `active_cid` in Redis server-side
3. `GET /user/clients` → refreshes client list
4. `bumpClientSwitch()` → increments `clientSwitchCount` in UserContext
5. `DashboardLayout` uses `<Outlet key={clientSwitchCount} />` — forces full subtree remount, all pages reinitialize with fresh data

### Logout

`clearAuthData()` removes all auth keys from both sessionStorage and localStorage, then redirects to `/login`. Any `401` from Axios triggers the same cleanup automatically.

---

## Axios Layer (`src/api/axiosConfig.js`)

**Base URL:** `REACT_APP_API_URL` (or `/api` via CRA proxy)

**Request interceptor:**
- Attaches `Authorization: Bearer <token>` from `embedStorage`
- Attaches `X-Client-Id: <currentCid>`

**Response interceptor:**
- Dictionary decompression: if response shape is `{ dictionary, data }`, short keys are expanded to long keys transparently — no call-site awareness needed
- `401` → `clearAuthData()` + redirect to `/login`

---

## API Modules

| Module | Key operations | Primary endpoints |
|--------|---------------|-------------------|
| `auth.js` | login, 2FA, session hydration | `/auth/*`, `/user/profile`, `/user/clients` |
| `posts.js` | list, fetch, upsert, trash, restore, comments | `/client/posts`, `/client/upsert-post`, `/client/trash` |
| `stats.js` | dashboard stats, geo, post/profile/moderation analytics | `/stats/get/*` |
| `campaigns.js` | CRUD campaigns | `/client/campaigns` |
| `placements.js` | CRUD placements | `/client/placements` |
| `surveys.js` | CRUD surveys | `/client/surveys` |
| `gamification.js` | config, rules, levels, quests, shop, user ledger | `/gamification/*` |
| `users.js` | list, ban/unban, stats, Nolan analysis, reputation log | `/client/users/*`, `/stats/get/users/*` |
| `reports.js` | list, resolve, hide/unhide comment | `/client/reports/*`, `/client/comments/*` |
| `profile.js` | profile update, password, 2FA setup/disable | `/user/profile`, `/user/2fa/*` |
| `admin.js` | search clients, set active CID | `/admin/search`, `/admin/set` |
| `systemUsers.js` | staff CRUD, reset password, restore, unlock | `/user/list`, `/user/create`, `/user/:id/*` |
| `jobs.js` | list, update, trigger, fetch logs | `/jobs`, `/jobs/:key`, `/jobs/:key/trigger` |
| `vapid.js` | send push, search profiles, generate VAPID keys | `/notifications/*` |
| `email.js` | send email | `/notifications/send-mail` |
| `moderation.js` | test moderation rules | `/client/moderation` |
| `reputation.js` | fetch/save reputation config | `/reputation/:cid` |
| `toxicity.js` | test toxicity with live config | `/client/:cid/test-toxicity` |
| `resilience.js` | save config, rotate ed25519 keys | `/client/:cid/resilience/*` |
| `media.js` | file upload with progress | `/media/upload` |
| `logs.js` | fetch app/db/cache logs | `/client/logs` |
| `setup.js` | register, verify email, resend OTP | `/auth/register`, `/auth/verify-email` |
| `advertiserProfiles.js` | CRUD advertiser accounts | `/client/advertiser-profiles` |
| `placementPricing.js` | pricing config per client | `/client/placement-pricing` |

---

## State Management

### `UserContext` (`src/contexts/UserContext.js`)

Single global context. Provides:

| Value | Type | Description |
|-------|------|-------------|
| `user` | object | Authenticated user: `role`, `clients[]`, `locale`, `accountType`, `enterpriseModules[]` |
| `loading` | bool | Initial profile fetch in progress |
| `fetchUser()` | fn | `GET /user/profile` → store to storage |
| `refreshUser()` | fn | Same, used after profile update |
| `updateProfile(data)` | fn | `PATCH /user/profile` |
| `clientSwitchCount` | number | Bumped on god-mode client switch |
| `bumpClientSwitch()` | fn | Triggers subtree remount via Outlet key |

### Custom hooks (business logic)

| Hook | State managed |
|------|--------------|
| `useDashboardStats` | Polling interval, date range, CID selection, real-time toggle |
| `useClient` | Client CRUD, which config modal is open (VAPID / email / reputation / resilience / network / modules / code) |
| `useCampaignModal` | Campaign form fields, open/close, submit |
| `usePlacementModal` | Placement form fields |
| `usePostModal` / `usePostForm` | Post editor tabs: general, creative, delivery, advanced, live, audio, comments |
| `useSurveyModal` / `useSurveyForm` | Survey builder |
| `useEnterprise` | Enterprise gate checks |
| `usePaginatedList` | Page number, page size, total, data array, fetch trigger |

No Redux or Zustand — all state lives in component-local hooks or `UserContext`.

---

## RBAC & Permissions (`src/utils/permissions.js`)

### Role levels

| Role | Level |
|------|-------|
| god | 100 |
| admin | 50 |
| editor | 40 |
| moderator | 30 |
| advertiser | 20 |
| analyst | 15 |
| user | 10 |

### Route permissions (`ROUTE_PERMISSIONS`)

| Route | Minimum roles |
|-------|--------------|
| `/dashboard` | all |
| `/client` | god, admin |
| `/posts`, `/post/*`, `/trash` | god, admin, editor, user |
| `/surveys` | god, admin, editor |
| `/campaigns`, `/placements`, `/placement-pricing`, `/advertiser-profiles` | god, admin, advertiser |
| `/users`, `/reports` | god, admin, moderator |
| `/post-stats` | god, admin, analyst, editor |
| `/profile-analytics` | god, admin, analyst |
| `/moderation-analytics` | god, admin, moderator |
| `/system-users`, `/gamification`, `/jobs` | god, admin |
| `/profile` | all |

### Default redirect per role

| Role | Default route |
|------|--------------|
| god, admin, analyst, user | `/dashboard` |
| advertiser | `/campaigns` |
| moderator | `/reports` |
| editor | `/posts` |

### Enterprise feature gates (`useEnterprise`)

`isEnterprise = client.enterpriseModules.length > 0 OR role === 'god'`
`hasModule(mod)` — god always returns true; others check `client.enterpriseModules[]`

The source of truth is the **active client** in session storage (`currentCid` → `loadClientsFromSession()`).
`user.accountType` / `user.enterpriseModules` are NOT used for dashboard UI gating — those are legacy user-level fields.
On god-mode client switch the entire routed subtree remounts, so the hook always reflects the newly active client.

| Module key | Feature |
|-----------|---------|
| `surveys` | Surveys page |
| `gamification` | Gamification page |
| `advertising` | Campaigns / Placements / Advertiser profiles |
| `network` | Network config tab (TURN, Nostr, P2P) |
| `resilience` | Resilience config tab |
| `push` | VAPID / push notifications |
| `liveMode` | Live-mode tab in post editor |

### `ModulesConfigModal` (`src/components/Client/ModulesConfigModal.jsx`)

Dialog opened from the "Modules" chip in `ClientCard`. Manages per-client plugin activation:

- **Enterprise modules section** (god only): surveys, gamification, advertising, network (SSE+Chat), resilience (P2P), push, liveMode
- **Community plugins section** (admin+): sentinel, placer
- Calls `PATCH /client/:cid/modules` via `updateClientModules(cid, payload)` in `src/api/admin.js`
- Reads initial state from `client.enterpriseModules` and `client.communityPlugins`
- Calls `onSaved()` callback after successful save (reloads client list from session)

Pattern: follows the same modal/hook pattern as `NetworkConfigModal` and other config modals in `Client/`.

---

## Encryption (`src/utils/crypto.js`)

- **Algorithm:** AES-CBC (CryptoJS)
- **Key derivation:** `SHA-256(cid)` → hex string → AES key (deterministic from CID)
- **Format on disk:** `"<ivHex>:<cipherTextHex>"`
- **Encrypted fields per client:** `config`, `vapid`, `email`, `postConfig`, `turn`, `nostr`, `p2p`, `resilience`
- **Plain (unencrypted) fields per client:** `enterpriseModules` (string[]), `communityPlugins` (string[])
- `getDecryptedClient(client)` — decrypts all encrypted fields; passes `enterpriseModules` and `communityPlugins` through as-is
- `getEncryptedClient(client)` — encrypts for backend persistence

Private keys (resilience ed25519, TURN credentials) are encrypted **server-side** — they are never transmitted to the client.

---

## Real-time / Polling (`useDashboardStats`)

| Data | Poll interval |
|------|--------------|
| Stats counters | 5 seconds |
| Geo distribution | 7 seconds |

- Real-time mode is a user toggle; selecting a custom date range automatically disables it
- Deduplication: ignores duplicate requests within 1 second

No WebSockets in the dashboard SPA itself. The Sentinel Debug Broker (WS) is used only from Node.js scripts, not from this app.

---

## Internationalisation

**12 languages:** en, es, pt, fr, de, it, ru, zh, ja, ar, hi, he
**26 JSON namespaces per language:** app, login, dashboard, sidebar, profile, posts, postForm, campaigns, placements, surveys, gamification, advertiserProfiles, jobs, users, reports, moderation, cache, db, setup, upload, common, + more.

**`client.json` keys related to `entityConfig`** (present in all 12 locale files):
- `interaction_deterministic`, `interaction_deterministic_help` — toggle label/tooltip
- `interaction_deterministic_hint` — code-snippet instruction shown in deterministic mode
- `interaction_deterministic_attr_entity` — explains the `data-entity` attribute
- `interaction_deterministic_attr_href` — explains the `data-href` attribute
- `entity_goto`, `entity_goto_help` — goTo toggle
- `entity_href_attribute`, `entity_href_attribute_help`, `entity_href_attribute_required` — hrefAttribute field (standard mode + goTo only)

`i18n.changeLanguage()` is triggered automatically when the user profile is fetched or updated (syncs UI language to the user's stored `locale`).

---

## Theming

- Light / Dark mode toggle — persisted to localStorage
- MUI `createTheme`:
  - Light primary: `#4f46e5` (indigo)
  - Dark primary: `#818cf8` (light indigo)
  - Optional Google-inspired theme (light only)
- Typography: Inter + system font stack
- Responsive design via MUI breakpoints; sidebar toggles on mobile via `useMediaQuery`

---

## Key Architectural Decisions

**1. `embedStorage` abstraction**
Masks sessionStorage / localStorage behind a single API. Dashboard writes auth keys to both; embed reads only from localStorage. `removeItem` and `clear` always clean both — logout is always complete.

**2. Client-side AES encryption**
Client configs encrypted at the client using a key derived from the CID. Backend stores opaque ciphertext; frontend decrypts on load. No plaintext credentials at rest on the client.

**3. God-mode remount via `key`**
Rather than wiring every page to react to a CID change, `DashboardLayout` passes `clientSwitchCount` as the `key` prop to `<Outlet>`. React unmounts and remounts the entire routed subtree, giving a clean slate without explicit per-page logic.

**4. Absolute token expiry timestamp**
Expiry stored as `Date.now() + expiresIn` at login time. Expiry checks work offline and across page reloads without knowing the original issue time.

**5. Dictionary decompression in Axios**
Backend can compress response payloads by replacing long keys with short dictionary codes. The Axios response interceptor restores original keys transparently — no API call site needs to know about compression.

**6. Enterprise gates at hook level**
`useEnterprise` and `SECTION_PERMISSIONS` are the single source of truth for feature gating. UI components call `hasModule()` rather than duplicating role checks.

---

## Common Developer Tasks

**Add a new page:**
1. Create `src/pages/MyPage.jsx`
2. Add route in `App.js` inside the `DashboardLayout` subtree
3. Add entry in `ROUTE_PERMISSIONS` in `src/utils/permissions.js`
4. Add sidebar item in `Sidebar.jsx` under the relevant section
5. Add locale keys to all language JSON files

**Add an API call:**
1. Create or extend a module in `src/api/`
2. Import and call from the relevant hook or component
3. Axios interceptors handle auth headers automatically — no manual token handling needed

**Add an enterprise-gated feature:**
1. Wrap the UI section with `<EnterpriseGate module="myModule" />`
2. Or use `const { hasModule } = useEnterprise()` in the hook
3. Register the module key in `useEnterprise.js` if new

**Test without a real backend:**
- `setupProxy.js` proxies `/api` to `REACT_APP_API_URL` — point it to a staging API or mock server
- Alternatively mock Axios responses in tests

**Debug client config decryption:**
- `getDecryptedClient(client)` logs decryption errors silently — add a console.log inside it temporarily
- Verify the CID used for key derivation matches what the backend used to encrypt
