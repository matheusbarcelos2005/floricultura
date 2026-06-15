// Global builder configuration state
let dbFlores = [];
let dbVasos = [];
let dbComplementos = [];

// Selected configuration state
const configurador = {
  base: null,
  flores: {},
  precoTotal: 0
};

let activeStep = 1;

document.addEventListener('DOMContentLoaded', async () => {
  // Load databases
  dbFlores = await getFlores();
  dbVasos = await getVasos();

  // Initialize Wizard elements
  initWizard();

  // Render static options
  renderBasesOptions();
  renderFloresOptions();
  
  // Initial updates
  updateVisualizer();
});

// Setup Wizard Stepper Controls
function initWizard() {
  const btnPrev = document.getElementById('btn-wizard-prev');
  const btnNext = document.getElementById('btn-wizard-next');

  btnPrev.addEventListener('click', () => {
    if (activeStep > 1) {
      goToStep(activeStep - 1);
    }
  });

  btnNext.addEventListener('click', () => {
    if (validateCurrentStep()) {
      if (activeStep < 3) {
        goToStep(activeStep + 1);
      } else {
        addCustomBouquetToCart();
      }
    }
  });
}

function goToStep(stepNumber) {
  // Update step navigation UI
  document.getElementById(`step-nav-${activeStep}`).classList.remove('active');
  if (stepNumber < activeStep) {
    // Going back, keep completed indicators or reset
    document.getElementById(`step-nav-${activeStep}`).classList.remove('completed');
  } else {
    document.getElementById(`step-nav-${activeStep}`).classList.add('completed');
  }
  
  activeStep = stepNumber;
  document.getElementById(`step-nav-${activeStep}`).classList.add('active');
  
  // Toggle panes
  const panes = document.querySelectorAll('.wizard-pane');
  panes.forEach(pane => pane.classList.remove('active'));
  document.getElementById(`pane-${activeStep}`).classList.add('active');
  
  // Update buttons
  document.getElementById('btn-wizard-prev').disabled = activeStep === 1;
  document.getElementById('btn-wizard-next').innerText = activeStep === 3 ? 'Adicionar ao Carrinho 🛒' : 'Avançar ➔';

  hideCompatibilityAlert();

  if (activeStep === 3) {
    renderReviewSummary();
  }
}

// Check step validity before moving forward
function validateCurrentStep() {
  if (activeStep === 1) {
    if (!configurador.base) {
      showCompatibilityAlert('Por favor, escolha uma base ou embalagem para o seu arranjo.');
      return false;
    }
  } else if (activeStep === 2) {
    const totalStems = getActiveStemsCount();
    if (totalStems === 0) {
      showCompatibilityAlert('Adicione pelo menos 1 flor para compor seu arranjo.');
      return false;
    }
  }
  return true;
}

// Render dynamic elements for wizard steps
function renderBasesOptions() {
  const container = document.getElementById('bases-options-container');
  if (!container) return;
  
  container.innerHTML = '';
  dbVasos.forEach(vaso => {
    container.innerHTML += `
      <div class="col-md-6">
        <div class="selectable-card p-3 h-100 d-flex flex-column justify-content-between" id="base-card-${vaso.id}" onclick="selectBase('${vaso.id}')">
          <div>
            <div class="text-center mb-2" style="height: 100px; overflow: hidden; border-radius: 8px;">
              <img src="${vaso.imagem}" onerror="this.src='https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=150&q=80'" class="img-fluid h-100" style="object-fit: cover;">
            </div>
            <h4 class="h6 mb-1">${vaso.nome}</h4>
            <p class="text-muted small mb-2" style="font-size:0.75rem;">Capacidade: máx. ${vaso.capacidadeMax} hastes.</p>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
            <span class="fw-bold text-dark">${formatPreco(vaso.preco)}</span>
            <span class="badge bg-light text-dark small border">${vaso.tipo}</span>
          </div>
        </div>
      </div>
    `;
  });
}

function selectBase(baseId) {
  const baseObj = dbVasos.find(v => v.id === baseId);
  if (!baseObj) return;

  // Visual selection toggling
  const cards = document.querySelectorAll('#bases-options-container .selectable-card');
  cards.forEach(c => c.classList.remove('selected'));
  
  document.getElementById(`base-card-${baseId}`).classList.add('selected');
  
  // Set in config
  configurador.base = baseObj;
  
  // Reset selected flowers if they violate new capacity limits or flower size constraints
  validateAllFlowersForBase();
  
  updateVisualizer();
}

