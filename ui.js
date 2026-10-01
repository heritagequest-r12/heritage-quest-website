/* ===== Heritage Quest — ui.js =====
   Dark/light toggle + scroll animation.
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

  // Desktop: toggle sits in the nav links, just before "Play Now".
  // Mobile: toggle sits in the top bar, next to the menu button.
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

  // If the visitor never picked a theme, follow their device setting live.
  function onSystemChange() {
    if (!saved()) apply(lightQuery.matches ? "light" : "dark");
  }
  if (lightQuery.addEventListener) lightQuery.addEventListener("change", onSystemChange);
  else if (lightQuery.addListener) lightQuery.addListener(onSystemChange);

  /* ---------------- SCROLL ANIMATION ---------------- */
  // mark(selector, step, extraClass): adds .reveal, staggers by `step` seconds
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

  // Reduced motion or very old browser: just show everything.
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.remove("reveal"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      el.classList.add("in");
      // After the animation, drop the helper classes so normal hover effects work again.
      setTimeout(function () { el.classList.remove("reveal", "reveal-right", "in"); }, 1600);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  items.forEach(function (el) { io.observe(el); });
})();