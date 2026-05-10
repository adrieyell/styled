/* ============================================
   STYLED STAFF DASHBOARD — js/staff.js
   Role-based restricted version of admin.js.

   Staff CAN:  Dashboard, Orders (update status/tracking),
               Products (view + update stock), Customers
               (view + add notes), Inventory (view),
               Promotions (view).

   Staff CANNOT: Analytics, Settings, Users/Staff Mgmt,
                 delete products, refund orders, manage
                 payment/shipping/domain settings,
                 create/remove admin users.
   ============================================ */

"use strict";

/* ─────────────────────────────────────────────
   MOCK DATA  (identical to admin.js)
───────────────────────────────────────────── */
const ORDERS = [
  {
    id: "STY-123456",
    customer: "Bea Santiago",
    email: "bea.santiago@gmail.com",
    date: "May 18, 2025",
    status: "Delivered",
    payment: "Paid",
    total: 24500,
    items: [
      {
        name: "Oversized Wool Coat",
        variant: "M / Camel",
        qty: 1,
        price: 24500,
      },
    ],
    address: "123 Ayala Ave, Makati City, Metro Manila 1226, Philippines",
    timeline: [
      "Order placed — May 18, 10:06 AM",
      "Paid — May 18, 10:07 AM",
      "Shipped — May 19, 9:40 AM",
      "Delivered — May 20, 2:15 PM",
    ],
  },
  {
    id: "STY-123455",
    customer: "Miguel Reyes",
    email: "miguel.reyes@gmail.com",
    date: "May 16, 2025",
    status: "Delivered",
    payment: "Paid",
    total: 9960,
    items: [
      { name: "Ribbed Knit Sweater", variant: "S / Oat", qty: 1, price: 9960 },
    ],
    address: "56 Buendia Ave, Makati City 1200, Philippines",
    timeline: [
      "Order placed — May 16, 3:00 PM",
      "Paid — May 16, 3:01 PM",
      "Shipped — May 17, 10:00 AM",
      "Delivered — May 18, 1:30 PM",
    ],
  },
  {
    id: "STY-123454",
    customer: "Trisha Mendoza",
    email: "trisha.mendoza@gmail.com",
    date: "May 17, 2025",
    status: "Processing",
    payment: "Paid",
    total: 9900,
    items: [
      {
        name: "Tailored Wide-Leg Pants",
        variant: "M / Black",
        qty: 1,
        price: 9900,
      },
    ],
    address: "78 Tomas Morato, QC 1103, Philippines",
    timeline: ["Order placed — May 17, 6:20 PM", "Paid — May 17, 6:21 PM"],
  },
  {
    id: "STY-123453",
    customer: "Anna Dela Cruz",
    email: "anna.dela.cruz@gmail.com",
    date: "May 16, 2025",
    status: "Delivered",
    payment: "Paid",
    total: 9140,
    items: [
      { name: "Cashmere Crewneck", variant: "S / Ivory", qty: 1, price: 9140 },
    ],
    address: "34 Katipunan Ave, QC 1105, Philippines",
    timeline: [
      "Order placed — May 16, 9:00 AM",
      "Paid — May 16, 9:02 AM",
      "Shipped — May 17, 8:30 AM",
      "Delivered — May 18, 12:00 PM",
    ],
  },
  {
    id: "STY-123452",
    customer: "Juan Pablo",
    email: "juan.pablo@gmail.com",
    date: "May 16, 2025",
    status: "Delivered",
    payment: "Refunded",
    total: 5340,
    items: [
      { name: "Silk Slip Dress", variant: "XS / Black", qty: 1, price: 5340 },
    ],
    address: "90 Ortigas Center, Pasig City 1605, Philippines",
    timeline: [
      "Order placed — May 16, 11:00 AM",
      "Paid — May 16, 11:01 AM",
      "Shipped — May 17, 2:00 PM",
      "Delivered — May 18, 10:00 AM",
      "Refunded — May 19, 3:00 PM",
    ],
  },
  {
    id: "STY-123451",
    customer: "Sofia Ramos",
    email: "sofia.ramos@gmail.com",
    date: "May 15, 2025",
    status: "Shipped",
    payment: "Paid",
    total: 6480,
    items: [
      { name: "Linen Blazer", variant: "M / Beige", qty: 1, price: 6480 },
    ],
    address: "22 Timog Ave, QC 1103, Philippines",
    timeline: [
      "Order placed — May 15, 8:00 AM",
      "Paid — May 15, 8:02 AM",
      "Shipped — May 16, 9:00 AM",
    ],
  },
  {
    id: "STY-123450",
    customer: "Camille Santos",
    email: "camille.santos@gmail.com",
    date: "May 14, 2025",
    status: "Processing",
    payment: "Paid",
    total: 18900,
    items: [
      {
        name: "Structured Tote Bag",
        variant: "One Size / Tan",
        qty: 1,
        price: 9950,
      },
      { name: "Leather Belt", variant: "S / Brown", qty: 1, price: 8950 },
    ],
    address: "5 Scout Tuason, QC 1103, Philippines",
    timeline: ["Order placed — May 14, 7:45 PM", "Paid — May 14, 7:46 PM"],
  },
  {
    id: "STY-123449",
    customer: "Diego Villanueva",
    email: "diego.v@gmail.com",
    date: "May 14, 2025",
    status: "Pending",
    payment: "Unpaid",
    total: 3480,
    items: [
      { name: "Cotton Turtleneck", variant: "L / White", qty: 1, price: 3480 },
    ],
    address: "17 Gilmore Ave, QC 1100, Philippines",
    timeline: ["Order placed — May 14, 3:00 PM"],
  },
];

