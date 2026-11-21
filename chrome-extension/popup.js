const ISA_WEB_URL = "https://isasecuredpdf.com/?editor=true";

document.addEventListener("DOMContentLoaded", () => {
  const btnLaunch = document.getElementById("btnLaunchEditor");
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");

  // Quick Action Buttons
  const btnActionRedact = document.getElementById("btnActionRedact");
  const btnActionSign = document.getElementById("btnActionSign");
  const btnActionPaste = document.getElementById("btnActionPaste");
  const btnActionAirgap = document.getElementById("btnActionAirgap");

  btnLaunch.addEventListener("click", () => {
    chrome.tabs.create({ url: ISA_WEB_URL });
  });

  if (btnActionRedact) {
    btnActionRedact.addEventListener("click", () => {
      chrome.tabs.create({ url: `${ISA_WEB_URL}&tool=redact` });
    });
  }

  if (btnActionSign) {
    btnActionSign.addEventListener("click", () => {
      chrome.tabs.create({ url: `${ISA_WEB_URL}&tool=sign` });
    });
  }

  if (btnActionPaste) {
    btnActionPaste.addEventListener("click", () => {
      chrome.tabs.create({ url: `${ISA_WEB_URL}&tool=blank` });
    });
  }

  if (btnActionAirgap) {
    btnActionAirgap.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://isasecuredpdf.com/#security" });
    });
  }

  dropzone.addEventListener("click", () => {
    fileInput.click();
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  function handleSelectedFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a valid PDF file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
      const arrayBuffer = evt.target.result;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      const payload = {
        fileName: file.name,
        base64Data: base64Data
      };

      // Hand off to background service worker (persists after popup closes)
      chrome.runtime.sendMessage({
        action: "OPEN_DROPPED_PDF",
        payload: payload
      });

      // Close transient popup
      setTimeout(() => window.close(), 150);
    };

    reader.readAsArrayBuffer(file);
  }
});
