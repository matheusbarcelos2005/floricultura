// Globals
let ordersList = [];
let dbFlores = [];
let dbVasos = [];
let dbComplementos = [];
let stockLevels = {};
let selectedOrderForComanda = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Load databases
  dbFlores = await getFlores();
  dbVasos = await getVasos();
  dbComplementos = await getComplementos();
  
  // Refresh and Render Tab 1 (Orders)
  refreshOrdersData();
  
  // Render Tab 2 (Stock)
  renderStockLevels();

  // Render Tab 3 (Stats)
  calculateStatistics();

  // Setup tab refresh hooks to update stats dynamically when tab changes
  const statsTabBtn = document.getElementById('stats-tab');
  if (statsTabBtn) {
    statsTabBtn.addEventListener('click', () => {
      calculateStatistics();
    });
  }

  const stockTabBtn = document.getElementById('stock-tab');
  if (stockTabBtn) {
    stockTabBtn.addEventListener('click', () => {
      renderStockLevels();
    });
  }

  // Setup filters
  setupAdminEvents();
});

function refreshOrdersData() {
  ordersList = getOrders();
  renderOrdersTable();
}

function setupAdminEvents() {
  // Filter status change
  const filterSelect = document.getElementById('order-filter-status');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      renderOrdersTable();
    });
  }

  // Search input change
  const searchInput = document.getElementById('order-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderOrdersTable();
    });
  }

  // Refresh orders button
  const btnRefresh = document.getElementById('btn-refresh-orders');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      refreshOrdersData();
      showToast('Lista de pedidos atualizada!');
    });
  }

  // Save stock levels button
  const btnSaveStock = document.getElementById('btn-save-stock');
  if (btnSaveStock) {
    btnSaveStock.addEventListener('click', () => {
      saveStockLevelsFromInputs();
    });
  }

  // Modal print comanda button click
  const btnPrintModal = document.getElementById('btn-modal-print-comanda');
  if (btnPrintModal) {
    btnPrintModal.addEventListener('click', () => {
      if (selectedOrderForComanda) {
        printComandaOrder(selectedOrderForComanda);
      }
    });
  }
}

// Render Orders Tab
function renderOrdersTable() {
  const tbody = document.getElementById('orders-admin-tbody');
  const filterStatus = document.getElementById('order-filter-status').value;
  const searchVal = document.getElementById('order-search-input').value.trim().toLowerCase();
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  // Sort orders descending (newest first)
  const sorted = [...ordersList].reverse();
  
  // Filter list
  const filtered = sorted.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.cliente.nome.toLowerCase().includes(searchVal) || 
                          order.id.toString().includes(searchVal) || 
                          order.cliente.telefone.includes(searchVal);
    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          Nenhum pedido encontrado para a pesquisa selecionada.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(order => {
    // Generate items text snippet
    const itemsPreview = order.itens.map(i => `${i.quantidade}x ${i.nome}`).join('<br>');
    
    tbody.innerHTML += `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td><span class="small text-muted">${order.dataPedido.split(' ')[0]}</span></td>
        <td>
          <div class="fw-bold">${order.cliente.nome}</div>
          <span class="small text-muted">${order.cliente.telefone}</span>
        </td>
        <td>
          <span class="small d-block fw-bold">${order.agendamento.data}</span>
          <span class="small text-muted">${order.agendamento.horario}</span>
        </td>
        <td><strong>${formatPreco(order.total)}</strong></td>
        <td>
          <select class="form-select form-select-sm border-0 fw-semibold text-center py-1 rounded-pill bg-light" onchange="updateOrderStatus(${order.id}, this.value)" style="width:160px;">
            <option value="Pendente de pagamento" ${order.status === 'Pendente de pagamento' ? 'selected' : ''}>Pendente Pgto</option>
            <option value="Pago" ${order.status === 'Pago' ? 'selected' : ''}>Pago</option>
            <option value="Em preparação" ${order.status === 'Em preparação' ? 'selected' : ''}>Em Preparação</option>
            <option value="Saiu para entrega" ${order.status === 'Saiu para entrega' ? 'selected' : ''}>Saiu p/ Entrega</option>
            <option value="Entregue" ${order.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
            <option value="Cancelado" ${order.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-premium py-1 px-3 me-1" onclick="openComandaModal(${order.id})" style="border-radius:12px;">
            Ver Comanda
          </button>
          <button class="btn btn-sm btn-sage py-1 px-3" onclick="triggerDirectPrint(${order.id})" style="border-radius:12px;">
            Imprimir
          </button>
        </td>
      </tr>
    `;
  });
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index > -1) {
    orders[index].status = newStatus;
    saveOrders(orders);
    refreshOrdersData();
    showToast(`Pedido #${orderId} atualizado para "${newStatus}"`);
  }
}

