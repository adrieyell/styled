/* ============================================
   STYLED ADMIN — app.js
   All interactivity, data, and chart setup
   ============================================ */

"use strict";

/* ─────────────────────────────────────────────
   MOCK DATA
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
      {
        name: "Leather Mini Shoulder Bag",
        variant: "Black",
        qty: 1,
        price: 5340,
      },
    ],
    address: "Bonifacio Global City, Taguig 1634, Philippines",
    timeline: [
      "Order placed — May 16, 2:00 PM",
      "Paid — May 16, 2:01 PM",
      "Refunded — May 18, 9:00 AM",
    ],
  },
  {
    id: "STY-123451",
    customer: "Camille Santos",
    email: "camille.santos@gmail.com",
    date: "May 15, 2025",
    status: "Processing",
    payment: "Paid",
    total: 3240,
    items: [
      {
        name: "Silk Slip Skirt",
        variant: "S / Champagne",
        qty: 1,
        price: 3240,
      },
    ],
    address: "Ortigas Center, Pasig City 1600, Philippines",
    timeline: ["Order placed — May 15, 11:00 AM", "Paid — May 15, 11:01 AM"],
  },
  {
    id: "STY-123450",
    customer: "Patricia Gomez",
    email: "patricia.gomez@gmail.com",
    date: "May 15, 2025",
    status: "Delivered",
    payment: "Paid",
    total: 6750,
    items: [
      { name: "Linen Button Dress", variant: "M / Sand", qty: 1, price: 6750 },
    ],
    address: "Alabang, Muntinlupa City 1780, Philippines",
    timeline: [
      "Order placed — May 15, 8:00 AM",
      "Paid — May 15, 8:01 AM",
      "Shipped — May 16, 9:00 AM",
      "Delivered — May 17, 1:00 PM",
    ],
  },
  {
    id: "STY-123449",
    customer: "Mikaela Yu",
    email: "mikaela.yu@gmail.com",
    date: "May 14, 2025",
    status: "Shipped",
    payment: "Paid",
    total: 7990,
    items: [
      { name: "Oversized Blazer", variant: "M / Beige", qty: 1, price: 7990 },
    ],
    address: "San Juan City, Metro Manila 1500, Philippines",
    timeline: [
      "Order placed — May 14, 4:00 PM",
      "Paid — May 14, 4:01 PM",
      "Shipped — May 15, 10:00 AM",
    ],
  },
  {
    id: "STY-123448",
    customer: "Daniela Cruz",
    email: "daniela.cruz@gmail.com",
    date: "May 14, 2025",
    status: "Delivered",
    payment: "Paid",
    total: 11980,
    items: [
      {
        name: "Tailored Wide-Leg Pants",
        variant: "S / Cream",
        qty: 1,
        price: 9900,
      },
      { name: "Ribbed Knit Sweater", variant: "XS / Oat", qty: 1, price: 2080 },
    ],
    address: "Las Piñas City, Metro Manila 1747, Philippines",
    timeline: [
      "Order placed — May 14, 1:00 PM",
      "Paid — May 14, 1:01 PM",
      "Shipped — May 15, 8:00 AM",
      "Delivered — May 16, 2:00 PM",
    ],
  },
  {
    id: "STY-123447",
    customer: "Karena Lim",
    email: "karena.lim@gmail.com",
    date: "May 14, 2025",
    status: "Cancelled",
    payment: "Refunded",
    total: 3190,
    items: [
      { name: "Knit Camisole", variant: "M / Sage", qty: 1, price: 3190 },
    ],
    address: "Mandaluyong City, Metro Manila 1552, Philippines",
    timeline: [
      "Order placed — May 14, 9:00 AM",
      "Cancelled — May 14, 10:30 AM",
      "Refunded — May 14, 11:00 AM",
    ],
  },
  {
    id: "STY-123446",
    customer: "Sofia Aquino",
    email: "sofia.aquino@gmail.com",
    date: "May 13, 2025",
    status: "Delivered",
    payment: "Paid",
    total: 19800,
    items: [
      { name: "Cashmere Crewneck", variant: "M / Camel", qty: 2, price: 9900 },
    ],
    address: "Pasay City, Metro Manila 1300, Philippines",
    timeline: [
      "Order placed — May 13, 7:00 AM",
      "Paid — May 13, 7:01 AM",
      "Shipped — May 14, 9:00 AM",
      "Delivered — May 15, 1:00 PM",
    ],
  },
  {
    id: "STY-123445",
    customer: "Rica Tan",
    email: "rica.tan@gmail.com",
    date: "May 13, 2025",
    status: "Pending",
    payment: "Unpaid",
    total: 8250,
    items: [{ name: "Linen Blazer", variant: "S / Sage", qty: 1, price: 8250 }],
    address: "Parañaque City, Metro Manila 1700, Philippines",
    timeline: ["Order placed — May 13, 11:30 PM"],
  },
];

const PRODUCTS = [
  {
    id: "P001",
    name: "Oversized Wool Coat",
    category: "Outerwear",
    price: 24500,
    stock: 18,
    status: "Active",
  },
  {
    id: "P002",
    name: "Ribbed Knit Sweater",
    category: "Knitwear",
    price: 9900,
    stock: 26,
    status: "Active",
  },
  {
    id: "P003",
    name: "Tailored Wide-Leg Pants",
    category: "Bottoms",
    price: 9900,
    stock: 14,
    status: "Active",
  },
  {
    id: "P004",
    name: "Cashmere Crewneck",
    category: "Knitwear",
    price: 14250,
    stock: 8,
    status: "Low Stock",
  },
  {
    id: "P005",
    name: "Leather Mini Shoulder Bag",
    category: "Accessories",
    price: 6800,
    stock: 22,
    status: "Active",
  },
  {
    id: "P006",
    name: "Linen Button Dress",
    category: "Dresses",
    price: 6750,
    stock: 3,
    status: "Low Stock",
  },
  {
    id: "P007",
    name: "Oversized Blazer",
    category: "Outerwear",
    price: 7990,
    stock: 11,
    status: "Active",
  },
  {
    id: "P008",
    name: "Silk Slip Skirt",
    category: "Bottoms",
    price: 3240,
    stock: 0,
    status: "Draft",
  },
  {
    id: "P009",
    name: "Knit Camisole",
    category: "Knitwear",
    price: 3190,
    stock: 5,
    status: "Active",
  },
  {
    id: "P010",
    name: "Straight-Cut Trousers",
    category: "Bottoms",
    price: 5500,
    stock: 9,
    status: "Active",
  },
];

const CUSTOMERS = [
  {
    id: "C001",
    name: "Bea Santiago",
    email: "bea.santiago@gmail.com",
    orders: 12,
    spent: 62340,
    tags: ["VIP"],
    since: "Jan 2024",
  },
  {
    id: "C002",
    name: "Miguel Reyes",
    email: "miguel.reyes@gmail.com",
    orders: 8,
    spent: 41230,
    tags: ["Repeat Buyer"],
    since: "Mar 2024",
  },
  {
    id: "C003",
    name: "Trisha Mendoza",
    email: "trisha.mendoza@gmail.com",
    orders: 5,
    spent: 33120,
    tags: ["Repeat Buyer"],
    since: "May 2024",
  },
  {
    id: "C004",
    name: "Anna Dela Cruz",
    email: "anna.dela.cruz@gmail.com",
    orders: 6,
    spent: 79800,
    tags: ["VIP"],
    since: "Feb 2024",
  },
  {
    id: "C005",
    name: "Juan Pablo",
    email: "juan.pablo@gmail.com",
    orders: 3,
    spent: 16400,
    tags: [],
    since: "Aug 2024",
  },
  {
    id: "C006",
    name: "Camille Santos",
    email: "camille.santos@gmail.com",
    orders: 7,
    spent: 37650,
    tags: ["Repeat Buyer"],
    since: "Apr 2024",
  },
  {
    id: "C007",
    name: "Patricia Gomez",
    email: "patricia.gomez@gmail.com",
    orders: 4,
    spent: 14300,
    tags: [],
    since: "Jun 2024",
  },
  {
    id: "C008",
    name: "Mikaela Yu",
    email: "mikaela.yu@gmail.com",
    orders: 2,
    spent: 9800,
    tags: ["New"],
    since: "Jan 2025",
  },
];

const PROMOTIONS = [
  {
    code: "WELCOME10",
    type: "Percentage",
    discount: "10% off",
    conditions: "Min. spend ₱2,500",
    uses: "42 / 100",
    expiry: "Jun 30, 2025",
    status: "Active",
  },
  {
    code: "FRIEND",
    type: "Free Shipping",
    discount: "Free shipping",
    conditions: "Min. spend ₱1,000",
    uses: "89 / —",
    expiry: "—",
    status: "Active",
  },
  {
    code: "VIP15",
    type: "Percentage",
    discount: "15% off",
    conditions: "Min. spend ₱5,000",
    uses: "25 / 50",
    expiry: "Jul 15, 2025",
    status: "Active",
  },
  {
    code: "SALE20",
    type: "Percentage",
    discount: "20% off",
    conditions: "Min. spend ₱4,000",
    uses: "100 / 100",
    expiry: "May 15, 2025",
    status: "Expired",
  },
  {
    code: "SUMMER25",
    type: "Percentage",
    discount: "25% off",
    conditions: "Min. spend ₱1,000",
    uses: "0 / 500",
    expiry: "Sep 30, 2025",
    status: "Scheduled",
  },
];

const INVENTORY = [
  {
    name: "Oversized Wool Coat",
    variant: "XS / Camel",
    sku: "OWC-XS-CAM",
    category: "Outerwear",
    stock: 3,
    threshold: 3,
  },
  {
    name: "Oversized Wool Coat",
    variant: "S / Camel",
    sku: "OWC-S-CAM",
    category: "Outerwear",
    stock: 4,
    threshold: 3,
  },
  {
    name: "Oversized Wool Coat",
    variant: "M / Camel",
    sku: "OWC-M-CAM",
    category: "Outerwear",
    stock: 6,
    threshold: 3,
  },
  {
    name: "Ribbed Knit Sweater",
    variant: "S / Oat",
    sku: "RKS-S-OAT",
    category: "Knitwear",
    stock: 10,
    threshold: 5,
  },
  {
    name: "Ribbed Knit Sweater",
    variant: "M / Oat",
    sku: "RKS-M-OAT",
    category: "Knitwear",
    stock: 12,
    threshold: 5,
  },
  {
    name: "Tailored Wide-Leg Pants",
    variant: "XS / Black",
    sku: "TWP-XS-BLK",
    category: "Bottoms",
    stock: 2,
    threshold: 3,
  },
  {
    name: "Tailored Wide-Leg Pants",
    variant: "S / Black",
    sku: "TWP-S-BLK",
    category: "Bottoms",
    stock: 5,
    threshold: 3,
  },
  {
    name: "Cashmere Crewneck",
    variant: "XS / Ivory",
    sku: "CC-XS-IVO",
    category: "Knitwear",
    stock: 2,
    threshold: 3,
  },
  {
    name: "Cashmere Crewneck",
    variant: "S / Ivory",
    sku: "CC-S-IVO",
    category: "Knitwear",
    stock: 0,
    threshold: 3,
  },
  {
    name: "Leather Mini Shoulder Bag",
    variant: "Black",
    sku: "LMSB-BLK",
    category: "Accessories",
    stock: 22,
    threshold: 5,
  },
  {
    name: "Linen Button Dress",
    variant: "M / Sand",
    sku: "LBD-M-SND",
    category: "Dresses",
    stock: 3,
    threshold: 4,
  },
  {
    name: "Oversized Blazer",
    variant: "M / Beige",
    sku: "OB-M-BEI",
    category: "Outerwear",
    stock: 11,
    threshold: 5,
  },
];

const USERS = [
  {
    name: "Admin",
    email: "admin@styled.com",
    role: "Admin",
    status: "Active",
    lastActive: "Today",
  },
  {
    name: "Trisha Mendoza",
    email: "trisha.mendoza@styled.com",
    role: "Staff",
    status: "Active",
    lastActive: "May 16, 2025",
  },
  {
    name: "Miguel Reyes",
    email: "miguel.reyes@styled.com",
    role: "Staff",
    status: "Active",
    lastActive: "May 18, 2025",
  },
  {
    name: "Anna Cruz",
    email: "anna.cruz@styled.com",
    role: "Staff",
    status: "Inactive",
    lastActive: "Apr 30, 2025",
  },
];

/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
let currentPage = "dashboard";

function navigate(page, btn) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  if (btn) btn.classList.add("active");
  currentPage = page;

  const titles = {
    dashboard: "Welcome back, <span>Admin</span>",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    analytics: "Analytics",
    promotions: "Promotions",
    inventory: "Inventory",
    settings: "Settings",
    users: "Users",
  };
  document.getElementById("page-title").innerHTML = titles[page] || page;

  const showDateFilter = page === "dashboard" || page === "analytics";
  document.getElementById("topbar-date-filter").style.display = showDateFilter
    ? "flex"
    : "none";

  initCharts(page);
}

/* ─────────────────────────────────────────────
   MODALS
───────────────────────────────────────────── */
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
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
   DASHBOARD
