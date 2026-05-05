// ============================================
// SHARED FUNCTIONS - Used across all pages
// ============================================

// PRODUCTS DATA (must be available for search on all pages)
const CATEGORIES = {
  tops: {
    label: "Category: Tops",
    displayName: "Tops",
    colors: ["#6b3a2a", "#1c1c1c", "#c9b99a"],
    products: [
      {
        name: "Mocha Wrap Tank",
        price: "₱320.00",
        img: "Assets/Images/Tops/Mocha Wrap Tank.png",
      },
      {
        name: "Coca Knot Tee",
        price: "₱299.00",
        img: "Assets/Images/Tops/Coca Knot Tee.png",
      },
      {
        name: "Cream Off-Shoulder",
        price: "₱350.00",
        img: "Assets/Images/Tops/Cream Off-Shoulder.png",
      },
      {
        name: "Wine Halter Blouse",
        price: "₱330.00",
        img: "Assets/Images/Tops/Wine Halter Blouse.png",
      },
      {
        name: "Midnight Peplum Top",
        price: "₱380.00",
        img: "Assets/Images/Tops/Midnight Peplum Top.png",
      },
      {
        name: "Black Lace Tank",
        price: "₱310.00",
        img: "Assets/Images/Tops/Black Lace Tank.png",
      },
      {
        name: "Rust Ruffle Top",
        price: "₱340.00",
        img: "Assets/Images/Tops/Rust Ruffle Top.png",
      },
      {
        name: "Ivory Flowy Top",
        price: "₱370.00",
        img: "Assets/Images/Tops/Ivory Flowy Top.png",
      },
      {
        name: "Sheer Chocolate Top",
        price: "₱300.00",
        img: "Assets/Images/Tops/Sheer Chocolate Top.png",
      },
      {
        name: "Textured Puff Sleeve Blouse",
        price: "₱370.00",
        img: "Assets/Images/Tops/Textured Puff Sleeve Blouse.png",
      },
    ],
  },
  bottoms: {
    label: "Category: Bottoms",
    displayName: "Bottoms",
    colors: ["#3d2b1f", "#8c6d57", "#e8ddd0"],
    products: [
      {
        name: "Midnight Lounge Shorts",
        price: "₱350.00",
        img: "Assets/Images/Bottoms/Midnight Lounge Shorts.png",
      },
      {
        name: "Sand Tailored Shorts",
        price: "₱270.00",
        img: "Assets/Images/Bottoms/Sand Tailored Shorts.png",
      },
      {
        name: "Striped Wrap Skirt",
        price: "₱490.00",
        img: "Assets/Images/Bottoms/Striped Wrap Skirt.png",
      },
      {
        name: "Bush Floral Skirt",
        price: "₱380.00",
        img: "Assets/Images/Bottoms/Bush Floral Skirt.png",
      },
      {
        name: "Cream Mini Skirt",
        price: "₱330.00",
        img: "Assets/Images/Bottoms/Cream Mini Skirt.png",
      },
      {
        name: "Pastel Bloom Skirt",
        price: "₱370.00",
        img: "Assets/Images/Bottoms/Pastel Bloom Skirt.png",
      },
      {
        name: "Sunshine Skirt",
        price: "₱460.00",
        img: "Assets/Images/Bottoms/Sunshine Skirt.png",
      },
      {
        name: "Black Maxi Skirt",
        price: "₱390.00",
        img: "Assets/Images/Bottoms/Black Maxi Skirt.png",
      },
      {
        name: "Wide-Leg Trousers",
        price: "₱420.00",
        img: "Assets/Images/Bottoms/Wide-Leg Trousers.png",
      },
      {
        name: "Chocolate Satin Pants",
        price: "₱420.00",
        img: "Assets/Images/Bottoms/Chocolate Satin Pants.png",
      },
    ],
  },
  dresses: {
    label: "Category: Dresses",
    displayName: "Dresses",
    colors: ["#5c3d2e", "#c9b99a", "#1e1510"],
    products: [
      {
        name: "Rosy Gingham Dress",
        price: "₱470.00",
        img: "Assets/Images/Dresses/Rosy Gingham Dress.png",
      },
      {
        name: "Olive Halter Dress",
        price: "₱450.00",
        img: "Assets/Images/Dresses/Olive Halter Dress.png",
      },
      {
        name: "Tie-Strap Dress",
        price: "₱650.00",
        img: "Assets/Images/Dresses/Tie-Strap Dress.png",
      },
      {
        name: "Mocha Bodycon",
        price: "₱470.00",
        img: "Assets/Images/Dresses/Mocha Bodycon.png",
      },
      {
        name: "Blush Lace Dress",
        price: "₱570.00",
        img: "Assets/Images/Dresses/Blush Lace Dress.png",
      },
      {
        name: "Slate Blue Dress",
        price: "₱440.00",
        img: "Assets/Images/Dresses/Slate Blue Dress.png",
      },
      {
        name: "Crimson Dress",
        price: "₱490.00",
        img: "Assets/Images/Dresses/Crimson Dress.png",
      },
      {
        name: "Wine Satin Dress",
        price: "₱500.00",
        img: "Assets/Images/Dresses/Wine Satin Dress.png",
      },
      {
        name: "Night Bodycon",
        price: "₱490.00",
        img: "Assets/Images/Dresses/Night Bodycon.png",
      },
      {
        name: "Soft Pink Dress",
        price: "₱470.00",
        img: "Assets/Images/Dresses/Soft Pink Dress.png",
      },
    ],
  },
  outerwear: {
    label: "Category: Outerwear",
    displayName: "Outerwear",
    colors: ["#2c1f14", "#7a6a5a", "#c9b99a"],
    products: [
      {
        name: "Two-Tone Bomber",
        price: "₱670.00",
        img: "Assets/Images/Outerwear/Two-Tone Bomber.png",
      },
      {
        name: "Corduroy Jacket",
        price: "₱690.00",
        img: "Assets/Images/Outerwear/Corduroy Jacket.png",
      },
      {
        name: "Minimalist Shacket",
        price: "₱550.00",
        img: "Assets/Images/Outerwear/Minimalist Shacket.png",
      },
      {
        name: "Zip Windbreaker",
        price: "₱800.00",
        img: "Assets/Images/Outerwear/Zip Windbreaker.png",
      },
      {
        name: "Utility Jacket",
        price: "₱570.00",
        img: "Assets/Images/Outerwear/Utility Jacket.png",
      },
      {
        name: "Shearling Trucker",
        price: "₱800.00",
        img: "Assets/Images/Outerwear/Shearling Trucker.png",
      },
      {
        name: "Leather Jacket",
        price: "₱990.00",
        img: "Assets/Images/Outerwear/Leather Jacket.png",
      },
      {
        name: "Patterned Bomber",
        price: "₱670.00",
        img: "Assets/Images/Outerwear/Patterned Bomber.png",
      },
      {
        name: "Leather Moto",
        price: "₱890.00",
        img: "Assets/Images/Outerwear/Leather Moto.png",
      },
      {
        name: "Oversized Utility Shacket",
        price: "₱670.00",
        img: "Assets/Images/Outerwear/Oversized Utility Shacket.png",
      },
    ],
  },
  accessories: {
    label: "Category: Accessories",
    displayName: "Accessories",
    colors: ["#8c6d57", "#2c1f14", "#f5f0ea"],
    products: [
      {
        name: "Beaded Ocean Necklace",
        price: "₱160.00",
        img: "Assets/Images/Accessories/Beaded Ocean Necklace.png",
      },
      {
        name: "Pearl Floral Earrings",
        price: "₱170.00",
        img: "Assets/Images/Accessories/Pearl Floral Earrings.png",
      },
      {
        name: "Gold Pearl Drops",
        price: "₱270.00",
        img: "Assets/Images/Accessories/Gold Pearl Drops.png",
      },
      {
        name: "Crochet Lace Bandana",
        price: "₱180.00",
        img: "Assets/Images/Accessories/Crochet Lace Bandana.png",
      },
      {
        name: "Braid Tail Chain",
        price: "₱670.00",
        img: "Assets/Images/Accessories/Braid Tail Chain.png",
      },
      {
        name: "Gold Arm Cuff",
        price: "₱130.00",
        img: "Assets/Images/Accessories/Gold Arm Cuff.png",
      },
      {
        name: "Hibiscus Hair Clips",
        price: "₱150.00",
        img: "Assets/Images/Accessories/Hibiscus Hair Clips.png",
      },
      {
        name: "Sun Stacking Rings",
        price: "₱270.00",
        img: "Assets/Images/Accessories/Sun Stacking Rings.png",
      },
      {
        name: "Starfish Layered Necklace",
        price: "₱160.00",
        img: "Assets/Images/Accessories/Starfish Layered Necklace.png",
      },
      {
        name: "Oval Retro Sunglasses",
        price: "₱370.00",
        img: "Assets/Images/Accessories/Oval Retro Sunglasses.png",
      },
    ],
  },
};

