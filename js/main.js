// Fallback data in case of CORS errors when running locally via file:// protocol
const DEFAULT_PRODUCTS = [
  {
    "id": "p1",
    "nome": "Buquê Encanto de Rosas",
    "categoria": "buques",
    "preco": 149.90,
    "descricao": "Um clássico e elegante buquê de 12 rosas vermelhas premium com folhagens selecionadas e embalagem sofisticada.",
    "imagem": "assets/images/produtos/buque_rosas.jpg",
    "destaque": true
  },
  {
    "id": "p2",
    "nome": "Arranjo Abraço Solar",
    "categoria": "arranjos",
    "preco": 119.90,
    "descricao": "Lindo arranjo com 5 girassóis vibrantes, complementados com flores do campo e gipsofilas em vaso rústico.",
    "imagem": "assets/images/produtos/arranjo_girassol.jpg",
    "destaque": true
  },
  {
    "id": "p3",
    "nome": "Orquídea Phalaenopsis Branca",
    "categoria": "orquideas",
    "preco": 179.00,
    "descricao": "Uma deslumbrante orquídea de duas hastes floridas em vaso de cerâmica branca decorada. Ideal para presente.",
    "imagem": "assets/images/produtos/orquidea_branca.jpg",
    "destaque": true
  },
  {
    "id": "p4",
    "nome": "Cesta Despertar Especial",
    "categoria": "cestas",
    "preco": 249.90,
    "descricao": "Cesta de vime completa para café da manhã com torradas, geleia, frutas, biscoitos finos e um lindo mini buquê.",
    "imagem": "assets/images/produtos/cesta_cafe.jpg",
    "destaque": true
  },
  {
    "id": "p5",
    "nome": "Buquê de Tulipas Coloridas",
    "categoria": "buques",
    "preco": 189.90,
    "descricao": "Combinação alegre e sofisticada de tulipas em tons variados envoltas em papel celofane importado e laço de cetim.",
    "imagem": "assets/images/produtos/buque_tulipas.jpg",
    "destaque": false
  },
  {
    "id": "p6",
    "nome": "Vaso de Lírios Brancos",
    "categoria": "arranjos",
    "preco": 139.90,
    "descricao": "Lírios brancos perfumados e imponentes plantados em um elegante vaso de vidro transparente.",
    "imagem": "assets/images/produtos/vaso_lirios.jpg",
    "destaque": false
  }
];

const DEFAULT_FLORES = [
  {
    "id": "f1",
    "nome": "Rosa Vermelha",
    "precoHaste": 8.50,
    "tamanho": "medium",
    "imagem": "assets/images/flores/rosa_vermelha.jpg",
    "cor": "#c70039"
  },
  {
    "id": "f2",
    "nome": "Rosa Branca",
    "precoHaste": 8.50,
    "tamanho": "medium",
    "imagem": "assets/images/flores/rosa_branca.jpg",
    "cor": "#f8f9fa"
  },
  {
    "id": "f3",
    "nome": "Girassol",
    "precoHaste": 12.00,
    "tamanho": "large",
    "imagem": "assets/images/flores/girassol.jpg",
    "cor": "#ffc300"
  },
  {
    "id": "f4",
    "nome": "Lírio Branco",
    "precoHaste": 15.00,
    "tamanho": "large",
    "imagem": "assets/images/flores/lirio.jpg",
    "cor": "#e3e3e3"
  },
  {
    "id": "f5",
    "nome": "Tulipa Rosa",
    "precoHaste": 18.00,
    "tamanho": "medium",
    "imagem": "assets/images/flores/tulipa.jpg",
    "cor": "#ff8da1"
  },
  {
    "id": "f6",
    "nome": "Gipsofila (Mosquitinho)",
    "precoHaste": 5.00,
    "tamanho": "small",
    "imagem": "assets/images/flores/gipsofila.jpg",
    "cor": "#ffffff"
  },
  {
    "id": "f7",
    "nome": "Astroemélia Colorida",
    "precoHaste": 6.00,
    "tamanho": "small",
    "imagem": "assets/images/flores/astromelia.jpg",
    "cor": "#ff5733"
  }
];