const PRODUCTS = [
  {
    id: "P001",
    name: "Oversized Wool Coat",
    category: "Outerwear",
    price: 24500,
    stock: 12,
    status: "Active",
  },
  {
    id: "P002",
    name: "Ribbed Knit Sweater",
    category: "Knitwear",
    price: 9960,
    stock: 3,
    status: "Low Stock",
  },
  {
    id: "P003",
    name: "Tailored Wide-Leg Pants",
    category: "Bottoms",
    price: 9900,
    stock: 18,
    status: "Active",
  },
  {
    id: "P004",
    name: "Cashmere Crewneck",
    category: "Knitwear",
    price: 9140,
    stock: 0,
    status: "Out of Stock",
  },
  {
    id: "P005",
    name: "Silk Slip Dress",
    category: "Dresses",
    price: 5340,
    stock: 7,
    status: "Active",
  },
  {
    id: "P006",
    name: "Linen Blazer",
    category: "Outerwear",
    price: 6480,
    stock: 2,
    status: "Low Stock",
  },
  {
    id: "P007",
    name: "Structured Tote Bag",
    category: "Accessories",
    price: 9950,
    stock: 14,
    status: "Active",
  },
  {
    id: "P008",
    name: "Leather Belt",
    category: "Accessories",
    price: 8950,
    stock: 20,
    status: "Active",
  },
  {
    id: "P009",
    name: "Cotton Turtleneck",
    category: "Knitwear",
    price: 3480,
    stock: 30,
    status: "Active",
  },
  {
    id: "P010",
    name: "Pleated Midi Skirt",
    category: "Bottoms",
    price: 4960,
    stock: 9,
    status: "Active",
  },
];

const CUSTOMERS = [
  {
    id: "C001",
    name: "Bea Santiago",
    email: "bea.santiago@gmail.com",
    orders: 4,
    spent: 82000,
    tags: ["VIP"],
    since: "Jan 2024",
  },
  {
    id: "C002",
    name: "Miguel Reyes",
    email: "miguel.reyes@gmail.com",
    orders: 2,
    spent: 19920,
    tags: [],
    since: "Mar 2024",
  },
  {
    id: "C003",
    name: "Trisha Mendoza",
    email: "trisha.mendoza@gmail.com",
    orders: 1,
    spent: 9900,
    tags: [],
    since: "May 2025",
  },
  {
    id: "C004",
    name: "Anna Dela Cruz",
    email: "anna.dela.cruz@gmail.com",
    orders: 3,
    spent: 27420,
    tags: ["Loyal"],
    since: "Feb 2024",
  },
  {
    id: "C005",
    name: "Juan Pablo",
    email: "juan.pablo@gmail.com",
    orders: 1,
    spent: 0,
    tags: ["Refunded"],
    since: "May 2025",
  },
  {
    id: "C006",
    name: "Sofia Ramos",
    email: "sofia.ramos@gmail.com",
    orders: 2,
    spent: 12960,
    tags: [],
    since: "Apr 2025",
  },
  {
    id: "C007",
    name: "Camille Santos",
    email: "camille.santos@gmail.com",
    orders: 1,
    spent: 18900,
    tags: [],
    since: "May 2025",
  },
  {
    id: "C008",
    name: "Diego Villanueva",
    email: "diego.v@gmail.com",
    orders: 0,
    spent: 0,
    tags: ["Pending"],
    since: "May 2025",
  },
];

