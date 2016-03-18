//Open search in this tab
function navigate(url) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, {url: url});
  });
}
// Event is fired each time the user updates the text in the omnibox,
// as long as the extension's keyword mode is still active.
chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    suggest([
      {content: "Star_wars_episode_7", description: "The Latest Movie"},
      {content: "Special:Random", description: "A Random Page"},
      {content: "", description: "Front Page"} 
    ]);
  });

// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener(
  function(text) {
    navigate("http://starwars.wikia.com/wiki/"+text);
  });