const DEFAULT_VASOS = [
  {
    "id": "v1",
    "nome": "Vaso de Vidro Pequeno",
    "tipo": "Vaso",
    "preco": 30.00,
    "capacidadeMax": 3,
    "tamanhosPermitidos": ["small", "medium"],
    "imagem": "assets/images/vasos/vaso_pequeno.jpg",
    "imagemParteTras": "assets/images/vasos/parte_de_cima_vasoP.jpg.png",
    "imagemParteFrente": "assets/images/vasos/parte_de_baixo_vasoP.png",
    "mouthYPercent": 0.63,
    "mouthXPercent": 0.5,
    "layerWidth": 210,
    "layerBottomOffset": 24,
    "backLayerOffsetY": -30,
    "backLayerScale": 0.7,
    "frontLayerOffsetY": 0,
    "frontLayerScale": 1,
    "flowerOffsetY": 0
  },
  {
    "id": "v2",
    "nome": "Vaso de Vidro Médio",
    "tipo": "Vaso",
    "preco": 50.00,
    "capacidadeMax": 6,
    "tamanhosPermitidos": ["small", "medium"],
    "imagem": "assets/images/vasos/vaso_medio.jpg",
    "aberturaY": 178
  },
  {
    "id": "v3",
    "nome": "Vaso de Vidro Grande",
    "tipo": "Vaso",
    "preco": 80.00,
    "capacidadeMax": 9,
    "tamanhosPermitidos": ["small", "medium", "large"],
    "imagem": "assets/images/vasos/vaso_grande.jpg",
    "aberturaY": 178
  },
  {
    "id": "v4",
    "nome": "Embalagem Kraft Rústica",
    "tipo": "Embalagem",
    "preco": 15.00,
    "capacidadeMax": 12,
    "tamanhosPermitidos": ["small", "medium"],
    "imagem": "assets/images/vasos/kraft.jpg",
    "imagemParteTras": "assets/images/vasos/parte_de_cima_kraft.jpg",
    "imagemParteFrente": "assets/images/vasos/parte_de_baixo_kraft.jpg.png",
    "aberturaY": 210,
    "mouthYPercent": 0.75,
    "mouthXPercent": 0.5,
    "layerWidth": 205,
    "layerBottomOffset": 24,
    "backLayerOffsetY": -52,
    "backLayerScale": 1.25,
    "frontLayerOffsetY": -9,
    "frontLayerScale": 1.06,
    "flowerOffsetY": 14
  },
  {
    "id": "v5",
    "nome": "Embalagem Tecido Premium",
    "tipo": "Embalagem",
    "preco": 25.00,
    "capacidadeMax": 20,
    "tamanhosPermitidos": ["small", "medium", "large"],
    "imagem": "assets/images/vasos/premium.jpg",
    "imagemParteTras": "assets/images/vasos/parte_de_cima_premium.jpg",
    "imagemParteFrente": "assets/images/vasos/parte_de_baixo_premium.jpg.png",
    "aberturaY": 210,
    "mouthYPercent": 0.75,
    "mouthXPercent": 0.5,
    "layerWidth": 205,
    "layerBottomOffset": 24,
    "backLayerOffsetY": -56,
    "backLayerScale": 1,
    "frontLayerOffsetY": -5,
    "frontLayerScale": 1.025,
    "flowerOffsetY": 14
  }
];

const DEFAULT_COMPLEMENTOS = [
  {
    "id": "c1",
    "nome": "Caixa de Trufas de Chocolate",
    "preco": 39.90,
    "descricao": "Deliciosas trufas artesanais de chocolate belga (120g).",
    "imagem": "assets/images/complementos/trufas.jpg"
  },
  {
    "id": "c2",
    "nome": "Urso de Pelúcia Fofo",
    "preco": 49.90,
    "descricao": "Urso de pelúcia super macio e antialérgico de 25cm.",
    "imagem": "assets/images/complementos/pelucia.jpg"
  },
  {
    "id": "c3",
    "nome": "Cartão de Mensagem Premium",
    "preco": 10.00,
    "descricao": "Lindo cartão impresso em papel texturizado para sua mensagem.",
    "imagem": "assets/images/complementos/cartao.jpg"
  },
  {
    "id": "c4",
    "nome": "Balão Metalizado de Coração",
    "preco": 15.00,
    "descricao": "Balão inflado com gás hélio em formato de coração vermelho escrito 'Com Amor'.",
    "imagem": "assets/images/complementos/balao.jpg"
  }
];

