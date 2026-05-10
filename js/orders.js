// ============================================
// ORDERS PAGE
// ============================================

// ── MOCK ORDER DATA ─────────────────────────
// Replace this with real backend data when ready.
// Orders are keyed by user email in localStorage
// so each user sees their own orders.
// When a real order is placed via checkout.js,
// saveOrder() below should be called.

const MOCK_ORDERS = [
  {
    id: "STY-876787",
    date: "May 02, 2026",
    dateISO: "2026-05-02",
    status: "Delivered",
    total: "₱460.00",
    totalNum: 460,
    items: [
      {
        name: "Beaded Ocean Necklace",
        price: "₱160.00",
        qty: 1,
        color: "#8c6d57",
        size: "—",
        img: "Assets/Images/Accessories/Beaded Ocean Necklace.png",
      },
      {
        name: "Gold Arm Cuff",
        price: "₱130.00",
        qty: 2,
        color: "#2c1f14",
        size: "—",
        img: "Assets/Images/Accessories/Gold Arm Cuff.png",
      },
    ],
    shipping: {
      address: "123 Ayala Avenue, Makati City\nMetro Manila, 1226\nPhilippines",
      cost: 0,
    },
    tracking: [
      { label: "Order Placed", date: "May 02, 2026", done: true },
      { label: "Processing", date: "May 02, 2026", done: true },
      { label: "Shipped", date: "May 03, 2026", done: true },
      { label: "Out for Delivery", date: "May 04, 2026", done: true },
      { label: "Delivered", date: "May 05, 2026", done: true },
    ],
  },
  {
    id: "STY-123455",
    date: "May 02, 2026",
    dateISO: "2026-05-02",
    status: "Processing",
    total: "₱650.00",
    totalNum: 650,
    items: [
      {
        name: "Tie-Strap Dress",
        price: "₱650.00",
        qty: 1,
        color: "#5c3d2e",
        size: "M",
        img: "Assets/Images/Dresses/Tie-Strap Dress.png",
      },
    ],
    shipping: {
      address:
        "456 BGC High Street, Taguig City\nMetro Manila, 1634\nPhilippines",
      cost: 0,
    },
    tracking: [
      { label: "Order Placed", date: "May 02, 2026", done: true },
      { label: "Processing", date: "May 02, 2026", done: true, active: true },
      { label: "Shipped", date: "—", done: false },
      { label: "Out for Delivery", date: "—", done: false },
      { label: "Delivered", date: "—", done: false },
    ],
  },
  {
    id: "STY-123498",
    date: "April 30, 2026",
    dateISO: "2026-04-30",
    status: "Delivered",
    total: "₱460.00",
    totalNum: 460,
    items: [
      {
        name: "Midnight Lounge Shorts",
        price: "₱350.00",
        qty: 1,
        color: "#3d2b1f",
        size: "S",
        img: "Assets/Images/Bottoms/Midnight Lounge Shorts.png",
      },
      {
        name: "Sand Tailored Shorts",
        price: "₱110.00",
        qty: 1,
        color: "#8c6d57",
        size: "M",
        img: "Assets/Images/Bottoms/Sand Tailored Shorts.png",
      },
    ],
    shipping: {
      address: "789 Ortigas Ave, Pasig City\nMetro Manila, 1605\nPhilippines",
      cost: 99,
    },
    tracking: [
      { label: "Order Placed", date: "April 30, 2026", done: true },
      { label: "Processing", date: "April 30, 2026", done: true },
      { label: "Shipped", date: "May 01, 2026", done: true },
      { label: "Out for Delivery", date: "May 02, 2026", done: true },
      { label: "Delivered", date: "May 03, 2026", done: true },
    ],
  },
];

// ── HELPERS ─────────────────────────────────
function getStatusClass(status) {
  const map = {
    Delivered: "status-delivered",
    Processing: "status-processing",
    Shipped: "status-shipped",
    Cancelled: "status-cancelled",
  };
  return map[status] || "status-processing";
}