function renderFloresOptions() {
  const container = document.getElementById('flowers-options-container');
  if (!container) return;
  
  container.innerHTML = '';
  dbFlores.forEach(flor => {
    container.innerHTML += `
      <div class="col-sm-6">
        <div class="selectable-card p-3 d-flex flex-column justify-content-between" id="flower-card-${flor.id}">
          <div class="d-flex gap-3 align-items-start">
            <div class="flower-option-thumb flex-shrink-0">
              <img src="${flor.imagem}" onerror="this.src='https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=100&q=80'">
            </div>
            <div>
              <h4 class="h6 mb-1">${flor.nome}</h4>
              <span class="text-muted small d-block" style="font-size:0.75rem;">Tam. Flor: ${translateSize(flor.tamanho)}</span>
              <strong class="text-dark small">${formatPreco(flor.precoHaste)} / haste</strong>
            </div>
          </div>
          
          <!-- Quantity Adjustments -->
          <div class="qty-control mt-3">
            <button class="qty-btn" onclick="adjustFlowerQuantity('${flor.id}', -1)">-</button>
            <span class="fw-bold px-3" id="qty-text-${flor.id}">0</span>
            <button class="qty-btn" onclick="adjustFlowerQuantity('${flor.id}', 1)">+</button>
          </div>
        </div>
      </div>
    `;
  });
}

function adjustFlowerQuantity(florId, change) {
  if (!configurador.base) {
    showCompatibilityAlert('Por favor, selecione uma base na Etapa 2 antes de escolher as flores.');
    return;
  }

  const florObj = dbFlores.find(f => f.id === florId);
  const currentQty = configurador.flores[florId] || 0;
  const newQty = Math.max(0, currentQty + change);
  
  if (change > 0) {
    // 1. Capacity Limits validation
    const currentTotalStems = getActiveStemsCount();
    if (currentTotalStems >= configurador.base.capacidadeMax) {
      showCompatibilityAlert(`Capacidade limite atingida! A base "${configurador.base.nome}" comporta no máximo ${configurador.base.capacidadeMax} hastes.`);
      return;
    }

    // 2. Flower Size compatibility validation
    if (!configurador.base.tamanhosPermitidos.includes(florObj.tamanho)) {
      showCompatibilityAlert(`Incompatibilidade! A flor "${florObj.nome}" (${translateSize(florObj.tamanho)}) é muito grande para a base "${configurador.base.nome}".`);
      return;
    }
  }

  // Hide alert if successful adjust
  hideCompatibilityAlert();
  
  if (newQty === 0) {
    delete configurador.flores[florId];
    document.getElementById(`flower-card-${florId}`).classList.remove('selected');
  } else {
    configurador.flores[florId] = newQty;
    document.getElementById(`flower-card-${florId}`).classList.add('selected');
  }
  
  document.getElementById(`qty-text-${florId}`).innerText = newQty;

  updateVisualizer();
}

