// ISA Secured PDF - Chrome Extension Background Service Worker (Manifest V3)

const ISA_WEB_URL = "https://isasecuredpdf.com/?editor=true";

chrome.runtime.onInstalled.addListener(() => {
  // Context menu for direct PDF links
  chrome.contextMenus.create({
    id: "isa-open-link",
    title: "Open & Redact in ISA Secured PDF",
    contexts: ["link"],
    targetUrlPatterns: ["*://*/*.pdf*", "*://*/*.PDF*"]
  });

  // Context menu on any web page
  chrome.contextMenus.create({
    id: "isa-open-editor",
    title: "Open ISA Secured PDF Editor",
    contexts: ["page", "action"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "isa-open-link" && info.linkUrl) {
    const targetUrl = `${ISA_WEB_URL}&pdfUrl=${encodeURIComponent(info.linkUrl)}`;
    chrome.tabs.create({ url: targetUrl });
  } else if (info.menuItemId === "isa-open-editor") {
    chrome.tabs.create({ url: ISA_WEB_URL });
  }
});
