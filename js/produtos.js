// State variables for Catalog Page
let allProducts = [];
let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'default';

document.addEventListener('DOMContentLoaded', async () => {
  // Load products database
  allProducts = await getProducts();
  
  // Parse URL query parameter for category (e.g., ?cat=buques)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');
  if (catParam) {
    currentCategory = catParam;
    // Update active button state
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      if (btn.getAttribute('data-category') === catParam) {
        btn.classList.add('active');
        btn.style.backgroundColor = 'var(--primary-dark)';
        btn.style.color = 'var(--text-light)';
      } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
        btn.style.color = '';
      }
    });
  } else {
    // Style active 'all' button initially
    const allBtn = document.querySelector('.filter-btn[data-category="all"]');
    if (allBtn) {
      allBtn.style.backgroundColor = 'var(--primary-dark)';
      allBtn.style.color = 'var(--text-light)';
    }
  }

  // Setup initial event handlers
  setupCatalogEvents();

  // Initial render
  filterAndRenderCatalog();
});

function setupCatalogEvents() {
  // Category buttons click events
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active from all
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.style.backgroundColor = '';
        b.style.color = '';
      });
      
      // Add active to current
      const category = btn.getAttribute('data-category');
      currentCategory = category;
      btn.classList.add('active');
      btn.style.backgroundColor = 'var(--primary-dark)';
      btn.style.color = 'var(--text-light)';
      
      filterAndRenderCatalog();
    });
  });

  // Search input and button events
  const searchInput = document.getElementById('search-input');
  const btnSearch = document.getElementById('btn-search');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      filterAndRenderCatalog();
    });
  }
  
  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      if (searchInput) {
        currentSearch = searchInput.value.trim().toLowerCase();
        filterAndRenderCatalog();
      }
    });
  }

  // Sort select change event
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      filterAndRenderCatalog();
    });
  }

  // Clear filters button
  const btnClear = document.getElementById('btn-clear-filters');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      currentCategory = 'all';
      currentSearch = '';
      currentSort = 'default';
      
      // Reset search field
      if (searchInput) searchInput.value = '';
      
      // Reset sort select
      if (sortSelect) sortSelect.value = 'default';
      
      // Reset category button styles
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.style.backgroundColor = '';
        b.style.color = '';
        if (b.getAttribute('data-category') === 'all') {
          b.classList.add('active');
          b.style.backgroundColor = 'var(--primary-dark)';
          b.style.color = 'var(--text-light)';
        }
      });
      
      filterAndRenderCatalog();
    });
  }
}

function filterAndRenderCatalog() {
  const container = document.getElementById('catalog-products-container');
  const countText = document.getElementById('catalog-count-text');
  const btnClear = document.getElementById('btn-clear-filters');
  
  if (!container) return;
  
  // 1. Filtering
  let filtered = allProducts.filter(product => {
    const matchesCategory = currentCategory === 'all' || product.categoria === currentCategory;
    const matchesSearch = product.nome.toLowerCase().includes(currentSearch) || 
                          product.descricao.toLowerCase().includes(currentSearch);
    return matchesCategory && matchesSearch;
  });
  
  // 2. Sorting
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => a.preco - b.preco);
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => b.preco - a.preco);
  } else if (currentSort === 'alphabetical') {
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));
  } else {
    // Default sorting - highlights first
    filtered.sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
  }
  
  // Update stats labels
  if (countText) {
    const text = filtered.length === 1 ? '1 produto encontrado' : `${filtered.length} produtos encontrados`;
    countText.innerText = text;
  }
  
  // Show/hide clear button
  if (btnClear) {
    const filtersActive = currentCategory !== 'all' || currentSearch !== '' || currentSort !== 'default';
    btnClear.style.display = filtersActive ? 'inline-block' : 'none';
  }
  
  // 3. Rendering Cards
  container.innerHTML = '';
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <span class="fs-1 d-block mb-3">✿</span>
        <p class="text-muted">Nenhum produto correspondente encontrado para os filtros selecionados.</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(product => {
    container.innerHTML += `
      <div class="col-md-4 col-sm-6">
        <div class="product-card">
          <div class="product-img-wrapper">
            ${product.destaque ? '<span class="product-tag">Destaque</span>' : ''}
            <img src="${product.imagem}" onerror="this.src='https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=400&q=80'" alt="${product.nome}" class="product-img">
          </div>
          <div class="product-body">
            <span class="text-uppercase text-muted fw-bold small" style="font-size:0.75rem;">${capitalize(product.categoria)}</span>
            <h3 class="product-title h5 mt-1">${product.nome}</h3>
            <p class="product-desc">${product.descricao}</p>
            <div class="product-footer">
              <span class="product-price">${formatPreco(product.preco)}</span>
              <button class="btn btn-premium btn-sm py-2 px-3" onclick="triggerAddToCart('${product.id}', '${product.nome}', ${product.preco}, '${product.imagem}')">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function triggerAddToCart(id, nome, preco, imagem) {
  const item = {
    id: id,
    nome: nome,
    preco: parseFloat(preco),
    imagem: imagem,
    quantidade: 1,
    isCustom: false
  };
  addToCart(item);
}

// Capitalize helper
function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}
