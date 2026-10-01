/* ===== Heritage Quest — script.js ===== */

/* ---------------------------------------------------------
   1. CONFIG — the ONLY part you need to edit
   --------------------------------------------------------- */
const CONFIG = {
  // Supabase > Project Settings > API
  SUPABASE_URL: "https://mojocqxdpdkzqkpfvetz.supabase.co",
  SUPABASE_KEY: "sb_publishable_uOnw8MPx2BV6yOcgk3qUvA_YXIQILo-", // public key only, NEVER the service_role / secret key

  // GitHub Releases link (replace after you upload the ZIP)
  DOWNLOAD_URL: "https://github.com/YOUR-USERNAME/YOUR-REPO/releases/latest",

  // Download info shown on the page
  VERSION: "v1.0",
  PLATFORM: "Windows 10 / 11 (64-bit)",
  FORMAT: "ZIP",
  FILE_SIZE: "about 500 MB",

  // Anti-spam (in milliseconds)
  RATING_COOLDOWN: 24 * 60 * 60 * 1000, // 1 rating per browser per day
  FEEDBACK_COOLDOWN: 60 * 1000,         // 1 feedback per minute
  LIST_LIMIT: 30                        // how many items to show
};

/* ---------------------------------------------------------
   2. SETUP
   --------------------------------------------------------- */
const $ = (id) => document.getElementById(id);
const configured = !CONFIG.SUPABASE_URL.includes("YOUR-PROJECT-ID") && !CONFIG.SUPABASE_KEY.includes("YOUR-");
const db = configured ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY) : null;

let selectedRating = 0;
let activeTab = "reviews";

/* ---------------------------------------------------------
   3. HELPERS
   --------------------------------------------------------- */
function toast(message, isError) {
  const t = $("toast");
  t.textContent = message;
  t.className = "toast show" + (isError ? " err" : "");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.className = "toast"), 3500);
}

function setStatus(id, message, type) {
  const el = $(id);
  el.textContent = message;
  el.className = "status " + (type || "");
}

function starText(n) {
  const full = Math.round(n);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function cleanName(value) {
  const name = (value || "").trim().replace(/\s+/g, " ");
  return name || null; // null is displayed as "Anonymous Player"
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function waitLeft(key, cooldown) {
  const last = Number(localStorage.getItem(key) || 0);
  return Math.max(0, last + cooldown - Date.now());
}

function friendlyWait(ms) {
  const mins = Math.ceil(ms / 60000);
  if (mins >= 60) return Math.ceil(mins / 60) + " hour(s)";
  if (mins > 1) return mins + " minutes";
  return Math.max(1, Math.ceil(ms / 1000)) + " seconds";
}

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text; // textContent = safe from HTML injection
  return el;
}

/* ---------------------------------------------------------
   4. DOWNLOAD SECTION + MOBILE MENU
   --------------------------------------------------------- */
function setupDownload() {
  $("dlVersion").textContent = CONFIG.VERSION;
  $("dlPlatform").textContent = CONFIG.PLATFORM;
  $("dlFormat").textContent = CONFIG.FORMAT;
  $("dlSize").textContent = CONFIG.FILE_SIZE;
  $("downloadBtn").href = CONFIG.DOWNLOAD_URL;
  if (CONFIG.DOWNLOAD_URL.includes("YOUR-USERNAME")) {
    $("dlNote").textContent = "Download link not set yet. Edit DOWNLOAD_URL in script.js.";
  }
}

function setupMenu() {
  const btn = $("menuBtn");
  const links = $("navLinks");
  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
}

/* ---------------------------------------------------------
   5. RATINGS
   --------------------------------------------------------- */
function setupStars() {
  const buttons = document.querySelectorAll("#starInput button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedRating = Number(btn.dataset.value);
      buttons.forEach((b) => {
        const on = Number(b.dataset.value) <= selectedRating;
        b.classList.toggle("on", on);
        b.setAttribute("aria-checked", String(Number(b.dataset.value) === selectedRating));
      });
    });
  });
}

async function loadRatingSummary() {
  if (!db) return;
  const { data, error } = await db.from("rating_summary").select("*").single();
  if (error || !data) return;
  const avg = Number(data.average) || 0;
  const total = Number(data.total) || 0;
  $("avgRating").textContent = avg.toFixed(1);
  $("avgStars").textContent = starText(avg);
  $("totalRatings").textContent = total + (total === 1 ? " rating" : " ratings");
}

async function submitRating(event) {
  event.preventDefault();
  if (!db) return setStatus("ratingStatus", "Supabase is not set up yet. Check script.js.", "err");
  if ($("rateHp").value) return; // honeypot: bots fill hidden fields

  if (selectedRating < 1 || selectedRating > 5) {
    return setStatus("ratingStatus", "Please choose 1 to 5 stars first.", "err");
  }
  const wait = waitLeft("hq_last_rating", CONFIG.RATING_COOLDOWN);
  if (wait > 0) {
    return setStatus("ratingStatus", "You already rated recently. Try again in " + friendlyWait(wait) + ".", "err");
  }

  const comment = $("rateComment").value.trim();
  const btn = event.target.querySelector("button[type=submit]");
  btn.disabled = true;
  setStatus("ratingStatus", "Sending...", "");

  const { error } = await db.from("ratings").insert({
    rating: selectedRating,
    nickname: cleanName($("rateNick").value),
    comment: comment || null
  });
  btn.disabled = false;

  if (error) {
    console.error(error);
    return setStatus("ratingStatus", "Could not save your rating. Please try again later.", "err");
  }
  localStorage.setItem("hq_last_rating", String(Date.now()));
  setStatus("ratingStatus", "Thank you for rating Heritage Quest!", "ok");
  toast("Rating submitted. Thank you!");
  event.target.reset();
  document.querySelectorAll("#starInput button").forEach((b) => b.classList.remove("on"));
  selectedRating = 0;
  loadRatingSummary();
  if (activeTab === "reviews") loadBoard();
}

