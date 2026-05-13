function getStatusClass(status) {
  const map = {
    Delivered: "status-delivered",
    Processing: "status-processing",
    Shipped: "status-shipped",
    Cancelled: "status-cancelled",
  };
  return map[status] || "status-processing";
}

// ── INIT USER INFO ───────────────────────────
function initUserInfo() {
  const user = getCurrentUser();
  if (!user) {
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

// ── FETCH ORDERS FROM API ────────────────────
async function fetchOrders() {
  const res = await fetch("php/orders.php", { credentials: "include" });

  if (res.status === 401) {
    window.location.href = "auth.html";
    return [];
  }

  if (!res.ok) {
    console.error("Orders API error:", res.status);
    return [];
  }

  const data = await res.json();
  return data.orders || [];
}

// ── FETCH SINGLE ORDER FROM API ──────────────
async function fetchOrder(orderId) {
  const res = await fetch(`php/orders.php?id=${encodeURIComponent(orderId)}`, {
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = "auth.html";
    return null;
  }

  if (!res.ok) {
    console.error("Order detail API error:", res.status);
    return null;
  }

  const data = await res.json();
  return data.order || null;
}

// ── RENDER ORDER LIST ────────────────────────
async function renderOrderList() {
  const container = document.getElementById("orders-container");
  const emptyEl = document.getElementById("orders-empty");

  if (container) {
    container.style.display = "flex";
    container.innerHTML = `<p style="color:#8c6d57;padding:2rem 0;text-align:center;width:100%">Loading orders…</p>`;
  }

  const orders = await fetchOrders();

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

  container.querySelectorAll(".order-row").forEach((row) => {
    row.addEventListener("click", async () => {
      const orderId = row.dataset.orderId;
      // Try already-fetched list first; fall back to individual API call
      let order = orders.find((o) => o.id === orderId);
      if (!order) {
        order = await fetchOrder(orderId);
      }
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
  // order.tracking is now { steps: [...], tracking_number, estimated_delivery }
  // Keep backward compat: if it's still a plain array (mock data), wrap it.
  const trackingData = normaliseTracking(order.tracking);
  renderTrackingStepper(trackingData);

  // Items list
  renderOrderItems(order.items || []);

  // Payment method
  const paymentEl = document.getElementById("od-payment");
  if (paymentEl) paymentEl.textContent = order.payment || "—";

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

// ── Normalise tracking payload ───────────────
// API returns: { steps: [...], tracking_number, estimated_delivery }
// Old mock data / legacy: plain array of step objects
// Returns a unified object: { steps, tracking_number, estimated_delivery }
function normaliseTracking(raw) {
  if (!raw) {
    return {
      steps: buildFallbackSteps("pending"),
      tracking_number: null,
      estimated_delivery: null,
    };
  }
  if (Array.isArray(raw)) {
    // Legacy plain array — wrap it
    return { steps: raw, tracking_number: null, estimated_delivery: null };
  }
  if (raw.steps && Array.isArray(raw.steps)) {
    return raw;
  }
  // Unexpected shape — fall back
  return {
    steps: buildFallbackSteps("pending"),
    tracking_number: null,
    estimated_delivery: null,
  };
}

// ── Fallback stepper data (mock) used only when API is unavailable ────────────
function buildFallbackSteps(status) {
  const statusMap = {
    pending: 1,
    processing: 2,
    shipped: 3,
    delivered: 5,
    cancelled: 1,
  };
  const doneCount = statusMap[(status || "pending").toLowerCase()] ?? 1;
  const labels = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
  return labels.map((label, i) => ({
    label,
    date: "—",
    done: i + 1 <= doneCount,
    active: i + 1 === doneCount && doneCount !== 5,
  }));
}

// ── RENDER TRACKING STEPPER ──────────────────
function renderTrackingStepper(trackingData) {
  const stepper = document.getElementById("tracking-stepper");
  if (!stepper) return;

  const steps = trackingData.steps || [];
  const trackingNumber = trackingData.tracking_number;
  const estimatedDelivery = trackingData.estimated_delivery;

  // Determine the last done/active index
  let activeIdx = -1;
  steps.forEach((s, i) => {
    if (s.done || s.active) activeIdx = i;
  });

  const stepsHTML = steps
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

  // Tracking number + estimated delivery bar (shown only when data exists)
  let metaHTML = "";
  if (trackingNumber || estimatedDelivery) {
    const tnPart = trackingNumber
      ? `<span class="ts-meta-item"><span class="ts-meta-label">Tracking #</span><strong>${trackingNumber}</strong></span>`
      : "";
    const edPart = estimatedDelivery
      ? `<span class="ts-meta-item"><span class="ts-meta-label">Est. Delivery</span><strong>${estimatedDelivery}</strong></span>`
      : "";
    metaHTML = `<div class="ts-meta-bar">${tnPart}${edPart}</div>`;
  }

  stepper.innerHTML = metaHTML + stepsHTML;
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
// renderOrderList() is intentionally NOT called here.
// orders.html calls window.initOrdersPage() after checkAuthStatus() confirms
// a valid session, so the orders API request is never made unauthenticated.
window.initOrdersPage = function () {
  initUserInfo();
  renderOrderList();

  setActiveTab(tabOrders);
  setTimeout(() => setActiveTab(document.getElementById("tab-orders")), 300);
};
