// Globals
let cartItems = [];
let shippingCost = 15.00;
let cartSubtotal = 0;
let cartTotal = 0;
let createdOrder = null;

document.addEventListener('DOMContentLoaded', () => {
  cartItems = getCart();
  
  // Empty cart safety check
  if (cartItems.length === 0) {
    window.location.href = 'carrinho.html';
    return;
  }
  
  // Read shipping cost saved from cart page
  const savedShipping = localStorage.getItem('floricultura_checkout_shipping');
  if (savedShipping !== null) {
    shippingCost = parseFloat(savedShipping);
  }
  
  // Setup min date selection to today
  setMinDeliveryDate();
  
  // Populate UI fields
  setupCheckoutUI();
  
  // Setup event listeners
  setupCheckoutEvents();
});

function setMinDeliveryDate() {
  const dateInput = document.getElementById('d-data');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }
}

function setupCheckoutUI() {
  // 1. Render items list
  const listContainer = document.getElementById('checkout-summary-items-list');
  if (listContainer) {
    listContainer.innerHTML = '';
    cartSubtotal = 0;
    
    cartItems.forEach(item => {
      cartSubtotal += (item.preco * item.quantidade);
      
      let badge = '';
      if (item.isCustom) {
        badge = `<span class="badge bg-secondary me-2 small" style="font-size:0.65rem;">Personalizado</span>`;
      }
      
      listContainer.innerHTML += `
        <div class="d-flex justify-content-between align-items-start mb-2.5 pb-2 border-bottom border-light">
          <div>
            <div class="small fw-bold text-dark">${badge}${item.nome}</div>
            <span class="text-muted small">${item.quantidade}x ${formatPreco(item.preco)}</span>
          </div>
          <span class="small fw-bold text-dark">${formatPreco(item.preco * item.quantidade)}</span>
        </div>
      `;
    });
  }

  // 2. Adjust shipping and totals
  cartTotal = cartSubtotal + shippingCost;
  
  document.getElementById('checkout-subtotal-price').innerText = formatPreco(cartSubtotal);
  document.getElementById('checkout-shipping-price').innerText = shippingCost === 0 ? 'Grátis' : formatPreco(shippingCost);
  document.getElementById('checkout-total-price').innerText = formatPreco(cartTotal);
  
  // 3. Toggle fields based on shipping option chosen
  const pickupInfo = document.getElementById('pickup-info-msg');
  const addressFields = document.querySelectorAll('.address-field');
  const addressInputs = document.querySelectorAll('.address-input');
  
  if (shippingCost === 0) {
    // Pickup: hide address inputs, disable required validation
    if (pickupInfo) pickupInfo.classList.remove('d-none');
    addressFields.forEach(el => el.classList.add('d-none'));
    addressInputs.forEach(input => {
      input.removeAttribute('required');
      input.value = 'Retirada na Loja';
    });
  } else {
    // Delivery: show address inputs, enable required validation
    if (pickupInfo) pickupInfo.classList.add('d-none');
    addressFields.forEach(el => el.classList.remove('d-none'));
    addressInputs.forEach(input => {
      input.setAttribute('required', '');
      input.value = '';
    });
  }
}

function setupCheckoutEvents() {
  // Payment option toggle box fields
  const ccBox = document.getElementById('credit-card-fields-box');
  const ccInputs = ccBox ? ccBox.querySelectorAll('input') : [];
  
  const paymentOptions = document.querySelectorAll('input[name="paymentOption"]');
  paymentOptions.forEach(opt => {
    opt.addEventListener('change', (e) => {
      if (e.target.value === 'CARTAO') {
        ccBox.classList.remove('d-none');
        ccInputs.forEach(input => input.setAttribute('required', ''));
      } else {
        ccBox.classList.add('d-none');
        ccInputs.forEach(input => {
          input.removeAttribute('required');
          input.value = '';
        });
      }
    });
  });

  // Handle Form submit
  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
      }
      
      // Submit is valid: Compile Order
      processOrderSubmission();
    });
  }

  // Comanda print callback on success
  const btnPrint = document.getElementById('btn-success-print-comanda');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      if (createdOrder) {
        printComandaOrder(createdOrder);
      }
    });
  }
}