/* ---------------------------------------------------------
   6. FEEDBACK
   --------------------------------------------------------- */
async function submitFeedback(event) {
  event.preventDefault();
  if (!db) return setStatus("feedbackStatus", "Supabase is not set up yet. Check script.js.", "err");
  if ($("fbHp").value) return;

  const type = $("fbType").value;
  const message = $("fbMessage").value.trim();

  if (!type) return setStatus("feedbackStatus", "Please select a feedback type.", "err");
  if (message.length < 3) return setStatus("feedbackStatus", "Please write a message (at least 3 characters).", "err");

  const wait = waitLeft("hq_last_feedback", CONFIG.FEEDBACK_COOLDOWN);
  if (wait > 0) {
    return setStatus("feedbackStatus", "Please wait " + friendlyWait(wait) + " before sending again.", "err");
  }

  const btn = event.target.querySelector("button[type=submit]");
  btn.disabled = true;
  setStatus("feedbackStatus", "Sending...", "");

  const { error } = await db.from("feedback").insert({
    nickname: cleanName($("fbNick").value),
    feedback_type: type,
    message: message
  });
  btn.disabled = false;

  if (error) {
    console.error(error);
    return setStatus("feedbackStatus", "Could not send your feedback. Please try again later.", "err");
  }
  localStorage.setItem("hq_last_feedback", String(Date.now()));
  setStatus("feedbackStatus", "Feedback sent. Salamat!", "ok");
  toast("Feedback sent. Salamat!");
  event.target.reset();
  if (activeTab === "feedback") loadBoard();
}

/* ---------------------------------------------------------
   7. DISPLAY (reads from Supabase)
   --------------------------------------------------------- */
async function loadBoard() {
  const list = $("boardList");
  if (!db) {
    list.replaceChildren(makeEl("div", "empty", "Connect Supabase in script.js to see player reviews and feedback."));
    return;
  }
  list.replaceChildren(makeEl("div", "empty", "Loading..."));

  let query;
  if (activeTab === "reviews") {
    query = db.from("ratings").select("rating, nickname, comment, created_at");
  } else {
    query = db.from("feedback").select("nickname, feedback_type, message, created_at");
    const filter = $("fbFilter").value;
    if (filter) query = query.eq("feedback_type", filter);
  }
  const { data, error } = await query.order("created_at", { ascending: false }).limit(CONFIG.LIST_LIMIT);

  if (error) {
    console.error(error);
    list.replaceChildren(makeEl("div", "empty", "Could not load entries right now."));
    return;
  }
  if (!data.length) {
    list.replaceChildren(makeEl("div", "empty", "Nothing here yet. Be the first to share!"));
    return;
  }

  const cards = data.map((row) => {
    const card = makeEl("article", "item");
    const head = makeEl("div", "item-head");
    head.append(makeEl("span", "item-name", row.nickname || "Anonymous Player"));
    if (activeTab === "reviews") {
      head.append(makeEl("span", "stars", starText(row.rating)));
    } else {
      head.append(makeEl("span", "badge" + (row.feedback_type === "Bug Report" ? " bug" : ""), row.feedback_type));
    }
    head.append(makeEl("span", "item-date", formatDate(row.created_at)));
    card.append(head);

    const text = activeTab === "reviews" ? row.comment : row.message;
    card.append(text ? makeEl("p", "", text) : makeEl("p", "none", "No written review."));
    return card;
  });
  list.replaceChildren(...cards);
}

function setupTabs() {
  const tabR = $("tabReviews");
  const tabF = $("tabFeedback");
  function switchTo(name) {
    activeTab = name;
    tabR.classList.toggle("active", name === "reviews");
    tabF.classList.toggle("active", name === "feedback");
    tabR.setAttribute("aria-selected", String(name === "reviews"));
    tabF.setAttribute("aria-selected", String(name === "feedback"));
    $("fbFilter").classList.toggle("hidden", name !== "feedback");
    loadBoard();
  }
  tabR.addEventListener("click", () => switchTo("reviews"));
  tabF.addEventListener("click", () => switchTo("feedback"));
  $("fbFilter").addEventListener("change", loadBoard);
}

/* ---------------------------------------------------------
   8. START
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  setupDownload();
  setupMenu();
  setupStars();
  setupTabs();
  $("ratingForm").addEventListener("submit", submitRating);
  $("feedbackForm").addEventListener("submit", submitFeedback);
  loadRatingSummary();
  loadBoard();
  if (!configured) console.warn("Heritage Quest: set SUPABASE_URL and SUPABASE_KEY in script.js");
});
