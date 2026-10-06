// QRForge popup logic — 100% client-side, no server needed.
// QR drawing lives in renderer.js (QRForge.renderCanvas / QRForge.renderSvg).
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
    inverted: { fg: "#ffffff", bg: "#111111" }
  };

  themeSel.addEventListener("change", () => {
    const t = THEMES[themeSel.value];
    if (t) { fgPick.value = t.fg; bgPick.value = t.bg; }
  });

  // ---- QR design options (3 thumbnails in a row) ----
  // The center logo stays as-is on every design; only the QR style changes.
  let designKey = "dots";
  const designRow = $("designRow");

  function setDesign(key) {
    designKey = key;
    designRow.querySelectorAll(".design-opt").forEach((el) => {
      const sel = el.dataset.key === key;
      el.classList.toggle("sel", sel);
      el.setAttribute("aria-checked", sel ? "true" : "false");
    });
  }

  QRForge.DESIGN_ORDER.forEach((key) => {
    const st = QRForge.QR_DESIGNS[key];
    const opt = document.createElement("button");
    opt.type = "button";
    opt.className = "design-opt";
    opt.dataset.key = key;
    opt.setAttribute("role", "radio");
    const img = document.createElement("img");
    img.src = "icons/designs/" + key + ".png";
    img.alt = "";
    const label = document.createElement("span");
    label.textContent = st.name;
    opt.appendChild(img);
    opt.appendChild(label);
    opt.addEventListener("click", () => setDesign(key));
    designRow.appendChild(opt);
  });
  setDesign(designKey);

  // ---- QRForge logo (icons/icon128.png), cached after first load ----
  let logoImgCache = null;
  let logoDataUrlCache = null;

  function loadLogoImg() {
    if (logoImgCache) return Promise.resolve(logoImgCache);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { logoImgCache = img; resolve(img); };
      img.onerror = () => resolve(null); // logo missing -> QR without logo
      img.src = QRForge.LOGO_PATH;
    });
  }

  function loadLogoDataUrl() {
    if (logoDataUrlCache) return Promise.resolve(logoDataUrlCache);
    return fetch(QRForge.LOGO_PATH)
      .then((r) => r.blob())
      .then((b) => new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => { logoDataUrlCache = fr.result; resolve(fr.result); };
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(b);
      }))
      .catch(() => null);
  }

  let lastCanvas = null;
  let lastRender = null; // options used for the last render (for SVG export)

  async function generate() {
    const text = input.value.trim();
    if (!text) {
      input.focus();
      input.placeholder = "Type something first…";
      return;
    }
    const size = parseInt(sizeSel.value, 10);
    const design = designKey;
    const fg = fgPick.value, bg = bgPick.value;

    preview.innerHTML = "<p style='color:#94a3b8'>Building…</p>";
    previewWrap.classList.remove("hidden");

    const logoImg = await loadLogoImg();

    try {
      lastRender = { text, size, fg, bg, design, logoImg };
      lastCanvas = QRForge.renderCanvas(lastRender);
    } catch (e) {
      preview.innerHTML =
        "<p style='color:#f87171'>Text too long — " + text.length +
        " characters. The center logo needs high error correction, which caps text at " +
        "~1,200 characters. Try shortening the text or splitting it into parts.</p>";
      lastCanvas = null;
      lastRender = null;
      return;
    }
    preview.innerHTML = "";
    preview.appendChild(lastCanvas);
    saveHistory(text);
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

  $("dlSvg").addEventListener("click", async () => {
    if (!lastRender) return;
    const logoDataUrl = await loadLogoDataUrl();
    const svg = QRForge.renderSvg({ ...lastRender, logoDataUrl });
    const blob = new Blob([svg], { type: "image/svg+xml" });
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
