# Chrome Web Store Listing Package — ISA Secured PDF

This document contains all exact copy-paste fields required by the **Google Chrome Web Store Developer Dashboard** (`https://chrome.google.com/webstore/devconsole`).

---

## 1. Store Listing Details

* **Extension Package (.zip):**  
  Upload file: `ISASecuredPDF_Chrome_Extension.zip`

* **Extension Name (Title):**  
  `ISA Secured PDF - Offline Editor, Redact & Sign`

* **Summary (132 characters max):**  
  `100% private, client-side PDF Editor, Redactor & Scanner. Zero cloud uploads. Open, redact, sign, and annotate offline in Chrome.`

* **Primary Category:**  
  `Productivity`

* **Language:**  
  `English`

---

## 2. Detailed Description (Paste into Chrome Web Store "Description")

```text
ISA Secured PDF is the ultimate privacy-first, on-device PDF Suite for Chrome. 

Unlike traditional online PDF converters and editors that upload your sensitive confidential files, contracts, and financial statements to remote third-party cloud servers, ISA Secured PDF processes 100% of your PDFs locally inside your browser memory (RAM) using client-side WebAssembly. Zero bytes ever leave your device.

KEY FEATURES:

🛡️ 100% AIR-GAPPED PRIVACY
• Complete on-device processing with ZERO server data transmission.
• Works 100% offline — no internet connection required to view, edit, or redact.
• HIPAA, GDPR, and enterprise confidentiality compliant by design.

⬛ PERMANENT BLACKOUT REDACTION
• Permanently scrub sensitive information, SSNs, bank account numbers, names, and confidential data.
• True vector-level redaction — cannot be highlighted, unhidden, or copied.

✍️ DIGITAL SIGNATURES & DOCUSIGN ALTERNATIVE
• Draw, type, or upload your legal digital signatures.
• Apply signatures, company seals, and approval stamps directly onto documents without subscription lock-in.

⚡ SEAMLESS CHROME INTEGRATION
• Automatic PDF Interception: Automatically opens downloaded or web-hosted PDFs directly into your secure workspace.
• Right-Click Menu: Right-click any PDF link on the web to instantly "Open & Redact in ISA Secured PDF".
• 1-Click Dropzone: Click the toolbar shield icon to drop and open any PDF in seconds.

📑 FULL PDF WORKSPACE TOOLS
• Universal Text & Annotation Editor: Add text anywhere, annotate, highlight, draw freehand, and stamp.
• Document Splitting & Merging: Extract specific pages or combine multiple documents.
• Page Manager: Rotate, delete, reorder, and duplicate pages effortlessly.
• AES-256 Encryption: Add strong passwords to protect your confidential files.

PRICING & FAIR USAGE:
• Free Starter tier includes up to 6 documents every 3 months with complete feature access.
• Upgrade to ISA Pro anytime for unlimited document processing, advanced exports, and standalone desktop apps.

Experience the fastest, safest, and most secure PDF editor built for privacy-conscious professionals, legal entities, healthcare workers, and enterprises.
```

---

## 3. Privacy Practices Tab (Mandatory for Rapid Google Approval)

### Single Purpose Description:
> *"A 100% client-side productivity tool that allows users to view, edit, permanently redact, digitally sign, and annotate PDF documents locally in Chrome without server uploads."*

### Permission Justifications:
* **`contextMenus`:**  
  *"Used to provide a right-click 'Open & Redact in ISA Secured PDF' option on PDF web links."*
* **`tabs`:**  
  *"Used to open the user's selected PDF inside the local ISA Secured PDF workspace tab."*
* **`storage`:**  
  *"Used to store user preferences and offline configuration locally on the device."*
* **`host_permissions (<all_urls>)`:**  
  *"Used to allow opening and intercepting web-hosted PDF documents and local file PDFs requested by the user."*

### Data Usage Declarations:
* **Does this extension collect or transmit user data?** Select **NO**.
* Check the box: **"I certify that my extension does not collect or use user data outside its single purpose."**
*(Checking this qualifies ISA Secured PDF for Google's official green **Privacy Badge**).*

---

## 4. Visual Assets (Ready in this folder)
* **Store Icon (128x128):** `store_icon_128x128.png`
* **Screenshots (1280x800):**  
  1. `screenshot1_workspace_1280x800.png`  
  2. `screenshot3_tools_1280x800.png`  
* **Small Promotional Tile (440x280):** `promo_tile_440x280.png`
