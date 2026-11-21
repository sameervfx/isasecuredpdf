const ISA_WEB_URL = "https://isasecuredpdf.com/?editor=true";

document.addEventListener("DOMContentLoaded", () => {
  const btnLaunch = document.getElementById("btnLaunchEditor");
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");

  // Quick Action Buttons
  const btnActionRedact = document.getElementById("btnActionRedact");
  const btnActionSign = document.getElementById("btnActionSign");
  const btnActionCompress = document.getElementById("btnActionCompress");
  const btnActionPassword = document.getElementById("btnActionPassword");
  const btnActionSplit = document.getElementById("btnActionSplit");
  const btnActionImage = document.getElementById("btnActionImage");

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

  if (btnActionCompress) {
    btnActionCompress.addEventListener("click", () => {
      chrome.tabs.create({ url: `${ISA_WEB_URL}&modal=compress` });
    });
  }

  if (btnActionPassword) {
    btnActionPassword.addEventListener("click", () => {
      chrome.tabs.create({ url: `${ISA_WEB_URL}&modal=password` });
    });
  }

  if (btnActionSplit) {
    btnActionSplit.addEventListener("click", () => {
      chrome.tabs.create({ url: `${ISA_WEB_URL}&modal=pages` });
    });
  }

  if (btnActionImage) {
    btnActionImage.addEventListener("click", () => {
      chrome.tabs.create({ url: `${ISA_WEB_URL}&modal=create` });
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
