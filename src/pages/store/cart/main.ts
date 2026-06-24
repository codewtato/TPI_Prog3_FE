import "../../../style.css";
import { requireAuth, logout, getUsuarioActual } from "../../../utils/auth.ts";
import {
  getCarrito,
  actualizarCantidad,
  eliminarItem,
  vaciarCarrito,
  contarItems,
} from "../../../utils/cart.ts";
import { ENVIO } from "../../../utils/config.ts";
import { escapeHtml, safeImgSrc, formatARS } from "../../../utils/index.ts";
import { ROUTES } from "../../../utils/routes.ts";
import { getPedidosLocal, savePedidoLocal } from "../../../utils/api.ts";
import type {
  ItemCarrito,
  Pedido,
  DetallePedido,
  FormaPago,
} from "../../../types/index.ts";

requireAuth();
const usuario = getUsuarioActual()!;
const app = document.getElementById("app")!;

function generatePedidoId(): number {
  const pedidos = getPedidosLocal();
  if (pedidos.length === 0) return 1000;
  return Math.max(...pedidos.map((p) => p.id)) + 1;
}

// --- Render helpers ---
function calcSubtotal(items: ItemCarrito[]): number {
  return items.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0);
}

// --- Main render ---
function render(): void {
  const items = getCarrito();
  const count = contarItems();

  app.innerHTML = `
    <div class="min-h-screen bg-surface flex flex-col">

      <!-- Header -->
      <header class="bg-white shadow-sm sticky top-0 z-40">
        <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="${ROUTES.storeHome}" class="flex items-center gap-2 font-bold text-xl text-secondary hover:text-primary transition">
            <span class="text-2xl">🍔</span>
            <span class="hidden sm:inline">Food Store</span>
          </a>
          <h1 class="text-base font-semibold text-secondary flex items-center gap-2">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Carrito
            ${count > 0 ? `<span class="bg-primary text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">${count}</span>` : ""}
          </h1>
          <button id="logout-btn" class="p-2 rounded-xl hover:bg-gray-100 transition text-muted hover:text-secondary" aria-label="Cerrar sesión">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Body -->
      <main class="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        ${items.length === 0 ? renderEmpty() : renderCart(items)}
      </main>
    </div>

    <!-- Checkout modal -->
    <div id="checkout-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold text-secondary">Confirmar pedido</h2>
            <button id="modal-close" class="p-1.5 rounded-lg hover:bg-gray-100 text-muted transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form id="checkout-form" novalidate>
            <!-- Resumen -->
            <div id="modal-summary" class="bg-surface rounded-xl p-4 mb-5 text-sm space-y-1.5"></div>

            <!-- Teléfono -->
            <div class="mb-4">
              <label for="checkout-phone" class="block text-sm font-medium text-secondary mb-1.5">Teléfono de contacto <span class="text-red-500">*</span></label>
              <input
                id="checkout-phone"
                type="tel"
                placeholder="Ej: 11 1234-5678"
                value="${escapeHtml(usuario.celular ?? "")}"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted text-sm"
              />
              <p id="phone-error" class="text-xs text-red-500 mt-1 hidden">Ingresá un teléfono válido.</p>
            </div>

            <!-- Forma de pago -->
            <div class="mb-6">
              <p class="text-sm font-medium text-secondary mb-2">Forma de pago <span class="text-red-500">*</span></p>
              <div class="grid grid-cols-3 gap-2" id="payment-group">
                ${(["TARJETA", "TRANSFERENCIA", "EFECTIVO"] as FormaPago[])
                  .map(
                    (fp) => `
                  <label class="payment-option cursor-pointer">
                    <input type="radio" name="formaPago" value="${fp}" class="sr-only" />
                    <div class="border-2 border-gray-200 rounded-xl p-3 text-center text-xs font-semibold text-secondary transition-colors hover:border-primary/50">
                      <div class="text-lg mb-1">${fp === "TARJETA" ? "💳" : fp === "TRANSFERENCIA" ? "🏦" : "💵"}</div>
                      ${fp === "TARJETA" ? "Tarjeta" : fp === "TRANSFERENCIA" ? "Transferencia" : "Efectivo"}
                    </div>
                  </label>
                `,
                  )
                  .join("")}
              </div>
              <p id="payment-error" class="text-xs text-red-500 mt-1 hidden">Seleccioná una forma de pago.</p>
            </div>

            <!-- Feedback -->
            <div id="checkout-feedback" class="hidden mb-4 px-4 py-3 rounded-xl text-sm font-medium"></div>

            <button
              type="submit"
              id="confirm-btn"
              class="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors text-base"
            >
              Confirmar pedido
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById("logout-btn")!.addEventListener("click", logout);
  bindCartEvents(items);
  bindCheckoutModal(items);
}

function renderEmpty(): string {
  return `
    <div class="text-center py-24">
      <div class="text-7xl mb-5">🛒</div>
      <h2 class="text-xl font-bold text-secondary mb-2">Tu carrito está vacío</h2>
      <p class="text-muted text-sm mb-8">Agregá productos desde el catálogo.</p>
      <a href="${ROUTES.storeHome}" class="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Ir a la tienda
      </a>
    </div>
  `;
}

function renderCart(items: ItemCarrito[]): string {
  const subtotal = calcSubtotal(items);
  const total = subtotal + ENVIO;

  return `
    <div class="flex flex-col lg:flex-row gap-6">

      <!-- Items list -->
      <section class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-secondary text-base">
            ${items.length} producto${items.length !== 1 ? "s" : ""}
          </h2>
          <button id="clear-cart-btn" class="text-xs text-red-500 hover:text-red-700 font-medium transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Vaciar carrito
          </button>
        </div>

        <div class="space-y-3" id="cart-items">
          ${items.map((item) => renderCartItem(item)).join("")}
        </div>
      </section>

      <!-- Summary -->
      <aside class="w-full lg:w-72 shrink-0">
        <div class="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
          <h2 class="font-semibold text-secondary text-base mb-4">Resumen</h2>
          <div class="space-y-3 text-sm mb-4">
            <div class="flex justify-between text-muted">
              <span>Subtotal</span>
              <span class="text-secondary font-medium">$${formatARS(subtotal)}</span>
            </div>
            <div class="flex justify-between text-muted">
              <span>Envío</span>
              <span class="text-secondary font-medium">$${formatARS(ENVIO)}</span>
            </div>
            <div class="border-t border-gray-100 pt-3 flex justify-between font-bold text-secondary text-base">
              <span>Total</span>
              <span class="text-primary">$${formatARS(total)}</span>
            </div>
          </div>
          <button
            id="checkout-btn"
            class="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Confirmar pedido
          </button>
          <a href="${ROUTES.storeHome}" class="mt-3 w-full py-2.5 border border-gray-200 text-secondary hover:bg-gray-50 font-medium rounded-xl transition-colors text-sm text-center block">
            Seguir comprando
          </a>
        </div>
      </aside>

    </div>
  `;
}

function renderCartItem(item: ItemCarrito): string {
  const imgSrc = safeImgSrc(item.producto.imagen);
  const nombre = escapeHtml(item.producto.nombre);
  const subtotal = item.producto.precio * item.cantidad;

  const imgTag = imgSrc
    ? `<img src="${escapeHtml(imgSrc)}" alt="${nombre}" class="w-full h-full object-cover" loading="lazy" />`
    : `<div class="w-full h-full flex items-center justify-center text-2xl">🍽️</div>`;

  return `
    <div class="bg-white rounded-2xl shadow-sm p-4 flex gap-4" data-item-id="${item.producto.id}">
      <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
        ${imgTag}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between gap-2 mb-1">
          <h3 class="font-semibold text-secondary text-sm leading-tight line-clamp-2">${nombre}</h3>
          <button class="delete-item-btn shrink-0 p-1 text-muted hover:text-red-500 transition" aria-label="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <p class="text-xs text-muted mb-3">$${formatARS(item.producto.precio)} c/u</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button class="qty-minus w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition text-secondary font-bold disabled:opacity-40" ${item.cantidad <= 1 ? "disabled" : ""}>−</button>
            <span class="qty-display w-8 h-8 flex items-center justify-center text-sm font-semibold text-secondary border-x border-gray-200">${item.cantidad}</span>
            <button class="qty-plus w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition text-secondary font-bold disabled:opacity-40" ${item.cantidad >= item.producto.stock ? "disabled" : ""}>+</button>
          </div>
          <span class="text-primary font-bold text-sm">$${formatARS(subtotal)}</span>
        </div>
        <p id="stock-error-${item.producto.id}" class="text-xs text-red-500 mt-1 hidden">Stock máximo: ${item.producto.stock}</p>
      </div>
    </div>
  `;
}

// --- Event binding ---
function bindCartEvents(items: ItemCarrito[]): void {
  if (items.length === 0) return;

  document.getElementById("clear-cart-btn")!.addEventListener("click", () => {
    if (confirm("¿Vaciar el carrito?")) {
      vaciarCarrito();
      render();
    }
  });

  document
    .getElementById("checkout-btn")!
    .addEventListener("click", openCheckoutModal);

  document.querySelectorAll("[data-item-id]").forEach((el) => {
    const id = Number((el as HTMLElement).dataset.itemId);
    const item = items.find((i) => i.producto.id === id)!;

    el.querySelector(".delete-item-btn")!.addEventListener("click", () => {
      eliminarItem(id);
      render();
    });

    el.querySelector(".qty-minus")!.addEventListener("click", () => {
      if (item.cantidad <= 1) return;
      actualizarCantidad(id, item.cantidad - 1);
      render();
    });

    el.querySelector(".qty-plus")!.addEventListener("click", () => {
      const next = item.cantidad + 1;
      if (next > item.producto.stock) return;
      try {
        actualizarCantidad(id, next);
        render();
      } catch {
        document
          .getElementById(`stock-error-${id}`)
          ?.classList.remove("hidden");
      }
    });
  });
}

// --- Checkout modal ---
function openCheckoutModal(): void {
  const modal = document.getElementById("checkout-modal")!;
  const items = getCarrito();
  const subtotal = calcSubtotal(items);
  const total = subtotal + ENVIO;

  const summary = document.getElementById("modal-summary")!;
  summary.innerHTML = `
    <div class="flex justify-between text-muted"><span>Subtotal</span><span class="font-medium text-secondary">$${formatARS(subtotal)}</span></div>
    <div class="flex justify-between text-muted"><span>Envío</span><span class="font-medium text-secondary">$${formatARS(ENVIO)}</span></div>
    <div class="flex justify-between font-bold text-secondary border-t border-gray-200 pt-1.5 mt-1.5">
      <span>Total</span><span class="text-primary">$${formatARS(total)}</span>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeCheckoutModal(): void {
  const modal = document.getElementById("checkout-modal")!;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function bindCheckoutModal(items: ItemCarrito[]): void {
  document
    .getElementById("modal-close")!
    .addEventListener("click", closeCheckoutModal);

  document.getElementById("checkout-modal")!.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeCheckoutModal();
  });

  // Payment option visual selection
  document
    .querySelectorAll(".payment-option input[type='radio']")
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        document.querySelectorAll(".payment-option div").forEach((div) => {
          div.classList.remove(
            "border-primary",
            "bg-orange-50",
            "text-primary",
          );
          div.classList.add("border-gray-200");
        });
        const label = (radio as HTMLInputElement)
          .closest(".payment-option")!
          .querySelector("div")!;
        label.classList.remove("border-gray-200");
        label.classList.add("border-primary", "bg-orange-50", "text-primary");
      });
    });

  document.getElementById("checkout-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    submitCheckout(items);
  });
}