function processOrderSubmission() {
  const nome = document.getElementById('c-nome').value.trim();
  const telefone = document.getElementById('c-telefone').value.trim();
  const email = document.getElementById('c-email').value.trim();
  
  const dataEntrega = document.getElementById('d-data').value;
  const horaEntrega = document.getElementById('d-horario').value;
  const mensagem = document.getElementById('c-mensagem').value.trim();
  const metodoPagamento = document.querySelector('input[name="paymentOption"]:checked').value;
  
  let enderecoCompleto = 'Retirada na Loja Bella Floricultura';
  if (shippingCost > 0) {
    const rua = document.getElementById('d-rua').value.trim();
    const num = document.getElementById('d-numero').value.trim();
    const bairro = document.getElementById('d-bairro').value.trim();
    const comp = document.getElementById('d-comp').value.trim();
    
    enderecoCompleto = `${rua}, ${num} - Bairro: ${bairro}`;
    if (comp) {
      enderecoCompleto += ` (Compl: ${comp})`;
    }
  }

  const allOrders = getOrders();
  const orderId = 1021 + allOrders.length; // Create a clean order number
  
  createdOrder = {
    id: orderId,
    cliente: {
      nome: nome,
      telefone: telefone,
      email: email
    },
    itens: cartItems,
    endereco: enderecoCompleto,
    agendamento: {
      data: formatDateBRL(dataEntrega),
      horario: horaEntrega
    },
    mensagemCartao: mensagem || 'Sem mensagem',
    formaPagamento: metodoPagamento,
    subtotal: cartSubtotal,
    frete: shippingCost,
    total: cartTotal,
    dataPedido: new Date().toLocaleString('pt-BR'),
    status: 'Pendente de pagamento'
  };

  // Save order locally in state
  allOrders.push(createdOrder);
  saveOrders(allOrders);

  // Transition UI to Payment Gateway Simulation
  showPaymentSimulator(metodoPagamento);
}

function showPaymentSimulator(metodo) {
  // Hide form view
  document.getElementById('checkout-main-content').classList.add('d-none');
  
  // Show simulator view
  const simView = document.getElementById('payment-simulator-view');
  simView.classList.remove('d-none');
  
  const pixPanel = document.getElementById('sim-pix-panel');
  const cardPanel = document.getElementById('sim-card-panel');
  const counterEl = document.getElementById('webhook-countdown');
  
  let seconds = 10;
  
  if (metodo === 'PIX') {
    pixPanel.classList.remove('d-none');
    cardPanel.classList.add('d-none');
    seconds = 10; // 10 seconds simulation for PIX webhook
  } else {
    pixPanel.classList.add('d-none');
    cardPanel.classList.remove('d-none');
    seconds = 3; // 3 seconds simulation for quick Credit Card payment
  }
  
  if (counterEl) counterEl.innerText = seconds;

  // Run countdown simulation
  const timer = setInterval(() => {
    seconds--;
    if (counterEl) counterEl.innerText = seconds;
    
    if (seconds <= 0) {
      clearInterval(timer);
      confirmPaymentSuccess();
    }
  }, 1000);
}

// Simulated webhook approval callback
function confirmPaymentSuccess() {
  if (!createdOrder) return;
  
  // 1. Update order status to PAID in DB
  const allOrders = getOrders();
  const index = allOrders.findIndex(o => o.id === createdOrder.id);
  if (index > -1) {
    allOrders[index].status = 'Pago';
    createdOrder.status = 'Pago';
    saveOrders(allOrders);
  }

  // 2. Subtract stock quantities for custom bouquet flowers & bases
  updateInventoryStock(createdOrder.itens);

  // 3. Clear shopping cart
  saveCart([]);

  // 4. Update Success View
  document.getElementById('sim-state-waiting').classList.add('d-none');
  
  const successPanel = document.getElementById('sim-state-success');
  successPanel.classList.remove('d-none');
  
  document.getElementById('success-order-id').innerText = createdOrder.id;
  
  showToast('Pagamento confirmado com sucesso!');
}