function renderComplementosOptions() {
  const container = document.getElementById('complements-options-container');
  if (!container) return;
  
  container.innerHTML = '';
  dbComplementos.forEach(comp => {
    container.innerHTML += `
      <div class="col-sm-6">
        <div class="selectable-card p-3 d-flex flex-column justify-content-between h-100" id="complement-card-${comp.id}">
          <div>
            <div class="text-center mb-2" style="height: 80px; overflow: hidden; border-radius: 8px;">
              <img src="${comp.imagem}" onerror="this.src='https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=150&q=80'" class="img-fluid h-100" style="object-fit: cover;">
            </div>
            <h4 class="h6 mb-1">${comp.nome}</h4>
            <p class="text-muted mb-2" style="font-size:0.75rem; line-height: 1.3;">${comp.descricao}</p>
          </div>
          <div class="qty-control mt-2 border-top pt-2">
            <span class="fw-bold text-dark small">${formatPreco(comp.preco)}</span>
            <div class="d-flex align-items-center">
              <button class="qty-btn" onclick="adjustComplementQuantity('${comp.id}', -1)">-</button>
              <span class="fw-bold px-2" id="qty-comp-text-${comp.id}" style="font-size:0.85rem;">0</span>
              <button class="qty-btn" onclick="adjustComplementQuantity('${comp.id}', 1)">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function adjustComplementQuantity(compId, change) {
  const currentQty = configurador.complementos[compId] || 0;
  const newQty = Math.max(0, currentQty + change);
  
  if (newQty === 0) {
    delete configurador.complementos[compId];
    document.getElementById(`complement-card-${compId}`).classList.remove('selected');
  } else {
    configurador.complementos[compId] = newQty;
    document.getElementById(`complement-card-${compId}`).classList.add('selected');
  }
  
  document.getElementById(`qty-comp-text-${compId}`).innerText = newQty;
  
  updateVisualizer();
}

// Compatibility check helpers
function validateAllFlowersForBase() {
  if (!configurador.base) return;
  
  let totalStems = 0;
  let resetTriggered = false;

  for (const florId in configurador.flores) {
    const florObj = dbFlores.find(f => f.id === florId);
    
    // Check flower size
    if (!configurador.base.tamanhosPermitidos.includes(florObj.tamanho)) {
      delete configurador.flores[florId];
      document.getElementById(`qty-text-${florId}`).innerText = 0;
      document.getElementById(`flower-card-${florId}`).classList.remove('selected');
      resetTriggered = true;
      continue;
    }
    
    // Check capacity limit
    const qty = configurador.flores[florId];
    if (totalStems + qty > configurador.base.capacidadeMax) {
      const allowedQty = configurador.base.capacidadeMax - totalStems;
      if (allowedQty > 0) {
        configurador.flores[florId] = allowedQty;
        document.getElementById(`qty-text-${florId}`).innerText = allowedQty;
        totalStems += allowedQty;
      } else {
        delete configurador.flores[florId];
        document.getElementById(`qty-text-${florId}`).innerText = 0;
        document.getElementById(`flower-card-${florId}`).classList.remove('selected');
      }
      resetTriggered = true;
    } else {
      totalStems += qty;
    }
  }
  
  if (resetTriggered) {
    showCompatibilityAlert(`Algumas flores foram reajustadas ou removidas para atender aos limites de tamanho e capacidade da nova base selecionada.`);
  }
}

// Helpers for counts & strings
function getActiveStemsCount() {
  return Object.values(configurador.flores).reduce((sum, val) => sum + val, 0);
}

function translateSize(size) {
  if (size === 'small') return 'Pequena';
  if (size === 'medium') return 'Média';
  if (size === 'large') return 'Grande';
  return size;
}

// Toast warning banner
function showCompatibilityAlert(message) {
  const alertBox = document.getElementById('compatibility-alert');
  const alertText = document.getElementById('compatibility-alert-text');
  if (alertBox && alertText) {
    alertText.innerText = message;
    alertBox.style.setProperty('display', 'flex', 'important');
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function hideCompatibilityAlert() {
  const alertBox = document.getElementById('compatibility-alert');
  if (alertBox) {
    alertBox.style.setProperty('display', 'none', 'important');
  }
}

// Calculate cost and compile HTML graphic stems overlay inside studio visualizer
function updateVisualizer() {
  // 1. Calculate price
  let basePrice = configurador.base ? configurador.base.preco : 0;
  
  let flowersPrice = 0;
  for (const fId in configurador.flores) {
    const flor = dbFlores.find(f => f.id === fId);
    flowersPrice += (flor.precoHaste * configurador.flores[fId]);
  }
  
  configurador.precoTotal = basePrice + flowersPrice;

  // 2. Update text badges
  document.getElementById('visualizer-total-price').innerText = formatPreco(configurador.precoTotal);
  
  const currentStems = getActiveStemsCount();
  const maxCapacity = configurador.base ? configurador.base.capacidadeMax : '--';
  document.getElementById('stem-count-badge').innerText = `${currentStems} / ${maxCapacity}`;
  
  const countIndicator = document.getElementById('stem-count-indicator');
  if (countIndicator) {
    countIndicator.innerText = `${currentStems} / ${maxCapacity} hastes`;
    if (configurador.base && currentStems >= maxCapacity) {
      countIndicator.className = 'badge bg-danger p-2';
    } else {
      countIndicator.className = 'badge bg-secondary p-2';
    }
  }

  // 3. Render base graphic
  const baseZone = document.getElementById('base-render-zone');
  const kraftOverlay = document.getElementById('kraft-bottom-overlay');
  const layerMaxHeight = configurador.base && configurador.base.layerMaxHeight ? configurador.base.layerMaxHeight : 190;
  const layerWidth = configurador.base && configurador.base.layerWidth ? configurador.base.layerWidth : 190;
  const layerBottomOffset = configurador.base && configurador.base.layerBottomOffset !== undefined ? configurador.base.layerBottomOffset : 24;
  const backLayerOffsetY = configurador.base && configurador.base.backLayerOffsetY !== undefined ? configurador.base.backLayerOffsetY : 0;
  const backLayerScale = configurador.base && configurador.base.backLayerScale ? configurador.base.backLayerScale : 1;
  const frontLayerOffsetY = configurador.base && configurador.base.frontLayerOffsetY !== undefined ? configurador.base.frontLayerOffsetY : 0;
  const frontLayerScale = configurador.base && configurador.base.frontLayerScale ? configurador.base.frontLayerScale : 1;

  if (baseZone) {
    if (configurador.base) {
      const backLayerSrc = configurador.base.imagemParteTras || configurador.base.imagemParteDecima;
      const frontLayerSrc = configurador.base.imagemParteFrente || configurador.base.imagemParteBaixo;
      const hasSplit = !!(backLayerSrc && frontLayerSrc);
      const baseSrc = backLayerSrc || configurador.base.imagem;

      baseZone.style.bottom = layerBottomOffset + 'px';
      baseZone.style.marginBottom = '0';
      if (hasSplit) {
        baseZone.innerHTML = `
          <div class="bouquet-base-layer-frame" style="width:${layerWidth}px;height:${layerWidth}px;">
            <img src="${baseSrc}" onerror="this.src='https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=200&q=80'" class="bouquet-base-layer-img bouquet-base-back-layer" style="transform: translateY(${backLayerOffsetY}px) scale(${backLayerScale}); filter: drop-shadow(0px 10px 10px rgba(0,0,0,0.1));">
          </div>
        `;
      } else {
        baseZone.innerHTML = `
          <div class="position-relative d-inline-block">
            <img src="${baseSrc}" onerror="this.src='https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=200&q=80'" class="img-fluid bouquet-base-layer-img" style="max-height: ${layerMaxHeight}px; border-radius: 12px; filter: drop-shadow(0px 10px 10px rgba(0,0,0,0.1));">
          </div>
        `;
      }

      if (kraftOverlay) {
        if (hasSplit) {
          const bottomPx = configurador.base.overlayBottomOffset !== undefined ? configurador.base.overlayBottomOffset : layerBottomOffset;
          kraftOverlay.style.bottom = bottomPx + 'px';
          kraftOverlay.style.display = 'block';

          const frontLayerWidthPercent = configurador.base.frontLayerWidthPercent || null;

          if (frontLayerWidthPercent !== null) {
            // Vaso mode: render the rim overlay with natural proportions, centered at the neck
            kraftOverlay.innerHTML = `
              <div class="bouquet-base-layer-frame" style="width:${layerWidth}px;height:${layerWidth}px;">
                <img src="${frontLayerSrc}" class="bouquet-base-front-layer" style="
                  position:absolute;
                  width:${frontLayerWidthPercent}%;
                  height:auto;
                  left:50%;
                  top:${frontLayerOffsetY}px;
                  transform:translateX(-50%);
                  filter:drop-shadow(0px 3px 6px rgba(0,0,0,0.2));
                ">
              </div>
            `;
          } else {
            kraftOverlay.innerHTML = `
              <div class="bouquet-base-layer-frame" style="width:${layerWidth}px;height:${layerWidth}px;">
                <img src="${frontLayerSrc}" class="bouquet-base-layer-img bouquet-base-front-layer" style="transform: translateY(${frontLayerOffsetY}px) scale(${frontLayerScale}); filter: drop-shadow(0px 10px 10px rgba(0,0,0,0.15));">
              </div>
            `;
          }
        } else {
          kraftOverlay.style.display = 'none';
          kraftOverlay.innerHTML = '';
        }
      }
    } else {
      baseZone.innerHTML = `<span class="text-muted d-block py-4">Selecione uma base na Etapa 2</span>`;
      if (kraftOverlay) {
        kraftOverlay.style.display = 'none';
        kraftOverlay.innerHTML = '';
      }
    }
  }

  // 4. Render flowers emerging from vase
  const stemsZone  = document.getElementById('stems-render-zone');
  const renderZone = document.getElementById('flowers-render-zone');
  if (!stemsZone || !renderZone) return;

  stemsZone.innerHTML  = '';
  renderZone.innerHTML = '';

  // Vasos: flores atrás (vaso cobre os caules inferiores)
  // Embalagens: flores na frente (papel envolve por fora, flores emergem visíveis)
  const hasFrontLayer = !!(configurador.base.imagemParteFrente || configurador.base.imagemParteBaixo);
  renderZone.style.zIndex = configurador.base.tipo === 'Embalagem' || hasFrontLayer ? '15' : '5';

  const totalStems = getActiveStemsCount();
  if (totalStems === 0) return;

  const canvasW = renderZone.clientWidth || 500;
  let centerX   = canvasW / 2;

  // Calcula a posição da boca de cada recipiente com base nas dimensões reais renderizadas
  let VASE_OPEN_Y = configurador.base.aberturaY || 180;
  const containerGraphic = baseZone ? (baseZone.querySelector('.bouquet-base-layer-frame') || baseZone.querySelector('img')) : null;
  const containerImg = baseZone ? baseZone.querySelector('img') : null;
  if (containerGraphic) {
    if (!containerImg || containerImg.complete && containerImg.naturalWidth > 0) {
      const imgRect             = containerGraphic.getBoundingClientRect();
      const canvasRect          = renderZone.getBoundingClientRect();
      const imgBottomFromCanvas = Math.round(canvasRect.bottom - imgRect.bottom);
      const imgRenderedHeight   = Math.round(imgRect.height);
      const imgRenderedWidth    = Math.round(imgRect.width);
      const imgLeftFromCanvas   = Math.round(imgRect.left - canvasRect.left);

      if (imgRenderedHeight > 20) {
        // Y: ponto calibrado ou fallback dinâmico
        if (configurador.base.mouthYPercent) {
          VASE_OPEN_Y = Math.round(imgBottomFromCanvas + imgRenderedHeight * configurador.base.mouthYPercent);
        } else {
          const insertDepth = configurador.base.tipo === 'Embalagem' ? 40 : 30;
          VASE_OPEN_Y = Math.round(imgBottomFromCanvas + imgRenderedHeight) - insertDepth;
        }

        // X: ponto calibrado individualmente (apenas quando definido); caso contrário usa o centro do canvas
        if (configurador.base.mouthXPercent) {
          centerX = Math.round(imgLeftFromCanvas + imgRenderedWidth * configurador.base.mouthXPercent);
        }
      }
    } else {
      containerImg.addEventListener('load', () => updateVisualizer(), { once: true });
    }
  }

  let index = 0;
  for (const florId in configurador.flores) {
    const flor = dbFlores.find(f => f.id === florId);
    const qty  = configurador.flores[florId];

    for (let q = 0; q < qty; q++) {
      const angleRange = Math.min(60, 24 + totalStems * 7);
      const angleStep  = totalStems > 1 ? angleRange / (totalStems - 1) : 0;
      const rotation   = totalStems > 1 ? -angleRange / 2 + (index * angleStep) : -10;
      const naturalVariation = ((index % 3) - 1) * 2;

      const imgSize = flor.tamanho === 'large' ? 155 : flor.tamanho === 'small' ? 110 : 130;
      const insertDepth = configurador.base.tipo === 'Embalagem' ? 18 : 28;
      const flowerOffsetY = configurador.base.flowerOffsetY || 0;

      const flowerEl = document.createElement('div');
      flowerEl.className = 'bouquet-flower-sprout';
      flowerEl.style.cssText = `
        position: absolute;
        left: ${centerX - imgSize / 2}px;
        bottom: ${VASE_OPEN_Y - insertDepth - flowerOffsetY}px;
        width: ${imgSize}px;
        transform: rotate(${rotation + naturalVariation}deg);
        transform-origin: 50% calc(100% - ${insertDepth}px);
      `;
      flowerEl.innerHTML = `<img src="${flor.imagem}" class="bouquet-flower-head" style="width:100%;">`;
      renderZone.appendChild(flowerEl);

      index++;
    }
  }
}

// Generate representational floral head based on hex colors and sizes
function getFlowerHeadSVG(color, size) {
  const radius = size === 'large' ? 18 : size === 'small' ? 10 : 14;
  
  if (color === '#ffc300') {
    // Sunflower SVG (petals + dark center)
    return `
      <!-- Sunflower Petals -->
      <circle cx="20" cy="20" r="${radius}" fill="#ffcc00"/>
      <circle cx="20" cy="20" r="${radius - 3}" fill="#ff9900"/>
      <path d="M20 5 L20 35 M5 20 L35 20 M9 9 L31 31 M9 31 L31 9" stroke="#e08b00" stroke-width="2"/>
      <!-- Brown Center -->
      <circle cx="20" cy="20" r="${radius/2}" fill="#5c3a21"/>
    `;
  }
  
  // Default Rose/Flower SVG (layered overlapping petals circles)
  return `
    <circle cx="20" cy="20" r="${radius}" fill="${color}" opacity="0.9"/>
    <circle cx="16" cy="18" r="${radius * 0.7}" fill="${darkenColor(color)}" opacity="0.95"/>
    <circle cx="24" cy="18" r="${radius * 0.7}" fill="${darkenColor(color)}" opacity="0.95"/>
    <circle cx="20" cy="24" r="${radius * 0.7}" fill="${darkenColor(color)}" opacity="0.95"/>
    <circle cx="20" cy="20" r="${radius * 0.4}" fill="${color}"/>
    <circle cx="20" cy="20" r="${radius * 0.2}" fill="#ffeb3b" opacity="0.8"/>
  `;
}

// Helper to darken colors for petal shading
function darkenColor(hex) {
  if (hex === '#ffffff' || hex === '#f8f9fa') return '#e0e0e0';
  if (hex === '#e3e3e3') return '#cccccc';
  
  // Very simplistic darken
  if (hex.startsWith('#')) {
    let color = hex.replace('#', '');
    let r = parseInt(color.substring(0,2), 16);
    let g = parseInt(color.substring(2,4), 16);
    let b = parseInt(color.substring(4,6), 16);
    
    r = Math.max(0, Math.floor(r * 0.75));
    g = Math.max(0, Math.floor(g * 0.75));
    b = Math.max(0, Math.floor(b * 0.75));
    
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }
  return hex;
}

function renderReviewSummary() {
  document.getElementById('review-base-text').innerText = configurador.base ? `${configurador.base.nome} (+${formatPreco(configurador.base.preco)})` : '--';
  
  // Flowers list
  const flowersList = document.getElementById('review-flowers-list');
  flowersList.innerHTML = '';
  
  let totalFlowersCount = 0;
  for (const fId in configurador.flores) {
    const flor = dbFlores.find(f => f.id === fId);
    const qty = configurador.flores[fId];
    totalFlowersCount += qty;
    
    flowersList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
        <span>🌸 ${qty}x ${flor.nome} <span class="text-muted small">(${translateSize(flor.tamanho)})</span></span>
        <span class="text-muted">${formatPreco(flor.precoHaste * qty)}</span>
      </li>
    `;
  }
  
  if (totalFlowersCount === 0) {
    flowersList.innerHTML = `<li class="list-group-item text-muted px-0 py-2">Nenhuma flor selecionada.</li>`;
  }
  
  // Total summary price
  document.getElementById('review-total-price').innerText = formatPreco(configurador.precoTotal);
}

// Compile custom item and send to local cart
function addCustomBouquetToCart() {
  // Build details string
  const details = [];
  
  // Base details
  details.push(`Base: ${configurador.base.nome}`);
  
  // Flower list
  const flowersText = [];
  for (const fId in configurador.flores) {
    const flor = dbFlores.find(f => f.id === fId);
    flowersText.push(`${configurador.flores[fId]}x ${flor.nome}`);
  }
  details.push(`Flores: ${flowersText.join(', ')}`);
  
  const customItem = {
    id: `custom_${Date.now()}`,
    nome: `Buquê Personalizado`,
    preco: parseFloat(configurador.precoTotal),
    imagem: configurador.base.imagem, // Use base image
    quantidade: 1,
    isCustom: true,
    composicao: {
      base: configurador.base,
      flores: configurador.flores,
      descricaoCurta: details.join(' | ')
    }
  };
  
  // Add to localStorage cart
  addToCart(customItem);
  
  // Clean custom builder inputs
  resetConfigurador();
  
  // Redirect to cart view after brief notification
  setTimeout(() => {
    window.location.href = 'carrinho.html';
  }, 1000);
}

function resetConfigurador() {
  configurador.estilo = '';
  configurador.base = null;
  configurador.flores = {};
  configurador.precoTotal = 0;

  document.querySelectorAll('#bases-options-container .selectable-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('#flowers-options-container .selectable-card').forEach(c => {
    c.classList.remove('selected');
  });
  dbFlores.forEach(f => {
    const qtyText = document.getElementById(`qty-text-${f.id}`);
    if (qtyText) qtyText.innerText = 0;
  });
}
