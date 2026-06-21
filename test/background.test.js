"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

// background.js guards its chrome.* listener registration behind a typeof
// check, so it can be required here without a chrome global.
const bg = require("../js/background.js");

const BASE = "https://starwars.fandom.com/wiki/";

test("module exposes its public helpers", () => {
  assert.equal(bg.WIKI_BASE, BASE);
  for (const fn of ["articleUrl", "escapeXml", "buildSuggestions",
                    "navigate", "onInputChanged", "onInputEntered"]) {
    assert.equal(typeof bg[fn], "function", `${fn} should be a function`);
  }
});

test("articleUrl: turns spaces into underscores", () => {
  assert.equal(bg.articleUrl("Luke Skywalker"), BASE + "Luke_Skywalker");
  assert.equal(bg.articleUrl("Grand Admiral Thrawn"),
               BASE + "Grand_Admiral_Thrawn");
  // every space is replaced, including runs of them
  assert.equal(bg.articleUrl("a  b"), BASE + "a__b");
});

test("articleUrl: trims surrounding whitespace", () => {
  assert.equal(bg.articleUrl("  Yoda  "), BASE + "Yoda");
  assert.equal(bg.articleUrl("\tAhsoka Tano\n"), BASE + "Ahsoka_Tano");
});

test("articleUrl: preserves ':' so namespace pages resolve", () => {
  assert.equal(bg.articleUrl("Special:Random"), BASE + "Special:Random");
  assert.equal(bg.articleUrl("Category:Jedi"), BASE + "Category:Jedi");
});

test("articleUrl: preserves '/' for subpages", () => {
  assert.equal(bg.articleUrl("Star Wars/Legends"),
               BASE + "Star_Wars/Legends");
});

test("articleUrl: preserves '#' so section anchors resolve", () => {
  assert.equal(bg.articleUrl("Luke Skywalker#Early life"),
               BASE + "Luke_Skywalker#Early_life");
  assert.equal(bg.articleUrl("Anakin Skywalker#Dark side"),
               BASE + "Anakin_Skywalker#Dark_side");
});

test("articleUrl: percent-encodes unsafe characters", () => {
  assert.equal(bg.articleUrl('say "hi"'), BASE + "say_%22hi%22");
  // non-ASCII is UTF-8 percent-encoded
  assert.equal(bg.articleUrl("Café"), BASE + "Caf%C3%A9");
});

test("articleUrl: leaves already-underscored titles intact", () => {
  assert.equal(bg.articleUrl("Darth_Vader"), BASE + "Darth_Vader");
});

test("articleUrl: empty / whitespace-only input yields the base", () => {
  assert.equal(bg.articleUrl(""), BASE);
  assert.equal(bg.articleUrl("   "), BASE);
});

test("escapeXml: escapes all five XML entities", () => {
  assert.equal(bg.escapeXml("&"), "&amp;");
  assert.equal(bg.escapeXml("<"), "&lt;");
  assert.equal(bg.escapeXml(">"), "&gt;");
  assert.equal(bg.escapeXml('"'), "&quot;");
  assert.equal(bg.escapeXml("'"), "&apos;");
});

test("escapeXml: escapes ampersands first (no double-escaping)", () => {
  assert.equal(bg.escapeXml("a & <b>"), "a &amp; &lt;b&gt;");
  assert.equal(bg.escapeXml("<match>"), "&lt;match&gt;");
});

test("escapeXml: leaves plain text unchanged", () => {
  assert.equal(bg.escapeXml("Obi-Wan Kenobi"), "Obi-Wan Kenobi");
});

test("buildSuggestions: empty query returns only the two quick links", () => {
  const out = bg.buildSuggestions("");
  assert.equal(out.length, 2);
  assert.deepEqual(out, [
    { content: "Special:Random", description: "A Random Page" },
    { content: "Main_Page", description: "Front Page" }
  ]);
});

test("buildSuggestions: whitespace-only query is treated as empty", () => {
  assert.deepEqual(bg.buildSuggestions("   "), [
    { content: "Special:Random", description: "A Random Page" },
    { content: "Main_Page", description: "Front Page" }
  ]);
});

test("buildSuggestions: non-empty query prepends a query suggestion", () => {
  const out = bg.buildSuggestions("yoda");
  assert.equal(out.length, 3);
  assert.deepEqual(out[0], {
    content: "yoda",
    description: "Go to <match>yoda</match> on Wookieepedia"
  });
  // quick links remain as the last two entries — check full shape, not just content
  assert.deepEqual(out[1], { content: "Special:Random", description: "A Random Page" });
  assert.deepEqual(out[2], { content: "Main_Page", description: "Front Page" });
});

test("buildSuggestions: query content is trimmed", () => {
  assert.deepEqual(bg.buildSuggestions("  yoda  ")[0], {
    content: "yoda",
    description: "Go to <match>yoda</match> on Wookieepedia"
  });
});

test("buildSuggestions: query description is XML-escaped", () => {
  const out = bg.buildSuggestions('Tom & "Jerry" <3');
  // Full description asserted so a template change around the escaped text is caught too.
  assert.deepEqual(out[0], {
    content: 'Tom & "Jerry" <3',
    description: 'Go to <match>Tom &amp; &quot;Jerry&quot; &lt;3</match> on Wookieepedia'
  });
});