// Database initializers
function initDatabase() {
  if (!localStorage.getItem('floricultura_produtos')) {
    localStorage.setItem('floricultura_produtos', JSON.stringify(DEFAULT_PRODUCTS));
  }
  localStorage.setItem('floricultura_flores', JSON.stringify(DEFAULT_FLORES));
  localStorage.setItem('floricultura_vasos', JSON.stringify(DEFAULT_VASOS));
  localStorage.setItem('floricultura_complementos', JSON.stringify(DEFAULT_COMPLEMENTOS));
  if (!localStorage.getItem('floricultura_pedidos')) {
    localStorage.setItem('floricultura_pedidos', JSON.stringify([]));
  }
  if (!localStorage.getItem('floricultura_estoque')) {
    // Basic inventory quantities
    const defaultEstoque = {
      "f1": 100, // Rosa Vermelha
      "f2": 80,  // Rosa Branca
      "f3": 50,  // Girassol
      "f4": 40,  // Lírio Branco
      "f5": 60,  // Tulipa Rosa
      "f6": 150, // Gipsofila
      "f7": 120, // Astroemélia
      "v1": 15,  // Vaso Vidro P
      "v2": 25,  // Vaso Vidro M
      "v3": 10,  // Vaso Vidro G
      "v4": 50,  // Kraft
      "v5": 30,  // Tecido
      "v6": 12   // Cesta
    };
    localStorage.setItem('floricultura_estoque', JSON.stringify(defaultEstoque));
  }
}

