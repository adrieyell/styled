// ============================================
// INDEX PAGE SPECIFIC CODE
// ============================================

let currentSlide = 1;
let activePriceRange = "all";
let currentCategory = "tops";

// Hero Slider
function goToSlide(n) {
  const prevSlide = document.getElementById("slide-" + currentSlide);
  const newSlide = document.getElementById("slide-" + n);
  if (prevSlide) prevSlide.classList.remove("active");
  if (newSlide) newSlide.classList.add("active");

  const dots = document.querySelectorAll(".slide-dot");
  if (dots[currentSlide - 1]) dots[currentSlide - 1].classList.remove("active");
  if (dots[n - 1]) dots[n - 1].classList.add("active");

  currentSlide = n;
}

// Auto slide
setInterval(() => {
  goToSlide(currentSlide === 3 ? 1 : currentSlide + 1);
}, 5000);

// Slide dot click handlers
document.querySelectorAll(".slide-dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    const slideNum = parseInt(dot.dataset.slide);
    goToSlide(slideNum);
  });
});

// Show Category
function showCategory(cat, el) {
  currentCategory = cat;
  document
    .querySelectorAll(".category-item")
    .forEach((i) => i.classList.remove("selected"));
  if (el) el.classList.add("selected");
  document
    .getElementById("products-section")
    .scrollIntoView({ behavior: "smooth", block: "start" });
  renderProducts(cat);
}

// Render Products
function renderProducts(cat) {
  const data = CATEGORIES[cat];
  if (!data) return;

  document.getElementById("products-cat-title").textContent = data.label;
  const grid = document.getElementById("products-grid");
  const colors = data.colors;
  const filtered = data.products.filter((p) =>
    productMatchesPrice(p.price, activePriceRange),
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);font-size:13px;letter-spacing:1px;">No products match this price range.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (p, i) => `
    <div class="product-card">
      <div class="product-img-wrap">
        <button class="wish-btn" data-wish><svg class="wish-icon" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" fill="currentColor"/></svg></button>
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
      </div>
      <p class="product-name">${p.name}</p>
      <p class="product-price">${p.price}</p>
      <div class="color-dots">
        ${colors.map((c, j) => `<span class="color-dot ${j === 0 ? "active" : ""}" style="background:${c}"></span>`).join("")}
      </div>
      <button class="btn-cart" data-product='${JSON.stringify(p)}'><svg class="cart-btn-icon" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="currentColor"/><line x1="3" y1="6" x2="21" y2="6" stroke="white" stroke-width="1.5"/><path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="white" stroke-width="1.5"/></svg>Add to Cart</button>
    </div>
  `,
    )
    .join("");

  // Add event listeners
  document.querySelectorAll(".wish-btn").forEach((btn) => {
    btn.removeEventListener("click", wishHandler);
    btn.addEventListener("click", wishHandler);
  });

  document.querySelectorAll(".color-dot").forEach((dot) => {
    dot.removeEventListener("click", colorHandler);
    dot.addEventListener("click", colorHandler);
  });

  document.querySelectorAll(".btn-cart").forEach((btn) => {
    btn.removeEventListener("click", cartHandler);
    btn.addEventListener("click", cartHandler);
  });
}

function wishHandler(e) {
  e.stopPropagation();
  e.currentTarget.classList.toggle("active");
}

function colorHandler() {
  this.closest(".color-dots")
    .querySelectorAll(".color-dot")
    .forEach((d) => d.classList.remove("active"));
  this.classList.add("active");
}

function cartHandler(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const product = JSON.parse(btn.dataset.product);
  const card = btn.closest(".product-card");
  const activeDot = card.querySelector(".color-dot.active");
  const color = activeDot ? activeDot.style.background : "#2c1f14";
  const imgEl = card.querySelector(".product-img-wrap img");
  const img = imgEl ? imgEl.src : "";
  const catTitle = document.getElementById("products-cat-title").textContent;

  const cart = getCart();
  const existing = cart.find(
    (i) => i.name === product.name && i.color === color,
  );
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({
      name: product.name,
      price: product.price,
      color,
      img,
      category: catTitle,
      qty: 1,
    });
  }
  saveCart(cart);
  updateBadge();

  btn.innerHTML = `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Added!`;
  btn.style.background = "#2c1f14";
  btn.style.color = "white";
  setTimeout(() => {
    btn.innerHTML = `<svg class="cart-btn-icon" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="currentColor"/><line x1="3" y1="6" x2="21" y2="6" stroke="white" stroke-width="1.5"/><path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="white" stroke-width="1.5"/></svg>Add to Cart`;
    btn.style.background = "";
    btn.style.color = "";
  }, 1500);
}

// Price Filter
function togglePriceFilter(e) {
  e.stopPropagation();
  document.getElementById("price-filter").classList.toggle("open");
}

const PRICE_LABELS = {
  all: "Price Range",
  "0-300": "Under ₱300",
  "300-600": "₱300 – ₱600",
  "600-900": "₱600 – ₱900",
  "900-99999": "₱900 & Above",
};

function applyPriceFilter() {
  const selected = document.querySelector('input[name="price-range"]:checked');
  activePriceRange = selected ? selected.value : "all";
  document.getElementById("price-filter").classList.remove("open");
  const btn = document.querySelector(".price-filter-btn");
  if (btn)
    btn.innerHTML =
      PRICE_LABELS[activePriceRange] + ' <span class="pf-arrow">▼</span>';
  renderProducts(currentCategory);
}

function productMatchesPrice(price, range) {
  if (range === "all") return true;
  const [min, max] = range.split("-").map(Number);
  const p = parsePrice(price);
  return p >= min && p <= max;
}

// Category click handlers
document.querySelectorAll(".category-item").forEach((item) => {
  item.addEventListener("click", () => {
    const category = item.dataset.category;
    showCategory(category, item);
  });
});

// Price filter button
const priceFilterBtn = document.getElementById("price-filter-btn");
if (priceFilterBtn) {
  priceFilterBtn.addEventListener("click", togglePriceFilter);
}

const applyPriceFilterBtn = document.getElementById("apply-price-filter");
if (applyPriceFilterBtn) {
  applyPriceFilterBtn.addEventListener("click", applyPriceFilter);
}

// Close price filter when clicking outside
document.addEventListener("click", (e) => {
  const pf = document.getElementById("price-filter");
  if (pf && !pf.contains(e.target)) {
    pf.classList.remove("open");
  }
});

// Initialize
renderProducts("tops");
