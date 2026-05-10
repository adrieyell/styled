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

setInterval(() => {
  goToSlide(currentSlide === 3 ? 1 : currentSlide + 1);
}, 5000);

document.querySelectorAll(".slide-dot").forEach((dot) => {
  dot.addEventListener("click", () => goToSlide(parseInt(dot.dataset.slide)));
});

// "View Collection" → scroll to categories section
document.querySelectorAll(".btn-outline").forEach((btn) => {
  if (btn.textContent.trim() === "View Collection") {
    btn.textContent = "Explore Lookbook";
    btn.href = "#categories";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById("categories");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
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

// ── Loading / error helpers ───────────────────────────────────────────────────
function showProductsSpinner() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;
                justify-content:center;padding:80px 0;gap:16px;color:var(--text-muted);">
      <div style="width:32px;height:32px;border:2px solid #e0d6cc;
                  border-top-color:#8c7b6e;border-radius:50%;
                  animation:spin .75s linear infinite;"></div>
      <span style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">
        Loading products…
      </span>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
}

function showProductsError(message) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px 0;
                color:var(--text-muted);font-size:13px;letter-spacing:1px;">
      <svg style="width:32px;height:32px;margin-bottom:12px;opacity:.4;"
           viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <br>${message || "Failed to load products."}
      <br><button onclick="renderProducts(currentCategory)"
            style="margin-top:14px;padding:6px 18px;border:1px solid currentColor;
                   background:none;cursor:pointer;font-size:12px;letter-spacing:1px;">
        Try again
      </button>
    </div>`;
}

// Render Products
async function renderProducts(cat) {
  const grid = document.getElementById("products-grid");
  const titleEl = document.getElementById("products-cat-title");

  // Show static title immediately while we wait for the API
  const staticCat = CATEGORIES[cat];
  if (titleEl && staticCat) titleEl.textContent = staticCat.label;

  showProductsSpinner();

  let products = [];
  let usedFallback = false;

  try {
    // Pass price filter to the API when a range is active
    let min_price, max_price;
    if (activePriceRange !== "all") {
      [min_price, max_price] = activePriceRange.split("-").map(Number);
    }

    const raw = await fetchProducts({ category: cat, min_price, max_price });
    products = raw.map(normaliseProduct);

    // Keep cache and search index fresh
    _updateProductCache(products);
    searchIndex = buildSearchIndex();

    if (products.length > 0 && titleEl) {
      titleEl.textContent = "Category: " + products[0].category_name;
    }
  } catch (err) {
    console.warn("products.php fetch failed — using static fallback:", err);
    usedFallback = true;

    if (!staticCat) {
      showProductsError("Category not found.");
      return;
    }
    // Build fallback products in the same normalised shape
    products = staticCat.products.map((p) => ({
      ...p,
      img: p.img,
      colors: staticCat.colors,
    }));
  }

  // Client-side price filter (covers fallback path; API already filters on success)
  const filtered = products.filter((p) => {
    const priceValue = p.price_num != null ? p.price_num : parsePrice(p.price);
    return productMatchesPrice(String(priceValue), activePriceRange);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);font-size:13px;letter-spacing:1px;">No products match this price range.</div>`;
    return;
  }

  const colors = staticCat?.colors || ["#2c1f14", "#7a6a5a", "#c9b99a"];

  grid.innerHTML = filtered
    .map((p) => {
      const dotColors = p.colors || colors;
      const imgSrc = p.img || p.image || "";
      return `
    <div class="product-card" data-product-name="${p.name.replace(/"/g, "&quot;")}" data-category="${cat}">
      <div class="product-img-wrap">
        <button class="wish-btn ${isInWishlist(p.name) ? "active" : ""}" data-product-name="${p.name.replace(/"/g, "&quot;")}" data-product='${JSON.stringify({ name: p.name, price: p.price, img: imgSrc, description: p.description }).replace(/'/g, "&#39;")}'>
          <svg class="wish-icon" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" fill="currentColor"/></svg>
        </button>
        <img src="${imgSrc}" alt="${p.name}" loading="lazy" />
      </div>
      <p class="product-name">${p.name}</p>
      <p class="product-price">${p.price}</p>
      <div class="color-dots">
        ${dotColors.map((c) => `<span class="color-dot" style="background:${c}"></span>`).join("")}
      </div>
      <button class="btn-cart" data-product='${JSON.stringify(p).replace(/'/g, "&#39;")}'>
        <svg class="cart-btn-icon" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="currentColor"/><line x1="3" y1="6" x2="21" y2="6" stroke="white" stroke-width="1.5"/><path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="white" stroke-width="1.5"/></svg>
        Add to Cart
      </button>
    </div>
  `;
    })
    .join("");

  // Product card click → open modal (but not on button clicks)
  grid.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".wish-btn") || e.target.closest(".btn-cart"))
        return;
      const productName = card.dataset.productName;
      const categoryKey = card.dataset.category;
      const product = findCachedProduct(productName, categoryKey);
      if (product) openProductModal(product, categoryKey);
    });
  });

  // Wishlist button
  grid.querySelectorAll(".wish-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const product = JSON.parse(btn.dataset.product.replace(/&#39;/g, "'"));
      toggleWishlistItem(product);
      btn.classList.toggle("active", isInWishlist(product.name));
    });
  });

  // Add to Cart button
  // For categories with sizing → open the modal so the user picks a size first.
  // For accessories (no size) → add directly to cart.
  grid.querySelectorAll(".btn-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const product = JSON.parse(btn.dataset.product.replace(/&#39;/g, "'"));

      // If this category has sizing, open the modal so the user picks a size first
      if (!NO_SIZE_CATEGORIES.has(cat)) {
        const card = btn.closest(".product-card");
        const productName = card.dataset.productName;
        // findCachedProduct covers both the API cache and static fallback data,
        // but static products lack product_id; fall back to the btn's own data-product
        const found = findCachedProduct(productName, cat) || product;
        if (found) openProductModal(found, cat);
        return;
      }

      // Accessories: add directly (no size needed)
      const user = getCurrentUser();
      if (!user) {
        showToast("Please login to add to cart");
        return;
      }
      if (!product.product_id) {
        showToast("Could not add item — please try again.");
        return;
      }
      (async () => {
        await saveCart({ product_id: product.product_id, size: "", qty: 1 });
        await getCart();
      })();

      btn.innerHTML = `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Added!`;
      btn.style.background = "#2c1f14";
      btn.style.color = "white";
      setTimeout(() => {
        btn.innerHTML = `<svg class="cart-btn-icon" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="currentColor"/><line x1="3" y1="6" x2="21" y2="6" stroke="white" stroke-width="1.5"/><path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="white" stroke-width="1.5"/></svg>Add to Cart`;
        btn.style.background = "";
        btn.style.color = "";
      }, 1500);
    });
  });
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

document.querySelectorAll(".category-item").forEach((item) => {
  item.addEventListener("click", () =>
    showCategory(item.dataset.category, item),
  );
});

const priceFilterBtn = document.getElementById("price-filter-btn");
if (priceFilterBtn) priceFilterBtn.addEventListener("click", togglePriceFilter);

const applyPriceFilterBtn = document.getElementById("apply-price-filter");
if (applyPriceFilterBtn)
  applyPriceFilterBtn.addEventListener("click", applyPriceFilter);

document.addEventListener("click", (e) => {
  const pf = document.getElementById("price-filter");
  if (pf && !pf.contains(e.target)) pf.classList.remove("open");
});

// Initialize
renderProducts("tops");