# QRForge — QR Code Generator (Chrome Extension)

Generate beautiful, customizable QR codes instantly — right from your browser.
100% client-side: no server, no tracking, works offline.

![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)

## ✨ Features

- **Instant QR generation** — paste any text or URL, get a QR code in one click
- **Two looks** — *Classic* and *Inverted* (the original square style).
- **3 QR designs** — pick from three options in a row: Classic, Snapchat Dots, Rounded. The center logo stays as-is (white badge + QRForge logo) on every design, and high error correction keeps every code easy to scan.
- **Customizable** — size (128/256/512/1024px), custom foreground/background colors
- **Export** — download as **PNG** or **SVG**, or copy straight to clipboard
- **Right-click anywhere** — generate a QR for the current page, any link, or selected text via context menu
- **History** — your recent QR codes are saved locally and one click restores them
- **Feedback tab** — send feedback directly to the developer, view developer info, or report issues on GitHub
- **Private** — everything runs locally in the extension; nothing is uploaded anywhere

## 📦 Chrome Web Store

**QRForge is live on the Chrome Web Store** — install it here:

👉 https://chromewebstore.google.com/detail/cpmoldalghdnanicpclbcnkkccoinaaf

## 🚀 Install (developer mode — free)

1. Download or clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this folder
5. Click the QRForge icon in your toolbar 🎉

## 🗂️ Project structure

```
qrforge-extension/
├── manifest.json        # Manifest V3 config
├── popup.html           # Popup UI
├── popup.js             # Popup wiring (tabs, history, feedback, export)
├── renderer.js          # QR drawing engine: 3 module designs + fixed center logo (canvas + SVG)
├── styles.css           # Dark-themed popup styles
├── background.js        # Service worker (context menus)
├── vendor/
│   └── qrcode.js        # qrcode-generator (MIT, kazuhikoarase)
└── icons/               # 16/32/48/128 px icons, designs/ (3 QR design thumbnails)
```

## 💰 Monetization roadmap (freemium-ready)

The code is structured for a future Pro tier:

- Free: 20 history items, PNG/SVG export, all styles, logo badges
- Pro (idea): unlimited history, batch QR generation, custom logo upload, team templates

Billing would plug in via Stripe/Paddle or an extension SDK (ExtensionPay, crxpay) —
Google retired native Web Store payments, so third-party billing is required.

## 💬 Feedback setup (private, free — one time, ~2 min)

The Feedback tab sends messages straight to **your** private Google Sheet — no email app, no backend server. Only you can see the responses.

1. Go to [forms.google.com](https://forms.google.com) → **Blank form**, name it `QRForge Feedback`
2. Add two questions:
   - `Your name` — Short answer, **not** required
   - `Your message` — Paragraph, **required**
3. **Responses** tab → **Link to Sheets** → Create — this is your private inbox (only you have access)
4. Click **⋮** (top right) → **Get pre-filled link** → type `Test` in both fields → **Get link** → copy it
5. From that link, note:
   - the **form ID**: the part between `/d/e/` and `/viewform`
   - the **entry IDs**: `entry.123456789` (name) and `entry.987654321` (message)
6. Paste them into `popup.js` (`FB_FORM_ID`, `FB_ENTRY_NAME`, `FB_ENTRY_MSG`), reload the extension

✅ The feedback backend is already configured in this repo — the Send button posts straight to the private Sheet. Until configured, the Send button falls back to opening the user's email app.

## 📄 License

© 2026 Adil Abdullah Khan. All rights reserved.

This code is proprietary — you may **not** copy, modify, merge, publish, distribute, or reuse it in any form. If you want QRForge, install the official extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/cpmoldalghdnanicpclbcnkkccoinaaf).

QR engine: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) by Kazuhiko Arase — see `vendor/qrcode.js`.

---

Built by [Adil Abdullah Khan](https://github.com/adilabdullah15) · Part of the QRForge API family
