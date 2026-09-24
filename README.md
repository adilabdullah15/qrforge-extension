# QRForge — QR Code Generator (Chrome Extension)

Generate beautiful, customizable QR codes instantly — right from your browser.
100% client-side: no server, no tracking, works offline.

![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Instant QR generation** — paste any text or URL, get a QR code in one click
- **Customizable** — size (256/512/1024px), 4 built-in themes, custom foreground/background colors
- **Export** — download as **PNG** or **SVG**, or copy straight to clipboard
- **Right-click anywhere** — generate a QR for the current page, any link, or selected text via context menu
- **History** — your recent QR codes are saved locally and one click restores them
- **Private** — everything runs locally in the extension; nothing is uploaded anywhere

## 🚀 Install (developer mode — free)

1. Download or clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this folder
5. Click the QRForge icon in your toolbar 🎉

## 📦 Publish to the Chrome Web Store

1. Zip this folder (exclude `node_modules`, `package.json`, `package-lock.json`)
2. Pay the **one-time $5 developer registration fee** at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload the ZIP, fill in the store listing (title, description, screenshots), submit for review
4. First review from a new account typically takes **7–14 business days**

## 🗂️ Project structure

```
qrforge-extension/
├── manifest.json        # Manifest V3 config
├── popup.html           # Popup UI
├── popup.js             # QR generation + export logic
├── styles.css           # Dark-themed popup styles
├── background.js        # Service worker (context menus)
├── vendor/
│   └── qrcode.js        # qrcode-generator (MIT, kazuhikoarase)
└── icons/               # 16/32/48/128 px icons
```

## 💰 Monetization roadmap (freemium-ready)

The code is structured for a future Pro tier:

- Free: 20 history items, PNG/SVG export, all themes
- Pro (idea): unlimited history, batch QR generation, logo overlay, team templates

Billing would plug in via Stripe/Paddle or an extension SDK (ExtensionPay, crxpay) —
Google retired native Web Store payments, so third-party billing is required.

## 📄 License

MIT — see [LICENSE](LICENSE). QR engine: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT).

---

Built by [Adil Abdullah Khan](https://github.com/adilabdullah15) · Part of the QRForge API family
