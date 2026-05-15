"use strict";

function showToast(msg, type = "") {
  let t = document.getElementById("_staff_toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "_staff_toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = "toast" + (type ? " " + type : "");
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error(
      `[staff] Non-JSON response from ${url} (${res.status}):`,
      text.slice(0, 300),
    );
    throw new Error(`Non-JSON response (${res.status}) from ${url}`);
  }
  if (!res.ok) {
    console.error(`[staff] HTTP ${res.status} from ${url}:`, data);
    throw new Error(`HTTP ${res.status}: ${data?.error || res.statusText}`);
  }
  return data;
}

const API = "/styled/php/admin";

/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
let currentPage = "dashboard";

const ALLOWED_PAGES = [
  "dashboard",
  "orders",
  "products",
  "customers",
  "promotions",
  "inventory",
  "contact",
];

function navigate(page, btn) {
  if (!ALLOWED_PAGES.includes(page)) {
    showAccessDenied();
    return;
  }

  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + page)?.classList.add("active");
  if (btn) btn.classList.add("active");
  currentPage = page;

  const titles = {
    dashboard: "Welcome back, <span>Staff</span>",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    promotions: "Promotions",
    inventory: "Inventory",
    contact: "Contact Messages",
  };
  document.getElementById("page-title").innerHTML = titles[page] || page;
  document.getElementById("topbar-date-filter").style.display =
    page === "dashboard" ? "flex" : "none";

  if (page === "dashboard") renderDashboard();
  if (page === "orders") {
    ordersPage = 1;
    renderOrdersTable();
  }
  if (page === "products") {
    productsPage = 1;
    renderProductsTable();
  }
  if (page === "customers") {
    customersPage = 1;
    renderCustomersTable();
  }
  if (page === "promotions") renderPromotions();
  if (page === "inventory") renderInventory();
  if (page === "contact") renderContactMessages();

  initCharts(page);
}

function showAccessDenied() {
  toast("Access restricted. Contact your admin.", "error");
}

