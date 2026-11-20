const ISA_WEB_URL = "https://isasecuredpdf.com/?editor=true";

document.addEventListener("DOMContentLoaded", () => {
  const btnLaunch = document.getElementById("btnLaunchEditor");
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");

  btnLaunch.addEventListener("click", () => {
    chrome.tabs.create({ url: ISA_WEB_URL });
  });

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

      // Open ISA Secured PDF and inject payload into localStorage
      chrome.tabs.create({ url: ISA_WEB_URL }, (tab) => {
        if (!tab.id) return;

        // Wait until tab completes loading to inject document
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);

            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (data) => {
                try {
                  localStorage.setItem("__isa_incoming_pdf__", JSON.stringify(data));
                  window.dispatchEvent(new CustomEvent("androidOpenPdf", { detail: data }));
                } catch (e) {
                  console.error("Failed to inject PDF into web editor:", e);
                }
              },
              args: [payload]
            });
          }
        });
      });
    };

    reader.readAsArrayBuffer(file);
  }
});
