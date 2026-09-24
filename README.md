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
- **Feedback tab** — send feedback directly to the developer, view developer info, or report issues on GitHub
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

MIT — see [LICENSE](LICENSE). QR engine: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT).

---

Built by [Adil Abdullah Khan](https://github.com/adilabdullah15) · Part of the QRForge API family