/* ─────────────────────────────────────────────
   MODALS
───────────────────────────────────────────── */
function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
});

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function formatPrice(n) {
  return (
    "₱" +
    Number(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function statusBadge(s) {
  const map = {
    paid: "paid",
    shipped: "shipped",
    delivered: "delivered",
    processing: "processing",
    pending: "pending",
    refunded: "refunded",
    cancelled: "cancelled",
    unpaid: "pending",
    active: "active",
    draft: "draft",
    "low stock": "low-stock",
    "in stock": "in-stock",
    "out of stock": "out",
    expired: "refunded",
    scheduled: "processing",
    unread: "pending",
    read: "delivered",
    replied: "shipped",
  };
  const key = (s || "").toLowerCase();
  return `<span class="badge badge-${map[key] || "delivered"}">${s}</span>`;
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function paginate(arr, page, perPage) {
  return arr.slice((page - 1) * perPage, page * perPage);
}

function renderPagination(containerId, total, cur, perPage, cb) {
  const pages = Math.ceil(total / perPage);
  const el = document.getElementById(containerId);
  if (!el) return;
  let html = `<button class="page-btn" ${cur === 1 ? "disabled" : ""} onclick="(${cb})(${cur - 1})">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i === cur ? "active" : ""}" onclick="(${cb})(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${cur === pages ? "disabled" : ""} onclick="(${cb})(${cur + 1})">›</button>`;
  el.innerHTML = html;
}

function tableLoading(tbodyId, cols) {
  const el = document.getElementById(tbodyId);
  if (el)
    el.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;color:var(--brown-100);padding:24px">Loading…</td></tr>`;
}

function tableError(tbodyId, cols, msg = "Failed to load data.") {
  const el = document.getElementById(tbodyId);
  if (el)
    el.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;color:var(--red);padding:24px">${msg}</td></tr>`;
}

function toast(msg, type) {
  // Simple toast — reuse existing alert if no toast UI
  if (type === "error") console.warn(msg);
  else console.log(msg);
  // Swap with your actual toast implementation if you have one
  alert(msg);
}

/* ─────────────────────────────────────────────
   DASHBOARD  (no revenue charts for staff)
───────────────────────────────────────────── */
async function renderDashboard() {
  // Recent orders only — no revenue stats
  tableLoading("dashboard-orders-body", 6);
  try {
    const data = await fetchJSON(`${API}/orders.php?page=1&limit=5`);
    const body = document.getElementById("dashboard-orders-body");
    if (!body) return;

    if (!data.success || !data.orders.length) {
      body.innerHTML = `<tr><td colspan="6" class="text-muted text-sm" style="padding:16px">No orders yet.</td></tr>`;
    } else {
      body.innerHTML = data.orders
        .map(
          (o) => `
        <tr style="cursor:pointer" onclick="openOrderDetail('${o.order_number}')">
          <td><span style="font-weight:500;color:var(--brown-400)">#${o.order_number}</span></td>
          <td>${o.customer_name || "—"}</td>
          <td class="text-muted">${new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
          <td>${statusBadge(o.status)}</td>
          <td style="font-weight:500">${formatPrice(o.total_amount)}</td>
          <td><button class="ellipsis-btn">···</button></td>
        </tr>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("[staff]", err);
    tableError("dashboard-orders-body", 6);
  }

  // Low stock alert (staff CAN see inventory)
  try {
    const invRes = await fetch(`${API}/inventory.php?status=low`, {
      credentials: "include",
    });
    const invData = await invRes.json();
    const lowStock = document.getElementById("low-stock-list");
    if (lowStock && invData.inventory) {
      const low = invData.inventory.slice(0, 5);
      lowStock.innerHTML = low.length
        ? low
            .map(
              (i) => `
            <div class="metric-row">
              <div class="flex-center gap-12">
                <div class="product-thumb">👗</div>
                <div>
                  <div style="font-size:13.5px;font-weight:500;color:var(--brown-400)">${i.product_name}</div>
                  <div class="text-sm text-muted">${i.size} — ${i.category}</div>
                </div>
              </div>
              <div style="font-size:13px;font-weight:500;color:var(--red)">${i.stock_qty} left</div>
            </div>`,
            )
            .join("")
        : `<div class="text-sm text-muted" style="padding:12px">All stock levels healthy.</div>`;
    }
  } catch (err) {
    console.error("[staff]", err);
  }

  initCharts("dashboard");
}

/* ─────────────────────────────────────────────
   ORDERS  (staff can update status, not refund/cancel)
───────────────────────────────────────────── */
let ordersPage = 1;
let ordersStatusFilter = "";
let ordersSearch = "";
const ORDERS_PER_PAGE = 8;

async function renderOrdersTable() {
  tableLoading("orders-body", 6);
  const params = new URLSearchParams({
    page: ordersPage,
    limit: ORDERS_PER_PAGE,
    status: ordersStatusFilter,
    search: ordersSearch,
  });
  try {
    const data = await fetchJSON(`${API}/orders.php?${params}`);
    const body = document.getElementById("orders-body");
    if (!body) return;

    if (!data.success || !data.orders.length) {
      body.innerHTML = `<tr><td colspan="6" class="text-muted text-sm" style="padding:16px">No orders found.</td></tr>`;
    } else {
      body.innerHTML = data.orders
        .map(
          (o) => `
        <tr style="cursor:pointer" onclick="openOrderDetail('${o.order_number}')">
          <td><span style="font-weight:500;color:var(--brown-400)">#${o.order_number}</span></td>
          <td>
            <div class="flex-center gap-8">
              <div class="customer-avatar">${initials(o.customer_name)}</div>
              ${o.customer_name || "—"}
            </div>
          </td>
          <td class="text-muted">${new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
          <td>${statusBadge(o.status)}</td>
          <td style="font-weight:500">${formatPrice(o.total_amount)}</td>
          <td><button class="ellipsis-btn">···</button></td>
        </tr>`,
        )
        .join("");
    }

    renderPagination(
      "orders-pagination",
      data.total,
      ordersPage,
      ORDERS_PER_PAGE,
      `function(p){ordersPage=p;renderOrdersTable();}`,
    );
  } catch (err) {
    console.error("[staff]", err);
    tableError("orders-body", 6);
  }
}

function filterOrders(q) {
  ordersSearch = q;
  ordersPage = 1;
  renderOrdersTable();
}
function filterOrdersByStatus(s) {
  ordersStatusFilter = s;
  ordersPage = 1;
  renderOrdersTable();
}
function showOrdersList() {
  document.getElementById("orders-list-view").style.display = "";
  document.getElementById("orders-detail-view").style.display = "none";
}

async function openOrderDetail(orderNumber) {
  navigate("orders", document.querySelector("[onclick*=\"'orders'\"]"));
  document.getElementById("orders-list-view").style.display = "none";
  document.getElementById("orders-detail-view").style.display = "";

  try {
    const data = await fetchJSON(`${API}/orders.php?id=${orderNumber}`);
    if (!data.success) return;
    const o = data.order;

    document.getElementById("detail-order-id").textContent =
      "#" + o.order_number;
    document.getElementById("detail-order-date").textContent = new Date(
      o.created_at,
    ).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    document.getElementById("detail-status-badge").innerHTML = statusBadge(
      o.status,
    );
    document.getElementById("detail-payment-badge").innerHTML = statusBadge(
      o.payment_method === "cod" ? "Pending" : "Paid",
    );
    document.getElementById("detail-customer-name").textContent =
      o.customer_name || "—";
    document.getElementById("detail-customer-email").textContent =
      o.customer_email || "";
    document.getElementById("detail-customer-avatar").textContent = initials(
      o.customer_name,
    );

    const addr = [o.street, o.city, o.province, o.zip_code]
      .filter(Boolean)
      .join(", ");
    document.getElementById("detail-shipping-address").textContent = addr;

    const itemsEl = document.getElementById("detail-items");
    if (itemsEl) {
      itemsEl.innerHTML = (o.items || [])
        .map(
          (item) => `
        <div class="metric-row">
          <div class="flex-center gap-12">
            <div class="product-thumb">👗</div>
            <div>
              <div style="font-size:13.5px;font-weight:500;color:var(--brown-400)">${item.product_name}</div>
              <div class="text-sm text-muted">${item.size || ""} × ${item.qty}</div>
            </div>
          </div>
          <div style="font-weight:500">${formatPrice(item.unit_price)}</div>
        </div>`,
        )
        .join("");
    }

    const summaryEl = document.getElementById("detail-summary");
    if (summaryEl) {
      const subtotal = (o.items || []).reduce(
        (s, i) => s + i.unit_price * i.qty,
        0,
      );
      summaryEl.innerHTML = `
        <div class="metric-row"><span class="text-sm text-muted">Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="metric-row" style="border-top:1px solid var(--border);padding-top:10px;margin-top:4px">
          <span style="font-weight:600;color:var(--brown-400)">Total</span>
          <span style="font-weight:600;color:var(--brown-400)">${formatPrice(o.total_amount)}</span>
        </div>`;
    }

    // Staff: show status update (no refund/cancel options)
    const actionsEl = document.getElementById("detail-actions");
    if (actionsEl) {
      actionsEl.innerHTML = `
        <select class="filter-select" id="status-select" style="height:36px;font-size:13px">
          ${["processing", "shipped", "delivered"]
            .map(
              (s) =>
                `<option value="${s}" ${s === o.status ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`,
            )
            .join("")}
        </select>
        <input class="form-input" type="text" id="tracking-input" placeholder="Tracking number" value="${o.tracking_number || ""}" style="width:160px;height:36px" />
        <button class="btn btn-primary btn-sm" onclick="updateOrderStatus(${o.order_id})">Update Status</button>`;
    }
  } catch (err) {
    console.error("[staff]", err);
  }
}

async function updateOrderStatus(orderId) {
  const status = document.getElementById("status-select")?.value;
  const tracking = document.getElementById("tracking-input")?.value || "";
  if (!status) return;
  try {
    const res = await fetch(`${API}/orders.php`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        status,
        tracking_number: tracking,
      }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("detail-status-badge").innerHTML =
        statusBadge(status);
      toast("Order status updated to " + status, "ok");
    } else {
      toast(data.error || "Update failed.", "error");
    }
  } catch (err) {
    console.error("[staff]", err);
    toast("Network error.", "error");
  }
}

/* ─────────────────────────────────────────────
   PRODUCTS  (view + update stock only — no add/delete/edit)
───────────────────────────────────────────── */
let productsPage = 1;
let productsCategoryFilter = "";
let productsStatusFilter = "";
let productsSearch = "";
const PRODUCTS_PER_PAGE = 8;

async function renderProductsTable() {
  tableLoading("products-body", 6);
  const params = new URLSearchParams({
    page: productsPage,
    limit: PRODUCTS_PER_PAGE,
    category: productsCategoryFilter,
    status: productsStatusFilter,
    search: productsSearch,
  });
  try {
    const data = await fetchJSON(`${API}/products.php?${params}`);
    const body = document.getElementById("products-body");
    if (!body) return;

    if (!data.success || !data.products.length) {
      body.innerHTML = `<tr><td colspan="6" class="text-muted text-sm" style="padding:16px">No products found.</td></tr>`;
    } else {
      body.innerHTML = data.products
        .map((p) => {
          const stock = parseInt(p.stock) || 0;
          const statLbl =
            stock === 0
              ? "Out of Stock"
              : stock <= 5
                ? "Low Stock"
                : p.status || "Active";
          return `
          <tr>
            <td>
              <div class="flex-center gap-12">
                <div class="product-thumb">👗</div>
                <span style="font-weight:500;color:var(--brown-400)">${p.name}</span>
              </div>
            </td>
            <td class="text-muted">${p.category || "—"}</td>
            <td style="font-weight:500">${formatPrice(p.price)}</td>
            <td>
              <div class="stock-bar-wrap">
                <span class="stock-num" style="color:${stock === 0 ? "var(--red)" : stock <= 5 ? "var(--gold)" : "var(--brown-300)"}">${stock}</span>
                <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${Math.min(100, (stock / 30) * 100)}%;background:var(--gold)"></div></div>
              </div>
            </td>
            <td>${statusBadge(statLbl)}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="openStockEditor(${p.product_id},'${p.name.replace(/'/g, "\\'")}',${stock})">Update Stock</button>
            </td>
          </tr>`;
        })
        .join("");
    }

    renderPagination(
      "products-pagination",
      data.total,
      productsPage,
      PRODUCTS_PER_PAGE,
      `function(p){productsPage=p;renderProductsTable();}`,
    );
  } catch (err) {
    console.error("[staff]", err);
    tableError("products-body", 6);
  }
}

function filterProducts(q) {
  productsSearch = q;
  productsPage = 1;
  renderProductsTable();
}
function filterProductsByStatus(s) {
  productsStatusFilter = s;
  productsPage = 1;
  renderProductsTable();
}
function filterProductsByCategory(c) {
  productsCategoryFilter = c;
  productsPage = 1;
  renderProductsTable();
}

// Staff: block full product editor
function openProductEditor() {
  showAccessDenied();
}

// Stock edit modal
let stockEditSizeId = null;

function openStockEditor(productId, name, currentStock) {
  stockEditSizeId = productId; // we'll fetch sizes on save
  let modal = document.getElementById("modal-stock-edit");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "modal-stock-edit";
    modal.innerHTML = `
      <div class="modal" style="max-width:360px">
        <div class="modal-header">
          <div class="modal-title" id="stock-modal-title">Update Stock</div>
          <button class="btn btn-ghost btn-icon" onclick="closeModal('modal-stock-edit')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label">New Stock Quantity</label>
            <input class="form-input" type="number" id="stock-qty-input" min="0" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-stock-edit')">Cancel</button>
          <button class="btn btn-primary" onclick="saveStock()">Save</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal("modal-stock-edit");
    });
  }
  document.getElementById("stock-modal-title").textContent =
    "Update Stock — " + name;
  document.getElementById("stock-qty-input").value = currentStock;
  openModal("modal-stock-edit");
}

async function saveStock() {
  // For staff stock update: we use the product_id and update ALL sizes proportionally
  // In production you'd show a per-size breakdown — this uses inventory PUT with size_id
  const qty = parseInt(document.getElementById("stock-qty-input")?.value, 10);
  if (isNaN(qty) || qty < 0) {
    toast("Enter a valid stock quantity.", "error");
    return;
  }

  // Fetch sizes for this product then update each
  try {
    const prodRes = await fetch(`${API}/products.php?id=${stockEditSizeId}`, {
      credentials: "include",
    });
    const prodData = await prodRes.json();
    if (!prodData.success) {
      toast("Could not load product sizes.", "error");
      return;
    }

    const sizes = prodData.product.sizes || [];
    if (!sizes.length) {
      toast("No size variants found.", "error");
      return;
    }

    // Update first size (or all equally if multiple)
    await Promise.all(
      sizes.map((s) =>
        fetch(`${API}/inventory.php`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ size_id: s.size_id, stock_qty: qty }),
        }),
      ),
    );

    closeModal("modal-stock-edit");
    renderProductsTable();
    renderInventory();
    toast("Stock updated.", "ok");
  } catch (err) {
    console.error("[staff]", err);
    toast("Network error.", "error");
  }
}

/* ─────────────────────────────────────────────
   CUSTOMERS  (view + add notes)
───────────────────────────────────────────── */
let customersPage = 1;
let customersSearch = "";
const CUSTOMERS_PER_PAGE = 8;

async function renderCustomersTable() {
  tableLoading("customers-body", 7);
  const params = new URLSearchParams({
    page: customersPage,
    limit: CUSTOMERS_PER_PAGE,
    search: customersSearch,
  });
  try {
    const data = await fetchJSON(`${API}/customers.php?${params}`);
    const body = document.getElementById("customers-body");
    if (!body) return;

    if (!data.success || !data.customers.length) {
      body.innerHTML = `<tr><td colspan="7" class="text-muted text-sm" style="padding:16px">No customers found.</td></tr>`;
    } else {
      body.innerHTML = data.customers
        .map(
          (c) => `
        <tr style="cursor:pointer" onclick="openCustomerProfile(${c.user_id})">
          <td>
            <div class="flex-center gap-12">
              <div class="customer-avatar">${initials(c.full_name)}</div>
              <span style="font-weight:500;color:var(--brown-400)">${c.full_name}</span>
            </div>
          </td>
          <td class="text-muted">${c.email}</td>
          <td>${c.order_count}</td>
          <td style="font-weight:500">${formatPrice(c.total_spent)}</td>
          <td>${c.admin_notes ? `<span class="badge badge-processing">Has note</span>` : "—"}</td>
          <td class="text-muted">${new Date(c.created_at).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}</td>
          <td><button class="ellipsis-btn">···</button></td>
        </tr>`,
        )
        .join("");
    }

    renderPagination(
      "customers-pagination",
      data.total,
      customersPage,
      CUSTOMERS_PER_PAGE,
      `function(p){customersPage=p;renderCustomersTable();}`,
    );
  } catch (err) {
    console.error("[staff]", err);
    tableError("customers-body", 7);
  }
}

function filterCustomers(q) {
  customersSearch = q;
  customersPage = 1;
  renderCustomersTable();
}

function showCustomersList() {
  document.getElementById("customers-list-view").style.display = "";
  document.getElementById("customer-profile-view").style.display = "none";
}

let viewingCustomerId = null;

async function openCustomerProfile(id) {
  viewingCustomerId = id;
  navigate("customers", document.querySelector("[onclick*=\"'customers'\"]"));
  document.getElementById("customers-list-view").style.display = "none";
  document.getElementById("customer-profile-view").style.display = "";

  try {
    const data = await fetchJSON(`${API}/customers.php?id=${id}`);
    if (!data.success) return;
    const c = data.customer;

    document.getElementById("profile-avatar").textContent = initials(
      c.full_name,
    );
    document.getElementById("profile-name").textContent = c.full_name;
    document.getElementById("profile-email").textContent = c.email;
    document.getElementById("profile-total-orders").textContent = c.order_count;
    document.getElementById("profile-total-spent").textContent = formatPrice(
      c.total_spent,
    );

    const noteEl = document.getElementById("profile-admin-notes");
    if (noteEl) noteEl.value = c.admin_notes || "";

    document.getElementById("profile-orders").innerHTML = c.orders.length
      ? c.orders
          .map(
            (o) => `
          <tr>
            <td>#${o.order_number}</td>
            <td class="text-muted">${new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
            <td>${statusBadge(o.status)}</td>
            <td style="font-weight:500">${formatPrice(o.total_amount)}</td>
          </tr>`,
          )
          .join("")
      : `<tr><td colspan="4" class="text-muted text-sm" style="padding:12px">No orders found</td></tr>`;
  } catch (err) {
    console.error("[staff]", err);
  }
}

async function saveCustomerNote() {
  if (!viewingCustomerId) return;
  const notes = document.getElementById("profile-admin-notes")?.value || "";
  try {
    const res = await fetch(`${API}/customers.php?id=${viewingCustomerId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: notes }),
    });
    const data = await res.json();
    toast(
      data.success ? "Note saved." : data.error || "Failed.",
      data.success ? "ok" : "error",
    );
  } catch (err) {
    console.error("[staff]", err);
    toast("Network error.", "error");
  }
}

/* ─────────────────────────────────────────────
   PROMOTIONS  (view only — no create/delete)
───────────────────────────────────────────── */
async function renderPromotions() {
  tableLoading("promotions-body", 8);
  try {
    const data = await fetchJSON(`${API}/promotions.php`);
    const body = document.getElementById("promotions-body");
    if (!body) return;

    if (!data.success || !data.promotions.length) {
      body.innerHTML = `<tr><td colspan="8" class="text-muted text-sm" style="padding:16px">No promotions found.</td></tr>`;
    } else {
      body.innerHTML = data.promotions
        .map((p) => {
          const isExpired =
            p.expiry_date && new Date(p.expiry_date) < new Date();
          const status = !p.is_active
            ? "Inactive"
            : isExpired
              ? "Expired"
              : "Active";
          const discount =
            p.discount_type === "percent"
              ? `${p.discount_value}% off`
              : `₱${p.discount_value} off`;
          const minOrder =
            p.min_order > 0
              ? `Min. spend ₱${Number(p.min_order).toLocaleString()}`
              : "No minimum";
          const uses = p.usage_limit
            ? `${p.usage_count} / ${p.usage_limit}`
            : `${p.usage_count} / —`;
          const expiry = p.expiry_date
            ? new Date(p.expiry_date).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—";
          return `
          <tr>
            <td><span style="font-weight:600;letter-spacing:.05em;color:var(--brown-400)">${p.code}</span></td>
            <td class="text-muted">${p.discount_type === "percent" ? "Percentage" : "Fixed"}</td>
            <td style="font-weight:500">${discount}</td>
            <td class="text-muted text-sm">${minOrder}</td>
            <td class="text-muted">${uses}</td>
            <td class="text-muted">${expiry}</td>
            <td>${statusBadge(status)}</td>
            <td>—</td>
          </tr>`;
        })
        .join("");
    }
  } catch (err) {
    console.error("[staff]", err);
    tableError("promotions-body", 8);
  }
}

/* ─────────────────────────────────────────────
   INVENTORY  (view only for staff)
───────────────────────────────────────────── */
let inventorySearch = "";

async function renderInventory() {
  tableLoading("inventory-body", 6);
  const params = new URLSearchParams({ search: inventorySearch });
  try {
    const data = await fetchJSON(`${API}/inventory.php?${params}`);
    const body = document.getElementById("inventory-body");
    if (!body) return;

    if (!data.success || !data.inventory.length) {
      body.innerHTML = `<tr><td colspan="6" class="text-muted text-sm" style="padding:16px">No inventory data found.</td></tr>`;
    } else {
      body.innerHTML = data.inventory
        .map((item) => {
          const qty = parseInt(item.stock_qty) || 0;
          const isOut = qty === 0;
          const isLow = qty > 0 && qty <= 5;
          const status = isOut
            ? "Out of Stock"
            : isLow
              ? "Low Stock"
              : "In Stock";
          return `
          <tr>
           <td class="text-muted">—</td>
            <td>
              <div class="flex-center gap-12">
                <div class="product-thumb">👗</div>
                <div>
                  <div style="font-size:13.5px;font-weight:500;color:var(--brown-400)">${item.product_name}</div>
                  <div class="text-sm text-muted">${item.size || "—"}</div>
                </div>
              </div>
            </td>
            <td style="font-weight:500;color:${isOut ? "var(--red)" : isLow ? "var(--gold)" : "var(--brown-300)"}">${qty}</td>
            <td class="text-muted">—</td>
            <td class="text-muted">—</td>
            <td>${statusBadge(status)}</td>
            <td>—</td>
          </tr>`;
        })
        .join("");
    }
  } catch (err) {
    console.error("[staff]", err);
    tableError("inventory-body", 6);
  }
}

function filterInventory(q) {
  inventorySearch = q;
  renderInventory();
}

/* ─────────────────────────────────────────────
   CONTACT MESSAGES
───────────────────────────────────────────── */
let contactStatusFilter = "";
let contactPage = 1;

async function renderContactMessages() {
  tableLoading("contact-body", 7);
  const params = new URLSearchParams({
    page: contactPage,
    limit: 20,
    status: contactStatusFilter,
  });
  try {
    const data = await fetchJSON(`${API}/contact-messages.php?${params}`);
    const body = document.getElementById("contact-body");
    if (!body) return;

    if (!data.success || !data.messages.length) {
      body.innerHTML = `<tr><td colspan="7" class="text-muted text-sm" style="padding:16px">No messages found.</td></tr>`;
    } else {
      body.innerHTML = data.messages
        .map(
          (m) => `
      <tr style="${m.status === "unread" ? "font-weight:600;" : ""}">
        <td style="color:var(--brown-400)">${escapeHtml(m.name)}</td>
        <td class="text-muted">${escapeHtml(m.email)}</td>
        <td>${escapeHtml(m.subject)}</td>
        <td class="text-muted text-sm" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(m.message)}</td>
        <td>${statusBadge(m.status)}</td>
        <td class="text-muted">${new Date(m.sent_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
        <td>
          <div class="flex-center gap-6">
            <button class="btn btn-outline btn-sm" onclick="viewContactMessage(${m.message_id})">View</button>
            <button class="btn btn-primary btn-sm reply-contact-btn" data-id="${m.message_id}" data-email="${escapeHtml(m.email)}" data-subject="${escapeHtml(m.subject)}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:3px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Reply
            </button>
            ${m.status === "unread" ? `<button class="btn btn-outline btn-sm" onclick="markMessage(${m.message_id},'read')">Mark Read</button>` : ""}
          </div>
        </td>
      </tr>
    `,
        )
        .join("");

      // Attach reply button listeners
      document.querySelectorAll(".reply-contact-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          openReplyModal(
            parseInt(btn.dataset.id),
            btn.dataset.email,
            btn.dataset.subject,
          );
        });
      });

      renderPagination(
        "contact-pagination",
        data.total,
        contactPage,
        20,
        `function(p){contactPage=p;renderContactMessages();}`,
      );
    }
    document.querySelectorAll(".reply-contact-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openReplyModal(
          parseInt(btn.dataset.id),
          btn.dataset.email,
          btn.dataset.subject,
        );
      });
    });

    renderPagination(
      "contact-pagination",
      data.total,
      contactPage,
      20,
      `function(p){contactPage=p;renderContactMessages();}`,
    );
  } catch (err) {
    console.error("[staff]", err);
    tableError("contact-body", 7);
  }
}

function filterContactMessages(s) {
  contactStatusFilter = s;
  contactPage = 1;
  renderContactMessages();
}

async function viewContactMessage(id) {
  try {
    const data = await fetchJSON(`${API}/contact-messages.php?id=${id}`);
    if (!data.success) return;
    const m = data.message;

    // Remove any existing overlay
    const existing = document.getElementById("_msg-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "_msg-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(28,17,9,.45);z-index:9000;display:flex;align-items:center;justify-content:center";
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:4px;padding:28px 32px;max-width:520px;width:90%;box-shadow:0 8px 32px rgba(28,17,9,.18)">
        <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--brown-100);margin-bottom:6px">Contact Message</div>
        <div style="font-weight:500;color:var(--brown-400);font-size:16px;margin-bottom:4px">${escapeHtml(m.subject)}</div>
        <div style="color:var(--brown-200);font-size:13px;margin-bottom:14px">${escapeHtml(m.name)} &lt;${escapeHtml(m.email)}&gt;</div>
        <div style="font-size:13.5px;color:var(--brown-300);line-height:1.7;white-space:pre-wrap;border-top:1px solid var(--beige-200);padding-top:12px">${escapeHtml(m.message)}</div>
        <div style="margin-top:20px;text-align:right">
          <button onclick="document.getElementById('_msg-overlay').remove()" style="background:var(--brown-400);color:#fff;border:none;border-radius:4px;padding:8px 18px;font-size:13px;cursor:pointer">Close</button>
        </div>
      </div>
    `;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);

    if (m.status === "unread") markMessage(id, "read");
  } catch (err) {
    console.error("[staff]", err);
  }
}

async function markMessage(id, status) {
  try {
    await fetch(`${API}/contact-messages.php?id=${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    renderContactMessages();
  } catch (err) {
    console.error("[staff]", err);
  }
}

function openReplyModal(id, email, subject) {
  document.getElementById("reply-message-id").value = id;
  document.getElementById("reply-to").value = email;
  document.getElementById("reply-subject").value = "Re: " + subject;
  document.getElementById("reply-body").value = "";
  openModal("modal-reply-contact");
}

async function sendContactReply() {
  const id = document.getElementById("reply-message-id").value;
  const subject = document.getElementById("reply-subject").value.trim();
  const body = document.getElementById("reply-body").value.trim();

  if (!subject || !body) {
    showToast("Subject and message are required.", "error");
    return;
  }

  try {
    const res = await fetch("/styled/php/admin/reply-contact.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: id,
        reply_subject: subject,
        reply_body: body,
      }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal("modal-reply-contact");
      showToast("Reply sent successfully.", "ok");
      renderContactMessages();
    } else {
      showToast(data.error || "Failed to send reply.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Network error. Could not send reply.", "error");
  }
}

/* ─────────────────────────────────────────────
   CHARTS  (dashboard only — no revenue for staff)
───────────────────────────────────────────── */
const chartInstances = {};
const BRAND_GOLD = "rgba(184,146,74,1)";
const BRAND_GOLD_BG = "rgba(184,146,74,0.12)";

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#fff",
      titleColor: "#1c120a",
      bodyColor: "#9c826a",
      borderColor: "#e6ddd2",
      borderWidth: 1,
      padding: 10,
      titleFont: { family: "'Cormorant Garamond', serif", size: 14 },
      bodyFont: { family: "'DM Sans', sans-serif", size: 12 },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: "#b8a090",
        font: { family: "'DM Sans', sans-serif", size: 11 },
      },
      border: { display: false },
    },
    y: {
      grid: { color: "rgba(230,221,210,0.6)" },
      ticks: {
        color: "#b8a090",
        font: { family: "'DM Sans', sans-serif", size: 11 },
      },
      border: { display: false },
    },
  },
};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function initCharts(page) {
  // Staff only sees order-count chart on dashboard (no revenue)
  if (page === "dashboard") {
    destroyChart("statusChart");
    const sCtx = document.getElementById("statusChart");
    if (sCtx) {
      chartInstances["statusChart"] = new Chart(sCtx, {
        type: "line",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              label: "Orders",
              data: [0, 0, 0, 0, 0, 0, 0],
              borderColor: BRAND_GOLD,
              backgroundColor: BRAND_GOLD_BG,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "rgba(61,36,16,0.65)",
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2,
            },
          ],
        },
        options: { ...baseOptions },
      });
    }
    // Revenue chart hidden for staff — controlled in HTML via applyStaffRestrictions
  }
}

/* ─────────────────────────────────────────────
   HIDE ADMIN-ONLY UI ELEMENTS
───────────────────────────────────────────── */
function applyStaffRestrictions() {
  // Hide "Add Product" button
  document
    .querySelectorAll('[onclick*="modal-add-product"]')
    .forEach((el) => (el.style.display = "none"));
  // Hide "Create Promotion" button
  document
    .querySelectorAll('[onclick*="modal-add-promo"]')
    .forEach((el) => (el.style.display = "none"));
  // Hide revenue chart card on dashboard
  document
    .querySelectorAll(".revenue-chart-card, #revenueChart")
    .forEach((el) => {
      const card = el.closest(".card") || el;
      card.style.display = "none";
    });
}

/* ─────────────────────────────────────────────
   LOGOUT / USER INFO
───────────────────────────────────────────── */
async function handleLogout() {
  try {
    await fetch("/styled/php/auth/logout.php", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("[staff]", err);
  }
  localStorage.removeItem("styled_user");
  window.location.replace("auth.html");
}
document.getElementById("logout-btn")?.addEventListener("click", handleLogout);

async function populateUserInfo() {
  try {
    const res = await fetch("/styled/php/auth/check.php", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.logged_in && data.user) {
      const u = data.user;
      const el = (id) => document.getElementById(id);
      if (el("sidebar-avatar"))
        el("sidebar-avatar").textContent = initials(u.full_name);
      if (el("sidebar-name")) el("sidebar-name").textContent = u.full_name;
      if (el("sidebar-email")) el("sidebar-email").textContent = u.email;
      if (el("page-title") && currentPage === "dashboard") {
        el("page-title").innerHTML =
          `Welcome back, <span>${u.full_name.split(" ")[0]}</span>`;
      }
    }
  } catch (err) {
    console.error("[staff]", err);
  }
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
function init() {
  applyStaffRestrictions();
  populateUserInfo();
  renderDashboard();
}

document.addEventListener("DOMContentLoaded", init);