// Modal view trigger
function openComandaModal(orderId) {
  const order = ordersList.find(o => o.id === orderId);
  if (!order) return;
  
  selectedOrderForComanda = order;
  const container = document.getElementById('comanda-modal-body-container');
  if (container) {
    let itemsHTML = '';
    order.itens.forEach(item => {
      if (item.isCustom && item.composicao) {
        const comp = item.composicao;
        const details = item.composicao.descricaoCurta.split(' | ');
        
        itemsHTML += `
          <strong>${item.quantidade}x ${item.nome}</strong><br>
          - Estilo: ${comp.estilo}<br>
          - Recipiente: ${comp.base.nome}<br>
        `;
        
        details.forEach((det, dIndex) => {
          if (dIndex > 0) {
            itemsHTML += `&nbsp;&nbsp;${det}<br>`;
          }
        });
        itemsHTML += '<br>';
      } else {
        itemsHTML += `
          <strong>${item.quantidade}x ${item.nome}</strong><br>
          - Categoria: ${item.categoria || 'Geral'}<br><br>
        `;
      }
    });

    container.innerHTML = `
      <div class="comanda-printable" style="border:none; padding: 0;">
        <h4 class="text-center fw-bold" style="font-family: 'Courier New', monospace;">BELLA FIORITURA</h4>
        <p class="text-center small mb-1" style="font-size:0.75rem;">Av. das Rosas, 750 | Tel: (11) 99999-9999</p>
        <div class="comanda-divider"></div>
        
        <p><strong>PEDIDO #${order.id}</strong></p>
        <p>Data: ${order.dataPedido}</p>
        <div class="comanda-divider"></div>
        
        <p><strong>Cliente:</strong> ${order.cliente.nome}</p>
        <p><strong>Telefone:</strong> ${order.cliente.telefone}</p>
        <p><strong>E-mail:</strong> ${order.cliente.email}</p>
        <div class="comanda-divider"></div>
        
        <p><strong>Itens:</strong></p>
        <div style="font-size:0.8rem;">
          ${itemsHTML}
        </div>
        <div class="comanda-divider"></div>
        
        <p><strong>Mensagem Cartão:</strong></p>
        <p style="font-style: italic; font-size:0.8rem;">"${order.mensagemCartao}"</p>
        <div class="comanda-divider"></div>
        
        <p><strong>Agendamento:</strong></p>
        <p>Data: ${order.agendamento.data}</p>
        <p>Horário: ${order.agendamento.horario}</p>
        <div class="comanda-divider"></div>
        
        <p><strong>Entrega:</strong></p>
        <p style="font-size:0.8rem;">${order.endereco}</p>
        <div class="comanda-divider"></div>
        
        <p><strong>Pagamento:</strong></p>
        <p>Método: ${order.formaPagamento === 'PIX' ? 'Pix Aprovado' : 'Cartão Crédito Aprovado'}</p>
        <p>Valor Pago: ${formatPreco(order.total)}</p>
        <div class="comanda-divider"></div>
      </div>
    `;
  }
  
  // Show Bootstrap modal
  const modalEl = document.getElementById('comandaModal');
  const modalObj = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modalObj.show();
}

function triggerDirectPrint(orderId) {
  const order = ordersList.find(o => o.id === orderId);
  if (order) {
    printComandaOrder(order);
  }
}

