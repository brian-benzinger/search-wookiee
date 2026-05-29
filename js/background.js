// Base URL for Wookieepedia article pages.
var WIKI_BASE = "https://starwars.fandom.com/wiki/";

// Build a wiki article URL from arbitrary input. Spaces become underscores
// (the wiki title convention) and the rest is percent-encoded with encodeURI,
// which preserves ':' so namespace pages like "Special:Random" still resolve.
function articleUrl(text) {
  return WIKI_BASE + encodeURI(text.trim().replace(/ /g, "_"));
}

// Open the given URL in the active tab.
function navigate(url) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, {url: url});
  });
}

// Escape text for an omnibox suggestion description, which Chrome parses as XML.
function escapeXml(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&apos;");
}

// Fired each time the user updates the text in the omnibox, as long as the
// extension's keyword mode is still active.
chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
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
    suggest(suggestions);
  });

// Fired when the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener(
  function(text) {
    navigate(articleUrl(text));
  });
