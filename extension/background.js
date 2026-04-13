chrome.runtime.onInstalled.addListener(() => {
  console.log("Filla extension installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "log") {
    console.log("Background:", request.data);
    sendResponse({ success: true });
  }
});
