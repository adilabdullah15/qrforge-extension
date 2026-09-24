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

  // Draw QR modules onto a canvas at the exact requested size, with chosen colors.
  // (We draw ourselves instead of using the lib's createImgTag, which only
  // takes positional args and has no color support.)
  function drawQr(qr, size, fg, bg) {
    const n = qr.getModuleCount();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const cell = size / n;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fg;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(Math.floor(c * cell), Math.floor(r * cell), Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
    return canvas;
  }

  let lastCanvas = null;

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
    lastCanvas = drawQr(qr, size, fg, bg);
    preview.innerHTML = "";
    preview.appendChild(lastCanvas);
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

  // ---- tabs ----
  const tabBtns = { generate: $("tabBtnGenerate"), feedback: $("tabBtnFeedback") };
  const tabPanes = { generate: $("tabGenerate"), feedback: $("tabFeedback") };
  function switchTab(which) {
    Object.keys(tabBtns).forEach((k) => {
      tabBtns[k].classList.toggle("active", k === which);
      tabPanes[k].classList.toggle("active", k === which);
    });
  }
  tabBtns.generate.addEventListener("click", () => switchTab("generate"));
  tabBtns.feedback.addEventListener("click", () => switchTab("feedback"));

  // ---- feedback backend (Google Form — free & private: only you see responses) ----
  // Setup (one time, ~2 min): create a Google Form with "Your name" + "Your message",
  // link it to Sheets, then get a pre-filled link and paste the IDs below.
  // See README "Feedback setup" for steps.
  const FB_FORM_ID = "1FAIpQLSfsbKuhDHG36ZyEU_oE3Rz5k8QOx1m3p6nfMNFZbl-HOgDaHg"; // "QRForge Feedback" form (private: only owner sees responses)
  const FB_ENTRY_NAME = "entry.783896294"; // "Your name" question (short answer, optional)
  const FB_ENTRY_MSG = "entry.1723422302"; // "Your message" question (paragraph, required)
  const DEV_EMAIL = "adilabdullahkhan35@gmail.com";
  const FB_CONFIGURED = FB_FORM_ID && FB_ENTRY_NAME && FB_ENTRY_MSG;

  function showFbStatus(msg, ok) {
    const el = $("fbStatus");
    el.textContent = msg;
    el.className = "fbstatus " + (ok ? "ok" : "err");
    el.style.display = "block";
    clearTimeout(showFbStatus._t);
    showFbStatus._t = setTimeout(() => { el.style.display = "none"; }, 5000);
  }

  $("fbSend").addEventListener("click", async () => {
    const name = $("fbName").value.trim();
    const msg = $("fbMsg").value.trim();
    if (!msg) { $("fbMsg").focus(); return; }

    // Fallback while the form backend isn't configured yet: open email app.
    if (!FB_CONFIGURED) {
      const subject = encodeURIComponent("QRForge Feedback" + (name ? " from " + name : ""));
      const body = encodeURIComponent((name ? "Name: " + name + "\n\n" : "") + msg + "\n\n— sent from QRForge");
      chrome.tabs.create({ url: `mailto:${DEV_EMAIL}?subject=${subject}&body=${body}` });
      return;
    }

    $("fbSend").disabled = true;
    $("fbSend").textContent = "Sending…";
    try {
      const params = new URLSearchParams();
      params.append(FB_ENTRY_NAME, name || "Anonymous");
      params.append(FB_ENTRY_MSG, msg);
      await fetch(`https://docs.google.com/forms/d/e/${FB_FORM_ID}/formResponse`, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      $("fbMsg").value = "";
      $("fbName").value = "";
      showFbStatus("✓ Thank you! Your feedback was received.", true);
    } catch (e) {
      showFbStatus("Couldn't send. Check your connection and try again.", false);
    } finally {
      $("fbSend").disabled = false;
      $("fbSend").textContent = "Send Feedback ✉️";
    }
  });
  $("fbIssue").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://github.com/adilabdullah15/qrforge-extension/issues" });
  });

  $("dlPng").addEventListener("click", () => {
    if (!lastCanvas) return;
    download(lastCanvas.toDataURL("image/png"), "qrforge.png");
  });

  $("dlSvg").addEventListener("click", () => {
    const blob = new Blob([renderSvg()], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    download(url, "qrforge.svg");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  $("copy").addEventListener("click", () => {
    if (!lastCanvas) return;
    lastCanvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        $("copy").textContent = "✓ Copied";
        setTimeout(() => ($("copy").textContent = "⧉ Copy"), 1500);
      } catch (e) { /* clipboard denied */ }
    });
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
