// Admin password check — compares SHA-256 hash, plain text password never stored in source
const ADMIN_HASH = 'df25930947dddf6403b02f6cc5828655e75024f17a6f7ba3f56f39ecd7dc43e6';

async function hashString(str) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkAdminPassword() {
  if (sessionStorage.getItem('painel_auth') === 'ok') return true;

  const pwd = prompt('Painel Administrativo – Bella Fioritura\n\nDigite a senha de acesso:');
  if (pwd === null) {
    window.location.replace('index.html');
    return false;
  }

  const hashed = await hashString(pwd);
  if (hashed === ADMIN_HASH) {
    sessionStorage.setItem('painel_auth', 'ok');
    return true;
  }

  alert('Senha incorreta.');
  window.location.replace('index.html');
  return false;
}

// Globals
let ordersList = [];
let dbFlores = [];
let dbVasos = [];
let dbComplementos = [];
let stockLevels = {};
let selectedOrderForComanda = null;
let allProductsAdmin = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await checkAdminPassword())) return;

  initImagePicker();

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

  const produtosTabBtn = document.getElementById('produtos-tab');
  if (produtosTabBtn) {
    produtosTabBtn.addEventListener('click', () => {
      renderProductsTab();
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
            <option value="Reembolsado" ${order.status === 'Reembolsado' ? 'selected' : ''}>Reembolsado</option>
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
      'Cancelado',
      'Reembolsado'
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
      else if (status === 'Reembolsado') badgeClass = 'bg-dark';
      
      statusDistEl.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2">
          <span>${status}</span>
          <span class="badge ${badgeClass}">${count}</span>
        </li>
      `;
    });
  }
}

// Image picker for product modal
function initImagePicker() {
  const fileInput = document.getElementById('product-imagem-file');
  if (!fileInput) return;
  fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  });
}

function setImagePreview(src) {
  const placeholder = document.getElementById('image-picker-placeholder');
  const preview = document.getElementById('image-picker-preview');
  if (!src) { clearImagePreview(); return; }
  if (placeholder) placeholder.style.display = 'none';
  if (preview) { preview.src = src; preview.style.display = 'block'; }
  document.getElementById('product-imagem').value = src;
}

function clearImagePreview() {
  const placeholder = document.getElementById('image-picker-placeholder');
  const preview = document.getElementById('image-picker-preview');
  if (placeholder) placeholder.style.display = 'block';
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  const hidden = document.getElementById('product-imagem');
  if (hidden) hidden.value = '';
  const fileInput = document.getElementById('product-imagem-file');
  if (fileInput) fileInput.value = '';
}

// Products Tab
async function renderProductsTab() {
  allProductsAdmin = await getProducts();
  const tbody = document.getElementById('products-admin-tbody');
  if (!tbody) return;

  if (allProductsAdmin.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum produto cadastrado.</td></tr>`;
    return;
  }

  let rows = '';
  allProductsAdmin.forEach(prod => {
    const isAtivo = prod.ativo !== false;
    rows += `
      <tr class="${isAtivo ? '' : 'table-secondary'}">
        <td>
          <div class="fw-bold ${isAtivo ? '' : 'text-muted'}">${prod.nome}</div>
          <span class="text-muted small" style="font-size:0.75rem;">${prod.id}</span>
        </td>
        <td>${capitalize(prod.categoria)}</td>
        <td>${formatPreco(prod.preco)}</td>
        <td class="text-center">
          ${prod.destaque
            ? '<span class="badge bg-warning text-dark">Destaque</span>'
            : '<span class="text-muted small">—</span>'}
        </td>
        <td class="text-center">
          ${isAtivo
            ? '<span class="badge bg-success">Ativo</span>'
            : '<span class="badge bg-secondary">Inativo</span>'}
        </td>
        <td class="text-center text-nowrap">
          <button class="btn btn-sm btn-outline-premium py-1 px-3 me-1" onclick="openProductModal('${prod.id}')" style="border-radius:12px;">Editar</button>
          <button class="btn btn-sm ${isAtivo ? 'btn-outline-danger' : 'btn-outline-success'} py-1 px-3" onclick="toggleProductActive('${prod.id}')" style="border-radius:12px;">
            ${isAtivo ? 'Desativar' : 'Ativar'}
          </button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = rows;
}

function openProductModal(productId) {
  const modalLabel = document.getElementById('productModalLabel');
  document.getElementById('product-form').reset();
  clearImagePreview();

  if (productId) {
    const prod = allProductsAdmin.find(p => p.id === productId);
    if (!prod) return;
    modalLabel.innerText = 'Editar Produto';
    document.getElementById('product-edit-id').value = prod.id;
    document.getElementById('product-nome').value = prod.nome;
    document.getElementById('product-categoria').value = prod.categoria;
    document.getElementById('product-preco').value = prod.preco;
    document.getElementById('product-descricao').value = prod.descricao;
    document.getElementById('product-destaque').checked = prod.destaque || false;
    document.getElementById('product-ativo').checked = prod.ativo !== false;
    if (prod.imagem) setImagePreview(prod.imagem);
  } else {
    modalLabel.innerText = 'Novo Produto';
    document.getElementById('product-edit-id').value = '';
    document.getElementById('product-ativo').checked = true;
  }

  const modalEl = document.getElementById('productModal');
  const modalObj = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modalObj.show();
}

function saveProduct() {
  const nome = document.getElementById('product-nome').value.trim();
  const categoria = document.getElementById('product-categoria').value;
  const preco = parseFloat(document.getElementById('product-preco').value);
  const imagem = document.getElementById('product-imagem').value.trim();
  const descricao = document.getElementById('product-descricao').value.trim();
  const destaque = document.getElementById('product-destaque').checked;
  const ativo = document.getElementById('product-ativo').checked;
  const editId = document.getElementById('product-edit-id').value;

  if (!nome || !descricao || isNaN(preco) || preco < 0) {
    showToast('Preencha nome, descrição e preço antes de salvar.');
    return;
  }

  const products = JSON.parse(localStorage.getItem('floricultura_produtos') || '[]');

  if (editId) {
    const index = products.findIndex(p => p.id === editId);
    if (index > -1) {
      products[index] = { ...products[index], nome, categoria, preco, imagem, descricao, destaque, ativo };
    }
  } else {
    const newId = 'p' + Date.now();
    products.push({ id: newId, nome, categoria, preco, imagem, descricao, destaque, ativo });
  }

  localStorage.setItem('floricultura_produtos', JSON.stringify(products));

  const modalEl = document.getElementById('productModal');
  const modalObj = bootstrap.Modal.getInstance(modalEl);
  if (modalObj) modalObj.hide();

  showToast(editId ? `"${nome}" atualizado com sucesso!` : `"${nome}" cadastrado com sucesso!`);
  renderProductsTab();
}

function toggleProductActive(productId) {
  const products = JSON.parse(localStorage.getItem('floricultura_produtos') || '[]');
  const index = products.findIndex(p => p.id === productId);
  if (index === -1) return;

  products[index].ativo = products[index].ativo === false;
  localStorage.setItem('floricultura_produtos', JSON.stringify(products));

  const status = products[index].ativo ? 'ativado' : 'desativado';
  showToast(`"${products[index].nome}" ${status}.`);
  renderProductsTab();
}

function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
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
