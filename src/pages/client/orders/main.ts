import "../../../style.css";
import { requireAuth, logout, getUsuarioActual } from "../../../utils/auth.ts";
import { getPedidos, getPedidosLocal } from "../../../utils/api.ts";
import {
  escapeHtml,
  safeImgSrc,
  formatARS,
  formatFecha,
  normalizeEstado,
} from "../../../utils/index.ts";
import { PAGO_LABEL, estadoBadge } from "../../../utils/orderStatus.ts";
import { ROUTES } from "../../../utils/routes.ts";
import type { Pedido, DetallePedido } from "../../../types/index.ts";

requireAuth();
const usuario = getUsuarioActual()!;
const app = document.getElementById("app")!;

// --- Render helpers ---

function renderEmpty(): string {
  return `
    <div class="text-center py-24">
      <div class="text-7xl mb-5">📦</div>
      <h2 class="text-xl font-bold text-secondary mb-2">No tenés pedidos todavía</h2>
      <p class="text-muted text-sm mb-8">Cuando hagas tu primer pedido, aparecerá aquí.</p>
      <a
        href="${ROUTES.storeHome}"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Ir a la tienda
      </a>
    </div>
  `;
}

function renderOrderCard(pedido: Pedido): string {
  const preview = pedido.detalles.slice(0, 3);
  const more = pedido.detalles.length - 3;
  const namesPreview = pedido.detalles
    .slice(0, 3)
    .map((d) => `${escapeHtml(d.producto.nombre)} x${d.cantidad}`)
    .join(" · ");

  const imgPreviews = preview
    .map((d) => {
      const img = safeImgSrc(d.producto.imagen);
      return img
        ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(d.producto.nombre)}" class="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-100" loading="lazy" />`
        : `<div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center text-lg">🍽️</div>`;
    })
    .join("");

  return `
    <article
      class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 border border-transparent hover:border-primary/20"
      data-pedido-id="${pedido.id}"
    >
      <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p class="text-xs text-muted mb-0.5">Pedido #${pedido.id}</p>
          <p class="text-sm font-medium text-secondary">${formatFecha(pedido.fecha)}</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap justify-end">
          ${estadoBadge(pedido.estado)}
          <span class="font-bold text-primary text-lg">$${formatARS(pedido.total)}</span>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap mb-2">
        ${imgPreviews}
        ${more > 0 ? `<span class="text-xs text-muted font-medium">+${more} más</span>` : ""}
      </div>

      <p class="text-xs text-muted leading-relaxed">
        ${namesPreview}${pedido.detalles.length > 3 ? "..." : ""}
      </p>
    </article>
  `;
}

function renderDetalleRow(d: DetallePedido): string {
  const img = safeImgSrc(d.producto.imagen);
  const imgTag = img
    ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(d.producto.nombre)}" class="w-12 h-12 rounded-lg object-cover bg-gray-100" loading="lazy" />`
    : `<div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">🍽️</div>`;

  return `
    <div class="flex items-center gap-3">
      ${imgTag}
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-secondary leading-tight line-clamp-1">${escapeHtml(d.producto.nombre)}</p>
        <p class="text-xs text-muted">$${formatARS(d.producto.precio)} × ${d.cantidad}</p>
      </div>
      <span class="text-sm font-semibold text-secondary shrink-0">$${formatARS(d.subtotal)}</span>
    </div>
  `;
}

// --- Detail modal ---

