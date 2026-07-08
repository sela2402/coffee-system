// ================= data model =================

const TAX_RATE = 0.07;

const MENUS = {
  Iced: [
    { name: "Latte",             priceS: 1.50, priceM: 2.00, priceL: 2.50, hasSizes: true },
    { name: "Americano",         priceS: 1.25, priceM: 1.75, priceL: 2.25, hasSizes: true },
    { name: "Matcha",            priceS: 1.75, priceM: 2.25, priceL: 2.75, hasSizes: true },
    { name: "Green Tea",         priceS: 1.50, priceM: 2.00, priceL: 2.50, hasSizes: true },
    { name: "Espresso",          priceS: 1.00, priceM: 1.50, priceL: 2.00, hasSizes: true },
    { name: "Milk Tea",          priceS: 1.75, priceM: 2.25, priceL: 2.75, hasSizes: true },
    { name: "Coconut Matcha",    priceS: 2.00, priceM: 2.50, priceL: 3.00, hasSizes: true },
    { name: "Matcha Strawberry", priceS: 2.25, priceM: 2.75, priceL: 3.25, hasSizes: true },
  ],
  Hot: [
    { name: "Chocolate",  priceS: 1.25, priceM: 1.75, priceL: 2.25, hasSizes: true },
    { name: "Flat White", priceS: 1.50, priceM: 2.00, priceL: 2.50, hasSizes: true },
    { name: "Cappuccino", priceS: 1.50, priceM: 2.00, priceL: 2.50, hasSizes: true },
    { name: "Cafe Latte", priceS: 1.50, priceM: 2.00, priceL: 2.50, hasSizes: true },
    { name: "Milk Tea",   priceS: 1.75, priceM: 2.25, priceL: 2.25, hasSizes: true },
  ],
  Toast: [
    { name: "Cheese Toast",     priceS: 2.00, hasSizes: false },
    { name: "Jam Toast",        priceS: 1.75, hasSizes: false },
    { name: "Avocado Toast",    priceS: 2.50, hasSizes: false },
    { name: "Ham Toast",        priceS: 2.25, hasSizes: false },
    { name: "Strawberry Toast", priceS: 2.25, hasSizes: false },
  ],
  Dessert: [
    { name: "Cake",      priceS: 3.00, hasSizes: false },
    { name: "Ice Cream", priceS: 2.50, hasSizes: false },
    { name: "Cupcake",   priceS: 2.00, hasSizes: false },
    { name: "Mochi",     priceS: 1.75, hasSizes: false },
    { name: "Macaron",   priceS: 1.50, hasSizes: false },
  ],
};

const CATEGORY_DOT = { Iced: "dot-iced", Hot: "dot-hot", Toast: "dot-toast", Dessert: "dot-dessert" };

// ================= state =================

let orders = [];        // cart lines
let currentCategory = "Iced";
let selectedCartIndex = -1;
let activeItem = null;  // item currently open in the customize dialog
let activeCategory = null;
let selectedSize = "M"; // S / M / L

// ================= dom refs =================

const el = (id) => document.getElementById(id);

const categoryTabs = el("categoryTabs");
const itemGrid = el("itemGrid");
const cartList = el("cartList");
const cartEmpty = el("cartEmpty");
const subtotalVal = el("subtotalVal");
const taxVal = el("taxVal");
const totalVal = el("totalVal");
const removeBtn = el("removeBtn");
const checkoutBtn = el("checkoutBtn");

const itemModalBackdrop = el("itemModalBackdrop");
const modalItemName = el("modalItemName");
const sizeSection = el("sizeSection");
const sizeOptions = el("sizeOptions");
const sugarSection = el("sugarSection");
const sugarSlider = el("sugarSlider");
const sugarValue = el("sugarValue");
const noSizeSection = el("noSizeSection");
const singlePrice = el("singlePrice");
const qtyInput = el("qtyInput");
const qtyMinus = el("qtyMinus");
const qtyPlus = el("qtyPlus");
const cancelBtn = el("cancelBtn");
const addToCartBtn = el("addToCartBtn");

