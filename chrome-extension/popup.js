const ISA_WEB_URL = "https://isasecuredpdf.com/?editor=true";

document.addEventListener("DOMContentLoaded", () => {
  const btnLaunch = document.getElementById("btnLaunchEditor");
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");

  // Track which action triggered the file picker
  let pendingAction = null;

  // Quick Action Buttons
  const btnActionRedact = document.getElementById("btnActionRedact");
  const btnActionSign = document.getElementById("btnActionSign");
  const btnActionCompress = document.getElementById("btnActionCompress");
  const btnActionPassword = document.getElementById("btnActionPassword");
  const btnActionSplit = document.getElementById("btnActionSplit");
  const btnActionImage = document.getElementById("btnActionImage");

  // Launch generic workspace
  btnLaunch.addEventListener("click", () => {
    chrome.tabs.create({ url: ISA_WEB_URL });
  });

  // 1. Redact: Pick file from desktop first -> load and open with redaction ready
  if (btnActionRedact) {
    btnActionRedact.addEventListener("click", () => {
      pendingAction = { tool: 'redact' };
      fileInput.click();
    });
  }

  // 2. Sign: Pick file from desktop first -> load and open with digital sign ready
  if (btnActionSign) {
    btnActionSign.addEventListener("click", () => {
      pendingAction = { tool: 'sign' };
      fileInput.click();
    });
  }

  // 3. Compress: Pick file from desktop first -> load and open compress modal
  if (btnActionCompress) {
    btnActionCompress.addEventListener("click", () => {
      pendingAction = { modal: 'compress' };
      fileInput.click();
    });
  }

  // 4. Add Password: Pick file from desktop first -> load and open password modal
  if (btnActionPassword) {
    btnActionPassword.addEventListener("click", () => {
      pendingAction = { modal: 'password' };
      fileInput.click();
    });
  }

  // 5. Split & Arrange: Pick file from desktop first -> load and open grid organizer
  if (btnActionSplit) {
    btnActionSplit.addEventListener("click", () => {
      pendingAction = { modal: 'pages' };
      fileInput.click();
    });
  }

  // 6. Image to PDF: Open dedicated Image-to-PDF / Scanner workspace directly
  if (btnActionImage) {
    btnActionImage.addEventListener("click", () => {
      chrome.tabs.create({ url: `${ISA_WEB_URL}&modal=image` });
    });
  }

  // Dropzone click
  dropzone.addEventListener("click", () => {
    pendingAction = null;
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

    const dropzoneTitle = document.querySelector(".dropzone-title");
    if (dropzoneTitle) {
      dropzoneTitle.textContent = "Loading " + file.name + "...";
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
        base64Data: base64Data,
        action: pendingAction
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
