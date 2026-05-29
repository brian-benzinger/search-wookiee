# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project overview

**search-wookiee** is a small Google Chrome extension that adds an omnibox
keyword search for [Wookieepedia](https://starwars.fandom.com/), the Star Wars
wiki. The user types `sw` in the Chrome address bar, presses space or tab to
enter keyword mode, then types a query that is opened directly on the wiki.

There is no build step, package manager, test suite, or backend. The repository
*is* the unpacked extension — the files are loaded directly by Chrome.

## Repository layout

```
.
├── manifest.json      # Extension manifest (Manifest V2) — entry point
├── popup.html         # Browser-action popup shown when the toolbar icon is clicked
├── css/
│   └── style.css      # Styles for the popup (#hint box + fadeIn animation)
├── js/
│   └── background.js  # Non-persistent background page: omnibox event handlers
├── img/               # Icons (yoda_*.png) referenced by the manifest
│   ├── yoda_16.png    # toolbar / icons entry
│   ├── yoda_19.png    # browser_action default_icon (19px)
│   ├── yoda_38.png    # browser_action default_icon (38px)
│   ├── yoda_48.png    # icons entry
│   └── yoda_128.png   # icons entry / store listing
├── README.md
└── LICENSE            # MIT
```

## How it works

The whole extension is wired through `manifest.json`:

- `"omnibox": { "keyword": "sw" }` registers `sw` as the omnibox keyword.
- `"background"` loads `js/background.js` as a **non-persistent** (event) page.
- `"browser_action"` shows `popup.html` (a usage hint) when the toolbar icon
  is clicked.
- `"permissions": []` — the extension requests **no** permissions. It relies on
  the `chrome.tabs` and `chrome.omnibox` APIs, which are available without a
  declared permission for these uses.

`js/background.js` registers two omnibox listeners:

- `chrome.omnibox.onInputChanged` — fires as the user types; returns three
  hard-coded suggestions (latest movie, a random page, the front page).
- `chrome.omnibox.onInputEntered` — fires on accept; navigates the active tab
  to `http://starwars.wikia.com/wiki/<text>` via a `navigate()` helper that
  uses `chrome.tabs.query` + `chrome.tabs.update`.

## Running / testing locally

There is no automated tooling. To test changes manually:

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the repository root.
4. After editing files, click the **reload** icon on the extension card
   (background-page changes require a reload).
5. Test by typing `sw`, then space/tab, then a query in the address bar.

## Conventions

- **Manifest V2.** This extension still uses `manifest_version: 2` with a
  background page (`background.scripts`). Manifest V2 is deprecated by Chrome in
  favor of V3 (service workers). Do not migrate to V3 unless explicitly asked —
  it is a breaking change that affects `background`, the omnibox wiring, and
  `browser_action` (renamed to `action`).
- **Vanilla JS only.** No frameworks, bundlers, transpilers, or dependencies.
  Keep it dependency-free; use plain `chrome.*` APIs.
- **Indentation** in existing files mixes tabs and spaces (e.g. `manifest.json`
  uses tabs). Match the surrounding file's style when editing.
- Keep `version` in `manifest.json` in sync with any release you cut.

## Known issues / things to be aware of

- **Stale wiki URL.** `background.js` navigates to `starwars.wikia.com`, which
  now redirects to `starwars.fandom.com`. Updating the base URL is a reasonable
  improvement if asked.
- **Insecure scheme.** Navigation uses `http://` rather than `https://`.
- The `onInputChanged` suggestions are hard-coded (e.g. "Star_wars_episode_7")
  and not derived from the user's query.
- The query text is concatenated into the URL without encoding; consider
  `encodeURIComponent` if touching that code.

## Git / workflow

- Default branch: `master`.
- Do not create pull requests unless explicitly asked.
- Keep changes minimal and focused; this is a tiny, self-contained codebase.