const PROMOTIONS = [
  {
    code: "SUMMER25",
    type: "Percentage",
    discount: "25% off",
    conditions: "No min spend",
    uses: 142,
    expiry: "Jun 30, 2025",
    status: "Active",
  },
  {
    code: "WELCOME10",
    type: "Percentage",
    discount: "10% off",
    conditions: "First order",
    uses: 89,
    expiry: "Dec 31, 2025",
    status: "Active",
  },
  {
    code: "FREESHIP",
    type: "Free Shipping",
    discount: "Free shipping",
    conditions: "₱500 min",
    uses: 67,
    expiry: "Jul 1, 2025",
    status: "Active",
  },
  {
    code: "FLASH500",
    type: "Fixed Amount",
    discount: "₱500 off",
    conditions: "₱3,000 min",
    uses: 34,
    expiry: "May 20, 2025",
    status: "Expired",
  },
  {
    code: "VIP20",
    type: "Percentage",
    discount: "20% off",
    conditions: "VIP members only",
    uses: 10,
    expiry: "Sep 1, 2025",
    status: "Scheduled",
  },
];

const INVENTORY = [
  {
    id: "P001",
    sku: "WC-M-CAM",
    name: "Oversized Wool Coat",
    variant: "M / Camel",
    stock: 12,
    reserved: 2,
    incoming: 0,
  },
  {
    id: "P002",
    sku: "RKS-S-OAT",
    name: "Ribbed Knit Sweater",
    variant: "S / Oat",
    stock: 3,
    reserved: 1,
    incoming: 20,
  },
  {
    id: "P003",
    sku: "WLP-M-BLK",
    name: "Tailored Wide-Leg Pants",
    variant: "M / Black",
    stock: 18,
    reserved: 1,
    incoming: 0,
  },
  {
    id: "P004",
    sku: "CC-S-IVR",
    name: "Cashmere Crewneck",
    variant: "S / Ivory",
    stock: 0,
    reserved: 0,
    incoming: 15,
  },
  {
    id: "P005",
    sku: "SSD-XS-BLK",
    name: "Silk Slip Dress",
    variant: "XS / Black",
    stock: 7,
    reserved: 0,
    incoming: 0,
  },
  {
    id: "P006",
    sku: "LB-M-BGE",
    name: "Linen Blazer",
    variant: "M / Beige",
    stock: 2,
    reserved: 1,
    incoming: 10,
  },
  {
    id: "P007",
    sku: "STB-OS-TAN",
    name: "Structured Tote Bag",
    variant: "One Size / Tan",
    stock: 14,
    reserved: 1,
    incoming: 0,
  },
  {
    id: "P008",
    sku: "LBT-S-BRN",
    name: "Leather Belt",
    variant: "S / Brown",
    stock: 20,
    reserved: 0,
    incoming: 0,
  },
  {
    id: "P009",
    sku: "CTN-L-WHT",
    name: "Cotton Turtleneck",
    variant: "L / White",
    stock: 30,
    reserved: 1,
    incoming: 0,
  },
  {
    id: "P010",
    sku: "PMS-M-NAV",
    name: "Pleated Midi Skirt",
    variant: "M / Navy",
    stock: 9,
    reserved: 2,
    incoming: 0,
  },
];

/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
let currentPage = "dashboard";

// Staff-allowed pages
const ALLOWED_PAGES = [
  "dashboard",
  "orders",
  "products",
  "customers",
  "promotions",
  "inventory",
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
  };
  document.getElementById("page-title").innerHTML = titles[page] || page;

  const showDateFilter = page === "dashboard";
  document.getElementById("topbar-date-filter").style.display = showDateFilter
    ? "flex"
    : "none";

  initCharts(page);
}