───────────────────────────────────────────── */
function renderDashboard() {
  // Recent orders (last 5)
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

  // Top products
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

  // Low stock
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
   ORDERS
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

  document.getElementById("detail-order-id").textContent = "Order #" + o.id;
  document.getElementById("detail-status-badge").outerHTML =
    `<span id="detail-status-badge" class="badge badge-${o.status.toLowerCase().replace(" ", "-")}">${o.status}</span>`;
  document.getElementById("detail-payment-badge").outerHTML =
    `<span id="detail-payment-badge" class="badge badge-${o.payment.toLowerCase()}">${o.payment}</span>`;

  document.getElementById("detail-items").innerHTML = o.items
    .map(
      (item) => `
    <div class="order-item">
      <div class="order-item-img" style="display:flex;align-items:center;justify-content:center;font-size:24px">👗</div>
      <div style="flex:1">
        <div style="font-weight:500;font-size:13.5px;color:var(--brown-400)">${item.name}</div>
        <div class="text-sm text-muted">${item.variant} × ${item.qty}</div>
      </div>
      <div style="font-weight:500">${formatPrice(item.price * item.qty)}</div>
    </div>`,
    )
    .join("");

  const subtotal = o.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  document.getElementById("detail-subtotal").textContent =
    formatPrice(subtotal);
  document.getElementById("detail-total-price").textContent = formatPrice(
    o.total,
  );

  document.getElementById("detail-customer").innerHTML = `
    <div class="flex-center gap-12" style="margin-bottom:12px">
      <div class="customer-avatar" style="width:38px;height:38px;font-size:15px">${initials(o.customer)}</div>
      <div>
        <div style="font-weight:500;font-size:13.5px;color:var(--brown-400)">${o.customer}</div>
        <div class="text-sm text-muted">${o.email}</div>
      </div>
    </div>`;

  document.getElementById("detail-address").innerHTML = o.address.replace(
    /,\s*/g,
    "<br>",
  );

  document.getElementById("detail-timeline").innerHTML = o.timeline
    .map(
      (t, i) => `
    <div class="timeline-item">
      <div class="timeline-dot ${i >= o.timeline.length - 1 && !["Delivered", "Cancelled", "Refunded"].includes(o.status) ? "empty" : ""}"></div>
      <div class="timeline-content">
        <div class="timeline-label">${t.split(" — ")[0]}</div>
        <div class="timeline-time">${t.split(" — ")[1] || ""}</div>
      </div>
    </div>`,
    )
    .join("");
}

