// QRForge popup logic — 100% client-side, no server needed.
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const input = $("input");
  const sizeSel = $("size");
  const themeSel = $("theme");
  const fgPick = $("fg");
  const bgPick = $("bg");
  const previewWrap = $("previewWrap");
  const preview = $("preview");

  const THEMES = {
    classic:  { fg: "#111111", bg: "#ffffff" },
    inverted: { fg: "#ffffff", bg: "#111111" },
    blue:     { fg: "#0c4a6e", bg: "#e0f2fe" },
    green:    { fg: "#14532d", bg: "#dcfce7" }
  };

  themeSel.addEventListener("change", () => {
    const t = THEMES[themeSel.value];
    if (t) { fgPick.value = t.fg; bgPick.value = t.bg; }
  });

  function currentOptions() {
    return {
      text: input.value.trim(),
      size: parseInt(sizeSel.value, 10),
      fg: fgPick.value,
      bg: bgPick.value
    };
  }

  // Max ~2,900 chars at lowest error correction ('L').
  // We try 'M' first (better scan reliability), then fall back to 'L' for long texts.
  function makeQr(text) {
    let lastErr = null;
    for (const ec of ["M", "L"]) {
      try {
        // qrcode-generator (kazuhikoarase) — type 0 = auto-detect version
        const qr = qrcode(0, ec);
        qr.addData(text);
        qr.make();
        return qr;
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }

  function generate() {
    const { text, size, fg, bg } = currentOptions();
    if (!text) {
      input.focus();
      input.placeholder = "Type something first…";
      return;
    }
    preview.innerHTML = "";
    let qr;
    try {
      qr = makeQr(text);
    } catch (e) {
      preview.innerHTML =
        "<p style='color:#f87171'>Text too long — " + text.length +
        " characters. QR codes hold up to ~2,900 characters" +
        " (fewer for non-English text). Try shortening it or splitting it into parts.</p>";
      previewWrap.classList.remove("hidden");
      return;
    }
    const cell = Math.max(1, Math.floor(size / qr.getModuleCount()));
    const imgTag = qr.createImgTag({ cellSize: cell, margin: 4, fgcolor: fg, bgcolor: bg });
    preview.innerHTML = imgTag;
    // Normalize to the requested size for crisp downloads
    const img = preview.querySelector("img");
    if (img) { img.width = size; img.height = size; }
    previewWrap.classList.remove("hidden");
    saveHistory(text);
  }

  function renderSvg() {
    const { text, size, fg, bg } = currentOptions();
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const cell = size / n;
    let rects = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          rects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/><g fill="${fg}">${rects}</g></svg>`;
  }

  function download(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  $("generate").addEventListener("click", generate);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); }
  });

  // Live character counter
  input.addEventListener("input", () => {
    $("charCount").textContent = input.value.length;
  });

  $("dlPng").addEventListener("click", () => {
    const { size } = currentOptions();
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = preview.querySelector("img");
    if (!img) return;
    const tmp = new Image();
    tmp.onload = () => {
      ctx.drawImage(tmp, 0, 0, size, size);
      download(canvas.toDataURL("image/png"), "qrforge.png");
    };
    tmp.src = img.src;
  });

  $("dlSvg").addEventListener("click", () => {
    const blob = new Blob([renderSvg()], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    download(url, "qrforge.svg");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  $("copy").addEventListener("click", async () => {
    const { size } = currentOptions();
    const img = preview.querySelector("img");
    if (!img) return;
    const tmp = new Image();
    tmp.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      canvas.getContext("2d").drawImage(tmp, 0, 0, size, size);
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          $("copy").textContent = "✓ Copied";
          setTimeout(() => ($("copy").textContent = "⧉ Copy"), 1500);
        } catch (e) { /* clipboard denied */ }
      });
    };
    tmp.src = img.src;
  });

  // ---- history (chrome.storage.local) ----
  const HIST_KEY = "qrforge_history";
  const HIST_MAX = 20; // free tier keeps 20; gate higher limits behind "Pro" later

  function saveHistory(text) {
    chrome.storage.local.get([HIST_KEY], (res) => {
      let h = res[HIST_KEY] || [];
      h = [text, ...h.filter((t) => t !== text)].slice(0, HIST_MAX);
      chrome.storage.local.set({ [HIST_KEY]: h }, renderHistory);
    });
  }

  function renderHistory() {
    chrome.storage.local.get([HIST_KEY], (res) => {
      const h = res[HIST_KEY] || [];
      $("histCount").textContent = h.length;
      const ul = $("histList");
      ul.innerHTML = "";
      h.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        li.title = t;
        li.addEventListener("click", () => { input.value = t; generate(); });
        ul.appendChild(li);
      });
    });
  }

  // Prefill from context-menu / selection payloads
  chrome.storage.local.get(["qrforge_prefill"], (res) => {
    if (res.qrforge_prefill) {
      input.value = res.qrforge_prefill;
      chrome.storage.local.remove("qrforge_prefill");
      generate();
    }
  });

  renderHistory();
})();
