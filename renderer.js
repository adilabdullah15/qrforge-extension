/* QRForge renderer v1.3.0 — pure QR drawing (canvas + SVG).
 *
 * No DOM dependencies except document.createElement("canvas"), so it can be
 * unit-tested headlessly. The popup (popup.js) loads this file after
 * vendor/qrcode.js and calls QRForge.renderCanvas / renderSvg.
 *
 * 3 QR designs (QR_DESIGNS / DESIGN_ORDER): Classic Squares, Snapchat Dots,
 * Rounded Blocks. The center logo is FIXED: white rounded badge + blue
 * QRForge logo, always as-is, on every design. The logo forces
 * error-correction "H" so every code stays easy to scan.
 */
(function () {
  "use strict";

  var QUIET = 4;          // quiet-zone modules around the modern designs
  var BADGE_RATIO = 0.24; // logo badge side as fraction of QR size

  var QR_DESIGNS = {
    squares: { name: "Classic" },
    dots:    { name: "Snapchat Dots" },
    rounded: { name: "Rounded" }
  };
  var DESIGN_ORDER = ["squares", "dots", "rounded"];

  // ---------------------------------------------------------------- QR matrix
  // vendor: qrcode-generator (kazuhikoarase, MIT). typeNumber 0 = auto version.
  function makeQr(text, levels) {
    var lastErr = null;
    for (var i = 0; i < levels.length; i++) {
      try {
        var qr = qrcode(0, levels[i]);
        qr.addData(text);
        qr.make();
        return qr;
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }

  function badgeSide(size) { return Math.round(size * BADGE_RATIO); }

  // ------------------------------------------------------------- canvas bits
  function rr(ctx, x, y, w, h, rad) { // rounded-rect path (no native roundRect needed)
    var r = Math.min(rad, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawModule(ctx, design, x, y, cell, fg) {
    var cx = x + cell / 2, cy = y + cell / 2;
    ctx.fillStyle = fg;
    if (design === "rounded") {
      rr(ctx, x + cell * 0.07, y + cell * 0.07, cell * 0.86, cell * 0.86, cell * 0.24);
      ctx.fill();
    } else { // "dots": small round pixels with breathing room (Snapchat style)
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.43, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function inFinder(r, c, n) {
    return (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
  }

  function drawEyes(ctx, n, q, cell, fg, bg) {
    var corners = [[0, 0], [0, n - 7], [n - 7, 0]];
    for (var i = 0; i < corners.length; i++) {
      var x = (q + corners[i][1]) * cell, y = (q + corners[i][0]) * cell;
      ctx.fillStyle = fg;
      rr(ctx, x, y, cell * 7, cell * 7, cell * 1.8); ctx.fill();
      ctx.fillStyle = bg;
      rr(ctx, x + cell, y + cell, cell * 5, cell * 5, cell * 1.2); ctx.fill();
      ctx.fillStyle = fg;
      rr(ctx, x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.9); ctx.fill();
    }
  }

  // Fixed center logo — white rounded badge + blue QRForge logo, as-is.
  function drawLogoCanvas(ctx, size, logoImg) {
    var s = badgeSide(size), cx = size / 2, cy = size / 2;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    rr(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.22);
    ctx.fill();
    if (logoImg) {
      var ls = s * 0.62;
      ctx.drawImage(logoImg, cx - ls / 2, cy - ls / 2, ls, ls);
    }
    ctx.restore();
  }

  function renderCanvas(o) {
    // o: { text, size, fg, bg, design, logoImg }
    var qr = makeQr(o.text, ["H"]); // logo always on -> high error correction
    var n = qr.getModuleCount();
    var canvas = document.createElement("canvas");
    canvas.width = o.size;
    canvas.height = o.size;
    var ctx = canvas.getContext("2d");
    var classic = o.design === "squares";
    var q = classic ? 0 : QUIET;
    var cell = o.size / (n + q * 2);

    ctx.fillStyle = o.bg;
    ctx.fillRect(0, 0, o.size, o.size);

    var r, c;
    if (classic) {
      // Original square modules, exactly as v1.2.0 (no quiet zone).
      ctx.fillStyle = o.fg;
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(Math.floor(c * cell), Math.floor(r * cell),
                         Math.ceil(cell), Math.ceil(cell));
          }
        }
      }
    } else {
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          if (!qr.isDark(r, c) || inFinder(r, c, n)) continue;
          drawModule(ctx, o.design, (q + c) * cell, (q + r) * cell, cell, o.fg);
        }
      }
      drawEyes(ctx, n, q, cell, o.fg, o.bg);
    }

    drawLogoCanvas(ctx, o.size, o.logoImg || null);
    return canvas;
  }

  // ------------------------------------------------------------------- SVG
  function f2(v) { return Math.round(v * 100) / 100; }

  function moduleSvg(design, x, y, cell, fg) {
    var cx = x + cell / 2, cy = y + cell / 2;
    if (design === "rounded") {
      var m = cell * 0.07, s = cell * 0.86;
      return '<rect x="' + f2(x + m) + '" y="' + f2(y + m) + '" width="' + f2(s) +
             '" height="' + f2(s) + '" rx="' + f2(cell * 0.24) + '" fill="' + fg + '"/>';
    }
    return '<circle cx="' + f2(cx) + '" cy="' + f2(cy) + '" r="' + f2(cell * 0.43) +
           '" fill="' + fg + '"/>';
  }

  function eyesSvg(n, q, cell, fg, bg) {
    var corners = [[0, 0], [0, n - 7], [n - 7, 0]];
    var out = "";
    for (var i = 0; i < corners.length; i++) {
      var x = (q + corners[i][1]) * cell, y = (q + corners[i][0]) * cell;
      out += '<rect x="' + f2(x) + '" y="' + f2(y) + '" width="' + f2(cell * 7) +
             '" height="' + f2(cell * 7) + '" rx="' + f2(cell * 1.8) + '" fill="' + fg + '"/>' +
             '<rect x="' + f2(x + cell) + '" y="' + f2(y + cell) + '" width="' + f2(cell * 5) +
             '" height="' + f2(cell * 5) + '" rx="' + f2(cell * 1.2) + '" fill="' + bg + '"/>' +
             '<rect x="' + f2(x + cell * 2) + '" y="' + f2(y + cell * 2) + '" width="' + f2(cell * 3) +
             '" height="' + f2(cell * 3) + '" rx="' + f2(cell * 0.9) + '" fill="' + fg + '"/>';
    }
    return out;
  }

  function logoSvg(size, logoDataUrl) {
    var s = badgeSide(size), cx = size / 2, cy = size / 2;
    var out = '<rect x="' + f2(cx - s / 2) + '" y="' + f2(cy - s / 2) + '" width="' + f2(s) +
              '" height="' + f2(s) + '" rx="' + f2(s * 0.22) + '" fill="#ffffff"/>';
    if (logoDataUrl) {
      var ls = s * 0.62;
      out += '<image href="' + logoDataUrl + '" xlink:href="' + logoDataUrl +
             '" x="' + f2(cx - ls / 2) + '" y="' + f2(cy - ls / 2) + '" width="' + f2(ls) +
             '" height="' + f2(ls) + '"/>';
    }
    return out;
  }

  function renderSvg(o) {
    // o: { text, size, fg, bg, design, logoDataUrl }
    var qr = makeQr(o.text, ["H"]);
    var n = qr.getModuleCount();
    var classic = o.design === "squares";
    var q = classic ? 0 : QUIET;
    var cell = o.size / (n + q * 2);
    var body = "";
    var r, c;

    if (classic) {
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          if (qr.isDark(r, c)) {
            body += '<rect x="' + f2(c * cell) + '" y="' + f2(r * cell) +
                    '" width="' + f2(cell) + '" height="' + f2(cell) + '"/>';
          }
        }
      }
      body = '<g fill="' + o.fg + '">' + body + "</g>";
    } else {
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          if (!qr.isDark(r, c) || inFinder(r, c, n)) continue;
          body += moduleSvg(o.design, (q + c) * cell, (q + r) * cell, cell, o.fg);
        }
      }
      body += eyesSvg(n, q, cell, o.fg, o.bg);
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
           'width="' + o.size + '" height="' + o.size + '" viewBox="0 0 ' + o.size + " " + o.size + '">' +
           '<rect width="' + o.size + '" height="' + o.size + '" fill="' + o.bg + '"/>' +
           body + logoSvg(o.size, o.logoDataUrl || null) + "</svg>";
  }

  // ------------------------------------------------------------------ export
  var root = typeof window !== "undefined" ? window : Function("return this")();
  root.QRForge = {
    QR_DESIGNS: QR_DESIGNS,
    DESIGN_ORDER: DESIGN_ORDER,
    LOGO_PATH: "icons/icon128.png",
    makeQr: makeQr,
    renderCanvas: renderCanvas,
    renderSvg: renderSvg
  };
})();
