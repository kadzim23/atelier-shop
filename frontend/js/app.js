(() => {
  /* ─── STATE ─── */
  let allProducts = [];
  let activeCategory = 'all';
  let searchQuery = '';

  /* ─── DOM REFS ─── */
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');
  const catalogTitle = document.getElementById('catalogTitle');
  const catalogCount = document.getElementById('catalogCount');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');

  /* ─── INIT ─── */
  async function init() {
    Cart.updateBadge();
    await loadProducts();
    bindEvents();
  }

  /* ─── PRODUCTS ─── */
  async function loadProducts() {
    try {
      allProducts = await api.get('/products');
      renderProducts();
    } catch (e) {
      grid.innerHTML = '<p style="padding:40px;opacity:.5">Gagal memuat produk. Pastikan server berjalan.</p>';
    }
  }

  function renderProducts() {
    let list = allProducts;
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }

    catalogTitle.textContent = activeCategory === 'all' ? 'Semua Produk' : activeCategory;
    catalogCount.textContent = `${list.length} produk`;

    if (!list.length) {
      grid.innerHTML = '';
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    grid.innerHTML = list.map(p => `
      <article class="product-card" data-id="${p.id}" tabindex="0" role="button" aria-label="Lihat detail ${p.name}">
        <div class="product-thumb">
          <span class="product-number">${p.sku || 'No. —'}</span>
          ${p.stock <= 3 && p.stock > 0 ? `<span class="stock-badge">Sisa ${p.stock}</span>` : ''}
          ${p.stock === 0 ? `<span class="stock-badge">Habis</span>` : ''}
          <img src="${p.image_url || 'https://via.placeholder.com/600x800?text=No+Image'}"
               alt="${p.name}" loading="lazy"
               onerror="this.src='https://via.placeholder.com/600x800?text=No+Image'">
        </div>
        <p class="product-category">${p.category || ''}</p>
        <p class="product-name">${p.name}</p>
        <p class="product-price">${formatRupiah(p.price)}</p>
      </article>
    `).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => openProductModal(+card.dataset.id));
      card.addEventListener('keydown', e => { if (e.key === 'Enter') openProductModal(+card.dataset.id); });
    });
  }

  /* ─── PRODUCT MODAL ─── */
  function openProductModal(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const sizes = p.sizes ? p.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const overlay = document.getElementById('productModalOverlay');
    const modal = document.getElementById('productModal');

    modal.innerHTML = `
      <button class="modal-close" id="closeProductModal">✕</button>
      <div class="product-modal-grid">
        <div class="product-modal-img">
          <img src="${p.image_url || ''}" alt="${p.name}"
               onerror="this.src='https://via.placeholder.com/600x800?text=No+Image'">
        </div>
        <div class="product-modal-info">
          <span class="product-number">${p.sku || ''}</span>
          <h3>${p.name}</h3>
          <p class="product-modal-price">${formatRupiah(p.price)}</p>
          <p class="product-modal-desc">${p.description || 'Tidak ada deskripsi.'}</p>

          ${sizes.length ? `
            <p style="font-size:12px;font-weight:700;letter-spacing:.05em;margin-bottom:8px;opacity:.6">UKURAN</p>
            <div class="size-selector" id="sizeSelector">
              ${sizes.map(s => `<button class="size-chip" data-size="${s}">${s}</button>`).join('')}
            </div>` : ''}

          <p style="font-size:12px;font-weight:700;letter-spacing:.05em;margin-bottom:8px;opacity:.6">JUMLAH</p>
          <div class="qty-selector">
            <button class="qty-btn" id="qtyMinus">−</button>
            <span class="qty-value" id="qtyValue">1</span>
            <button class="qty-btn" id="qtyPlus">+</button>
          </div>
          <p class="stock-note">Stok tersedia: ${p.stock} pcs</p>

          <button class="btn-primary full-width" id="addToCartBtn" style="margin-top:24px"
            ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Stok Habis' : '+ Tambah ke Keranjang'}
          </button>
        </div>
      </div>
    `;

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    let selectedSize = sizes.length === 1 ? sizes[0] : null;
    let qty = 1;

    if (sizes.length === 1) {
      modal.querySelector(`.size-chip[data-size="${sizes[0]}"]`)?.classList.add('selected');
    }

    modal.querySelectorAll('.size-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        modal.querySelectorAll('.size-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedSize = chip.dataset.size;
      });
    });

    modal.querySelector('#qtyMinus')?.addEventListener('click', () => {
      if (qty > 1) { qty--; modal.querySelector('#qtyValue').textContent = qty; }
    });

    modal.querySelector('#qtyPlus')?.addEventListener('click', () => {
      if (qty < p.stock) { qty++; modal.querySelector('#qtyValue').textContent = qty; }
    });

    modal.querySelector('#addToCartBtn')?.addEventListener('click', () => {
      if (sizes.length && !selectedSize) { showToast('Pilih ukuran terlebih dahulu.'); return; }
      Cart.add(p, selectedSize || '-', qty);
      showToast(`${p.name} ditambahkan ke keranjang ✓`);
      closeProductModal();
      openCart();
    });

    document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeProductModal(); });
  }

  function closeProductModal() {
    document.getElementById('productModalOverlay').hidden = true;
    document.body.style.overflow = '';
  }

  /* ─── CART DRAWER ─── */
  function openCart() {
    renderCart();
    cartDrawer.classList.add('open');
    cartOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  function renderCart() {
    const items = Cart.getItems();
    const sub = Cart.getSubtotal();
    const shipping = Cart.getShipping();
    const total = Cart.getTotal();

    if (!items.length) {
      cartItemsEl.innerHTML = '<div class="cart-empty"><p>Keranjang masih kosong.</p><p style="font-size:13px;margin-top:6px">Mulai belanja produk ATELIER.</p></div>';
      cartFooter.hidden = true;
      return;
    }

    cartFooter.hidden = false;

    cartItemsEl.innerHTML = items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <img src="${item.image_url || ''}" alt="${item.name}"
             onerror="this.src='https://via.placeholder.com/70x88?text=IMG'">
        <div>
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-meta">Ukuran: ${item.size} · ${item.sku || ''}</p>
          <p class="cart-item-price">${formatRupiah(item.price)}</p>
        </div>
        <div class="cart-item-actions">
          <div class="cart-qty-controls">
            <button class="cart-qty-btn" data-action="minus" data-key="${item.key}">−</button>
            <span>${item.quantity}</span>
            <button class="cart-qty-btn" data-action="plus" data-key="${item.key}">+</button>
          </div>
          <button class="remove-item-btn" data-key="${item.key}">Hapus</button>
        </div>
      </div>
    `).join('');

    document.getElementById('cartSubtotal').textContent = formatRupiah(sub);
    document.getElementById('cartShipping').textContent = shipping === 0
      ? (sub > 0 ? 'GRATIS ✓' : formatRupiah(0))
      : formatRupiah(shipping);
    document.getElementById('cartTotal').textContent = formatRupiah(total);

    cartItemsEl.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const delta = btn.dataset.action === 'plus' ? 1 : -1;
        Cart.updateQty(key, delta);
        renderCart();
      });
    });

    cartItemsEl.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Cart.remove(btn.dataset.key);
        renderCart();
      });
    });
  }

  /* ─── CHECKOUT MODAL ─── */
  function openCheckout() {
    const items = Cart.getItems();
    if (!items.length) return;

    const sub = Cart.getSubtotal();
    const shipping = Cart.getShipping();
    const total = Cart.getTotal();

    const overlay = document.getElementById('checkoutOverlay');
    const modal = document.getElementById('checkoutModal');

    modal.innerHTML = `
      <button class="modal-close" id="closeCheckout">✕</button>
      <h3>Checkout</h3>
      <p class="modal-sub">Isi data pengiriman dengan lengkap.</p>

      <div class="form-row">
        <div>
          <input type="text" id="ck_name" placeholder="Nama lengkap *">
        </div>
        <div>
          <input type="email" id="ck_email" placeholder="Alamat email *">
        </div>
      </div>
      <input type="tel" id="ck_phone" placeholder="Nomor telepon">
      <textarea id="ck_address" placeholder="Alamat pengiriman lengkap *" rows="3" style="resize:vertical"></textarea>

      <p style="font-size:12px;font-weight:700;letter-spacing:.05em;margin-bottom:10px;opacity:.6">METODE PEMBAYARAN</p>
      <div class="payment-options">
        <label class="payment-option selected">
          <input type="radio" name="payment" value="transfer" checked>
          <span>🏦</span>
          <div>
            <p style="font-weight:600;font-size:14px">Transfer Bank</p>
            <p style="font-size:12px;opacity:.6">BCA / BNI / Mandiri</p>
          </div>
        </label>
        <label class="payment-option">
          <input type="radio" name="payment" value="qris">
          <span>⊞</span>
          <div>
            <p style="font-weight:600;font-size:14px">QRIS</p>
            <p style="font-size:12px;opacity:.6">Semua dompet digital</p>
          </div>
        </label>
        <label class="payment-option">
          <input type="radio" name="payment" value="cod">
          <span>💵</span>
          <div>
            <p style="font-weight:600;font-size:14px">COD (Bayar di Tempat)</p>
            <p style="font-size:12px;opacity:.6">Tersedia untuk area tertentu</p>
          </div>
        </label>
      </div>

      <div class="checkout-summary">
        <div class="summary-row"><span>${items.length} item</span><span>${formatRupiah(sub)}</span></div>
        <div class="summary-row"><span>Ongkir ${sub >= 500000 ? '(gratis)' : ''}</span><span>${shipping === 0 && sub > 0 ? 'GRATIS' : formatRupiah(shipping)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatRupiah(total)}</span></div>
      </div>

      <button class="btn-primary full-width" id="placeOrderBtn">Konfirmasi Pesanan</button>
    `;

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    modal.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        modal.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    document.getElementById('closeCheckout').addEventListener('click', () => {
      overlay.hidden = true;
      document.body.style.overflow = '';
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.hidden = true;
        document.body.style.overflow = '';
      }
    });

    document.getElementById('placeOrderBtn').addEventListener('click', async () => {
      const name = document.getElementById('ck_name').value.trim();
      const email = document.getElementById('ck_email').value.trim();
      const phone = document.getElementById('ck_phone').value.trim();
      const address = document.getElementById('ck_address').value.trim();
      const payment = modal.querySelector('input[name="payment"]:checked')?.value || 'transfer';

      if (!name || !email || !address) {
        showToast('Lengkapi nama, email, dan alamat.'); return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Format email tidak valid.'); return;
      }

      const btn = document.getElementById('placeOrderBtn');
      btn.disabled = true;
      btn.textContent = 'Memproses…';

      try {
        const payload = {
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          customer_address: address,
          payment_method: payment,
          items: Cart.getItems().map(i => ({
            product_id: i.product_id,
            size: i.size,
            quantity: i.quantity
          }))
        };

        const result = await api.post('/orders', payload);
        Cart.clear();
        closeCart();

        modal.innerHTML = `
          <div class="order-success">
            <div class="check-icon">✓</div>
            <h3>Pesanan Berhasil!</h3>
            <p style="opacity:.6;font-size:14px;margin-top:6px">Nomor pesanan kamu:</p>
            <div class="order-number-display">${result.order_number}</div>
            <div class="checkout-summary" style="text-align:left">
              <div class="summary-row"><span>Subtotal</span><span>${formatRupiah(result.subtotal)}</span></div>
              <div class="summary-row"><span>Ongkir</span><span>${result.shipping_fee === 0 ? 'GRATIS' : formatRupiah(result.shipping_fee)}</span></div>
              <div class="summary-row total"><span>Total</span><span>${formatRupiah(result.total)}</span></div>
            </div>
            <p style="font-size:13px;opacity:.6;margin-bottom:20px">Simpan nomor pesanan untuk melacak status pengiriman.</p>
            <button class="btn-primary" id="doneBtn">Selesai</button>
          </div>
        `;

        document.getElementById('doneBtn').addEventListener('click', () => {
          overlay.hidden = true;
          document.body.style.overflow = '';
          loadProducts();
        });
      } catch (err) {
        showToast(err.error || 'Gagal membuat pesanan. Coba lagi.');
        btn.disabled = false;
        btn.textContent = 'Konfirmasi Pesanan';
      }
    });
  }

  /* ─── ORDER TRACKING ─── */
  function openTrack() {
    document.getElementById('trackOverlay').hidden = false;
    document.getElementById('trackOrderNumber').value = '';
    document.getElementById('trackResult').innerHTML = '';
    document.body.style.overflow = 'hidden';
  }

  /* ─── EVENTS ─── */
  function bindEvents() {
    /* nav category */
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.category;
        renderProducts();
        document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
      });
    });
    document.querySelector('.nav-link[data-category="all"]')?.classList.add('active');

    /* search */
    document.getElementById('searchToggle').addEventListener('click', () => {
      const bar = document.getElementById('searchBar');
      bar.classList.toggle('open');
      if (bar.classList.contains('open')) document.getElementById('searchInput').focus();
    });

    document.getElementById('searchInput').addEventListener('input', e => {
      searchQuery = e.target.value;
      renderProducts();
      if (searchQuery) document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
    });

    /* cart */
    document.getElementById('cartToggle').addEventListener('click', openCart);
    document.getElementById('closeCart').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    document.getElementById('checkoutBtn').addEventListener('click', () => { closeCart(); openCheckout(); });

    /* hero shop now */
    document.getElementById('shopNowBtn')?.addEventListener('click', () => {
      document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
    });

    /* track */
    document.getElementById('trackBtn').addEventListener('click', openTrack);
    document.getElementById('footerTrackBtn')?.addEventListener('click', openTrack);
    document.getElementById('closeTrack').addEventListener('click', () => {
      document.getElementById('trackOverlay').hidden = true;
      document.body.style.overflow = '';
    });

    document.getElementById('trackSubmit').addEventListener('click', async () => {
      const num = document.getElementById('trackOrderNumber').value.trim();
      if (!num) { showToast('Masukkan nomor pesanan.'); return; }
      const resultEl = document.getElementById('trackResult');
      resultEl.innerHTML = '<p style="font-size:14px;opacity:.5;margin-top:12px">Memuat…</p>';
      try {
        const order = await api.get(`/orders/track/${encodeURIComponent(num)}`);
        const statusColor = { paid: '#C9A876', processing: '#4A90D9', shipped: '#8B6F47', completed: '#4A7A5C', cancelled: '#B3463F' };
        resultEl.innerHTML = `
          <div class="track-result-card">
            <span class="track-status" style="background:${statusColor[order.status] || '#eee'};color:#fff">${order.status.toUpperCase()}</span>
            <p style="font-weight:700;font-size:15px">${order.order_number}</p>
            <p style="font-size:13px;opacity:.6;margin-bottom:8px">${new Date(order.created_at).toLocaleString('id-ID')}</p>
            <p style="font-size:13px;margin-bottom:8px">👤 ${order.customer_name} · ${order.customer_email}</p>
            <p style="font-size:13px;margin-bottom:14px">📍 ${order.customer_address}</p>
            <div style="border-top:1px solid #E5DFD3;padding-top:10px">
              ${order.items.map(i => `
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
                  <span>${i.product_name} × ${i.quantity} <small style="opacity:.5">(${i.size})</small></span>
                  <span>${formatRupiah(i.price * i.quantity)}</span>
                </div>`).join('')}
              <div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px;margin-top:10px;padding-top:10px;border-top:1px solid #E5DFD3">
                <span>Total</span><span>${formatRupiah(order.total)}</span>
              </div>
            </div>
          </div>`;
      } catch (err) {
        resultEl.innerHTML = `<p style="color:#B3463F;font-size:14px;margin-top:12px">${err.error || 'Pesanan tidak ditemukan.'}</p>`;
      }
    });

    /* track overlay close on bg click */
    document.getElementById('trackOverlay').addEventListener('click', e => {
      if (e.target === document.getElementById('trackOverlay')) {
        document.getElementById('trackOverlay').hidden = true;
        document.body.style.overflow = '';
      }
    });

    /* mobile menu */
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('mainNav').classList.toggle('open');
    });
  }

  init();
})();