function getOrders() {
  // Merge mock orders with any real orders saved from checkout
  try {
    const saved = JSON.parse(localStorage.getItem("styled_orders")) || [];
    // Prepend saved (newest first), then mock
    return [...saved, ...MOCK_ORDERS];
  } catch (e) {
    return MOCK_ORDERS;
  }
}

// Call this from checkout.js when an order is placed
function saveOrder(order) {
  try {
    const existing = JSON.parse(localStorage.getItem("styled_orders")) || [];
    existing.unshift(order);
    localStorage.setItem("styled_orders", JSON.stringify(existing));
  } catch (e) {}
}

// ── INIT USER INFO ───────────────────────────
function initUserInfo() {
  const user = getCurrentUser();
  if (!user) {
    // Not logged in — redirect to auth
    window.location.href = "auth.html";
    return;
  }

  const nameEl = document.getElementById("os-name");
  const avatarEl = document.getElementById("os-avatar");
  if (nameEl)
    nameEl.innerHTML = `<em>${user.name?.split(" ")[0] || "there"}</em>`;
  if (avatarEl) {
    avatarEl.textContent = user.name
      ? user.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";
  }
}

// ── RENDER ORDER LIST ────────────────────────
function renderOrderList() {
  const orders = getOrders();
  const container = document.getElementById("orders-container");
  const emptyEl = document.getElementById("orders-empty");
  const signoutBtn = document.getElementById("signout-btn-list");

  if (!orders || orders.length === 0) {
    container.style.display = "none";
    emptyEl.style.display = "flex";
    return;
  }

  container.style.display = "flex";
  emptyEl.style.display = "none";

  container.innerHTML = orders
    .map((order) => {
      const firstItem = order.items?.[0];
      const thumbSrc = firstItem?.img || "";
      const itemCount = order.items?.length || 1;
      const statusClass = getStatusClass(order.status);

      const thumbHTML = thumbSrc
        ? `<img class="order-thumb" src="${thumbSrc}" alt="${firstItem?.name || ""}" onerror="this.style.display='none'" />`
        : `<div class="order-thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></div>`;

      return `
      <div class="order-row" data-order-id="${order.id}">
        ${thumbHTML}
        <div class="order-info">
          <p class="order-num">${order.id}</p>
          <p class="order-meta">${order.date} &bull; ${itemCount} item${itemCount !== 1 ? "s" : ""}</p>
        </div>
        <p class="order-price">${order.total}</p>
        <span class="order-status ${statusClass}">${order.status}</span>
        <div class="order-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    `;
    })
    .join("");

  // Click handlers
  container.querySelectorAll(".order-row").forEach((row) => {
    row.addEventListener("click", () => {
      const orderId = row.dataset.orderId;
      const order = orders.find((o) => o.id === orderId);
      if (order) openOrderDetail(order);
    });
  });
}

// ── RENDER ORDER DETAIL ──────────────────────
function openOrderDetail(order) {
  document.getElementById("view-list").style.display = "none";
  document.getElementById("view-detail").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Header
  document.getElementById("od-num").textContent = order.id;
  const statusBadge = document.getElementById("od-status-badge");
  statusBadge.textContent = order.status;
  statusBadge.className = `od-status-badge ${getStatusClass(order.status)}`;

  // Meta row
  document.getElementById("od-date").textContent = order.date;
  const itemCount = order.items?.length || 1;
  document.getElementById("od-items-count").textContent =
    `${itemCount} item${itemCount !== 1 ? "s" : ""}`;
  document.getElementById("od-total").textContent = order.total;

  // Tracking stepper
  renderTrackingStepper(order.tracking || []);

  // Items list
  renderOrderItems(order.items || []);

  // Address
  const addressEl = document.getElementById("od-address");
  addressEl.innerHTML = (order.shipping?.address || "—").replace(/\n/g, "<br>");

  // Totals
  const subtotal = order.totalNum - (order.shipping?.cost || 0);
  const shipping = order.shipping?.cost || 0;
  document.getElementById("od-subtotal").textContent =
    "₱" + subtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  document.getElementById("od-shipping").textContent =
    shipping === 0 ? "FREE" : "₱" + shipping.toFixed(2);
  document.getElementById("od-grand").textContent = order.total;
}

