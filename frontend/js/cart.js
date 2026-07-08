const Cart = (() => {
  let items = JSON.parse(localStorage.getItem('atelier_cart') || '[]');

  function save() {
    localStorage.setItem('atelier_cart', JSON.stringify(items));
    updateBadge();
  }

  function updateBadge() {
    const badge = document.getElementById('cartCount');
    const total = items.reduce((s, i) => s + i.quantity, 0);
    if (badge) badge.textContent = total;
  }

  function add(product, size, quantity = 1) {
    const key = `${product.id}-${size}`;
    const existing = items.find(i => i.key === key);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock);
    } else {
      items.push({
        key,
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        sku: product.sku,
        size,
        quantity,
        stock: product.stock
      });
    }
    save();
  }

  function remove(key) {
    items = items.filter(i => i.key !== key);
    save();
  }

  function updateQty(key, delta) {
    const item = items.find(i => i.key === key);
    if (!item) return;
    item.quantity = Math.max(1, Math.min(item.quantity + delta, item.stock));
    save();
  }

  function clear() {
    items = [];
    save();
  }

  function getItems() { return [...items]; }

  function getSubtotal() {
    return items.reduce((s, i) => s + i.price * i.quantity, 0);
  }

  function getShipping() {
    const sub = getSubtotal();
    return sub === 0 ? 0 : sub >= 500000 ? 0 : 25000;
  }

  function getTotal() { return getSubtotal() + getShipping(); }

  return { add, remove, updateQty, clear, getItems, getSubtotal, getShipping, getTotal, updateBadge };
})();

window.Cart = Cart;
