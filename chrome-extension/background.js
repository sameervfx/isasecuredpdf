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

// Helper: Injects PDF payload into a given tab
function injectPdfPayloadIntoTab(targetTabId, payload) {
  const doInject = () => {
    chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      func: (data) => {
        try {
          localStorage.setItem("__isa_incoming_pdf__", JSON.stringify(data));
          window.dispatchEvent(new CustomEvent("androidOpenPdf", { detail: data }));
          if (typeof window.__ISA_OPEN_PAYLOAD__ === "function") {
            window.__ISA_OPEN_PAYLOAD__(data);
          }
        } catch (e) {
          console.error("Failed to inject PDF payload:", e);
        }
      },
      args: [payload]
    }).catch((err) => {
      // Tab might still be navigating
    });
  };

  // Immediate attempt
  doInject();
  // Safe retries to ensure React has fully mounted
  setTimeout(doInject, 300);
  setTimeout(doInject, 800);
}

// 2. Handle dropped/selected PDFs dispatched from the transient popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "OPEN_DROPPED_PDF" && message.payload) {
    const payload = message.payload;
    let targetUrl = ISA_WEB_URL;
    if (payload.action?.tool) {
      targetUrl += `&tool=${encodeURIComponent(payload.action.tool)}`;
    }
    if (payload.action?.modal) {
      targetUrl += `&modal=${encodeURIComponent(payload.action.modal)}`;
    }

    chrome.tabs.create({ url: targetUrl }, (newTab) => {
      if (!newTab || !newTab.id) return;
      const targetTabId = newTab.id;

      const onLoaded = function(tabId, changeInfo) {
        if (tabId === targetTabId && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(onLoaded);
          injectPdfPayloadIntoTab(targetTabId, payload);
        }
      };
      chrome.tabs.onUpdated.addListener(onLoaded);

      // Safe timeout fallbacks
      setTimeout(() => {
        injectPdfPayloadIntoTab(targetTabId, payload);
      }, 1200);
      setTimeout(() => {
        injectPdfPayloadIntoTab(targetTabId, payload);
      }, 2500);
    });
    sendResponse({ status: "opening" });
  }
  return true;
});

// 3. Automatic Interception: Whenever Chrome navigates to any PDF (Web or local file://)
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

        const onLoaded = function(updatedTabId, info) {
          if (updatedTabId === tabId && info.status === "complete") {
            chrome.tabs.onUpdated.removeListener(onLoaded);
            injectPdfPayloadIntoTab(tabId, { fileName, base64Data });
            setTimeout(() => processingTabs.delete(tabId), 1200);
          }
        };
        chrome.tabs.onUpdated.addListener(onLoaded);
      } catch (fileErr) {
        console.warn("Could not read local file URL directly (check 'Allow access to file URLs'):", fileErr);
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
