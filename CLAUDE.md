# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project overview

**search-wookiee** is a small Google Chrome extension that adds an omnibox
keyword search for [Wookieepedia](https://starwars.fandom.com/), the Star Wars
wiki. The user types `sw` in the Chrome address bar, presses space or tab to
enter keyword mode, then types a query that is opened directly on the wiki.

There is no build step, bundler, or backend, and no third-party dependencies.
The repository *is* the unpacked extension — the files are loaded directly by
Chrome. The only tooling is a unit-test suite that runs on Node's **built-in**
test runner (`node:test`), so it needs no `npm install`.

## Repository layout

```
.
├── .github/
│   └── workflows/
│       └── test.yml   # CI: runs `npm test` on PRs and pushes to main
├── manifest.json      # Extension manifest (Manifest V2) — entry point
├── popup.html         # Browser-action popup shown when the toolbar icon is clicked
├── css/
│   └── style.css      # Styles for the popup (#hint box + fadeIn animation)
├── js/
│   └── background.js  # Non-persistent background page: omnibox event handlers
├── test/
│   └── background.test.js  # Unit tests (node:test) for js/background.js
├── package.json       # Dev-only: defines the `npm test` script (no deps)
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

- `chrome.omnibox.onInputChanged` — fires as the user types; returns a
  suggestion for the live query (XML-escaped via `escapeXml()`) plus two static
  quick links: a random page and the front page.
- `chrome.omnibox.onInputEntered` — fires on accept; navigates the active tab
  to `https://starwars.fandom.com/wiki/<text>` via a `navigate()` helper that
  uses `chrome.tabs.query` + `chrome.tabs.update`. The article title is built
  by `articleUrl()`, which turns spaces into underscores and percent-encodes
  the rest with `encodeURI` (preserving `:` so namespaces like `Special:Random`
  still resolve).

The logic is split into small, pure-ish functions (`articleUrl`, `escapeXml`,
`buildSuggestions`, `navigate`, `onInputChanged`, `onInputEntered`) so it can be
unit-tested. Two guards at the bottom of the file keep it working in both
contexts: listener registration runs only when `chrome` is defined (the
browser), and a `module.exports` block runs only when `module` is defined
(Node), exporting the functions for the test suite. Keep both guards if you edit
the file.

## Running / testing locally

### Automated tests

The unit tests live in `test/` and use Node's built-in runner — no install
needed:

```
npm test        # or: node --test "test/**/*.test.js"
```

They cover URL building (`articleUrl`), XML escaping (`escapeXml`), suggestion
construction (`buildSuggestions`), and the omnibox handlers (`onInputChanged` /
`onInputEntered` / `navigate`) using a small mock `chrome` global. Add or update
tests in `test/background.test.js` when you change `js/background.js`.

**Coverage is enforced.** `npm test` runs with Node's built-in coverage and
fails (exit 1) if `js/background.js` falls below **98% lines / 90% branches**
(functions are also gated at 90%). Test files are excluded from the metric via
`--test-coverage-exclude`, so the numbers reflect real source coverage. The
suite currently sits at 100% on all three. If you add code to `background.js`,
add tests to keep it above the thresholds — including any browser-only guard
blocks (see the listener-registration test, which re-`require`s the module with
a mock `chrome` global so the registration path is exercised).

The same `npm test` runs in CI on every pull request and on pushes to `main`
via `.github/workflows/test.yml` (Node 22, no install step since there are no
dependencies). Keep it green.

### Manual testing in Chrome

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
- **Vanilla JS only.** No frameworks, bundlers, transpilers, or runtime
  dependencies. Keep it dependency-free; use plain `chrome.*` APIs. The test
  suite likewise uses only Node's built-in `node:test` / `node:assert` — do not
  add a third-party test framework.
- **Test alongside changes.** When you touch `js/background.js`, run `npm test`
  and keep `test/background.test.js` green.
- **Indentation** in existing files mixes tabs and spaces (e.g. `manifest.json`
  uses tabs). Match the surrounding file's style when editing.
- Keep `version` in `manifest.json` in sync with any release you cut.

## Known issues / things to be aware of

- The two quick-link suggestions (random page, front page) are static by
  design; only the first suggestion reflects the typed query.
- Omnibox suggestion descriptions are parsed as XML, so any dynamic text must
  pass through `escapeXml()` before being interpolated. Keep that escaping if
  you add more dynamic suggestions.

Previously-known issues, now fixed in `js/background.js`: the base URL points at
`https://starwars.fandom.com` (was the stale, insecure `http://starwars.wikia.com`),
and article titles are encoded via `articleUrl()` rather than concatenated raw.

## Git / workflow

- Default branch: `main`.
- Do not create pull requests unless explicitly asked.
- Keep changes minimal and focused; this is a tiny, self-contained codebase.