function openDetail(pedido: Pedido): void {
  const modal = document.getElementById("detail-modal")!;
  const content = document.getElementById("modal-content")!;

  const subtotalSum = pedido.detalles.reduce((a, d) => a + d.subtotal, 0);
  const envio = pedido.total - subtotalSum;
  const pagoLabel = PAGO_LABEL[pedido.formaPago] ?? pedido.formaPago;
  const celular = pedido.usuarioDto.celular
    ? `<p class="text-sm text-muted mt-0.5">${escapeHtml(pedido.usuarioDto.celular)}</p>`
    : "";

  content.innerHTML = `
    <div class="flex items-start justify-between mb-5 gap-4">
      <div>
        <h2 class="text-lg font-bold text-secondary">Pedido #${pedido.id}</h2>
        <p class="text-sm text-muted">${formatFecha(pedido.fecha)}</p>
      </div>
      <button id="modal-close-btn" class="p-1.5 rounded-lg hover:bg-gray-100 text-muted transition shrink-0" aria-label="Cerrar">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="flex flex-wrap gap-2 mb-5">
      ${estadoBadge(pedido.estado)}
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-secondary">
        ${escapeHtml(pagoLabel)}
      </span>
    </div>

    <!-- Info de entrega -->
    <div class="bg-surface rounded-xl p-4 mb-5">
      <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Datos de entrega</p>
      <p class="text-sm font-medium text-secondary">
        ${escapeHtml(pedido.usuarioDto.nombre)} ${escapeHtml(pedido.usuarioDto.apellido)}
      </p>
      ${celular}
    </div>

    <!-- Productos -->
    <div class="mb-5">
      <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
        Productos (${pedido.detalles.length})
      </p>
      <div class="space-y-3">
        ${pedido.detalles.map((d) => renderDetalleRow(d)).join("")}
      </div>
    </div>

    <!-- Desglose de costos -->
    <div class="border-t border-gray-100 pt-4 space-y-2 text-sm">
      <div class="flex justify-between text-muted">
        <span>Subtotal</span>
        <span>$${formatARS(subtotalSum)}</span>
      </div>
      ${
        envio > 0
          ? `
      <div class="flex justify-between text-muted">
        <span>Envío</span>
        <span>$${formatARS(envio)}</span>
      </div>`
          : ""
      }
      <div class="flex justify-between font-bold text-secondary text-base border-t border-gray-100 pt-2 mt-2">
        <span>Total</span>
        <span class="text-primary">$${formatARS(pedido.total)}</span>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  document
    .getElementById("modal-close-btn")!
    .addEventListener("click", closeDetail);
}

function closeDetail(): void {
  const modal = document.getElementById("detail-modal")!;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// --- Page render ---

function renderPage(pedidos: Pedido[]): void {
  app.innerHTML = `
    <div class="min-h-screen bg-surface flex flex-col">

      <!-- Header -->
      <header class="bg-white shadow-sm sticky top-0 z-40">
        <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="${ROUTES.storeHome}" class="flex items-center gap-2 font-bold text-xl text-secondary hover:text-primary transition">
            <span class="text-2xl">🍔</span>
            <span class="hidden sm:inline">Food Store</span>
          </a>
          <h1 class="text-base font-semibold text-secondary flex items-center gap-2">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Mis Pedidos
          </h1>
          <button id="logout-btn" class="p-2 rounded-xl hover:bg-gray-100 transition text-muted hover:text-secondary" aria-label="Cerrar sesión">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Main -->
      <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        ${
          pedidos.length === 0
            ? renderEmpty()
            : `
          <p class="text-sm text-muted mb-6">
            ${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""}
          </p>
          <div class="space-y-4">
            ${pedidos.map((p) => renderOrderCard(p)).join("")}
          </div>
        `
        }
      </main>
    </div>

    <!-- Detail modal -->
    <div id="detail-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div id="modal-content" class="p-6"></div>
      </div>
    </div>
  `;

  document.getElementById("logout-btn")!.addEventListener("click", logout);

  document.getElementById("detail-modal")!.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeDetail();
  });

  document.querySelectorAll("article[data-pedido-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number((card as HTMLElement).dataset.pedidoId);
      const pedido = pedidos.find((p) => p.id === id);
      if (pedido) openDetail(pedido);
    });
  });
}

// --- Skeleton / error ---

function renderSkeleton(): void {
  app.innerHTML = `
    <div class="min-h-screen bg-surface flex flex-col">
      <header class="bg-white shadow-sm h-16"></header>
      <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div class="space-y-4 animate-pulse">
          ${[1, 2, 3].map(() => `<div class="bg-white rounded-2xl p-5 h-28"></div>`).join("")}
        </div>
      </main>
    </div>
  `;
}

function renderError(msg: string): void {
  app.innerHTML = `
    <div class="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-4">
      <div class="text-5xl">⚠️</div>
      <p class="text-secondary font-medium text-center">${escapeHtml(msg)}</p>
      <button id="retry-btn" class="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition text-sm">
        Reintentar
      </button>
    </div>
  `;
  document.getElementById("retry-btn")!.addEventListener("click", loadData);
}

// --- Data ---

async function loadData(): Promise<void> {
  renderSkeleton();
  try {
    const [pedidosJson, pedidosLocal] = await Promise.all([
      getPedidos(),
      Promise.resolve(getPedidosLocal()),
    ]);

    const normalizedJson: Pedido[] = pedidosJson.map((p) => ({
      ...p,
      estado: normalizeEstado(p.estado as string),
    }));

    const todos = [...normalizedJson, ...pedidosLocal]
      .filter((p) => p.usuarioDto.id === usuario.id)
      .sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );

    renderPage(todos);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error al cargar los pedidos.";
    renderError(msg);
  }
}

loadData();
