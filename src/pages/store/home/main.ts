import "../../../style.css";
import { requireAuth, logout, getUsuarioActual } from "../../../utils/auth.ts";
import { getCategorias, getProductos } from "../../../utils/api.ts";
import { contarItems } from "../../../utils/cart.ts";
import { escapeHtml, safeImgSrc, debounce } from "../../../utils/index.ts";
import { getEl } from "../../../utils/dom.ts";
import { ROUTES } from "../../../utils/routes.ts";
import type { Categoria, Producto } from "../../../types/index.ts";

requireAuth();

const usuario = getUsuarioActual()!;
const app = document.getElementById("app")!;

app.innerHTML = `
  <div class="min-h-screen bg-surface flex flex-col">

    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button id="sidebar-toggle" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-secondary" aria-label="Menú categorías">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <a href="/" class="flex items-center gap-2 font-bold text-xl text-secondary">
            <span class="text-2xl">🍔</span>
            <span class="hidden sm:inline">Food Store</span>
          </a>
        </div>

        <div class="flex-1 max-w-md hidden sm:block">
          <input
            id="search-input"
            type="search"
            placeholder="Buscar productos..."
            class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted text-sm"
          />
        </div>

        <div class="flex items-center gap-2">
          ${
            usuario.rol === "ADMIN"
              ? `
          <a href="${ROUTES.adminHome}" class="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition">
            Admin
          </a>`
              : `
          <a href="${ROUTES.clientOrders}" class="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition">
            Mis Pedidos
          </a>`
          }
          <span class="hidden md:block text-sm text-muted">Hola, <strong class="text-secondary">${escapeHtml(usuario.nombre)}</strong></span>
          <a href="${ROUTES.cart}" class="relative p-2 rounded-xl hover:bg-orange-50 transition" aria-label="Carrito">
            <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span id="cart-badge" class="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 hidden">0</span>
          </a>
          <button id="logout-btn" class="p-2 rounded-xl hover:bg-gray-100 transition text-muted hover:text-secondary" aria-label="Cerrar sesión">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile search -->
      <div class="sm:hidden px-4 pb-3">
        <input
          id="search-input-mobile"
          type="search"
          placeholder="Buscar productos..."
          class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted text-sm"
        />
      </div>
    </header>

    <!-- Body -->
    <div class="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">

      <!-- Sidebar overlay (mobile) -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/40 z-30 hidden lg:hidden"></div>

      <!-- Sidebar -->
      <aside id="sidebar" class="
        fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-40 transform -translate-x-full transition-transform duration-300
        lg:static lg:h-auto lg:w-56 lg:shrink-0 lg:translate-x-0 lg:shadow-none lg:bg-transparent lg:z-auto
      ">
        <div class="p-4 lg:p-0 h-full overflow-y-auto">
          <div class="flex items-center justify-between mb-4 lg:hidden">
            <h2 class="font-bold text-secondary">Categorías</h2>
            <button id="sidebar-close" class="p-1 rounded-lg hover:bg-gray-100 text-muted">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <h2 class="hidden lg:block font-bold text-secondary mb-3 text-sm uppercase tracking-wide">Categorías</h2>
          <nav id="categories-nav" class="space-y-1">
            <div class="animate-pulse space-y-2">
              ${[1, 2, 3, 4].map(() => `<div class="h-10 bg-gray-200 rounded-xl"></div>`).join("")}
            </div>
          </nav>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 min-w-0">
        <!-- Sort bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p id="results-count" class="text-sm text-muted"></p>
          <select id="sort-select" class="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-secondary cursor-pointer">
            <option value="default">Ordenar por</option>
            <option value="az">Nombre A → Z</option>
            <option value="za">Nombre Z → A</option>
            <option value="price-asc">Precio menor → mayor</option>
            <option value="price-desc">Precio mayor → menor</option>
          </select>
        </div>

        <!-- Product grid -->
        <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          <!-- skeleton -->
          ${[1, 2, 3, 4, 5, 6]
            .map(
              () => `
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
              <div class="h-48 bg-gray-200"></div>
              <div class="p-4 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 rounded w-full"></div>
                <div class="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>

        <!-- Error state -->
        <div id="error-state" class="hidden text-center py-16">
          <div class="text-5xl mb-4">⚠️</div>
          <p id="error-msg" class="text-secondary font-medium"></p>
          <button id="retry-btn" class="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium text-sm">
            Reintentar
          </button>
        </div>

        <!-- Empty state -->
        <div id="empty-state" class="hidden text-center py-16">
          <div class="text-5xl mb-4">🔍</div>
          <p class="text-secondary font-medium">No se encontraron productos</p>
          <p class="text-muted text-sm mt-1">Probá con otra búsqueda o categoría</p>
        </div>
      </main>
    </div>
  </div>
