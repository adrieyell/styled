function getStatusClass(status) {
  const map = {
    Delivered: "status-delivered",
    Processing: "status-processing",
    Shipped: "status-shipped",
    Cancelled: "status-cancelled",
    Pending: "status-pending",
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
  const avatarEl = document.getElementById("os-avatar"); // ← fixed
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

// ── FETCH ORDERS (list) ─────────────────────
async function fetchOrders() {
  try {
    const res = await fetch("php/orders.php", { credentials: "include" });
    if (res.status === 401) {
      window.location.href = "auth.html";
      return [];
    }
    const data = await res.json();
    return data.orders || [];
  } catch (err) {
    console.error("fetchOrders error:", err);
    return [];
  }
}

// ── FETCH SINGLE ORDER (full detail) ────────
async function fetchOrder(orderId) {
  try {
    const res = await fetch(
      `php/orders.php?id=${encodeURIComponent(orderId)}`,
      { credentials: "include" },
    );
    if (res.status === 401) {
      window.location.href = "auth.html";
      return null;
    }
    const data = await res.json();
    return data.order || null;
  } catch (err) {
    console.error("fetchOrder error:", err);
    return null;
  }
}

// ── RENDER ORDER LIST ───────────────────────
async function renderOrderList() {
  const container = document.getElementById("orders-container");
  const emptyEl = document.getElementById("orders-empty");
  if (container) {
    container.style.display = "flex";
    container.innerHTML = `<p style="color:#8c6d57;padding:2rem 0;text-align:center;width:100%">Loading orders…</p>`;
  }
  const orders = await fetchOrders();
  if (!orders || orders.length === 0) {
    if (container) container.style.display = "none";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }
  if (container) container.style.display = "flex";
  if (emptyEl) emptyEl.style.display = "none";

  container.innerHTML = orders
    .map((order) => {
      const firstItem = order.items?.[0];
      const thumbSrc = firstItem?.img || "";
      const itemCount = order.items?.length || 1;
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
        <span class="order-status ${getStatusClass(order.status)}">${order.status}</span>
        <div class="order-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    `;
    })
    .join("");

  // 🔧 FIX: Always fetch full order details – never use the list object
  document.querySelectorAll(".order-row").forEach((row) => {
    row.addEventListener("click", async () => {
      const orderId = row.dataset.orderId;
      // Always fetch the full order from the server
      const fullOrder = await fetchOrder(orderId);
      if (fullOrder) {
        openOrderDetail(fullOrder);
      } else {
        console.error("Failed to load order details for", orderId);
      }
    });
  });
}
function buildTrackingFromStatus(status, orderDate) {
  const statusMap = {
    Pending: 1,
    Processing: 2,
    Shipped: 3,
    "Out for Delivery": 4,
    Delivered: 5,
    Cancelled: 1,
  };
  const stepLabels = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
  let doneCount = statusMap[status] || 1;
  const steps = stepLabels.map((label, i) => {
    let date = "—";
    if (i === 0 && orderDate) date = orderDate;
    return {
      label: label,
      date: date,
      done: i + 1 <= doneCount,
      active: i + 1 === doneCount && doneCount !== 5,
    };
  });
  return { steps, tracking_number: null, estimated_delivery: null };
}
// ── RENDER ORDER DETAIL (uses full API response) ──
function openOrderDetail(order) {
  document.getElementById("view-list").style.display = "none";
  document.getElementById("view-detail").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  document.getElementById("od-num").textContent = order.id;
  const statusBadge = document.getElementById("od-status-badge");
  statusBadge.textContent = order.status;
  statusBadge.className = `od-status-badge ${getStatusClass(order.status)}`;

  document.getElementById("od-date").textContent = order.date;
  const itemCount = order.items?.length || 1;
  document.getElementById("od-items-count").textContent =
    `${itemCount} item${itemCount !== 1 ? "s" : ""}`;
  document.getElementById("od-total").textContent = order.total;

  const paymentEl = document.getElementById("od-payment");
  if (paymentEl) paymentEl.textContent = order.payment || "—";
  const trackingData = buildTrackingFromStatus(order.status, order.date);
  renderTrackingStepper(trackingData);
  renderOrderItems(order.items || []);
  document.getElementById("od-address").innerHTML = (
    order.shipping?.address || "—"
  ).replace(/\n/g, "<br>");
  document.getElementById("od-subtotal").textContent =
    order.subtotal || "₱0.00";
  document.getElementById("od-shipping").textContent =
    order.shipping?.cost_display || "FREE";
  document.getElementById("od-grand").textContent = order.total;
}

function renderOrderItems(items) {
  const list = document.getElementById("od-items-list");
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<div class="od-item-row">No items found.</div>';
    return;
  }
  list.innerHTML = items
    .map(
      (item) => `
    <div class="od-item-row">
      <img class="od-item-img" src="${item.img || ""}" alt="${item.product_name || "Product"}" onerror="this.style.opacity='0'" />
      <div class="od-item-info">
        <p class="od-item-name">${item.product_name || "Product"}</p>
        <div class="od-item-meta">
          ${item.size && item.size !== "—" ? `<span>Size: ${item.size}</span>` : ""}
          <span>Qty: ${item.qty || 1}</span>
        </div>
      </div>
      <p class="od-item-price">${item.price || "₱0.00"}</p>
    </div>
  `,
    )
    .join("");
}

function normaliseTracking(raw) {
  if (!raw || !raw.steps || raw.steps.length === 0) {
    return {
      steps: buildFallbackSteps("pending"),
      tracking_number: null,
      estimated_delivery: null,
    };
  }
  return raw;
}

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

function renderTrackingStepper(trackingData) {
  const stepper = document.getElementById("tracking-stepper");
  if (!stepper) return;
  const steps = trackingData.steps || [];
  const trackingNumber = trackingData.tracking_number;
  const estimatedDelivery = trackingData.estimated_delivery;
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
      return `<div class="${cls}"><div class="ts-dot"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div><p class="ts-label">${step.label}</p><p class="ts-date">${step.date !== "—" ? step.date : ""}</p></div>`;
    })
    .join("");
  let metaHTML = "";
  if (trackingNumber || estimatedDelivery) {
    metaHTML = `<div class="ts-meta-bar">${trackingNumber ? `<span class="ts-meta-item"><span class="ts-meta-label">Tracking #</span><strong>${trackingNumber}</strong></span>` : ""}${estimatedDelivery ? `<span class="ts-meta-item"><span class="ts-meta-label">Est. Delivery</span><strong>${estimatedDelivery}</strong></span>` : ""}</div>`;
  }
  stepper.innerHTML = metaHTML + stepsHTML;
}

// ── BACK BUTTON ──────────────────────────────
document.getElementById("back-btn")?.addEventListener("click", () => {
  document.getElementById("view-detail").style.display = "none";
  document.getElementById("view-list").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── SIGN OUT ─────────────────────────────────
function handleSignOut() {
  fetch("/styled/php/auth/logout.php", {
    method: "GET",
    credentials: "include",
  }).finally(() => {
    localStorage.removeItem("styled_user");
    window.location.href = "auth.html";
  });
}
document.getElementById("os-signout")?.addEventListener("click", handleSignOut);

// ── TABS ─────────────────────────────────────
const tabOrders = document.getElementById("tab-orders");
const tabWishlist = document.getElementById("tab-wishlist");
function setActiveTab(activeEl) {
  document
    .querySelectorAll(".os-nav-item")
    .forEach((el) => el.classList.remove("active"));
  if (activeEl) activeEl.classList.add("active");
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

window.initOrdersPage = function () {
  initUserInfo();
  renderOrderList();
  setActiveTab(tabOrders);
  setTimeout(() => setActiveTab(document.getElementById("tab-orders")), 300);
};