/* ─────────────────────────────────────────────
   ACCESS DENIED TOAST
───────────────────────────────────────────── */
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
    n.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function statusBadge(s) {
  const map = {
    Paid: "paid",
    Shipped: "shipped",
    Delivered: "delivered",
    Processing: "processing",
    Pending: "pending",
    Refunded: "refunded",
    Cancelled: "cancelled",
    Unpaid: "pending",
    Active: "active",
    Draft: "draft",
    "Low Stock": "low-stock",
    "In Stock": "in-stock",
    "Out of Stock": "out",
    Expired: "refunded",
    Scheduled: "processing",
  };
  return `<span class="badge badge-${map[s] || "delivered"}">${s}</span>`;
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function paginate(arr, page, perPage) {
  const start = (page - 1) * perPage;
  return arr.slice(start, start + perPage);
}

function renderPagination(containerId, total, currentPage, perPage, onPage) {
  const pages = Math.ceil(total / perPage);
  const el = document.getElementById(containerId);
  if (!el) return;
  let html = `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="(${onPage})(${currentPage - 1})">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="(${onPage})(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${currentPage === pages ? "disabled" : ""} onclick="(${onPage})(${currentPage + 1})">›</button>`;
  el.innerHTML = html;
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
let toastTimer;
function toast(msg, type = "") {
  let el = document.getElementById("staff-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "staff-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = "toast " + type + " show";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ─────────────────────────────────────────────
   LOGOUT
───────────────────────────────────────────── */
async function handleLogout() {
  try {
    await fetch("/styled/php/auth/logout.php", {
      method: "POST",
      credentials: "include",
    });
  } catch (_) {}
  localStorage.removeItem("styled_user");
  window.location.replace("auth.html");
}

document.getElementById("logout-btn")?.addEventListener("click", handleLogout);

/* ─────────────────────────────────────────────
   POPULATE SIDEBAR USER INFO FROM SESSION
───────────────────────────────────────────── */
async function populateUserInfo() {
  try {
    const res = await fetch("/styled/php/auth/check.php", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.logged_in && data.user) {
      const u = data.user;
      const avatarEl = document.getElementById("sidebar-avatar");
      const nameEl = document.getElementById("sidebar-name");
      const emailEl = document.getElementById("sidebar-email");
      if (avatarEl) avatarEl.textContent = initials(u.full_name);
      if (nameEl) nameEl.textContent = u.full_name;
      if (emailEl) emailEl.textContent = u.email;

      const titleEl = document.getElementById("page-title");
      if (titleEl && currentPage === "dashboard") {
        titleEl.innerHTML = `Welcome back, <span>${u.full_name.split(" ")[0]}</span>`;
      }
    }
  } catch (_) {}
}

/* ─────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────── */
function renderDashboard() {
  const body = document.getElementById("dashboard-orders-body");
  if (!body) return;
  body.innerHTML = ORDERS.slice(0, 5)
    .map(
      (o) => `
    <tr style="cursor:pointer" onclick="openOrderDetail('${o.id}')">
      <td><span style="font-weight:500;color:var(--brown-400)">#${o.id}</span></td>
      <td>${o.customer}</td>
      <td class="text-muted">${o.date}</td>
      <td>${statusBadge(o.status)}</td>
      <td>${statusBadge(o.payment)}</td>
      <td style="font-weight:500">${formatPrice(o.total)}</td>
      <td><button class="ellipsis-btn">···</button></td>
    </tr>`,
    )
    .join("");

  const topProds = document.getElementById("top-products-list");
  if (topProds) {
    const sorted = [...PRODUCTS].sort((a, b) => b.stock - a.stock).slice(0, 5);
    topProds.innerHTML = sorted
      .map(
        (p) => `
      <div class="metric-row">
        <div class="flex-center gap-12">
          <div class="product-thumb">👗</div>
          <div>
            <div style="font-size:13.5px;font-weight:500;color:var(--brown-400)">${p.name}</div>
            <div class="text-sm text-muted">${formatPrice(p.price)}</div>
          </div>
        </div>
        <div class="text-sm text-muted">${p.stock + 81} sold</div>
      </div>`,
      )
      .join("");
  }

  const lowStock = document.getElementById("low-stock-list");
  if (lowStock) {
    const low = PRODUCTS.filter(
      (p) => p.stock <= 3 || p.status === "Low Stock",
    ).slice(0, 5);
    lowStock.innerHTML = low
      .map(
        (p) => `
      <div class="metric-row">
        <div class="flex-center gap-12">
          <div class="product-thumb">👗</div>
          <div>
            <div style="font-size:13.5px;font-weight:500;color:var(--brown-400)">${p.name}</div>
            <div class="text-sm text-muted">${p.category}</div>
          </div>
        </div>
        <div style="font-size:13px;font-weight:500;color:var(--red)">${p.stock} left</div>
      </div>`,
      )
      .join("");
  }
}

/* ─────────────────────────────────────────────
   ORDERS  (staff can update status / tracking)
───────────────────────────────────────────── */
let filteredOrders = [...ORDERS];
let ordersPage = 1;
const ORDERS_PER_PAGE = 8;

function renderOrdersTable() {
  const body = document.getElementById("orders-body");
  if (!body) return;
  const page = paginate(filteredOrders, ordersPage, ORDERS_PER_PAGE);
  body.innerHTML = page
    .map(
      (o) => `
    <tr style="cursor:pointer" onclick="openOrderDetail('${o.id}')">
      <td><span style="font-weight:500;color:var(--brown-400)">#${o.id}</span></td>
      <td>
        <div class="flex-center gap-8">
          <div class="customer-avatar">${initials(o.customer)}</div>
          ${o.customer}
        </div>
      </td>
      <td class="text-muted">${o.date}</td>
      <td>${statusBadge(o.status)}</td>
      <td>${statusBadge(o.payment)}</td>
      <td style="font-weight:500">${formatPrice(o.total)}</td>
      <td><button class="ellipsis-btn">···</button></td>
    </tr>`,
    )
    .join("");

  renderPagination(
    "orders-pagination",
    filteredOrders.length,
    ordersPage,
    ORDERS_PER_PAGE,
    `function(p){ordersPage=p;renderOrdersTable();}`,
  );
}

function filterOrders(q) {
  q = q.toLowerCase();
  filteredOrders = ORDERS.filter(
    (o) =>
      o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q),
  );
  ordersPage = 1;
  renderOrdersTable();
}

function filterOrdersByStatus(s) {
  filteredOrders = s ? ORDERS.filter((o) => o.status === s) : [...ORDERS];
  ordersPage = 1;
  renderOrdersTable();
}

function showOrdersList() {
  document.getElementById("orders-list-view").style.display = "";
  document.getElementById("orders-detail-view").style.display = "none";
}

function openOrderDetail(id) {
  navigate("orders", document.querySelector('[onclick*="orders"]'));
  const o = ORDERS.find((x) => x.id === id);
  if (!o) return;
  document.getElementById("orders-list-view").style.display = "none";
  document.getElementById("orders-detail-view").style.display = "";

  document.getElementById("detail-order-id").textContent = "#" + o.id;
  document.getElementById("detail-order-date").textContent = o.date;
  document.getElementById("detail-status-badge").innerHTML = statusBadge(
    o.status,
  );
  document.getElementById("detail-payment-badge").innerHTML = statusBadge(
    o.payment,
  );
  document.getElementById("detail-customer-name").textContent = o.customer;
  document.getElementById("detail-customer-email").textContent = o.email;
  document.getElementById("detail-customer-avatar").textContent = initials(
    o.customer,
  );
  document.getElementById("detail-shipping-address").textContent = o.address;

  const itemsEl = document.getElementById("detail-items");
  if (itemsEl) {
    itemsEl.innerHTML = o.items
      .map(
        (item) => `
      <div class="metric-row">
        <div class="flex-center gap-12">
          <div class="product-thumb">👗</div>
          <div>
            <div style="font-size:13.5px;font-weight:500;color:var(--brown-400)">${item.name}</div>
            <div class="text-sm text-muted">${item.variant} × ${item.qty}</div>
          </div>
        </div>
        <div style="font-weight:500">${formatPrice(item.price)}</div>
      </div>`,
      )
      .join("");
  }

  const total = o.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const summaryEl = document.getElementById("detail-summary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="metric-row"><span class="text-sm text-muted">Subtotal</span><span style="font-size:13.5px">${formatPrice(total)}</span></div>
      <div class="metric-row"><span class="text-sm text-muted">Shipping</span><span style="font-size:13.5px">₱150.00</span></div>
      <div class="metric-row" style="border-top:1px solid var(--border);padding-top:10px;margin-top:4px">
        <span style="font-weight:600;color:var(--brown-400)">Total</span>
        <span style="font-weight:600;color:var(--brown-400)">${formatPrice(total + 150)}</span>
      </div>`;
  }

  const timelineEl = document.getElementById("detail-timeline");
  if (timelineEl) {
    timelineEl.innerHTML = o.timeline
      .map(
        (t, i) => `
      <div class="flex-center gap-12" style="align-items:flex-start">
        <div style="width:8px;height:8px;border-radius:50%;background:${i === o.timeline.length - 1 ? "var(--brown-300)" : "var(--border)"};margin-top:5px;flex-shrink:0"></div>
        <span class="text-sm" style="color:${i === o.timeline.length - 1 ? "var(--brown-400)" : "var(--brown-200)"}">${t}</span>
      </div>`,
      )
      .join("");
  }

  // Staff: allow status update + tracking, but NO refund button
  const actionsEl = document.getElementById("detail-actions");
  if (actionsEl) {
    actionsEl.innerHTML = `
      <select class="filter-select" id="status-select" style="height:36px;font-size:13px">
        ${["Processing", "Shipped", "Delivered", "Cancelled"]
          .map(
            (s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`,
          )
          .join("")}
      </select>
      <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${o.id}')">Update Status</button>`;
  }
}

function updateOrderStatus(id) {
  const sel = document.getElementById("status-select");
  if (!sel) return;
  const o = ORDERS.find((x) => x.id === id);
  if (!o) return;
  const newStatus = sel.value;
  o.status = newStatus;
  document.getElementById("detail-status-badge").innerHTML =
    statusBadge(newStatus);
  toast("Order status updated to " + newStatus, "ok");
}

/* ─────────────────────────────────────────────
   PRODUCTS  (view + update stock only — no delete)
───────────────────────────────────────────── */
let filteredProducts = [...PRODUCTS];
let productsPage = 1;
const PRODUCTS_PER_PAGE = 8;

function renderProductsTable() {
  const body = document.getElementById("products-body");
  if (!body) return;
  const page = paginate(filteredProducts, productsPage, PRODUCTS_PER_PAGE);
  body.innerHTML = page
    .map(
      (p) => `
    <tr>
      <td>
        <div class="flex-center gap-12">
          <div class="product-thumb">👗</div>
          <span style="font-weight:500;color:var(--brown-400)">${p.name}</span>
        </div>
      </td>
      <td class="text-muted">${p.category}</td>
      <td style="font-weight:500">${formatPrice(p.price)}</td>
      <td>
        <div class="stock-bar-wrap">
          <span class="stock-num" style="color:${p.stock === 0 ? "var(--red)" : p.stock <= 3 ? "var(--gold)" : "var(--brown-300)"}">${p.stock}</span>
          <div class="progress-bar" style="flex:1">
            <div class="progress-fill" style="width:${Math.min(100, (p.stock / 30) * 100)}%;background:var(--gold)"></div>
          </div>
        </div>
      </td>
      <td>${statusBadge(p.status === "Low Stock" ? "Low Stock" : p.status)}</td>
      <td>
        <div class="flex-center gap-8">
          <button class="btn btn-outline btn-sm" onclick="openStockEditor('${p.id}')">Update Stock</button>
        </div>
      </td>
    </tr>`,
    )
    .join("");

  renderPagination(
    "products-pagination",
    filteredProducts.length,
    productsPage,
    PRODUCTS_PER_PAGE,
    `function(p){productsPage=p;renderProductsTable();}`,
  );
}

function filterProducts(q) {
  q = q.toLowerCase();
  filteredProducts = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
  );
  productsPage = 1;
  renderProductsTable();
}

function filterProductsByStatus(s) {
  filteredProducts = s
    ? PRODUCTS.filter(
        (p) =>
          p.status === s || (s === "Low Stock" && p.status === "Low Stock"),
      )
    : [...PRODUCTS];
  productsPage = 1;
  renderProductsTable();
}

function filterProductsByCategory(c) {
  filteredProducts = c
    ? PRODUCTS.filter((p) => p.category === c)
    : [...PRODUCTS];
  productsPage = 1;
  renderProductsTable();
}

// Staff sees a stock-update modal, not the full product editor
let stockEditId = null;
function openStockEditor(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  stockEditId = id;

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
            <label class="form-label">Current Stock</label>
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
    "Update Stock — " + p.name;
  document.getElementById("stock-qty-input").value = p.stock;
  openModal("modal-stock-edit");
}

function saveStock() {
  const p = PRODUCTS.find((x) => x.id === stockEditId);
  if (!p) return;
  const qty = parseInt(document.getElementById("stock-qty-input").value, 10);
  if (isNaN(qty) || qty < 0) {
    toast("Enter a valid stock quantity.", "error");
    return;
  }
  p.stock = qty;
  p.status = qty === 0 ? "Out of Stock" : qty <= 3 ? "Low Stock" : "Active";
  closeModal("modal-stock-edit");
  renderProductsTable();
  renderInventory();
  toast("Stock updated for " + p.name, "ok");
}

// Staff cannot add products — intercept the Add Product button
function openProductEditor() {
  showAccessDenied();
}

/* ─────────────────────────────────────────────
   CUSTOMERS  (view + add internal notes)
───────────────────────────────────────────── */
let filteredCustomers = [...CUSTOMERS];
let customersPage = 1;
const CUSTOMERS_PER_PAGE = 8;

function renderCustomersTable() {
  const body = document.getElementById("customers-body");
  if (!body) return;
  const page = paginate(filteredCustomers, customersPage, CUSTOMERS_PER_PAGE);
  body.innerHTML = page
    .map(
      (c) => `
    <tr style="cursor:pointer" onclick="openCustomerProfile('${c.id}')">
      <td>
        <div class="flex-center gap-12">
          <div class="customer-avatar">${initials(c.name)}</div>
          <span style="font-weight:500;color:var(--brown-400)">${c.name}</span>
        </div>
      </td>
      <td class="text-muted">${c.email}</td>
      <td>${c.orders}</td>
      <td style="font-weight:500">${formatPrice(c.spent)}</td>
      <td>${c.tags.map((t) => `<span class="badge badge-active">${t}</span>`).join(" ") || "—"}</td>
      <td class="text-muted">${c.since}</td>
      <td><button class="ellipsis-btn">···</button></td>
    </tr>`,
    )
    .join("");

  renderPagination(
    "customers-pagination",
    filteredCustomers.length,
    customersPage,
    CUSTOMERS_PER_PAGE,
    `function(p){customersPage=p;renderCustomersTable();}`,
  );
}

function filterCustomers(q) {
  q = q.toLowerCase();
  filteredCustomers = CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
  );
  customersPage = 1;
  renderCustomersTable();
}

function showCustomersList() {
  document.getElementById("customers-list-view").style.display = "";
  document.getElementById("customer-profile-view").style.display = "none";
}

function openCustomerProfile(id) {
  const c = CUSTOMERS.find((x) => x.id === id);
  if (!c) return;
  navigate("customers", document.querySelector('[onclick*="customers"]'));
  document.getElementById("customers-list-view").style.display = "none";
  document.getElementById("customer-profile-view").style.display = "";
  document.getElementById("profile-avatar").textContent = initials(c.name);
  document.getElementById("profile-name").textContent = c.name;
  document.getElementById("profile-email").textContent = c.email;
  document.getElementById("profile-total-orders").textContent = c.orders;
  document.getElementById("profile-total-spent").textContent = formatPrice(
    c.spent,
  );

  const cOrders = ORDERS.filter((o) => o.customer === c.name);
  document.getElementById("profile-orders").innerHTML = cOrders.length
    ? cOrders
        .map(
          (o) =>
            `<tr><td>#${o.id}</td><td class="text-muted">${o.date}</td><td>${statusBadge(o.status)}</td><td style="font-weight:500">${formatPrice(o.total)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="text-muted text-sm" style="padding:12px">No orders found</td></tr>`;
}

/* ─────────────────────────────────────────────
   PROMOTIONS  (view only — staff cannot create)
───────────────────────────────────────────── */
function renderPromotions() {
  const body = document.getElementById("promotions-body");
  if (!body) return;
  body.innerHTML = PROMOTIONS.map(
    (p) => `
    <tr>
      <td><span style="font-weight:600;font-family:var(--font-body);letter-spacing:.05em;color:var(--brown-400)">${p.code}</span></td>
      <td class="text-muted">${p.type}</td>
      <td style="font-weight:500">${p.discount}</td>
      <td class="text-muted text-sm">${p.conditions}</td>
      <td class="text-muted">${p.uses}</td>
      <td class="text-muted">${p.expiry}</td>
      <td>${statusBadge(p.status)}</td>
      <td>—</td>
    </tr>`,
  ).join("");
}

/* ─────────────────────────────────────────────
   INVENTORY  (view only — stock edits via Products)
───────────────────────────────────────────── */
let filteredInventory = [...INVENTORY];

function renderInventory() {
  const body = document.getElementById("inventory-body");
  if (!body) return;
  body.innerHTML = filteredInventory
    .map((item) => {
      const statusLabel =
        item.stock === 0
          ? "Out of Stock"
          : item.stock <= 3
            ? "Low Stock"
            : "In Stock";
      return `
    <tr>
      <td class="text-muted" style="font-family:monospace;font-size:12px">${item.sku}</td>
      <td>
        <div class="flex-center gap-12">
          <div class="product-thumb">👗</div>
          <div>
            <div style="font-size:13.5px;font-weight:500;color:var(--brown-400)">${item.name}</div>
            <div class="text-sm text-muted">${item.variant}</div>
          </div>
        </div>
      </td>
      <td style="font-weight:500;color:${item.stock === 0 ? "var(--red)" : item.stock <= 3 ? "var(--gold)" : "var(--brown-300)"}">${item.stock}</td>
      <td class="text-muted">${item.reserved}</td>
      <td class="text-muted">${item.incoming > 0 ? `+${item.incoming} incoming` : "—"}</td>
      <td>${statusBadge(statusLabel)}</td>
      <td>—</td>
    </tr>`;
    })
    .join("");
}

function filterInventory(q) {
  q = q.toLowerCase();
  filteredInventory = INVENTORY.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      i.variant.toLowerCase().includes(q),
  );
  renderInventory();
}

/* ─────────────────────────────────────────────
   CHARTS  (dashboard only for staff)
───────────────────────────────────────────── */
const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

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
      grid: { color: "rgba(230,221,210,0.6)", drawBorder: false },
      ticks: {
        color: "#b8a090",
        font: { family: "'DM Sans', sans-serif", size: 11 },
      },
      border: { display: false },
    },
  },
};

function initCharts(page) {
  if (page === "dashboard") {
    destroyChart("revenueChart");
    destroyChart("statusChart");

    const rCtx = document.getElementById("revenueChart");
    if (rCtx) {
      chartInstances["revenueChart"] = new Chart(rCtx, {
        type: "bar",
        data: {
          labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          datasets: [
            {
              label: "Revenue",
              data: [
                42000, 58000, 51000, 67000, 89000, 74000, 95000, 82000, 71000,
                88000, 102000, 118000,
              ],
              backgroundColor: BRAND_GOLD_BG,
              borderColor: BRAND_GOLD,
              borderWidth: 2,
              borderRadius: 4,
            },
          ],
        },
        options: { ...baseOptions },
      });
    }

    const sCtx = document.getElementById("statusChart");
    if (sCtx) {
      chartInstances["statusChart"] = new Chart(sCtx, {
        type: "line",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              label: "Orders",
              data: [12, 19, 14, 22, 17, 28, 21],
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
  }
}

/* ─────────────────────────────────────────────
   HIDE ADMIN-ONLY UI ELEMENTS
───────────────────────────────────────────── */
function applyStaffRestrictions() {
  // Hide "Add Product" button in topbar
  document.querySelectorAll('[onclick*="modal-add-product"]').forEach((el) => {
    el.style.display = "none";
  });
  // Hide "Create Discount" button in topbar (staff views promos but can't create)
  document.querySelectorAll('[onclick*="modal-add-promo"]').forEach((el) => {
    el.style.display = "none";
  });
  // Hide "Create Promotion" button on promotions page if it exists
  document
    .querySelectorAll("[onclick*=\"openModal('modal-add-promo')\"]")
    .forEach((el) => {
      el.style.display = "none";
    });
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
function init() {
  applyStaffRestrictions();
  renderDashboard();
  renderOrdersTable();
  renderProductsTable();
  renderCustomersTable();
  renderPromotions();
  renderInventory();
  initCharts("dashboard");
  populateUserInfo();
}

document.addEventListener("DOMContentLoaded", init);