// Cart functions
function getCart() {
  try {
    return JSON.parse(sessionStorage.getItem("styled_cart")) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  sessionStorage.setItem("styled_cart", JSON.stringify(cart));
}

function updateBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const badges = document.querySelectorAll(".cart-badge");
  badges.forEach((badge) => {
    if (badge) badge.textContent = total;
  });
}

function parsePrice(str) {
  return parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
}

function formatPrice(num) {
  return "₱" + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ============================================
// SEARCH FUNCTIONALITY - Works on ALL pages
// ============================================

// Build search index once
const searchIndex = (function buildSearchIndex() {
  const index = [];
  // Add categories
  for (const [key, category] of Object.entries(CATEGORIES)) {
    index.push({
      type: "category",
      name: category.displayName,
      categoryKey: key,
      searchText: category.displayName.toLowerCase(),
    });
  }
  // Add products
  for (const [catKey, category] of Object.entries(CATEGORIES)) {
    for (const product of category.products) {
      index.push({
        type: "product",
        name: product.name,
        category: category.displayName,
        categoryKey: catKey,
        productData: product,
        searchText: product.name.toLowerCase(),
      });
    }
  }
  return index;
})();

function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return text.replace(regex, '<mark class="search-result-highlight">$1</mark>');
}

function performSearch(query, resultsContainer) {
  if (!query.trim()) {
    resultsContainer.innerHTML = "";
    return;
  }

  const lowerQuery = query.toLowerCase();
  const matches = searchIndex.filter((item) =>
    item.searchText.includes(lowerQuery),
  );

  if (matches.length === 0) {
    resultsContainer.innerHTML =
      '<div class="search-result-empty">No products found</div>';
    return;
  }

  resultsContainer.innerHTML = matches
    .map((match) => {
      if (match.type === "category") {
        return `<div class="search-result-item category-result" data-type="category" data-category="${match.categoryKey}"><div class="search-result-name">${highlightText(match.name, query)}</div><div class="search-result-category">Category</div></div>`;
      } else {
        return `<div class="search-result-item" data-type="product" data-product-name="${match.name.replace(/['"]/g, "&quot;")}" data-category="${match.categoryKey}" data-product='${JSON.stringify(match.productData).replace(/['"]/g, "&quot;")}'><div class="search-result-name">${highlightText(match.name, query)}</div><div class="search-result-category">in <span>${match.category}</span></div></div>`;
      }
    })
    .join("");

  // Add click handlers to results
  resultsContainer.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const category = item.dataset.category;
      closeAllSearchDropdowns();
      const isIndex =
        window.location.pathname.includes("index.html") ||
        window.location.pathname === "/" ||
        window.location.pathname.endsWith("/") ||
        window.location.pathname === "";
      if (isIndex) {
        const categoryItem = document.querySelector(
          `.category-item[data-category="${category}"]`,
        );
        if (categoryItem) categoryItem.click();
      } else {
        window.location.href = `index.html#category-${category}`;
      }
    });
  });
}