function submitCheckout(items: ItemCarrito[]): void {
  const phoneInput = document.getElementById(
    "checkout-phone",
  ) as HTMLInputElement;
  const phoneError = document.getElementById("phone-error")!;
  const paymentError = document.getElementById("payment-error")!;
  const feedback = document.getElementById("checkout-feedback")!;
  const confirmBtn = document.getElementById(
    "confirm-btn",
  ) as HTMLButtonElement;

  const phone = phoneInput.value.trim();
  const selectedPayment = (
    document.querySelector(
      "input[name='formaPago']:checked",
    ) as HTMLInputElement | null
  )?.value as FormaPago | undefined;

  let valid = true;

  if (!phone || phone.length < 6) {
    phoneError.classList.remove("hidden");
    valid = false;
  } else {
    phoneError.classList.add("hidden");
  }

  if (!selectedPayment) {
    paymentError.classList.remove("hidden");
    valid = false;
  } else {
    paymentError.classList.add("hidden");
  }

  if (!valid) return;

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Procesando...";

  const detalles: DetallePedido[] = items.map((item) => ({
    cantidad: item.cantidad,
    subtotal: item.producto.precio * item.cantidad,
    producto: item.producto,
  }));

  const subtotal = detalles.reduce((acc, d) => acc + d.subtotal, 0);

  const pedido: Pedido = {
    id: generatePedidoId(),
    fecha: new Date().toISOString(),
    estado: "PENDIENTE",
    total: subtotal + ENVIO,
    formaPago: selectedPayment!,
    detalles,
    usuarioDto: { ...usuario, celular: phone },
  };

  savePedidoLocal(pedido);
  vaciarCarrito();

  feedback.textContent = `Pedido #${pedido.id} confirmado. Redirigiendo...`;
  feedback.className =
    "mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-green-50 border border-green-200 text-green-700";
  feedback.classList.remove("hidden");

  setTimeout(() => {
    window.location.href = ROUTES.clientOrders;
  }, 1200);
}

render();
