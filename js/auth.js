// ============================================
// AUTH PAGE - Sign up, Login, Password validation
// ============================================

let active = "signup";

// Tab switching
function switchTab(tab) {
  if (tab === active) return;

  document.getElementById("tab-" + active).classList.remove("active");
  document.getElementById("tab-" + tab).classList.add("active");

  const outF = document.getElementById("form-" + active);
  const inF = document.getElementById("form-" + tab);
  outF.classList.add("slide-out");
  outF.classList.remove("active");
  setTimeout(() => {
    outF.classList.remove("slide-out");
    inF.classList.add("active");
  }, 340);

  document.getElementById("img-" + active).classList.remove("active");
  document.getElementById("img-" + tab).classList.add("active");

  active = tab;
  resetAll();
}

// Validation helpers
const FM = {
  name: { w: "fw-name", e: "er-name" },
  "su-email": { w: "fw-su-email", e: "er-su-email" },
  "su-pw": { w: "fw-su-pw", e: "er-su-pw" },
  "su-cpw": { w: "fw-su-cpw", e: "er-su-cpw" },
  "li-email": { w: "fw-li-email", e: "er-li-email" },
  "li-pw": { w: "fw-li-pw", e: "er-li-pw" },
};

function setErr(key, msg) {
  const m = FM[key];
  if (!m) return;
  document.getElementById(m.e).textContent = msg;
  document.getElementById(m.w).classList.add("is-error");
}

function clr(key) {
  const m = FM[key];
  if (!m) return;
  document.getElementById(m.e).textContent = "";
  document.getElementById(m.w).classList.remove("is-error");
}

function resetAll() {
  Object.keys(FM).forEach(clr);
  ["s1", "s2", "s3", "s4"].forEach(
    (id) => (document.getElementById(id).style.background = ""),
  );
  document.getElementById("s-lbl").textContent = "";
  ["req-len", "req-upper", "req-num", "req-sym"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("met");
  });
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Password strength
function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function updateStrength() {
  const pw = document.getElementById("su-pw").value;
  const s = pw ? strength(pw) : 0;
  const colors = ["", "#c0392b", "#e67e22", "#d4ac0d", "#3a6b4a"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const c = colors[s] || "var(--border)";
  for (let i = 1; i <= 4; i++) {
    document.getElementById("s" + i).style.background =
      i <= s ? c : "var(--border)";
  }
  document.getElementById("s-lbl").textContent = pw ? labels[s] : "";
}

function updateReqs() {
  const pw = document.getElementById("su-pw").value;
  setReq("req-len", pw.length >= 8);
  setReq("req-upper", /[A-Z]/.test(pw));
  setReq("req-num", /[0-9]/.test(pw));
  setReq("req-sym", /[^A-Za-z0-9]/.test(pw));
}

function setReq(id, met) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("met", met);
}

// Modal functions
function showModal() {
  document.getElementById("success-modal").classList.add("show");
}

function closeModal() {
  document.getElementById("success-modal").classList.remove("show");
}

function goToLogin() {
  closeModal();
  setTimeout(() => switchTab("login"), 200);
}

// Password reveal
function revealPw(inputId, btn) {
  const inp = document.getElementById(inputId);
  const isPassword = inp.type === "password";
  inp.type = isPassword ? "text" : "password";
  const svg = btn.querySelector("svg");
  if (isPassword) {
    svg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    svg.innerHTML = `<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

// Submit with loading
function submit(btnId) {
  const btn = document.getElementById(btnId);
  btn.classList.add("loading");
  btn.disabled = true;
  return new Promise((r) =>
    setTimeout(() => {
      btn.classList.remove("loading");
      btn.disabled = false;
      r();
    }, 1200),
  );
}

// Toast
let toastT;
function toast(msg, type = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast " + type;
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("show"), 3200);
}

// Signup handler
async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById("su-name").value.trim();
  const email = document.getElementById("su-email").value.trim();
  const pw = document.getElementById("su-pw").value;
  const cpw = document.getElementById("su-cpw").value;
  let ok = true;

  if (!name) {
    setErr("name", "Please enter your full name.");
    ok = false;
  } else if (name.length < 2) {
    setErr("name", "Name must be at least 2 characters.");
    ok = false;
  }

  if (!email) {
    setErr("su-email", "Please enter your email address.");
    ok = false;
  } else if (!validEmail(email)) {
    setErr("su-email", "Please enter a valid email address.");
    ok = false;
  }

  if (!pw) {
    setErr("su-pw", "Please create a password.");
    ok = false;
  } else if (pw.length < 8) {
    setErr("su-pw", "Password must be at least 8 characters.");
    ok = false;
  } else if (strength(pw) < 2) {
    setErr("su-pw", "Too weak — add uppercase letters, numbers or symbols.");
    ok = false;
  }

  if (!cpw) {
    setErr("su-cpw", "Please confirm your password.");
    ok = false;
  } else if (pw && cpw !== pw) {
    setErr("su-cpw", "Passwords do not match.");
    ok = false;
  }

  if (!ok) return;

  await submit("btn-signup");
  showModal();
}

// Login handler
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("li-email").value.trim();
  const pw = document.getElementById("li-pw").value;
  let ok = true;

  if (!email) {
    setErr("li-email", "Please enter your email address.");
    ok = false;
  } else if (!validEmail(email)) {
    setErr("li-email", "Please enter a valid email address.");
    ok = false;
  }

  if (!pw) {
    setErr("li-pw", "Please enter your password.");
    ok = false;
  } else if (pw.length < 6) {
    setErr("li-pw", "Password must be at least 6 characters.");
    ok = false;
  }

  if (!ok) return;

  await submit("btn-login");
  toast("Welcome back! Redirecting…", "ok");
  setTimeout(() => (window.location.href = "index.html"), 1600);
}

// Event listeners
document
  .getElementById("tab-signup")
  ?.addEventListener("click", () => switchTab("signup"));
document
  .getElementById("tab-login")
  ?.addEventListener("click", () => switchTab("login"));

document.querySelectorAll(".switch-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.switch));
});

document.querySelectorAll(".toggle-pw").forEach((btn) => {
  btn.addEventListener("click", () => revealPw(btn.dataset.target, btn));
});

document
  .getElementById("form-signup")
  ?.addEventListener("submit", handleSignup);
document.getElementById("form-login")?.addEventListener("submit", handleLogin);

document.getElementById("close-modal")?.addEventListener("click", closeModal);
document
  .getElementById("modal-login-btn")
  ?.addEventListener("click", goToLogin);

// Password validation on input
const suPw = document.getElementById("su-pw");
if (suPw) {
  suPw.addEventListener("input", () => {
    updateStrength();
    updateReqs();
    clr("su-pw");
  });
}

// Clear fields on input
["su-name", "su-email", "su-cpw", "li-email", "li-pw"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => clr(id));
});