`;

// --- State ---
let allProducts: Producto[] = [];
let categorias: Categoria[] = [];
let selectedCategoryId: number | null = null;
let searchQuery = "";
let sortOrder = "default";

// --- Cart badge ---
function updateCartBadge(): void {
  const count = contarItems();
  const badge = document.getElementById("cart-badge")!;
  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

// --- Filtering / sorting ---
function getFilteredProducts(): Producto[] {
  let result = allProducts.filter(
    (p) => p.disponible && !(p.eliminado ?? false),
  );

  if (selectedCategoryId !== null) {
    result = result.filter((p) => p.categoria.id === selectedCategoryId);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter((p) => p.nombre.toLowerCase().includes(q));
  }

  switch (sortOrder) {
    case "az":
      result = [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case "za":
      result = [...result].sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    case "price-asc":
      result = [...result].sort((a, b) => a.precio - b.precio);
      break;
    case "price-desc":
      result = [...result].sort((a, b) => b.precio - a.precio);
      break;
  }

  return result;
}

function renderProducts(): void {
  const grid = document.getElementById("product-grid")!;
  const emptyState = document.getElementById("empty-state")!;
  const resultsCount = document.getElementById("results-count")!;
  const filtered = getFilteredProducts();

  resultsCount.textContent = `${filtered.length} producto${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  grid.innerHTML = filtered
    .map((p) => {
      const imgSrc = safeImgSrc(p.imagen);
      const nombre = escapeHtml(p.nombre);
      const descripcion = p.descripcion ? escapeHtml(p.descripcion) : null;
      const categoriaNombre = escapeHtml(p.categoria.nombre);
      const precio = p.precio.toLocaleString("es-AR");
      const imgTag = imgSrc
        ? `<img src="${escapeHtml(imgSrc)}" alt="${nombre}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />`
        : `<div class="w-full h-full flex items-center justify-center text-5xl">🍽️</div>`;
      const badgeClass = p.disponible
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-600";
      const badgeText = p.disponible ? "Disponible" : "No disponible";
      const descHtml = descripcion
        ? `<p class="text-muted text-sm line-clamp-2 mb-3">${descripcion}</p>`
        : `<div class="mb-3"></div>`;
      return `
    <article
      class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group"
      data-id="${p.id}"
    >
      <div class="relative h-48 overflow-hidden bg-gray-100">
        ${imgTag}
        <span class="absolute top-2 right-2 ${badgeClass} text-xs font-semibold px-2 py-0.5 rounded-full">
          ${badgeText}
        </span>
      </div>
      <div class="p-4">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">${categoriaNombre}</p>
        <h3 class="font-semibold text-secondary text-base leading-tight mb-1 line-clamp-1">${nombre}</h3>
        ${descHtml}
        <div class="flex items-center justify-between">
          <span class="text-primary font-bold text-lg">$${precio}</span>
          <span class="text-xs text-muted">Stock: ${p.stock}</span>
        </div>
      </div>
    </article>`;
    })
    .join("");
}

function renderCategories(): void {
  const nav = document.getElementById("categories-nav")!;

  const items: { id: number | null; nombre: string }[] = [
    { id: null, nombre: "Todas" },
    ...categorias.map((c) => ({ id: c.id, nombre: c.nombre })),
  ];

  nav.innerHTML = items
    .map((c) => {
      const activeClass =
        selectedCategoryId === c.id
          ? "bg-primary text-white"
          : "text-secondary hover:bg-orange-50 hover:text-primary";
      return `
    <button
      class="category-btn w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeClass}"
      data-category="${c.id ?? "all"}"
    >
      ${escapeHtml(c.nombre)}
    </button>`;
    })
    .join("");
}

// --- Sidebar (mobile) ---
const sidebar = getEl("sidebar");
const sidebarOverlay = getEl("sidebar-overlay");

function openSidebar(): void {
  sidebar.classList.remove("-translate-x-full");
  sidebarOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeSidebar(): void {
  sidebar.classList.add("-translate-x-full");
  sidebarOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

getEl("sidebar-toggle").addEventListener("click", openSidebar);
getEl("sidebar-close").addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// --- Search ---
const debouncedSearch = debounce((value: string) => {
  searchQuery = (value as string).trim();
  renderProducts();
}, 300);

function bindSearch(id: string): void {
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input) return;
  input.addEventListener("input", () => {
    const other =
      id === "search-input" ? "search-input-mobile" : "search-input";
    const otherEl = document.getElementById(other) as HTMLInputElement | null;
    if (otherEl) otherEl.value = input.value;
    debouncedSearch(input.value);
  });
}

bindSearch("search-input");
bindSearch("search-input-mobile");

// --- Sort ---
document.getElementById("sort-select")!.addEventListener("change", (e) => {
  sortOrder = (e.target as HTMLSelectElement).value;
  renderProducts();
});

// --- Event delegation ---
document.getElementById("product-grid")!.addEventListener("click", (e) => {
  const card = (e.target as Element).closest("article[data-id]");
  if (!card) return;
  const id = (card as HTMLElement).dataset.id;
  window.location.href = `${ROUTES.productDetail}?id=${id}`;
});

document.getElementById("categories-nav")!.addEventListener("click", (e) => {
  const btn = (e.target as Element).closest(".category-btn");
  if (!btn) return;
  const val = (btn as HTMLElement).dataset.category;
  selectedCategoryId = val === "all" ? null : Number(val);
  renderCategories();
  renderProducts();
  closeSidebar();
});

// --- Logout ---
document.getElementById("logout-btn")!.addEventListener("click", logout);

// --- Load data ---
async function loadData(): Promise<void> {
  const grid = document.getElementById("product-grid")!;
  const errorState = document.getElementById("error-state")!;
  const errorMsg = document.getElementById("error-msg")!;
  const retryBtn = document.getElementById("retry-btn")!;

  errorState.classList.add("hidden");

  try {
    [categorias, allProducts] = await Promise.all([
      getCategorias(),
      getProductos(),
    ]);
    renderCategories();
    renderProducts();
  } catch (err) {
    grid.innerHTML = "";
    errorMsg.textContent =
      err instanceof Error ? err.message : "Error al cargar los productos.";
    errorState.classList.remove("hidden");
    retryBtn.onclick = loadData;
  }
}

updateCartBadge();
loadData();
