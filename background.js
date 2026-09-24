// QRForge background service worker — context menus (Manifest V3).
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "qr-page",
    title: "Generate QR for this page",
    contexts: ["page"]
  });
  chrome.contextMenus.create({
    id: "qr-link",
    title: "Generate QR for this link",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "qr-selection",
    title: 'Generate QR for "%s"',
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let text = "";
  if (info.menuItemId === "qr-link") text = info.linkUrl || "";
  else if (info.menuItemId === "qr-selection") text = info.selectionText || "";
  else text = (tab && tab.url) || "";

  // Stash the payload, then open the popup-equivalent page.
  chrome.storage.local.set({ qrforge_prefill: text }, () => {
    chrome.action.openPopup().catch(() => {
      // openPopup may fail without a user gesture in some flows; fall back to a tab.
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
    });
  });
});