/* ─────────────────────────────────────────────
   PRODUCTS
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
          <span class="stock-num ${p.stock === 0 ? "" : ""}${p.stock <= 3 && p.stock > 0 ? "" : ""}${p.stock <= 3 ? "text-muted" : ""}"
            style="color:${p.stock === 0 ? "var(--red)" : p.stock <= 3 ? "var(--gold)" : "var(--brown-300)"}">${p.stock}</span>
          <div class="progress-bar" style="flex:1">
            <div class="progress-fill" style="width:${Math.min(100, (p.stock / 30) * 100)}%;background:${p.stock === 0 ? "var(--red)" : p.stock <= 5 ? "var(--gold)" : "var(--gold)"}"></div>
          </div>
        </div>
      </td>
      <td>${statusBadge(p.status === "Low Stock" ? "Low Stock" : p.status)}</td>
      <td>
        <div class="flex-center gap-8">
          <button class="btn btn-outline btn-sm" onclick="openProductEditor('${p.id}')">Edit</button>
          <button class="ellipsis-btn">···</button>
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

function showProductsList() {
  document.getElementById("products-list-view").style.display = "";
  document.getElementById("products-editor-view").style.display = "none";
}

function openProductEditor(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  document.getElementById("products-list-view").style.display = "none";
  document.getElementById("products-editor-view").style.display = "";
  document.getElementById("editor-product-name").textContent = p.name;
  document.getElementById("edit-product-name").value = p.name;
  document.getElementById("edit-price").value = p.price;
  switchProductTab(
    "general",
    document.querySelector("#product-editor-tabs .pill-tab"),
  );
}

function switchProductTab(tab, btn) {
  ["general", "variants", "inventory", "seo"].forEach((t) => {
    const el = document.getElementById("tab-" + t);
    if (el) el.style.display = t === tab ? "" : "none";
  });
  document
    .querySelectorAll("#product-editor-tabs .pill-tab")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

/* ─────────────────────────────────────────────
   CUSTOMERS
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
      <td>${c.tags.map((t) => `<span class="badge badge-vip" style="margin-right:4px">${t}</span>`).join("")}</td>
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
   ANALYTICS
───────────────────────────────────────────── */
function renderAnalytics() {
  const topProds = document.getElementById("analytics-top-products");
  if (topProds) {
    const sorted = [...PRODUCTS].sort((a, b) => b.stock - a.stock).slice(0, 5);
    topProds.innerHTML = sorted
      .map(
        (p, i) => `
      <div class="metric-row">
        <div>
          <div style="font-size:13.5px;font-weight:500;color:var(--brown-400)">${i + 1}. ${p.name}</div>
          <div class="text-sm text-muted">${p.category} — ${formatPrice(p.price)}</div>
        </div>
        <div class="text-sm text-bold">${p.stock + 81} sold</div>
      </div>`,
      )
      .join("");
  }

  const traffic = document.getElementById("analytics-traffic");
  if (traffic) {
    const sources = [
      { label: "Direct", pct: 42, color: "var(--brown-300)" },
      { label: "Instagram", pct: 29, color: "var(--gold)" },
      { label: "Google", pct: 20, color: "var(--blue)" },
      { label: "Email", pct: 9, color: "var(--brown-100)" },
    ];
    traffic.innerHTML = sources
      .map(
        (s) => `
      <div class="metric-row">
        <div style="font-size:13.5px">${s.label}</div>
        <div style="display:flex;align-items:center;gap:8px;width:160px">
          <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${s.pct}%;background:${s.color}"></div></div>
          <span class="text-sm text-bold" style="min-width:28px">${s.pct}%</span>
        </div>
      </div>`,
      )
      .join("");
  }
}

