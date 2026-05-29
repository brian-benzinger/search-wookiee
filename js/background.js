// Base URL for Wookieepedia article pages.
var WIKI_BASE = "https://starwars.fandom.com/wiki/";

// Build a wiki article URL from arbitrary input. Spaces become underscores
// (the wiki title convention) and the rest is percent-encoded with encodeURI,
// which preserves ':' so namespace pages like "Special:Random" still resolve.
function articleUrl(text) {
  return WIKI_BASE + encodeURI(text.trim().replace(/ /g, "_"));
}

// Escape text for an omnibox suggestion description, which Chrome parses as XML.
function escapeXml(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&apos;");
}

// Build the omnibox suggestion list for the current query. The first entry
// reflects the live query (when non-empty); the rest are static quick links.
function buildSuggestions(text) {
  var suggestions = [];
  var query = text.trim();
  if (query) {
    suggestions.push({
      content: query,
      description: "Go to <match>" + escapeXml(query) + "</match> on Wookieepedia"
    });
  }
  suggestions.push({content: "Special:Random", description: "A Random Page"});
  suggestions.push({content: "Main_Page", description: "Front Page"});
  return suggestions;
}

// Open the given URL in the active tab.
function navigate(url) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, {url: url});
  });
}

// Fired each time the user updates the text in the omnibox, as long as the
// extension's keyword mode is still active.
function onInputChanged(text, suggest) {
  suggest(buildSuggestions(text));
}

// Fired when the user accepts the input in the omnibox.
function onInputEntered(text) {
  navigate(articleUrl(text));
}

// Register listeners only in the extension (browser) context. Skipped under
// Node so the module can be imported by the test suite without a chrome global.
if (typeof chrome !== "undefined" && chrome.omnibox) {
  chrome.omnibox.onInputChanged.addListener(onInputChanged);
  chrome.omnibox.onInputEntered.addListener(onInputEntered);
}

// Export the pure helpers and handlers for Node-based tests. No-op in Chrome,
// where `module` is undefined.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    WIKI_BASE: WIKI_BASE,
    articleUrl: articleUrl,
    escapeXml: escapeXml,
    buildSuggestions: buildSuggestions,
    navigate: navigate,
    onInputChanged: onInputChanged,
    onInputEntered: onInputEntered
  };
}