// Data loaders with CORS fallback
async function loadData(key, filePath, defaultData) {
  // localStorage is the source of truth — only seed from JSON on first load
  const local = localStorage.getItem(`floricultura_${key}`);
  if (local) return JSON.parse(local);

  try {
    const response = await fetch(filePath);
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(`floricultura_${key}`, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.warn(`Could not fetch ${filePath}. Using fallback defaults.`);
  }

  return defaultData;
}

// Global getters
async function getProducts() { return loadData('produtos', 'data/produtos.json', DEFAULT_PRODUCTS); }
async function getFlores() { return loadData('flores', 'data/flores.json', DEFAULT_FLORES); }
async function getVasos() { return loadData('vasos', 'data/vasos.json', DEFAULT_VASOS); }
async function getComplementos() { return loadData('complementos', 'data/complementos.json', DEFAULT_COMPLEMENTOS); }

function getOrders() {
  const o = localStorage.getItem('floricultura_pedidos');
  return o ? JSON.parse(o) : [];
}

function saveOrders(orders) {
  localStorage.setItem('floricultura_pedidos', JSON.stringify(orders));
}

function getEstoque() {
  const e = localStorage.getItem('floricultura_estoque');
  return e ? JSON.parse(e) : {};
}

function saveEstoque(estoque) {
  localStorage.setItem('floricultura_estoque', JSON.stringify(estoque));
}

// Shopping Cart operations
function getCart() {
  const c = localStorage.getItem('floricultura_carrinho');
  return c ? JSON.parse(c) : [];
}

function saveCart(cart) {
  localStorage.setItem('floricultura_carrinho', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  // We can group pre-configured items by id, but custom bouquets are unique.
  if (item.isCustom) {
    cart.push(item);
  } else {
    const existingIndex = cart.findIndex(i => i.id === item.id && !i.isCustom);
    if (existingIndex > -1) {
      cart[existingIndex].quantidade += item.quantidade || 1;
    } else {
      item.quantidade = item.quantidade || 1;
      cart.push(item);
    }
  }
  saveCart(cart);
  showToast(`"${item.nome}" adicionado ao carrinho!`);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge-count');
  if (badge) {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + (item.quantidade || 1), 0);
    badge.innerText = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// Toast notification helper
function showToast(message) {
  // Create toast container if not exists
  let container = document.getElementById('toast-container-custom');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container-custom';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.background = '#4a2e2b';
  toast.style.color = '#fdfbf7';
  toast.style.padding = '0.85rem 1.5rem';
  toast.style.borderRadius = '30px';
  toast.style.marginTop = '10px';
  toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
  toast.style.fontSize = '0.9rem';
  toast.style.fontWeight = '600';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '8px';
  toast.style.animation = 'fadeIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
  
  toast.innerHTML = `<span>✿</span> ${message}`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Header & Footer Dynamic Rendering
function renderHeaderFooter() {
  const currentPath = window.location.pathname;
  const isPage = (name) => currentPath.endsWith(name) || (name === 'index.html' && (currentPath === '/' || currentPath.endsWith('/')));

  // Render Header
  const headerElem = document.getElementById('global-header');
  if (headerElem) {
    headerElem.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-custom fixed-top py-3">
        <div class="container">
          <a class="navbar-brand" href="index.html">
            <span style="color: var(--sage-green);">✿</span> Bella Fioritura
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          
          <div class="collapse navbar-collapse" id="navbarContent">
            <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link ${isPage('index.html') ? 'active' : ''}" href="index.html">Início</a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${isPage('produtos.html') ? 'active' : ''}" href="produtos.html">Catálogo</a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${isPage('montar-buque.html') ? 'active' : ''}" href="montar-buque.html">Monte Seu Buquê</a>
              </li>
            </ul>
            <div class="d-flex align-items-center gap-3">
              <a href="carrinho.html" class="btn btn-outline-premium py-2 px-3 d-flex align-items-center gap-2 cart-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-cart3" viewBox="0 0 16 16">
                  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.465.401l-9.397.472L4.415 11H13a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l.84 4.479 9.144-.459L13.89 4H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                <span>Carrinho</span>
                <span id="cart-badge-count" class="cart-badge" style="display: none;">0</span>
              </a>
            </div>
          </div>
        </div>
      </nav>
      <div style="height: 85px;"></div>
    `;
  }

  // Render Footer
  const footerElem = document.getElementById('global-footer');
  if (footerElem) {
    footerElem.innerHTML = `
      <footer style="background-color: var(--primary-dark); color: var(--text-light); margin-top: 5rem;" class="py-5">
        <div class="container">
          <div class="row g-4">
            <div class="col-md-4">
              <h4 class="mb-3 text-white">Bella Fioritura</h4>
              <p class="text-white-50 small">Encantando vidas e perfumando momentos especiais com flores selecionadas e arranjos únicos criados com paixão.</p>
              <div class="d-flex gap-3 mt-3">
                <span style="color: var(--primary-floral);">✿ Cultivando Amor</span>
              </div>
            </div>
            <div class="col-md-4">
              <h5 class="mb-3 text-white text-uppercase small" style="letter-spacing: 1px;">Links Rápidos</h5>
              <ul class="list-unstyled d-flex flex-column gap-2 text-white-50 small">
                <li><a href="index.html" class="text-reset text-decoration-none hover-link">Página Inicial</a></li>
                <li><a href="produtos.html" class="text-reset text-decoration-none hover-link">Catálogo Completo</a></li>
                <li><a href="montar-buque.html" class="text-reset text-decoration-none hover-link">Configurador Personalizado</a></li>
              </ul>
            </div>
            <div class="col-md-4">
              <h5 class="mb-3 text-white text-uppercase small" style="letter-spacing: 1px;">Funcionamento & Contato</h5>
              <p class="text-white-50 small mb-2">
                <strong>Horário:</strong> Segunda a Sábado, das 08:00 às 18:00
              </p>
              <p class="text-white-50 small mb-2">
                <strong>Endereço:</strong> Av. das Rosas, 750 - Jardim Floral, SP
              </p>
              <p class="text-white-50 small">
                <strong>WhatsApp:</strong> (11) 99999-9999
              </p>
            </div>
          </div>
          <hr class="my-4" style="border-color: rgba(255,255,255,0.1);">
          <div class="row align-items-center">
            <div class="col-md-6 text-center text-md-start">
              <p class="mb-0 text-white-50 small">&copy; 2026 Bella Fioritura. Todos os direitos reservados. Projeto Acadêmico / Protótipo.</p>
            </div>
            <div class="col-md-6 text-center text-md-end mt-3 mt-md-0">
              <span class="text-white-50 small">Desenvolvido com ☕ e ♥</span>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // Update badge initially
  updateCartBadge();
}

// Format prices in BRL currency helper
function formatPreco(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Hook everything up on page load
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  renderHeaderFooter();
});