const receiptModalBackdrop = el("receiptModalBackdrop");
const receiptText = el("receiptText");
const saveReceiptBtn = el("saveReceiptBtn");
const closeReceiptBtn = el("closeReceiptBtn");

const toastEl = el("toast");
const headerClock = el("headerClock");

// ================= helpers =================

function money(n) {
  return "$" + n.toFixed(2);
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function tickClock() {
  const now = new Date();
  headerClock.textContent = now.toLocaleString(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}
tickClock();
setInterval(tickClock, 1000);

// ================= menu rendering =================

function renderCategoryTabs() {
  [...categoryTabs.querySelectorAll(".tab")].forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.cat === currentCategory);
  });
}

function renderItemGrid(category) {
  itemGrid.innerHTML = "";
  const menu = MENUS[category];
  menu.forEach((item) => {
    const card = document.createElement("button");
    card.className = "item-card";
    card.type = "button";

    const nameLine = document.createElement("div");
    nameLine.className = "item-name";
    const dot = `<span class="item-cat-dot ${CATEGORY_DOT[category]}"></span>`;
    nameLine.innerHTML = dot + item.name;

    const priceLine = document.createElement("div");
    priceLine.className = "item-price";
    priceLine.textContent = item.hasSizes
      ? `${money(item.priceS)} – ${money(item.priceL)}`
      : money(item.priceS);

    card.appendChild(nameLine);
    card.appendChild(priceLine);

    card.addEventListener("click", () => openItemDialog(item, category));
    itemGrid.appendChild(card);
  });
}

function showCategory(category) {
  currentCategory = category;
  renderCategoryTabs();
  renderItemGrid(category);
}

categoryTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  showCategory(btn.dataset.cat);
});

// ================= item customize dialog =================

function openItemDialog(item, category) {
  activeItem = item;
  activeCategory = category;
  selectedSize = "M";

  modalItemName.textContent = item.name;
  qtyInput.value = 1;

  if (item.hasSizes) {
    sizeSection.style.display = "";
    sugarSection.style.display = "";
    noSizeSection.style.display = "none";

    sizeOptions.innerHTML = "";
    const sizes = [
      { key: "S", price: item.priceS },
      { key: "M", price: item.priceM },
      { key: "L", price: item.priceL },
    ];
    sizes.forEach((s) => {
      const opt = document.createElement("div");
      opt.className = "size-opt" + (s.key === selectedSize ? " selected" : "");
      opt.textContent = `${s.key}  (${money(s.price)})`;
      opt.addEventListener("click", () => {
        selectedSize = s.key;
        [...sizeOptions.children].forEach((c) => c.classList.remove("selected"));
        opt.classList.add("selected");
      });
      sizeOptions.appendChild(opt);
    });

    sugarSlider.value = 50;
    sugarValue.textContent = "50%";
  } else {
    sizeSection.style.display = "none";
    sugarSection.style.display = "none";
    noSizeSection.style.display = "";
    singlePrice.textContent = money(item.priceS);
  }

  itemModalBackdrop.classList.add("open");
}

sugarSlider.addEventListener("input", () => {
  sugarValue.textContent = sugarSlider.value + "%";
});

qtyMinus.addEventListener("click", () => {
  qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
});
qtyPlus.addEventListener("click", () => {
  qtyInput.value = Math.min(20, (parseInt(qtyInput.value, 10) || 1) + 1);
});
qtyInput.addEventListener("change", () => {
  let v = parseInt(qtyInput.value, 10) || 1;
  v = Math.max(1, Math.min(20, v));
  qtyInput.value = v;
});

function closeItemDialog() {
  itemModalBackdrop.classList.remove("open");
  activeItem = null;
  activeCategory = null;
}

cancelBtn.addEventListener("click", closeItemDialog);
itemModalBackdrop.addEventListener("click", (e) => {
  if (e.target === itemModalBackdrop) closeItemDialog();
});