function renderTrackingStepper(steps) {
  const stepper = document.getElementById("tracking-stepper");
  if (!stepper) return;

  // Find the active step index (last done, or explicitly active)
  let activeIdx = -1;
  steps.forEach((s, i) => {
    if (s.done || s.active) activeIdx = i;
  });

  stepper.innerHTML = steps
    .map((step, i) => {
      const isDone = i < activeIdx;
      const isActive = i === activeIdx;
      const cls = isDone
        ? "ts-step done"
        : isActive
          ? "ts-step active"
          : "ts-step";

      return `
      <div class="${cls}">
        <div class="ts-dot">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p class="ts-label">${step.label}</p>
        <p class="ts-date">${step.date !== "—" ? step.date : ""}</p>
      </div>
    `;
    })
    .join("");
}

function renderOrderItems(items) {
  const list = document.getElementById("od-items-list");
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
    <div class="od-item-row">
      <img class="od-item-img" src="${item.img || ""}" alt="${item.name}" onerror="this.style.opacity='0'" />
      <div class="od-item-info">
        <p class="od-item-name">${item.name}</p>
        <div class="od-item-meta">
          ${item.color ? `<span><span class="od-item-swatch" style="background:${item.color}"></span></span>` : ""}
          ${item.size && item.size !== "—" ? `<span>Size: ${item.size}</span>` : ""}
          <span>Qty: ${item.qty || 1}</span>
        </div>
      </div>
      <p class="od-item-price">${item.price}</p>
    </div>
  `,
    )
    .join("");
}

// ── BACK BUTTON ──────────────────────────────
document.getElementById("back-btn")?.addEventListener("click", () => {
  document.getElementById("view-detail").style.display = "none";
  document.getElementById("view-list").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── SIGN OUT ─────────────────────────────────
function handleSignOut() {
  localStorage.removeItem("styled_user");
  window.location.href = "auth.html";
}

document.getElementById("os-signout")?.addEventListener("click", handleSignOut);
document
  .getElementById("signout-btn-list")
  ?.addEventListener("click", handleSignOut);

// ── SIDEBAR TAB ACTIVE STATES ────────────────
const tabOrders = document.getElementById("tab-orders");
const tabWishlist = document.getElementById("tab-wishlist");

function setActiveTab(activeEl) {
  // Use inline styles — beats CSS classes, attributes, and external stylesheets
  [tabOrders, tabWishlist].forEach((el) => {
    if (!el) return;
    el.style.background = "";
    el.style.borderLeft = "3px solid transparent";
    el.style.color = "";
    el.style.fontWeight = "";
  });
  if (!activeEl) return;
  activeEl.style.background = "#ffffff";
  activeEl.style.borderLeft = "3px solid #2c1f14";
  activeEl.style.color = "#1e1510";
  activeEl.style.fontWeight = "500";
}

tabOrders?.addEventListener("click", (e) => {
  e.preventDefault();
  setActiveTab(tabOrders);
  document.getElementById("view-list").style.display = "block";
  document.getElementById("view-detail").style.display = "none";
});

tabWishlist?.addEventListener("click", (e) => {
  e.preventDefault();
  setActiveTab(tabWishlist);
  openWishlistPanel();
});

// ── INIT ─────────────────────────────────────
initUserInfo();
renderOrderList();

// Set My Orders active using inline styles — runs immediately and after DOM ready
setActiveTab(tabOrders);
document.addEventListener("DOMContentLoaded", () => setActiveTab(document.getElementById("tab-orders")));
setTimeout(() => setActiveTab(document.getElementById("tab-orders")), 300);