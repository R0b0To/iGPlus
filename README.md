# iGPlus

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/K3K2ND3Y8)

A browser extension (Chrome & Firefox) that enhances the [igpmanager.com](https://igpmanager.com) online racing management game with quality-of-life UI improvements, calculated suggestions, and optional data export/backup tools. iGPlus is **unofficial** and **not affiliated with igpmanager.com** — it only reads and augments the page you are already logged into; it does not modify game rules, results, or server-side data beyond the normal in-game actions it triggers on your behalf (e.g. clicking "repair" for you).

> Privacy policy: see [`PRIVACY.md`](./PRIVACY.md)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Permissions](#permissions)
- [Third-Party Services & Libraries](#third-party-services--libraries)
- [FAQ](#faq)
- [Privacy](#privacy)
- [Support](#support)

---

## Overview

iGPlus is a **client-side-only browser extension** (Manifest V3 for Chrome, WebExtensions for Firefox). It has no backend server of its own. It works by:

1. Detecting which page of `igpmanager.com` you are on (`background.js`).
2. Injecting the matching content script(s)/stylesheet(s) for that page (`common/config.js` → `tabScripts`).
3. Reading the page's own AJAX/HTML data, computing derived stats (research gains, setup suggestions, tyre wear, pit-loss, etc.), and rendering additional UI on top of the native page.
4. Optionally caching data locally (IndexedDB / `chrome.storage.local`) and, if the user opts in, backing selected data up to their own Dropbox account.

There is no build step evident in the repository — the extension ships as plain ES modules loaded directly via `chrome.scripting.executeScript` and dynamic `import(chrome.runtime.getURL(...))` calls. *(Needs Verification: no `package.json`, bundler config, or CI pipeline was present in the reviewed source, so this is inferred purely from the file layout and import style.)*

## Features

Features are individually toggleable from the in-game **Settings** page (injected by `scripts/settings/addSettings.js`). Defaults live in `common/config.js` (`scriptDefaults`).

### Team & Race Weekend
| Feature | Toggle key | Source | What it does |
|---|---|---|---|
| Home Shortcuts | `review` | `scripts/home.js` | Auto-enables the Strategy tab once the race countdown drops under 10 minutes (native lock removal). |
| Academy Auto-Refresh | `refresh` | `scripts/timerAlert.js` | Shows a live countdown badge next to the HQ menu for the Driver Academy refresh timer. |
| HQ-Focused View | `hq` | `scripts/headquarters.js` | Adds a condensed "card" view of every facility (level, condition, repair/upgrade/collect actions, recruit lists) alongside the native 3D view, with drag-to-reorder and show/hide preferences, plus a bulk "Fix Selected" repair action. |
| Training | `train` | `scripts/training.js` | Overlays a projected health-regeneration bar for drivers and pit crew, estimated at next-race time. |
| My Staff | `staff` | `scripts/staff/staff.js`, `scripts/staff/changeDesigner.js` | Shows Chief Designer strength/weakness icons on the Staff page and in the "Change Designer" dialog. |
| Staff Transfer Market | `market` | `scripts/staff/staffMarket.js` | Adds Chief Designer strength/weakness icons and Technical Director special-skill labels to the staff market table. |
| Driver Transfer Market | `marketDriver` | `scripts/driver/driverMarket.js` | Adds a sortable Talent column and special-skill icon to the driver transfer market. |
| Engine / Brand page | *(always active on that page)* | `scripts/engine.js` | Swaps in a themed circuit map and overlays numeric values on the setup parameter bars. |

### Race Weekend Tools
| Feature | Toggle key | Source | What it does |
|---|---|---|---|
| Race Setup Suggestions | `setup` | `scripts/raceSetup/setups.js`, `.../settings.js`, `.../const.js` | Suggests Ride Height, Suspension, and Wing values per driver from a built-in circuit database, adjusted for driver height and skills; click-to-apply onto the native slider; a "Personalize" modal lets you override the per-circuit baseline (persisted locally). Also makes practice-lap table rows copyable to the clipboard. |
| Race Strategy Editor | `strategy` (+ `sliderS` / `editS`) | `scripts/strategy/*.js` | Drag-and-drop stint editor (tyre, push level, laps/fuel, estimated wear %), a settings modal for tuning push/fuel model constants, multiple named saved strategies per track, an optional slider or click-to-edit control for the native fuel input, and an optional import of a **publicly shared, read-only Google Sheet** into a customizable comparison table. |
| Weather & Circuit Map | *(always active on the Race page)* | `scripts/race/*.js` | Fetches an OpenWeatherMap forecast for the circuit's coordinates and renders temperature/humidity/precipitation/cloud-cover charts (Plotly) around race time; swaps in a themed circuit map. |
| Race Result Charts | *(always active on result-detail pages)* | `scripts/raceResult.js` | Computes pit time-loss per stop and adds a table/chart toggle (Plotly) for lap time, tyre wear %, and fuel remaining. |
| Car Design / Research | `research` | `scripts/research.js` | Adds a full numeric research-value table with a weighted "recommended research" highlight. |

### Data, Reports & Export
| Feature | Toggle key | Source | What it does |
|---|---|---|---|
| Reports | `reports` | `scripts/reports.js`, popup (`popup/popup.js`) | "Extract" pulls the full lap-by-lap report for every driver after a race, caches it locally, builds tyre-strategy previews and pit-loss stats on the result table, and lets you export Qualifying/Race/Full CSV files (download or clipboard) plus a formatted "Top 3" podium summary via the toolbar popup. |
| Advanced History | `history` | `scripts/track_history.js` | Shows per-circuit stat bars (overtaking, bumpiness, fuel consumption, tyre wear) and a themed map on the League race-history page. |
| League Home | `league` | `scripts/league.js` | Adds a "Full race history" shortcut, quali→finish position history for your own races, and standings-change (▲/▼) indicators. |
| Shortlist Talent | *(always active)* | `scripts/shortlist.js` | Adds a Talent column to the driver shortlist page, caching parsed driver data locally. |

### Cloud Sync & Personalization
| Feature | Toggle key | Source | What it does |
|---|---|---|---|
| Cloud Sync (Dropbox) | `gdrive`* | `auth/dropboxAuth.js`, `auth/dropbox_handler.js`, `scripts/autoSync.js` | Optional OAuth2 (PKCE) connection to the user's own Dropbox account to back up settings, saved strategies, saved setups, and race reports as JSON files, and to sync data between browsers/devices. |
| Dark Mode | `darkmode` | `scripts/darkmode.js`, `scripts/darkmode_forum.js`, `scripts/darkmode_off.js` | Injects/removes a dark theme on the main game UI and the forum. |
| Disable Background Image | `disablebg` | `scripts/disablebg.js`  + `css/disablebg.css` |  Removes game background images. |
| Vertical Sponsor Layout | `sponsor` | `scripts/sponsor.js` | Reflows the sponsor sign-up table into a vertical layout. |
| Team Color Picker | *(always active)* | `scripts/team_settings.js` | Replaces the native color input with a styled color picker (plus a validated hex text field on mobile browsers). |
| Settings Panel | `settings` | `scripts/settings/*.js` | Injects the entire iGPlus preferences block into the native Settings page. |

\* The internal toggle key, storage key names (`gdrive`), and some UI strings still say "Google Drive"/"Google Sheet" from an earlier implementation. **The current backing cloud provider is Dropbox** (see `auth/dropboxAuth.js` and `auth/dropbox_handler.js`) — this is a known naming inconsistency in the codebase, not a functional Google Drive integration.

### Toolbar Popup (Reports Manager)
`popup/popup.html` + `popup/popup.js` provide:
- A dropdown of previously extracted race reports (persisted in IndexedDB).
- Buttons to generate: Race Report, Lap 2 Overtakes, Pit History, Pit Time Loss, Pit Stops (stationary time), Average Report (position heatmap), and a Full CSV export.
- Copy-to-clipboard and download-as-file actions for the generated text/CSV.
- Delete a saved report (and its Dropbox copy, if Cloud Sync is enabled).

### Chrome / Chromium (Manifest V3)
1. Clone or download this repository.
2. Go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `Extension/` folder (the one containing `manifest.json`).
5. Navigate to `igpmanager.com` and log in — content scripts activate automatically per page.

### Firefox
The repository ships a **separate manifest for Firefox**, `Extension/manifest-f.json`, which uses the `background.scripts` array form (instead of Chrome's `service_worker`) and declares `browser_specific_settings.gecko`.
1. Rename/copy `manifest-f.json` to `manifest.json` inside a copy of the `Extension/` folder (Firefox reads `manifest.json` specifically).
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select the modified `manifest.json`.
4. Note: temporary add-ons are removed when Firefox restarts. *(Needs Verification: no packaging/build script to automate producing a browser-specific `manifest.json` was found in the repository — this step is currently manual.)*

### Notes
- `manifest.json` (Chrome) includes a fixed public `key` field, which pins a stable extension ID. This matters for the Dropbox OAuth redirect URI (`chrome.identity.getRedirectURL()` is derived from the extension ID) — see [Contributing](#contributing).
- No environment variables, `.env` files, or server-side configuration exist; all configuration is done through the browser's local storage and the in-app Settings panel described below.

## Configuration

All configuration happens **inside the game UI**, on the native Settings page, in a block injected by `scripts/settings/addSettings.js` / `scripts/settings/settingsHTML.js`.

| Setting | Storage location | Notes |
|---|---|---|
| Language (en / it / es) | `chrome.storage.local.language` | Drives `common/localization.js` strings. |
| Per-feature toggles (see tables above) | `chrome.storage.local.script` (object keyed by toggle key) | Defaults from `scriptDefaults` in `common/config.js`. |
| Darkmode / Race Report Sign / Overtakes Sign | `chrome.storage.local.{darkmode,raceSign,overSign}` | Simple UI preference toggles. |
| Custom Separator | `chrome.storage.local.separator` | Delimiter used when building CSV/text report output (default `,`). |
| Google Sheet link, sheet name, track-column header | `chrome.storage.local.{gLink,gLinkName,gTrack}` | Used only by the **Strategy** page's optional public-Sheet import (read-only `gviz` fetch, no auth). |
| Cloud Sync (Dropbox) toggle + "Sync Now" | `chrome.storage.local.script.gdrive`, OAuth tokens in `chrome.storage.local.dbxAuth` | See [Privacy](#privacy). |
| Custom circuit setup baselines | `chrome.storage.local.customCircuits` | Editable per-circuit Ride/Wing/Suspension baseline, seeded from `scripts/raceSetup/const.js`. |
| Push-level / fuel-model tuning | `chrome.storage.local.{pushLevels,tyreFuelModel}` | Set from the Strategy page's settings modal. |
| Saved strategies | `chrome.storage.local.save` (keyed by track code / hash) | Created via the Strategy page "save" popup. |
| HQ panel layout | `chrome.storage.local.igp_hq_prefs` | Card order, hidden facilities, active tab, auto-fix selections. |
| Imported-sheet table layout | `chrome.storage.local.igplus_tableConfig_*` | Column order/visibility/width for the Strategy page's imported Google Sheet table. |
| Strategies/Setups backup files | Upload/Download buttons in Settings | Local JSON import/export, independent of Dropbox. |

## Usage

1. Install the extension (see above) and log into `igpmanager.com`.
2. Open **Settings → iGPlus preferences** in-game to enable/disable individual features and set your language, separator, and (optionally) Dropbox sync or a public Google Sheet link.
3. Browse the game normally — enhancements appear automatically on their matching pages (race setup, strategy, staff, transfer markets, HQ, league, etc.).
4. After a race, open the **Race Result** dialog and click **Extract** to pull the full lap-by-lap report; strategy previews and pit-loss stats will appear on the result table.
5. Click the extension's toolbar icon to open the **Reports** popup, pick a saved race from the dropdown, and generate/copy/download the report type you need.
6. If you enable **Cloud Sync**, approve the Dropbox authorization prompt once; subsequent syncs happen automatically on page load (`scripts/autoSync.js`) or via the **Sync Now** button.

## Project Structure

```
Extension/
├── manifest.json                # Chrome (Manifest V3, service_worker background)
├── manifest-f.json              # Firefox variant (background.scripts, gecko settings)
├── background.js                # Background service worker: page-routing, message broker
├── auth/
│   ├── dropboxAuth.js           # Dropbox OAuth2 (PKCE) flow + token storage/refresh
│   ├── dropbox_handler.js       # Dropbox file sync (config/reports/strategies/setups JSON)
│   └── csv_handler.js           # CSV encode/parse + Dropbox CSV import/export ("sheet" UI)
├── common/
│   ├── circuits.js              # Canonical circuit id <-> 2-letter code map
│   ├── config.js                # Feature-toggle defaults + per-URL script/style routing table
│   ├── database.js              # IndexedDB wrapper (DB: iGPlusDB)
│   ├── dom.js                   # Shared DOM element builder (`el()`)
│   ├── driverFields.js          # Named indices for the game's driver CSV data format
│   ├── fetcher.js               # Centralized fetch helpers (game API + OpenWeatherMap)
│   ├── gameActions.js           # Authenticated game "action" endpoint client (CSRF handling)
│   ├── localization.js          # en / it / es UI strings
│   ├── safeQuery.js             # Defensive DOM query helpers (log-and-return-null)
│   ├── storage.js                # chrome.storage.local wrapper
│   └── tableSort.js             # Generic <table> column sorter
├── scripts/
│   ├── autoSync.js, darkmode*.js, engine.js, headquarters.js, home.js, league.js,
│   │   raceResult.js, reports.js, research.js, shortlist.js, sponsor.js,
│   │   team_settings.js, timerAlert.js, track_history.js, training.js
│   ├── driver/        (driverHelpers.js, driverMarket.js)
│   ├── race/           (chartConfig.js, const.js, race.js)
│   ├── raceSetup/       (const.js, options.js, settings.js, setups.js)
│   ├── settings/         (addSettings.js, settingsHTML.js)
│   ├── staff/              (changeDesigner.js, helpers.js, staff.js, staffMarket.js)
│   └── strategy/            (const.js, strategy.js, strategyMath.js, utility.js)
├── popup/
│   ├── popup.html, popup.css, popup.js
├── css/                     
├── images/                  # Icons / circuit maps — contents not in reviewed source
└── lib/
    ├── purify.js             # Vendored DOMPurify (HTML sanitization)
    └── plotly-3.5.1.min.js   # Vendored Plotly.js (charts)

privacy.md   # Legacy privacy policy (published via GitHub Pages)
README.md / PRIVACY.md / SECURITY.md / CONTRIBUTING.md
```

## Architecture

```
 igpmanager.com tab navigates
        │
        ▼
 background.js (tabs.onUpdated listener)
        │  looks up URL path in common/config.js → tabScripts
        │  reads chrome.storage.local.script (enabled features)
        ▼
 chrome.scripting.executeScript / insertCSS
        │
        ▼
 Content script (scripts/**.js)
        │  dynamic import(chrome.runtime.getURL('common/*.js')) for shared helpers
        │  reads/mutates the live DOM, calls common/fetcher.js or common/gameActions.js
        │  (fetch(..., {credentials:'include'}) reuses the user's existing session cookie)
        ▼
 Local persistence layer
   ├─ chrome.storage.local  → settings, cached strategy/setup data, OAuth tokens
   └─ IndexedDB (iGPlusDB)  → race_result / reports / shortlist_driver object stores
        │
        ▼ (optional, user-enabled)
 Dropbox API  ←→  auth/dropboxAuth.js (OAuth2 PKCE) + auth/dropbox_handler.js (file sync)
```

Key architectural points:
- **No build step / bundler evident.** Modules are loaded directly with native ES `import`/`export` and `chrome.runtime.getURL()` + dynamic `import()`, not a bundled output.
- **Per-page routing table** (`common/config.js` → `tabScripts`) maps a URL path prefix to the scripts/styles to inject, gated by a feature-toggle key.
- **Retry-and-observe pattern**: most content scripts poll briefly (`setTimeout` retry loops) and/or use `MutationObserver` to wait for the third-party game's own dynamically-rendered DOM, since there is no reliable "ready" event exposed by the site.
- **Shared helpers over duplication**: `common/dom.js`, `common/safeQuery.js`, `common/fetcher.js`, `common/gameActions.js`, and `common/tableSort.js` centralize patterns that were previously duplicated across multiple scripts (per in-code comments).
- **CSRF handling**: `common/gameActions.js` reads and forwards the game's own CSRF name/token pair on mutating requests (facility repair/upgrade/collect) rather than bypassing them.
- **Sanitization**: HTML fragments returned by the game's API (report tables, cleaned car-attribute markup) are passed through the vendored DOMPurify (`lib/purify.js`) before being inserted into the DOM (see `scripts/reports.js` `parseReportHTML`, `scripts/strategy/utility.js` `cleanHtml`).

## Permissions

| Permission | Declared in | Purpose |
|---|---|---|
| `tabs` | both manifests | Detect URL changes on the user's tabs to decide which enhancement scripts to inject. |
| `scripting` | both manifests | Programmatically inject content scripts and CSS. |
| `storage` | both manifests | Persist settings, cached data, and (optional) Dropbox tokens via `chrome.storage.local`. |
| `identity` | both manifests | Launch the Dropbox OAuth2/PKCE web-auth flow; only exercised when Cloud Sync is enabled. |
| `host_permissions: *://igpmanager.com/*` | both manifests | Restricts all content-script injection and DOM access to the igpmanager.com domain — the extension cannot run on other sites. |
| `web_accessible_resources`: `*.png`, `*.PNG`, `*.svg`, `*.css`, `*.js` matching `*://igpmanager.com/*` | both manifests | Allows pages on igpmanager.com to load extension-bundled images/CSS/JS (e.g. circuit map images swapped into the DOM). |

The Firefox manifest additionally declares `browser_specific_settings.gecko.data_collection_permissions.required: ["none"]` — a Firefox-specific, self-declared statement that the extension does not require any Firefox data-collection permission category.

## Third-Party Services & Libraries

| Service / Library | Where used | Nature of use |
|---|---|---|
| igpmanager.com (the game itself) | `common/fetcher.js`, `common/gameActions.js`, most content scripts | The extension's core data source; requests are made with `credentials:'include'`, reusing the user's existing logged-in session — no separate credential storage. |
| OpenWeatherMap API | `common/fetcher.js` (`fetchIGPRaceWeather`, `fetchIGPRaceWeatherNow`), `scripts/race/race.js` | Fetches a weather forecast for the next race's circuit coordinates for the optional weather chart. Uses an API key embedded directly in the source (`appid` constant). |
| Dropbox API v2 (`api.dropboxapi.com`, `content.dropboxapi.com`, `www.dropbox.com`) | `auth/dropboxAuth.js`, `auth/dropbox_handler.js`, `auth/csv_handler.js` | **Optional**, user-initiated Cloud Sync (OAuth2 PKCE). Stores `config.json`, `reports.json`, `strategies.json`, `setups.json` in the app's Dropbox folder. |
| Google Sheets ("gviz" public query endpoint) | `scripts/strategy/strategy.js` (`readGSheets`) | **Optional**. If the user pastes a link to a *publicly viewable* Google Sheet in Settings, the Strategy page fetches it directly (unauthenticated `GET`) to overlay a custom data table. |
| Google Fonts (`fonts.googleapis.com`) | `popup/popup.html` | Loads the "Inter" font stylesheet when the toolbar popup opens. |
| DOMPurify | `lib/purify.js` (vendored) | HTML sanitization before inserting game-supplied HTML fragments into the DOM. |
| Plotly.js v3.5.1 | `lib/plotly-3.5.1.min.js` (vendored) | Interactive charts (weather forecast, lap-by-lap race data). |

## FAQ

**Is this an official igpmanager tool?**
No. It's an unofficial, community-made browser extension that only augments the page's own UI/data on the client side.

**Where is my data stored?**
Locally in your browser (`chrome.storage.local` + IndexedDB) unless you explicitly enable Dropbox Cloud Sync, in which case selected data is also written to your own Dropbox account (`Apps/iGPlus` folder).

**Why does the export dialog say "Google Sheet" if it uses Dropbox?**
This is a known naming inconsistency left over from an earlier Google Sheets-based export implementation; the current backend for that dialog is Dropbox (`auth/csv_handler.js`, `auth/dropbox_handler.js`).

**Can I use it on other manager games?**
No — `host_permissions` restricts the extension entirely to `igpmanager.com`.

**Does it work on mobile browsers?**
yes, tested with mobile Firefox

**Why do some features require no toggle to work?**
A handful of page-specific scripts (e.g. `shortlist.js`, `team_settings.js`, `raceResult.js`, `race/race.js`) have no `key` entry in `tabScripts`, so `background.js`'s `if (!key || enabledScripts[key])` check treats them as always enabled on their matching page.


## Privacy

See [`PRIVACY.md`](./PRIVACY.md) for a full breakdown of what data is collected, stored, and sent to third parties, and under what conditions.


## Support

- Bug reports / feature requests: [GitHub Issues](https://github.com/R0b0To/iGPlus/issues)
- Support the project: [Ko-fi](https://ko-fi.com/K3K2ND3Y8)