function closeAllSearchDropdowns() {
  document.querySelectorAll(".search-dropdown").forEach((dropdown) => {
    dropdown.classList.remove("open");
    const input = dropdown.querySelector("#search-input");
    if (input) input.value = "";
    const results = dropdown.querySelector(".search-results");
    if (results) results.innerHTML = "";
  });
}

// Initialize search on a specific search element
function initSearch(searchBtn, searchDropdown, searchInput, searchResults) {
  if (!searchBtn || !searchDropdown || !searchInput || !searchResults) return;

  let debounceTimer;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(
      () => performSearch(e.target.value, searchResults),
      300,
    );
  });

  searchBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = searchDropdown.classList.contains("open");
    if (isOpen) {
      searchDropdown.classList.remove("open");
      searchInput.value = "";
      searchResults.innerHTML = "";
    } else {
      // Close all other search dropdowns first
      closeAllSearchDropdowns();
      searchDropdown.classList.add("open");
      searchInput.focus();
    }
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !searchDropdown.contains(e.target) &&
      e.target !== searchBtn &&
      !searchBtn.contains(e.target)
    ) {
      searchDropdown.classList.remove("open");
      searchInput.value = "";
      searchResults.innerHTML = "";
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchDropdown.classList.contains("open")) {
      searchDropdown.classList.remove("open");
      searchInput.value = "";
      searchResults.innerHTML = "";
    }
  });
}

// Initialize all search components on the page
function initAllSearches() {
  const searchWrappers = document.querySelectorAll(".search-wrapper");
  searchWrappers.forEach((wrapper) => {
    const searchBtn = wrapper.querySelector("button");
    const searchDropdown = wrapper.querySelector(".search-dropdown");
    const searchInput = wrapper.querySelector("input");
    const searchResults = wrapper.querySelector(".search-results");
    if (searchBtn && searchDropdown) {
      initSearch(searchBtn, searchDropdown, searchInput, searchResults);
    }
  });
}

// Back to top
const backToTop = document.getElementById("back-to-top");
if (backToTop) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) backToTop.classList.add("visible");
    else backToTop.classList.remove("visible");
  });
  backToTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

// Cart button redirect
const cartBtn = document.getElementById("cart-btn");
if (cartBtn) {
  cartBtn.addEventListener(
    "click",
    () => (window.location.href = "checkout.html"),
  );
}

// Handle category hash on index page
if (
  window.location.pathname.includes("index.html") ||
  window.location.pathname === "/" ||
  window.location.pathname.endsWith("/") ||
  window.location.pathname === ""
) {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#category-")) {
    const category = hash.replace("#category-", "");
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        const categoryItem = document.querySelector(
          `.category-item[data-category="${category}"]`,
        );
        if (categoryItem) categoryItem.click();
      }, 300);
    });
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initAllSearches();
  updateBadge();
});
