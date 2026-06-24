import "../../../style.css";
import { requireAuth, logout } from "../../../utils/auth.ts";
import { getProductos } from "../../../utils/api.ts";
import { agregarItem, contarItems } from "../../../utils/cart.ts";
import { escapeHtml, safeImgSrc } from "../../../utils/index.ts";
import { ROUTES } from "../../../utils/routes.ts";
import type { Producto } from "../../../types/index.ts";

requireAuth();

const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));

const app = document.getElementById("app")!;

function renderShell(): void {
  app.innerHTML = `
    <div class="min-h-screen bg-surface flex flex-col">
      <header class="bg-white shadow-sm sticky top-0 z-40">
        <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="${ROUTES.storeHome}" class="flex items-center gap-2 font-bold text-xl text-secondary hover:text-primary transition">
            <span class="text-2xl">🍔</span>
            <span class="hidden sm:inline">Food Store</span>
          </a>
          <div class="flex items-center gap-2">
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
      </header>
      <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-8" id="main-content">
        <div class="animate-pulse space-y-6">
          <div class="h-5 w-32 bg-gray-200 rounded"></div>
          <div class="grid md:grid-cols-2 gap-8">
            <div class="h-80 bg-gray-200 rounded-2xl"></div>
            <div class="space-y-4">
              <div class="h-6 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-full"></div>
              <div class="h-4 bg-gray-200 rounded w-2/3"></div>
              <div class="h-8 bg-gray-200 rounded w-1/3 mt-4"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
  document.getElementById("logout-btn")!.addEventListener("click", logout);
  updateCartBadge();
}

function updateCartBadge(): void {
  const count = contarItems();
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function renderProduct(p: Producto): void {
  const main = document.getElementById("main-content")!;
  const imgSrc = safeImgSrc(p.imagen);
  const nombre = escapeHtml(p.nombre);
  const descripcion = p.descripcion ? escapeHtml(p.descripcion) : null;
  const categoriaNombre = escapeHtml(p.categoria.nombre);
  const noDisponible = !p.disponible || p.stock === 0;

  main.innerHTML = `
    <div>
      <a href="${ROUTES.storeHome}" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver al catálogo
      </a>

      <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
        <!-- Imagen -->
        <div class="relative rounded-2xl overflow-hidden bg-gray-100 h-72 md:h-auto md:min-h-[360px]">
          ${
            imgSrc
              ? `<img src="${escapeHtml(imgSrc)}" alt="${nombre}" class="w-full h-full object-cover" />`
              : `<div class="w-full h-full flex items-center justify-center text-7xl">🍽️</div>`
          }
          <span class="absolute top-3 right-3 ${p.disponible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"} text-xs font-semibold px-3 py-1 rounded-full">
            ${p.disponible ? "Disponible" : "No disponible"}
          </span>
        </div>

        <!-- Info -->
        <div class="flex flex-col">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-2">${categoriaNombre}</p>
          <h1 class="text-2xl sm:text-3xl font-bold text-secondary mb-3">${nombre}</h1>
          ${descripcion ? `<p class="text-muted text-base leading-relaxed mb-5">${descripcion}</p>` : ""}

          <div class="flex items-baseline gap-3 mb-2">
            <span class="text-3xl font-bold text-primary">$${p.precio.toLocaleString("es-AR")}</span>
          </div>
          <p class="text-sm text-muted mb-6">
            Stock disponible: <strong class="text-secondary">${p.stock}</strong> unidades
          </p>

          ${
            noDisponible
              ? `
          <div class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
            ${!p.disponible ? "Este producto no está disponible." : "Sin stock disponible."}
          </div>`
              : `
          <!-- Cantidad -->
          <div class="flex items-center gap-3 mb-5">
            <label class="text-sm font-medium text-secondary">Cantidad:</label>
            <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button id="qty-minus" class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition text-secondary font-bold text-lg disabled:opacity-40">−</button>
              <input
                id="qty-input"
                type="number"
                value="1"
                min="1"
                max="${p.stock}"
                class="w-14 h-10 text-center text-secondary font-semibold text-base border-x border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button id="qty-plus" class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition text-secondary font-bold text-lg disabled:opacity-40">+</button>
            </div>
            <span id="qty-error" class="text-xs text-red-500 hidden">Máximo ${p.stock}</span>
          </div>`
          }

          <!-- Feedback -->
          <div id="feedback" class="hidden mb-4 px-4 py-3 rounded-xl text-sm font-medium"></div>

          <!-- Botón -->
          <button
            id="add-btn"
            ${noDisponible ? "disabled" : ""}
            class="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            ${noDisponible ? "No disponible" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </div>
  `;

  if (noDisponible) return;

  const qtyInput = document.getElementById("qty-input") as HTMLInputElement;
  const qtyMinus = document.getElementById("qty-minus") as HTMLButtonElement;
  const qtyPlus = document.getElementById("qty-plus") as HTMLButtonElement;
  const qtyError = document.getElementById("qty-error")!;
  const addBtn = document.getElementById("add-btn") as HTMLButtonElement;
  const feedback = document.getElementById("feedback")!;

  function getCantidad(): number {
    return parseInt(qtyInput.value) || 1;
  }

  function syncButtons(): void {
    const qty = getCantidad();
    qtyMinus.disabled = qty <= 1;
    qtyPlus.disabled = qty >= p.stock;
    const over = qty > p.stock;
    qtyError.classList.toggle("hidden", !over);
    addBtn.disabled = over;
  }

  qtyMinus.addEventListener("click", () => {
    const v = getCantidad();
    if (v > 1) qtyInput.value = String(v - 1);
    syncButtons();
  });

  qtyPlus.addEventListener("click", () => {
    const v = getCantidad();
    if (v < p.stock) qtyInput.value = String(v + 1);
    syncButtons();
  });

  qtyInput.addEventListener("input", () => {
    let v = parseInt(qtyInput.value);
    if (isNaN(v) || v < 1) v = 1;
    qtyInput.value = String(v);
    syncButtons();
  });

  syncButtons();

  addBtn.addEventListener("click", () => {
    const cantidad = getCantidad();
    try {
      agregarItem(p, cantidad);
      updateCartBadge();
      feedback.textContent = `✓ ${cantidad} × ${p.nombre} agregado al carrito`;
      feedback.className =
        "mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-green-50 border border-green-200 text-green-700";
      feedback.classList.remove("hidden");
      setTimeout(() => feedback.classList.add("hidden"), 3000);
    } catch (err) {
      feedback.textContent =
        err instanceof Error ? err.message : "Error al agregar al carrito.";
      feedback.className =
        "mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-600";
      feedback.classList.remove("hidden");
    }
  });
}

function renderError(msg: string): void {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `
    <div class="text-center py-20">
      <div class="text-5xl mb-4">⚠️</div>
      <p class="text-secondary font-medium mb-4">${escapeHtml(msg)}</p>
      <a href="${ROUTES.storeHome}" class="inline-block px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium text-sm">
        Volver al catálogo
      </a>
    </div>
  `;
}

async function init(): Promise<void> {
  renderShell();

  if (!productId || isNaN(productId)) {
    renderError("Producto no encontrado.");
    return;
  }

  try {
    const productos = await getProductos();
    const producto = productos.find((p) => p.id === productId);
    if (!producto) {
      renderError("Producto no encontrado.");
      return;
    }
    renderProduct(producto);
  } catch (err) {
    renderError(
      err instanceof Error ? err.message : "Error al cargar el producto.",
    );
  }
}

init();
