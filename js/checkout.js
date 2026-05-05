// ============================================
// CHECKOUT PAGE - Cart, quantities, payment
// ============================================

function renderCart() {
  const cart = getCart();
  const tbody = document.getElementById("cart-table-body");
  const emptyEl = document.getElementById("cart-empty");
  const totalsEl = document.getElementById("order-totals");
  const tipBox = document.getElementById("style-tip-box");

  tbody.innerHTML = "";

  if (cart.length === 0) {
    emptyEl.style.display = "block";
    totalsEl.style.display = "none";
    tipBox.style.display = "none";
    document.querySelector(".btn-place-order")?.classList.add("disabled");
    return;
  }

  emptyEl.style.display = "none";
  totalsEl.style.display = "flex";
  tipBox.style.display = "block";
  document.querySelector(".btn-place-order")?.classList.remove("disabled");

  const firstItem = cart[0];
  document.getElementById("style-tip-img").src =
    firstItem.img || "assets/images/logo_styled.png";
  document.getElementById("style-tip-text").textContent =
    `You've added ${cart.length} item${cart.length > 1 ? "s" : ""} to your bag. Complete your look by pairing your selections with our curated accessories — free shipping on orders over ₱1000!`;

  let subtotal = 0;
  let totalQty = 0;

  cart.forEach((item, idx) => {
    const unitPrice = parsePrice(item.price);
    const qty = item.qty || 1;
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    totalQty += qty;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="item-cell"><div class="item-thumb-placeholder"><img class="item-thumb" src="${item.img}" alt="${item.name}" onerror="this.style.display='none'" style="width:56px;height:64px;object-fit:cover;" /></div><div><p class="item-name">${item.name}</p><p class="item-meta"><span class="item-color-swatch" style="background:${item.color}"></span>${item.category || ""}</p></div></div></td>
      <td><div class="qty-control"><button class="qty-btn" data-idx="${idx}" data-delta="-1">−</button><span class="qty-num">${qty}</span><button class="qty-btn" data-idx="${idx}" data-delta="1">+</button></div></td>
      <td>${formatPrice(unitPrice)}</td>
      <td>${formatPrice(lineTotal)}</td>
      <td><button class="remove-btn" data-idx="${idx}">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("nav-cart-badge").textContent = totalQty;

  const shipping = subtotal >= 1000 ? 0 : 99;
  const grand = subtotal + shipping;

  document.getElementById("subtotal-val").textContent = formatPrice(subtotal);
  document.getElementById("shipping-val").textContent =
    shipping === 0 ? "FREE" : formatPrice(shipping);
  document.getElementById("grand-total-val").textContent = formatPrice(grand);

  // Add event listeners
  document.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      const delta = parseInt(btn.dataset.delta);
      const cart = getCart();
      cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + delta);
      saveCart(cart);
      renderCart();
    });
  });

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      const cart = getCart();
      cart.splice(idx, 1);
      saveCart(cart);
      renderCart();
    });
  });
}

function formatCard(input) {
  let val = input.value.replace(/\D/g, "").substring(0, 16);
  input.value = val.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(input) {
  let val = input.value.replace(/\D/g, "").substring(0, 4);
  if (val.length >= 3) val = val.substring(0, 2) + " / " + val.substring(2);
  input.value = val;
}

function applyPromo() {
  const code = document.getElementById("co-promo").value.trim().toUpperCase();
  if (code === "STYLED10") {
    alert("Promo code applied! 10% off your order.");
  } else if (code === "") {
    alert("Please enter a promo code.");
  } else {
    alert("Invalid promo code. Try STYLED10!");
  }
}

function placeOrder() {
  const cart = getCart();
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const required = [
    { id: "co-name", label: "Full Name" },
    { id: "co-email", label: "Email Address" },
    { id: "co-phone", label: "Phone Number" },
    { id: "co-address", label: "Street Address" },
    { id: "co-city", label: "City" },
    { id: "co-zip", label: "ZIP Code" },
    { id: "co-province", label: "Province / Region" },
    { id: "co-card", label: "Card Number" },
    { id: "co-expiry", label: "Expiry Date" },
    { id: "co-cvv", label: "CVV" },
    { id: "co-cardholder", label: "Name on Card" },
  ];

  for (const field of required) {
    const val = document.getElementById(field.id).value.trim();
    if (!val) {
      alert(`Please fill in: ${field.label}`);
      document.getElementById(field.id).focus();
      return;
    }
  }

  const email = document.getElementById("co-email").value;
  if (!email.includes("@") || !email.includes(".")) {
    alert("Please enter a valid email address.");
    return;
  }

  saveCart([]);
  const orderNum = "STY-" + Math.floor(100000 + Math.random() * 900000);
  document.getElementById("success-order-num").textContent =
    "Order #" + orderNum;
  document.getElementById("success-overlay").classList.add("show");
}

// Card formatting
const cardInput = document.getElementById("co-card");
if (cardInput) cardInput.addEventListener("input", () => formatCard(cardInput));

const expiryInput = document.getElementById("co-expiry");
if (expiryInput)
  expiryInput.addEventListener("input", () => formatExpiry(expiryInput));

const promoBtn = document.getElementById("apply-promo-btn");
if (promoBtn) promoBtn.addEventListener("click", applyPromo);

const placeOrderBtn = document.getElementById("place-order-btn");
if (placeOrderBtn) placeOrderBtn.addEventListener("click", placeOrder);

// Close success overlay
document.querySelector(".success-overlay")?.addEventListener("click", (e) => {
  if (e.target.classList.contains("success-overlay")) {
    e.target.classList.remove("show");
  }
});

renderCart();