addToCartBtn.addEventListener("click", () => {
  if (!activeItem) return;

  const item = activeItem;
  const qty = parseInt(qtyInput.value, 10) || 1;

  let unitPrice, size, sugar;
  if (item.hasSizes) {
    size = selectedSize;
    unitPrice = size === "S" ? item.priceS : size === "L" ? item.priceL : item.priceM;
    sugar = parseInt(sugarSlider.value, 10);
  } else {
    size = "";
    unitPrice = item.priceS;
    sugar = -1;
  }

  orders.push({
    category: activeCategory,
    itemName: item.name,
    size,
    sugarLevel: sugar,
    unitPrice,
    quantity: qty,
  });

  closeItemDialog();
  refreshCart();
  showToast(`Added ${qty} × ${item.name} to cart`);
});

// ================= cart =================

function subtotal() {
  return orders.reduce((sum, o) => sum + o.unitPrice * o.quantity, 0);
}

function refreshCart() {
  cartList.innerHTML = "";

  if (orders.length === 0) {
    cartList.appendChild(cartEmpty);
    selectedCartIndex = -1;
  } else {
    orders.forEach((o, idx) => {
      const li = document.createElement("li");
      li.className = "cart-item" + (idx === selectedCartIndex ? " selected" : "");

      const sizeText = o.size ? ` (${o.size})` : "";
      const sugarText = o.sugarLevel >= 0 ? `, ${o.sugarLevel}% sugar` : "";
      const lineTotal = o.unitPrice * o.quantity;

      const top = document.createElement("div");
      top.className = "cart-item-top";
      top.innerHTML = `<span>${o.quantity}x ${o.itemName}${sizeText}</span><span>${money(lineTotal)}</span>`;

      const sub = document.createElement("div");
      sub.className = "cart-item-sub";
      sub.textContent = `${o.category}${sugarText}`;

      li.appendChild(top);
      li.appendChild(sub);

      li.addEventListener("click", () => {
        selectedCartIndex = idx;
        refreshCart();
      });

      cartList.appendChild(li);
    });
  }

  const sub = subtotal();
  const tax = sub * TAX_RATE;
  subtotalVal.textContent = money(sub);
  taxVal.textContent = money(tax);
  totalVal.textContent = money(sub + tax);
}

removeBtn.addEventListener("click", () => {
  if (selectedCartIndex < 0 || selectedCartIndex >= orders.length) {
    showToast("Select an item in the cart first.");
    return;
  }
  orders.splice(selectedCartIndex, 1);
  selectedCartIndex = -1;
  refreshCart();
});

// ================= checkout / receipt =================

function buildReceiptText() {
  const sub = subtotal();
  const tax = sub * TAX_RATE;
  const total = sub + tax;

  let text = "";
  text += "================ RECEIPT ================\n";
  text += new Date().toLocaleString() + "\n";
  text += "------------------------------------------\n";

  orders.forEach((o, i) => {
    const sizeText = o.size ? ` (${o.size})` : "";
    const lineTotal = o.unitPrice * o.quantity;
    text += `${i + 1}. ${o.quantity}x ${o.category} - ${o.itemName}${sizeText}  ${money(lineTotal)}\n`;
    if (o.sugarLevel >= 0) {
      text += `    Sugar level: ${o.sugarLevel}%\n`;
    }
  });

  text += "------------------------------------------\n";
  text += `Subtotal: ${money(sub)}\n`;
  text += `Tax (7%): ${money(tax)}\n`;
  text += `TOTAL:    ${money(total)}\n`;
  text += "===========================================\n";
  text += "Thank you for your order!";
  return text;
}

checkoutBtn.addEventListener("click", () => {
  if (orders.length === 0) {
    showToast("Your cart is empty.");
    return;
  }
  receiptText.textContent = buildReceiptText();
  receiptModalBackdrop.classList.add("open");
});

closeReceiptBtn.addEventListener("click", () => {
  receiptModalBackdrop.classList.remove("open");
  orders = [];
  selectedCartIndex = -1;
  refreshCart();
});

saveReceiptBtn.addEventListener("click", () => {
  const blob = new Blob([receiptText.textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "receipt.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Receipt saved to file.");
});

receiptModalBackdrop.addEventListener("click", (e) => {
  if (e.target === receiptModalBackdrop) {
    receiptModalBackdrop.classList.remove("open");
    orders = [];
    selectedCartIndex = -1;
    refreshCart();
  }
});

// ================= init =================

showCategory("Iced");
refreshCart();