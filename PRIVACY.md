# Privacy Policy — QRForge

**Last updated:** September 24, 2026
**Developer:** Adil Abdullah Khan

QRForge ("the extension") is a 100% client-side QR code generator. This policy explains what data the extension handles.

## Data the extension handles

- **QR content you enter** (text or URLs): processed entirely on your device to draw the QR code. It is never transmitted anywhere.
- **History**: your recent QR texts are stored locally on your device via `chrome.storage` (last 20 items). You can clear them at any time from the popup. This data never leaves your device.
- **Feedback (optional)**: if you use the Feedback tab, the name (optional) and message you type are sent to the developer's private Google Form / Google Sheet so your suggestion can be read. Nothing else is sent, and sending feedback is always your choice.

## What we don't do

- No accounts, no sign-in required.
- No advertising, no analytics, no tracking.
- We never sell, rent, or share your data with third parties.

## Permissions used and why

- `storage` — save your QR history locally on your device.
- `contextMenus` — add "Generate QR" items to the right-click menu for pages, links, and selected text.
- `activeTab` — generate a QR code for the page in the active tab.
- Host access to `https://docs.google.com/*` — used only to submit feedback you choose to send. No other network requests are made.

## Data retention & your control

- History lives only in your browser; uninstalling the extension deletes it.
- Feedback messages are kept in the developer's private sheet until deleted on request.

## Contact

Questions about this policy: adilabdullahkhan35@gmail.com
Source code: https://github.com/adilabdullah15/qrforge-extension
