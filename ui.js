/* ===== Heritage Quest — ui.js =====
   Dark/light toggle + scroll animation + Interactive Canvas + Ultra-Smooth Inertia Scroll.
   Separate from script.js, so the Supabase code is untouched. */
(function () {
  "use strict";

  var root = document.documentElement;
  var KEY = "hq_theme";
  var COLORS = { dark: "#090c11", light: "#f7f4ed" };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lightQuery = window.matchMedia("(prefers-color-scheme: light)");
  var animTimer;

  /* ---------------- THEME ---------------- */
  function saved() {
    try {
      var v = localStorage.getItem(KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) { return null; }
  }

  var btn = document.createElement("button");
  btn.type = "button";
  btn.id = "themeBtn";
  btn.className = "theme-btn";
  btn.innerHTML =
    '<svg class="i-sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>' +
    '<svg class="i-moon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  var menu = document.getElementById("menuBtn");
  var links = document.getElementById("navLinks");
  var mobileQuery = window.matchMedia("(max-width: 960px)");
  function place() {
    if (mobileQuery.matches) {
      if (menu && menu.parentNode) menu.parentNode.insertBefore(btn, menu);
    } else if (links) {
      var play = links.querySelector(".nav-play");
      links.insertBefore(btn, play || null);
    }
  }
  place();
  if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", place);
  else if (mobileQuery.addListener) mobileQuery.addListener(place);

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    var meta = document.getElementById("themeColor");
    if (meta) meta.setAttribute("content", COLORS[theme]);
    var next = theme === "dark" ? "light" : "dark";
    btn.setAttribute("aria-label", "Switch to " + next + " mode");
    btn.setAttribute("title", "Switch to " + next + " mode");
  }

  apply(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    if (!reduceMotion) {
      root.classList.add("theme-anim");
      clearTimeout(animTimer);
      animTimer = setTimeout(function () { root.classList.remove("theme-anim"); }, 450);
    }
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  });

  function onSystemChange() {
    if (!saved()) apply(lightQuery.matches ? "light" : "dark");
  }
  if (lightQuery.addEventListener) lightQuery.addEventListener("change", onSystemChange);
  else if (lightQuery.addListener) lightQuery.addListener(onSystemChange);

  /* ---------------- SCROLL REVEAL ANIMATION ---------------- */
  function mark(selector, step, extra) {
    document.querySelectorAll(selector).forEach(function (el, i) {
      el.classList.add("reveal");
      if (extra) el.classList.add(extra);
      el.style.setProperty("--d", (Math.min(i, 6) * step).toFixed(2) + "s");
    });
  }

  mark(".hero-text > *", 0.09);
  mark(".hero-shot", 0, "reveal-right");
  mark(".section > h2, .section > .sub, .credits-lead, .credits h3", 0);
  mark("#about .two-col > *", 0.1);
  mark("#features .card", 0.08);
  mark(".download-box", 0);
  mark(".forms > *", 0.1);
  mark(".board", 0);
  mark(".person.adviser", 0);
  mark(".team-grid .person", 0.08);
  mark(".craft-box", 0.1);
  mark(".footer", 0);

  var items = document.querySelectorAll(".reveal");

  if (!reduceMotion && ("IntersectionObserver" in window)) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add("in");
        setTimeout(function () { el.classList.remove("reveal", "reveal-right", "in"); }, 1600);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.remove("reveal"); });
  }

  /* ---------------- ANIMATED CANVAS BACKGROUND ENGINE ---------------- */
  var bgCanvas = document.createElement("canvas");
  bgCanvas.id = "bg-canvas";
  bgCanvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;";
  document.body.prepend(bgCanvas);

  var ctx = bgCanvas.getContext("2d");
  var w, h;
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function resize() {
    w = bgCanvas.width = window.innerWidth;
    h = bgCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  var particles = [];
  for (var p = 0; p < 40; p++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.4 - 0.1
    });
  }

  var tick = 0;
  function render() {
    tick += 0.03;
    ctx.clearRect(0, 0, w, h);

    var isDark = root.getAttribute("data-theme") !== "light";

    var sky = ctx.createLinearGradient(0, 0, 0, h);
    if (isDark) {
      sky.addColorStop(0, "#080c11");
      sky.addColorStop(0.5, "#101622");
      sky.addColorStop(1, "#182232");
    } else {
      sky.addColorStop(0, "#f7f4ed");
      sky.addColorStop(0.5, "#eae3d2");
      sky.addColorStop(1, "#dcd2bc");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = isDark ? "#0d141f" : "#b5a890";
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.7);
    ctx.lineTo(w * 0.35, h * 0.32);
    ctx.lineTo(w * 0.68, h * 0.7);
    ctx.closePath();
    ctx.fill();

    var lakeY = h * 0.65;
    ctx.fillStyle = isDark ? "#0a0f18" : "#8e8068";
    ctx.fillRect(0, lakeY, w, h - lakeY);

    ctx.strokeStyle = isDark ? "#172335" : "#beaf97";
    ctx.lineWidth = 2;
    for (var i = 0; i < 10; i++) {
      var ry = lakeY + i * 28 + Math.sin(tick + i) * 4;
      ctx.beginPath();
      ctx.moveTo(0, ry);
      ctx.lineTo(w, ry);
      ctx.stroke();
    }

    ctx.fillStyle = isDark ? "#06090e" : "#5a4d3a";
    ctx.fillRect(w * 0.12, lakeY - 35, 55, 30);
    ctx.fillRect(w * 0.14, lakeY, 5, 35);
    ctx.fillRect(w * 0.19, lakeY, 5, 35);

    ctx.fillRect(w * 0.78, lakeY - 45, 75, 40);
    ctx.fillRect(w * 0.81, lakeY, 6, 45);
    ctx.fillRect(w * 0.86, lakeY, 6, 45);

    ctx.fillStyle = "#f5a30a";
    particles.forEach(function (pt) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      if (pt.y < 0) pt.y = h;
      if (pt.x < 0) pt.x = w;
      if (pt.x > w) pt.x = 0;

      ctx.globalAlpha = Math.sin(tick + pt.x) * 0.5 + 0.5;
      ctx.fillRect(pt.x, pt.y, pt.r, pt.r);
    });
    ctx.globalAlpha = 1.0;

    if (isDark) {
      var torch = ctx.createRadialGradient(
        mouse.x, mouse.y, 10,
        mouse.x, mouse.y, 200
      );
      torch.addColorStop(0, "rgba(245, 163, 10, 0.18)");
      torch.addColorStop(0.5, "rgba(245, 163, 10, 0.04)");
      torch.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = torch;
      ctx.fillRect(0, 0, w, h);
    }

    requestAnimationFrame(render);
  }
  render();

  /* ---------------- ULTRA-SMOOTH INERTIA SCROLL ENGINE ---------------- */
  var currentY = window.scrollY;
  var targetY = window.scrollY;
  var ease = 0.085;
  var isScrolling = false;

  function smoothScrollLoop() {
    if (!isScrolling) return;

    var diff = targetY - currentY;
    if (Math.abs(diff) < 0.1) {
      currentY = targetY;
      window.scrollTo(0, currentY);
      isScrolling = false;
      return;
    }

    currentY += diff * ease;
    window.scrollTo(0, currentY);
    requestAnimationFrame(smoothScrollLoop);
  }

  window.addEventListener("wheel", function (e) {
    if (e.ctrlKey) return;
    e.preventDefault();

    targetY += e.deltaY * 0.95;
    targetY = Math.max(0, Math.min(targetY, document.documentElement.scrollHeight - window.innerHeight));

    if (!isScrolling) {
      isScrolling = true;
      requestAnimationFrame(smoothScrollLoop);
    }
  }, { passive: false });

  window.addEventListener("scroll", function () {
    if (!isScrolling) {
      currentY = window.scrollY;
      targetY = window.scrollY;
    }
  });
})();