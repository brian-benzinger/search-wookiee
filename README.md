# search-wookiee

[![CI](https://github.com/brian-benzinger/search-wookiee/actions/workflows/test.yml/badge.svg)](https://github.com/brian-benzinger/search-wookiee/actions/workflows/test.yml)

Chrome extension that adds a Wookieepedia omnibox keyword — type `sw` in the address bar to search the Star Wars wiki instantly.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the repository root.

## Usage

1. Click in the Chrome address bar and type `sw` followed by **Space** or **Tab**.
2. Type any Star Wars topic (e.g. `Luke Skywalker`, `Special:Random`, `Category:Jedi`).
3. Press **Enter** to navigate to that Wookieepedia article.

Two quick-link suggestions are always available:
- **A Random Page** — navigates to `Special:Random`
- **Front Page** — navigates to the wiki's main page

## Development

No dependencies to install. Run the test suite with Node's built-in runner:

```sh
npm test
```

Tests live in `test/background.test.js` and cover URL building, XML escaping, suggestion construction, and the omnibox event handlers. Coverage is gated at 98% lines / 90% branches / 90% functions.

After editing `js/background.js`, reload the extension on `chrome://extensions` to pick up the changes.

## License

MIT