// Render Stock Tab
function renderStockLevels() {
  stockLevels = getEstoque();
  const container = document.getElementById('stock-items-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Render Flowers inputs
  container.innerHTML += `<div class="col-12"><h3 class="h6 text-muted text-uppercase mb-2" style="letter-spacing:1px;">Estoque de Flores (Hastes)</h3></div>`;
  dbFlores.forEach(flor => {
    const qty = stockLevels[flor.id] || 0;
    const isLow = qty < 15;
    
    container.innerHTML += `
      <div class="col-lg-3 col-md-4 col-sm-6">
        <div class="p-3 border rounded-3 bg-white h-100 d-flex flex-column justify-content-between">
          <div class="d-flex gap-2 align-items-center mb-2">
            <span class="fs-4">🌸</span>
            <div>
              <h4 class="h6 mb-0">${flor.nome}</h4>
              <span class="text-muted small" style="font-size:0.7rem;">Cód: ${flor.id}</span>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <input type="number" id="stock-input-${flor.id}" class="form-control form-control-sm text-center fw-bold" value="${qty}" min="0" style="width: 80px; border-radius:6px;">
            ${isLow ? '<span class="badge bg-danger ms-2" style="font-size:0.65rem;">Estoque Baixo</span>' : '<span class="badge bg-success ms-2" style="font-size:0.65rem;">Normal</span>'}
          </div>
        </div>
      </div>
    `;
  });
  
  // Render Recipient Bases inputs
  container.innerHTML += `<div class="col-12 mt-4"><h3 class="h6 text-muted text-uppercase mb-2" style="letter-spacing:1px;">Estoque de Bases, Vasos & Embalagens</h3></div>`;
  dbVasos.forEach(vaso => {
    const qty = stockLevels[vaso.id] || 0;
    const isLow = qty < 15;
    
    container.innerHTML += `
      <div class="col-lg-3 col-md-4 col-sm-6">
        <div class="p-3 border rounded-3 bg-white h-100 d-flex flex-column justify-content-between">
          <div class="d-flex gap-2 align-items-center mb-2">
            <span class="fs-4">🏺</span>
            <div>
              <h4 class="h6 mb-0">${vaso.nome}</h4>
              <span class="text-muted small" style="font-size:0.7rem;">Cód: ${vaso.id}</span>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <input type="number" id="stock-input-${vaso.id}" class="form-control form-control-sm text-center fw-bold" value="${qty}" min="0" style="width: 80px; border-radius:6px;">
            ${isLow ? '<span class="badge bg-danger ms-2" style="font-size:0.65rem;">Estoque Baixo</span>' : '<span class="badge bg-success ms-2" style="font-size:0.65rem;">Normal</span>'}
          </div>
        </div>
      </div>
    `;
  });
}

function saveStockLevelsFromInputs() {
  const stock = getEstoque();
  
  // Read flowers inputs
  dbFlores.forEach(flor => {
    const input = document.getElementById(`stock-input-${flor.id}`);
    if (input) {
      stock[flor.id] = Math.max(0, parseInt(input.value) || 0);
    }
  });
  
  // Read vases inputs
  dbVasos.forEach(vaso => {
    const input = document.getElementById(`stock-input-${vaso.id}`);
    if (input) {
      stock[vaso.id] = Math.max(0, parseInt(input.value) || 0);
    }
  });
  
  saveEstoque(stock);
  renderStockLevels();
  showToast('Estoque atualizado com sucesso!');
}

// Render Stats Tab
function calculateStatistics() {
  const orders = getOrders();
  
  // 1. Total faturamento approved (exclude pending and canceled)
  const approvedOrders = orders.filter(o => o.status !== 'Pendente de pagamento' && o.status !== 'Cancelado');
  const revenue = approvedOrders.reduce((sum, o) => sum + o.total, 0);
  document.getElementById('stats-total-revenue').innerText = formatPreco(revenue);
  
  // 2. Count totals
  document.getElementById('stats-total-orders').innerText = orders.length;
  
  const delivered = orders.filter(o => o.status === 'Entregue').length;
  document.getElementById('stats-completed-orders').innerText = `${delivered} pedidos finalizados e entregues`;
  
  // 3. Loop over items and aggregate statistics on bases and flower stems
  const flowersCount = {};
  const vasesCount = {};
  
  // Initialize frequencies
  dbFlores.forEach(f => flowersCount[f.nome] = 0);
  dbVasos.forEach(v => vasesCount[v.nome] = 0);
  
  approvedOrders.forEach(order => {
    order.itens.forEach(item => {
      if (item.isCustom && item.composicao) {
        const comp = item.composicao;
        
        // Tally vases
        if (comp.base) {
          const vObj = dbVasos.find(v => v.id === comp.base.id);
          if (vObj) {
            vasesCount[vObj.nome] = (vasesCount[vObj.nome] || 0) + item.quantidade;
          }
        }
        
        // Tally flowers
        for (const fId in comp.flores) {
          const fObj = dbFlores.find(f => f.id === fId);
          if (fObj) {
            flowersCount[fObj.nome] = (flowersCount[fObj.nome] || 0) + (comp.flores[fId] * item.quantidade);
          }
        }
      } else {
        // Tally pre-made products. If it is "buque", mock that it counts as a Kraft wrapper
        if (item.categoria === 'buques') {
          const kraftName = dbVasos.find(v => v.id === 'v4').nome;
          vasesCount[kraftName] = (vasesCount[kraftName] || 0) + item.quantidade;
        } else if (item.categoria === 'arranjos') {
          const vasoMName = dbVasos.find(v => v.id === 'v2').nome;
          vasesCount[vasoMName] = (vasesCount[vasoMName] || 0) + item.quantidade;
        }
      }
    });
  });

  // Render top base stats
  let topVaseName = '--';
  let topVaseQty = 0;
  for (const name in vasesCount) {
    if (vasesCount[name] > topVaseQty) {
      topVaseQty = vasesCount[name];
      topVaseName = name;
    }
  }
  document.getElementById('stats-top-vase').innerText = topVaseName;
  document.getElementById('stats-top-vase-desc').innerText = `${topVaseQty} recipientes utilizados`;

  // Render sorted flowers list
  const flowersListEl = document.getElementById('stats-top-flowers-list');
  if (flowersListEl) {
    flowersListEl.innerHTML = '';
    
    // Sort array
    const sortedFlowers = Object.entries(flowersCount).sort((a, b) => b[1] - a[1]);
    
    sortedFlowers.forEach(([name, qty]) => {
      flowersListEl.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2">
          <span>🌸 ${name}</span>
          <span class="badge bg-light text-dark border fw-bold">${qty} hastes</span>
        </li>
      `;
    });
  }

  // Render status distribution lists
  const statusDistEl = document.getElementById('stats-status-distribution-list');
  if (statusDistEl) {
    statusDistEl.innerHTML = '';
    
    const statuses = [
      'Pendente de pagamento',
      'Pago',
      'Em preparação',
      'Saiu para entrega',
      'Entregue',
      'Cancelado'
    ];
    
    statuses.forEach(status => {
      const count = orders.filter(o => o.status === status).length;
      let badgeClass = 'bg-secondary';
      if (status === 'Pendente de pagamento') badgeClass = 'bg-warning text-dark';
      else if (status === 'Pago') badgeClass = 'bg-success';
      else if (status === 'Em preparação') badgeClass = 'bg-info text-dark';
      else if (status === 'Saiu para entrega') badgeClass = 'bg-primary';
      else if (status === 'Entregue') badgeClass = 'bg-success';
      else if (status === 'Cancelado') badgeClass = 'bg-danger';
      
      statusDistEl.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2">
          <span>${status}</span>
          <span class="badge ${badgeClass}">${count}</span>
        </li>
      `;
    });
  }
}

// Print comanda formatting helper
function printComandaOrder(order) {
  let printDiv = document.getElementById('comanda-print-zone');
  if (!printDiv) {
    printDiv = document.createElement('div');
    printDiv.id = 'comanda-print-zone';
    document.body.appendChild(printDiv);
  }
  
  let itemsText = '';
  order.itens.forEach(item => {
    if (item.isCustom && item.composicao) {
      const comp = item.composicao;
      const details = item.composicao.descricaoCurta.split(' | ');
      
      itemsText += `
        <strong>${item.quantidade}x ${item.nome}</strong><br>
        - Estilo: ${comp.estilo}<br>
        - Recipiente: ${comp.base.nome}<br>
      `;
      
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
      <div style="font-size:0.85rem;">
        ${itemsText}
      </div>
      <div class="comanda-divider"></div>
      
      <p><strong>Mensagem Cartão:</strong></p>
      <p style="font-style: italic; font-size:0.85rem;">"${order.mensagemCartao}"</p>
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

  window.print();
}