/* ─────────────────────────────────────────────
   PROMOTIONS
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
      <td><button class="ellipsis-btn">···</button></td>
    </tr>`,
  ).join("");
}

/* ─────────────────────────────────────────────
   INVENTORY
───────────────────────────────────────────── */
let filteredInventory = [...INVENTORY];

function renderInventory() {
  const body = document.getElementById("inventory-body");
  if (!body) return;
  body.innerHTML = filteredInventory
    .map((item) => {
      const isLow = item.stock > 0 && item.stock <= item.threshold;
      const isOut = item.stock === 0;
      const status = isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock";
      return `
      <tr>
        <td style="font-weight:500;color:var(--brown-400)">${item.name}</td>
        <td class="text-muted">${item.variant}</td>
        <td><code style="font-size:12px;background:var(--beige-100);padding:2px 6px;border-radius:3px">${item.sku}</code></td>
        <td class="text-muted">${item.category}</td>
        <td>
          <div class="flex-center gap-8">
            <span style="font-weight:600;color:${isOut ? "var(--red)" : isLow ? "var(--gold)" : "var(--brown-400)"}">${item.stock}</span>
            <div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${Math.min(100, (item.stock / 20) * 100)}%;background:${isOut ? "var(--red)" : isLow ? "var(--gold)" : "var(--gold)"}"></div></div>
          </div>
        </td>
        <td>${statusBadge(status)}</td>
        <td>
          <div class="flex-center gap-6">
            <input class="form-input" type="number" value="${item.stock}" style="width:65px;height:30px;padding:0 8px;font-size:13px" />
            <button class="btn btn-outline btn-sm">Update</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function filterInventory(q) {
  q = q.toLowerCase();
  filteredInventory = INVENTORY.filter(
    (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
  );
  renderInventory();
}

function filterInventoryByStatus(s) {
  if (!s) {
    filteredInventory = [...INVENTORY];
  } else if (s === "in")
    filteredInventory = INVENTORY.filter((i) => i.stock > i.threshold);
  else if (s === "low")
    filteredInventory = INVENTORY.filter(
      (i) => i.stock > 0 && i.stock <= i.threshold,
    );
  else if (s === "out")
    filteredInventory = INVENTORY.filter((i) => i.stock === 0);
  renderInventory();
}

/* ─────────────────────────────────────────────
   USERS
───────────────────────────────────────────── */
function renderUsers() {
  const body = document.getElementById("users-body");
  if (!body) return;
  const roleClass = {
    Admin: "role-admin",
    Staff: "role-staff",
  };
  body.innerHTML = USERS.map(
    (u) => `
    <tr>
      <td>
        <div class="flex-center gap-12">
          <div class="customer-avatar">${initials(u.name)}</div>
          <span style="font-weight:500;color:var(--brown-400)">${u.name}</span>
        </div>
      </td>
      <td class="text-muted">${u.email}</td>
      <td><span class="role-badge ${roleClass[u.role] || "role-staff"}">${u.role}</span></td>
      <td>${statusBadge(u.status)}</td>
      <td class="text-muted">${u.lastActive}</td>
      <td>
        <div class="flex-center gap-8">
          <button class="btn btn-outline btn-sm">Edit</button>
          <button class="ellipsis-btn">···</button>
        </div>
      </td>
    </tr>`,
  ).join("");
}

/* ─────────────────────────────────────────────
   SETTINGS
───────────────────────────────────────────── */
function switchSettings(section, btn) {
  document
    .querySelectorAll(".settings-section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".settings-nav-item")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("settings-" + section).classList.add("active");
  if (btn) btn.classList.add("active");
}

/* ─────────────────────────────────────────────
   CHARTS
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
const BRAND_BROWN = "rgba(92,68,51,1)";
const COLORS_DONUT = ["#3a6b4a", "#2d4f7a", "#5c4433", "#c4b5a0"];

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
            "May 12",
            "May 13",
            "May 14",
            "May 15",
            "May 16",
            "May 17",
            "May 18",
          ],
          datasets: [
            {
              data: [42000, 78000, 55000, 91000, 63000, 110000, 80000],
              backgroundColor: (ctx) => {
                const chart = ctx.chart;
                const { ctx: c, chartArea } = chart;
                if (!chartArea) return "rgba(61,36,16,0.7)";
                const g = c.createLinearGradient(
                  0,
                  chartArea.top,
                  0,
                  chartArea.bottom,
                );
                g.addColorStop(0, "rgba(61,36,16,0.78)");
                g.addColorStop(1, "rgba(61,36,16,0.10)");
                return g;
              },
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: { ...baseOptions },
      });
    }

    const sCtx = document.getElementById("statusChart");
    if (sCtx) {
      chartInstances["statusChart"] = new Chart(sCtx, {
        type: "doughnut",
        data: {
          labels: ["Paid", "Shipped", "Delivered", "Processing"],
          datasets: [
            {
              data: [100, 50, 30, 30],
              backgroundColor: ["#27503a", "#1e3f6a", "#3d2410", "#c4b5a0"],
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: baseOptions.plugins.tooltip,
          },
          cutout: "65%",
        },
      });
    }
  }

  if (page === "analytics") {
    destroyChart("analyticsRevenueChart");
    destroyChart("categoryChart");
    destroyChart("customerTypeChart");

    const arCtx = document.getElementById("analyticsRevenueChart");
    if (arCtx) {
      chartInstances["analyticsRevenueChart"] = new Chart(arCtx, {
        type: "line",
        data: {
          labels: [
            "May 12",
            "May 13",
            "May 14",
            "May 15",
            "May 16",
            "May 17",
            "May 18",
          ],
          datasets: [
            {
              data: [42000, 78000, 55000, 91000, 63000, 110000, 80000],
              borderColor: "rgba(61,36,16,0.65)",
              backgroundColor: "rgba(61,36,16,0.05)",
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

    const catCtx = document.getElementById("categoryChart");
    if (catCtx) {
      chartInstances["categoryChart"] = new Chart(catCtx, {
        type: "doughnut",
        data: {
          labels: [
            "Outerwear",
            "Knitwear",
            "Bottoms",
            "Dresses",
            "Accessories",
          ],
          datasets: [
            {
              data: [42, 29, 18, 6, 5],
              backgroundColor: [
                "#1c1109",
                "#3d2410",
                "#9a7a44",
                "#c4b5a0",
                "#b8a090",
              ],
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "right",
              labels: {
                font: { family: "'DM Sans'", size: 11 },
                color: "#7d6450",
                padding: 12,
              },
            },
            tooltip: baseOptions.plugins.tooltip,
          },
          cutout: "60%",
        },
      });
    }

    const ctCtx = document.getElementById("customerTypeChart");
    if (ctCtx) {
      chartInstances["customerTypeChart"] = new Chart(ctCtx, {
        type: "doughnut",
        data: {
          labels: ["New", "Returning"],
          datasets: [
            {
              data: [63, 37],
              backgroundColor: ["#3d2410", "#9a7a44"],
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: baseOptions.plugins.tooltip,
          },
          cutout: "65%",
        },
      });
    }
  }
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
  } catch (_) {
    // ignore network errors — still redirect
  }
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

      // Update topbar greeting
      const titleEl = document.getElementById("page-title");
      if (titleEl && currentPage === "dashboard") {
        titleEl.innerHTML = `Welcome back, <span>${u.full_name.split(" ")[0]}</span>`;
      }
    }
  } catch (_) {}
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
function init() {
  renderDashboard();
  renderOrdersTable();
  renderProductsTable();
  renderCustomersTable();
  renderAnalytics();
  renderPromotions();
  renderInventory();
  renderUsers();
  initCharts("dashboard");
  populateUserInfo();
}

document.addEventListener("DOMContentLoaded", init);
