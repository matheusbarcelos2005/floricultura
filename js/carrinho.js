document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  setupCartEvents();
});

function setupCartEvents() {
  // Clear cart button click
  const btnClear = document.getElementById('btn-clear-cart');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('Tem certeza de que deseja esvaziar o carrinho?')) {
        saveCart([]);
        renderCart();
      }
    });
  }

  // Shipping type change triggers total recalculation
  const shippingRadios = document.querySelectorAll('input[name="shippingRadio"]');
  shippingRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      recalculateCartTotal();
    });
  });

  // Checkout button click
  const btnCheckout = document.getElementById('btn-cart-checkout');
  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      const cart = getCart();
      if (cart.length === 0) {
        showToast('Seu carrinho está vazio!');
        return;
      }
      
      // Save chosen shipping cost to read at checkout
      const selectedShipping = parseFloat(document.querySelector('input[name="shippingRadio"]:checked').value);
      localStorage.setItem('floricultura_checkout_shipping', selectedShipping);
      
      window.location.href = 'checkout.html';
    });
  }
}

function renderCart() {
  const cart = getCart();
  const itemsContainer = document.getElementById('cart-items-list-container');
  const cartColumn = document.getElementById('cart-items-column');
  const asideSummary = document.querySelector('aside');
  const emptyState = document.getElementById('cart-empty-state');
  
  if (!itemsContainer) return;

  if (cart.length === 0) {
    // Hide regular columns, show empty state
    if (cartColumn) cartColumn.style.setProperty('display', 'none', 'important');
    if (asideSummary) asideSummary.style.setProperty('display', 'none', 'important');
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  // Show regular layouts, hide empty state
  if (cartColumn) cartColumn.style.setProperty('display', 'block', 'important');
  if (asideSummary) asideSummary.style.setProperty('display', 'block', 'important');
  if (emptyState) emptyState.classList.add('d-none');

  itemsContainer.innerHTML = '';
  
  cart.forEach((item, index) => {
    let compositionDetailsHTML = '';
    
    // If it's a custom bouquet, build a detailed list
    if (item.isCustom && item.composicao) {
      compositionDetailsHTML = `
        <div class="mt-2 text-muted small bg-light p-2.5 rounded" style="font-size: 0.8rem; border-left: 3px solid var(--primary-floral);">
          <div class="mb-1"><strong>Base:</strong> ${item.composicao.base.nome}</div>
          <div><strong>Composição:</strong> ${item.composicao.descricaoCurta.split(' | ').slice(1).join(' | ')}</div>
        </div>
      `;
    }

    itemsContainer.innerHTML += `
      <div class="row align-items-center mb-4 pb-4 border-bottom">
        <!-- Thumbnail image -->
        <div class="col-3 col-md-2">
          <div style="width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 12px;">
            <img src="${item.imagem}" onerror="this.src='https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=100&q=80'" class="w-100 h-100" style="object-fit: cover;">
          </div>
        </div>
        
        <!-- Details name -->
        <div class="col-9 col-md-5 mt-2 mt-md-0">
          <h3 class="h6 mb-1 text-dark">${item.nome}</h3>
          <span class="text-muted small">${formatPreco(item.preco)} / un</span>
          ${compositionDetailsHTML}
        </div>
        
        <!-- Quantity counter -->
        <div class="col-6 col-md-3 mt-3 mt-md-0">
          <div class="qty-control justify-content-start gap-3 mt-0">
            <button class="qty-btn" onclick="updateCartItemQuantity(${index}, -1)">-</button>
            <span class="fw-bold px-1" style="font-size: 0.9rem;">${item.quantidade}</span>
            <button class="qty-btn" onclick="updateCartItemQuantity(${index}, 1)">+</button>
          </div>
        </div>
        
        <!-- Total product sum & Delete -->
        <div class="col-6 col-md-2 mt-3 mt-md-0 text-end d-flex flex-column align-items-end justify-content-center">
          <span class="fw-bold text-dark d-block mb-1">${formatPreco(item.preco * item.quantidade)}</span>
          <button class="btn btn-link text-danger p-0 border-0 small text-decoration-none" onclick="removeCartItem(${index})">
            Remover
          </button>
        </div>
      </div>
    `;
  });

  recalculateCartTotal();
}

function updateCartItemQuantity(index, change) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    const item = cart[index];
    item.quantidade = Math.max(1, item.quantidade + change);
    saveCart(cart);
    renderCart();
  }
}

function removeCartItem(index) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    const item = cart[index];
    if (confirm(`Remover "${item.nome}" do carrinho?`)) {
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
      showToast('Item removido do carrinho!');
    }
  }
}

function recalculateCartTotal() {
  const cart = getCart();
  
  // 1. Calculate subtotal
  const subtotal = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
  
  // 2. Read shipping costs
  const shippingRadio = document.querySelector('input[name="shippingRadio"]:checked');
  const shippingCost = shippingRadio ? parseFloat(shippingRadio.value) : 15.00;
  
  // 3. Sum total
  const total = subtotal + shippingCost;
  
  // 4. Update UI
  const subtotalPriceEl = document.getElementById('cart-subtotal-price');
  if (subtotalPriceEl) subtotalPriceEl.innerText = formatPreco(subtotal);
  
  const totalPriceEl = document.getElementById('cart-total-price');
  if (totalPriceEl) totalPriceEl.innerText = formatPreco(total);
}