test("buildSuggestions: escapes apostrophes and '>' in the description", () => {
  // Apostrophes are common in Star Wars titles (e.g. "Vader's Fist") and '>'
  // is the one XML entity not covered by the sibling test above.
  assert.deepEqual(bg.buildSuggestions("Vader's Fist > Others")[0], {
    content: "Vader's Fist > Others",
    description: "Go to <match>Vader&apos;s Fist &gt; Others</match> on Wookieepedia"
  });
});

test("onInputChanged: passes built suggestions to the suggest callback", () => {
  let received;
  bg.onInputChanged("luke", (s) => { received = s; });
  // Check full shape so a regression in buildSuggestions template is caught here too.
  assert.equal(received.length, 3);
  assert.deepEqual(received[0], {
    content: "luke",
    description: "Go to <match>luke</match> on Wookieepedia"
  });
  assert.deepEqual(received[1], { content: "Special:Random", description: "A Random Page" });
  assert.deepEqual(received[2], { content: "Main_Page", description: "Front Page" });
});

test("onInputChanged: empty query passes only the two quick links to suggest", () => {
  // Chrome fires onInputChanged with "" when the user enters keyword mode
  // without typing anything yet; verify the handler passes through correctly.
  let received;
  bg.onInputChanged("", (s) => { received = s; });
  assert.deepEqual(received, [
    { content: "Special:Random", description: "A Random Page" },
    { content: "Main_Page", description: "Front Page" }
  ]);
});

// --- Navigation paths (require a mocked chrome global) ---

function withMockChrome(activeTabId, fn) {
  const calls = { query: [], update: [] };
  global.chrome = {
    tabs: {
      query(opts, cb) {
        calls.query.push(opts);
        cb([{ id: activeTabId }]);
      },
      update(tabId, updateInfo) {
        calls.update.push({ tabId, updateInfo });
      }
    }
  };
  try {
    fn(calls);
  } finally {
    delete global.chrome;
  }
}

test("navigate: updates the active tab in the current window", () => {
  withMockChrome(42, (calls) => {
    bg.navigate(BASE + "Yoda");
    assert.deepEqual(calls.query[0], { active: true, currentWindow: true });
    assert.equal(calls.update.length, 1);
    assert.deepEqual(calls.update[0], {
      tabId: 42,
      updateInfo: { url: BASE + "Yoda" }
    });
  });
});

test("onInputEntered: navigates the active tab to the article URL", () => {
  withMockChrome(7, (calls) => {
    bg.onInputEntered("Luke Skywalker");
    assert.equal(calls.update[0].tabId, 7);
    assert.equal(calls.update[0].updateInfo.url, BASE + "Luke_Skywalker");
  });
});

test("onInputEntered: namespace input keeps its colon", () => {
  withMockChrome(1, (calls) => {
    bg.onInputEntered("Special:Random");
    assert.equal(calls.update[0].updateInfo.url, BASE + "Special:Random");
  });
});

test("onInputEntered: empty input navigates to the wiki base URL", () => {
  withMockChrome(3, (calls) => {
    bg.onInputEntered("");
    assert.equal(calls.update[0].updateInfo.url, BASE);
  });
});

test("onInputEntered: whitespace-only input navigates to the wiki base URL", () => {
  withMockChrome(4, (calls) => {
    bg.onInputEntered("   ");
    assert.equal(calls.update[0].updateInfo.url, BASE);
  });
});

test("onInputEntered: leading/trailing whitespace is trimmed from the article URL", () => {
  withMockChrome(5, (calls) => {
    bg.onInputEntered("  Luke Skywalker  ");
    assert.equal(calls.update[0].updateInfo.url, BASE + "Luke_Skywalker");
  });
});

test("onInputEntered: passes '&' to the URL as-is (not XML-escaped to '&amp;')", () => {
  // encodeURI preserves '&' as a URI reserved character, so the URL gets a
  // literal '&'. More importantly, this guards against accidentally running
  // escapeXml on the text before articleUrl — that would produce '&amp;' in
  // the URL, silently navigating to the wrong article.
  withMockChrome(9, (calls) => {
    bg.onInputEntered("Han & Leia");
    assert.equal(calls.update[0].updateInfo.url, BASE + "Han_&_Leia");
  });
});

// --- Listener registration (browser-context guard) ---

test("registers omnibox listeners when a chrome.omnibox global is present", () => {
  const added = {};
  global.chrome = {
    omnibox: {
      onInputChanged: { addListener(fn) { added.changed = fn; } },
      onInputEntered: { addListener(fn) { added.entered = fn; } }
    }
  };
  // Re-evaluate the module so its registration guard runs with chrome defined.
  const path = require.resolve("../js/background.js");
  delete require.cache[path];
  try {
    const fresh = require(path);
    assert.equal(added.changed, fresh.onInputChanged);
    assert.equal(added.entered, fresh.onInputEntered);
  } finally {
    delete global.chrome;
    delete require.cache[path];
  }
});
