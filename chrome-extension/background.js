// ISA Secured PDF - Chrome Extension Background Service Worker (Manifest V3)
// Automatically intercepts PDF openings in Chrome and routes them to ISA Secured PDF

const ISA_WEB_URL = "https://isasecuredpdf.com/?editor=true";
const processingTabs = new Set();

function isPdfUrl(rawUrl) {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    // Don't intercept if already on our editor, extension, or google viewer
    if (parsed.hostname.includes("isasecuredpdf.com") || parsed.protocol === "chrome-extension:") {
      return false;
    }
    const path = parsed.pathname.toLowerCase();
    return path.endsWith(".pdf") || rawUrl.toLowerCase().includes(".pdf?");
  } catch (e) {
    return false;
  }
}

// 1. Right-click context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "isa-open-link",
    title: "Open & Redact in ISA Secured PDF",
    contexts: ["link"],
    targetUrlPatterns: ["*://*/*.pdf*", "*://*/*.PDF*"]
  });

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

// 2. Automatic Interception: Whenever Chrome navigates to any PDF (Web or local file://)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab.url;
  if (!url || processingTabs.has(tabId) || !isPdfUrl(url)) return;

  processingTabs.add(tabId);

  try {
    if (url.startsWith("file://")) {
      // Local file PDF opened in Chrome
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);
        const fileName = decodeURIComponent(url.split("/").pop() || "document.pdf");

        // Redirect tab to ISA Secured PDF Workspace
        await chrome.tabs.update(tabId, { url: ISA_WEB_URL });

        // Once the tab finishes loading the ISA workspace, inject the PDF payload
        const onLoaded = function(updatedTabId, info) {
          if (updatedTabId === tabId && info.status === "complete") {
            chrome.tabs.onUpdated.removeListener(onLoaded);
            chrome.scripting.executeScript({
              target: { tabId },
              func: (data) => {
                try {
                  localStorage.setItem("__isa_incoming_pdf__", JSON.stringify(data));
                  window.dispatchEvent(new CustomEvent("androidOpenPdf", { detail: data }));
                } catch (e) {
                  console.error("Failed to inject PDF payload:", e);
                }
              },
              args: [{ fileName, base64Data }]
            });
            setTimeout(() => processingTabs.delete(tabId), 1000);
          }
        };
        chrome.tabs.onUpdated.addListener(onLoaded);
      } catch (fileErr) {
        // If file access permission is not yet enabled, fallback to opening ISA editor
        console.warn("Could not read file URL (ensure 'Allow access to file URLs' is enabled in chrome://extensions):", fileErr);
        await chrome.tabs.update(tabId, { url: ISA_WEB_URL });
        setTimeout(() => processingTabs.delete(tabId), 1000);
      }
    } else {
      // Remote Web PDF URL (https://... or http://...)
      const targetUrl = `${ISA_WEB_URL}&pdfUrl=${encodeURIComponent(url)}`;
      await chrome.tabs.update(tabId, { url: targetUrl });
      setTimeout(() => processingTabs.delete(tabId), 1000);
    }
  } catch (err) {
    console.error("Failed to intercept PDF navigation:", err);
    processingTabs.delete(tabId);
  }
});