function updateInventoryStock(itens) {
  const stock = getEstoque();
  let stockUpdated = false;

  itens.forEach(item => {
    // If it's a custom bouquet, subtract base and flower quantities
    if (item.isCustom && item.composicao) {
      const comp = item.composicao;
      
      // Subtract vase/base
      if (comp.base && stock[comp.base.id] !== undefined) {
        stock[comp.base.id] = Math.max(0, stock[comp.base.id] - item.quantidade);
        stockUpdated = true;
      }
      
      // Subtract flower stems
      for (const florId in comp.flores) {
        if (stock[florId] !== undefined) {
          stock[florId] = Math.max(0, stock[florId] - (comp.flores[florId] * item.quantidade));
          stockUpdated = true;
        }
      }
    }
  });

  if (stockUpdated) {
    saveEstoque(stock);
  }
}

// Generate printable receipts directly from client-side
function printComandaOrder(order) {
  // Create dynamic printable comanda div
  let printDiv = document.getElementById('comanda-print-zone');
  if (!printDiv) {
    printDiv = document.createElement('div');
    printDiv.id = 'comanda-print-zone';
    document.body.appendChild(printDiv);
  }
  
  // Format items text
  let itemsText = '';
  order.itens.forEach(item => {
    if (item.isCustom && item.composicao) {
      const comp = item.composicao;
      const details = item.composicao.descricaoCurta.split(' | ');
      
      itemsText += `
        <strong>${item.quantidade}x ${item.nome}</strong><br>
        - Recipiente: ${comp.base.nome}<br>
      `;
      
      // Flowers details
      details.forEach((det, dIndex) => {
        if (dIndex > 0) {
          itemsText += `&nbsp;&nbsp;${det}<br>`;
        }
      });
      itemsText += '<br>';
    } else {
      itemsText += `
        <strong>${item.quantidade}x ${item.nome}</strong><br>
        - Categoria: ${item.categoria || 'Geral'}<br><br>
      `;
    }
  });

  printDiv.innerHTML = `
    <div class="comanda-printable">
      <h3 class="text-center" style="font-family:'Courier New', monospace; font-weight: bold;">BELLA FIORITURA</h3>
      <p class="text-center" style="font-size:0.8rem;">Av. das Rosas, 750 | Tel: (11) 99999-9999</p>
      <div class="comanda-divider"></div>
      
      <p><strong>PEDIDO #${order.id}</strong></p>
      <p>Data: ${order.dataPedido}</p>
      <div class="comanda-divider"></div>
      
      <p><strong>Cliente:</strong> ${order.cliente.nome}</p>
      <p><strong>Telefone:</strong> ${order.cliente.telefone}</p>
      <p><strong>E-mail:</strong> ${order.cliente.email}</p>
      <div class="comanda-divider"></div>
      
      <p><strong>Itens:</strong></p>
      <div style="font-size: 0.85rem;">
        ${itemsText}
      </div>
      <div class="comanda-divider"></div>
      
      <p><strong>Mensagem Cartão:</strong></p>
      <p style="font-style: italic; font-size: 0.85rem;">"${order.mensagemCartao}"</p>
      <div class="comanda-divider"></div>
      
      <p><strong>Agendamento:</strong></p>
      <p>Data: ${order.agendamento.data}</p>
      <p>Horário: ${order.agendamento.horario}</p>
      <div class="comanda-divider"></div>
      
      <p><strong>Entrega:</strong></p>
      <p style="font-size:0.85rem;">${order.endereco}</p>
      <div class="comanda-divider"></div>
      
      <p><strong>Pagamento:</strong></p>
      <p>Método: ${order.formaPagamento === 'PIX' ? 'Pix Aprovado' : 'Cartão Crédito Aprovado'}</p>
      <p>Valor Pago: ${formatPreco(order.total)}</p>
      <div class="comanda-divider"></div>
      
      <h4 class="text-center" style="font-family:'Courier New', monospace; font-size:0.9rem; font-weight: bold; margin-top:20px;">PRONTO PARA PREPARAÇÃO</h4>
    </div>
  `;

  // Trigger print dialog
  window.print();
}

// Format date BRL (yyyy-mm-dd to dd/mm/yyyy)
function formatDateBRL(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
