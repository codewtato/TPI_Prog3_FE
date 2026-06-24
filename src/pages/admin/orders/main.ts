import "../../../style.css";
import { requireAuth, getUsuarioActual } from "../../../utils/auth.ts";
import {
  getPedidos,
  getPedidosLocal,
  upsertPedidoLocal,
} from "../../../utils/api.ts";
import {
  escapeHtml,
  formatFecha,
  formatPrecio,
  normalizeEstado,
} from "../../../utils/index.ts";
import {
  ESTADO_META,
  PAGO_LABEL,
  estadoBadge,
} from "../../../utils/orderStatus.ts";
import { renderAdminLayout, getAdminMain } from "../../../utils/adminLayout.ts";
import { errorState } from "../../../utils/ui.ts";
import type { Pedido, Estado } from "../../../types/index.ts";

requireAuth("ADMIN");
const usuario = getUsuarioActual()!;
const app = document.getElementById("app")!;

let pedidos: Pedido[] = [];
let estadoFiltro: Estado | "TODOS" = "TODOS";

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADOS: Estado[] = ["PENDIENTE", "CONFIRMADO", "TERMINADO", "CANCELADO"];

function clienteNombre(p: Pedido): string {
  return `${escapeHtml(p.usuarioDto.nombre)} ${escapeHtml(p.usuarioDto.apellido)}`;
}

function filteredPedidos(): Pedido[] {
  return estadoFiltro === "TODOS"
    ? pedidos
    : pedidos.filter((p) => p.estado === estadoFiltro);
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function orderCard(p: Pedido): string {
  const cantProductos = p.detalles.reduce((sum, d) => sum + d.cantidad, 0);
  const primeros = p.detalles.slice(0, 2);
  const resto = p.detalles.length - 2;

  return `
    <div data-order-id="${p.id}"
      class="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3 cursor-pointer
             hover:shadow-md hover:ring-1 hover:ring-primary/20 transition-all">

      <!-- Top row -->
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-bold text-secondary text-sm">Pedido #${p.id}</p>
          <p class="text-xs text-muted mt-0.5">${clienteNombre(p)}</p>
        </div>
        <div class="shrink-0 text-right">
          ${estadoBadge(p.estado)}
          <p class="text-xs text-muted mt-1">${formatFecha(p.fecha)}</p>
        </div>
      </div>

      <!-- Products preview -->
      <div class="text-xs text-muted space-y-0.5">
        ${primeros
          .map(
            (d) =>
              `<p class="truncate">× ${d.cantidad} ${escapeHtml(d.producto.nombre)}</p>`,
          )
          .join("")}
        ${resto > 0 ? `<p class="text-muted italic">+ ${resto} producto${resto > 1 ? "s" : ""} más</p>` : ""}
      </div>

      <!-- Bottom row -->
      <div class="flex items-center justify-between pt-1 border-t border-gray-50">
        <span class="text-xs text-muted">${cantProductos} ítem${cantProductos !== 1 ? "s" : ""} · ${escapeHtml(PAGO_LABEL[p.formaPago] ?? p.formaPago)}</span>
        <span class="font-bold text-secondary text-sm">${formatPrecio(p.total)}</span>
      </div>
    </div>
  `;
}

function renderCards(): void {
  const visible = filteredPedidos();
  getAdminMain().innerHTML = `
    <div class="space-y-4">

      <!-- Header + filter -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 class="text-lg font-bold text-secondary flex-1">
          Pedidos
          <span class="ml-1 text-sm font-normal text-muted">(${pedidos.length})</span>
        </h2>
        <!-- Estado filter -->
        <div class="flex flex-wrap gap-2">
          <button data-filter="TODOS"
            class="filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                   ${estadoFiltro === "TODOS" ? "bg-secondary text-white border-secondary" : "bg-white text-secondary border-gray-200 hover:bg-gray-50"}">
            Todos (${pedidos.length})
          </button>
          ${ESTADOS.map((e) => {
            const count = pedidos.filter((p) => p.estado === e).length;
            const active = estadoFiltro === e;
            const { label, filterCls } = ESTADO_META[e];
            return `
              <button data-filter="${e}"
                class="filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                       ${active ? filterCls : "bg-white text-secondary border-gray-200 hover:bg-gray-50"}">
                ${label} (${count})
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Cards grid -->
      ${
        visible.length === 0
          ? `<div class="py-16 flex flex-col items-center gap-3 text-muted bg-white rounded-2xl">
               <span class="text-4xl">📋</span>
               <p class="text-sm">No hay pedidos${estadoFiltro !== "TODOS" ? ` con estado "${ESTADO_META[estadoFiltro as Estado].label}"` : ""}</p>
             </div>`
          : `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               ${visible.map(orderCard).join("")}
             </div>`
      }
    </div>

    <div id="modal-root"></div>
  `;

  // Filter buttons
  document.querySelectorAll<HTMLElement>("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset["filter"]!;
      estadoFiltro = val === "TODOS" ? "TODOS" : (val as Estado);
      renderCards();
    });
  });

  // Order card click → detail modal
  document.querySelectorAll<HTMLElement>("[data-order-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset["orderId"]);
      const pedido = pedidos.find((p) => p.id === id);
      if (pedido) openDetailModal(pedido);
    });
  });
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function openDetailModal(pedido: Pedido): void {
  const modalRoot = document.getElementById("modal-root")!;

  const subtotal = pedido.detalles.reduce((sum, d) => sum + d.subtotal, 0);

  modalRoot.innerHTML = `
    <div id="modal-backdrop" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
           role="dialog" aria-modal="true" aria-labelledby="modal-title">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 id="modal-title" class="font-bold text-secondary text-base">Pedido #${pedido.id}</h2>
            <p class="text-xs text-muted mt-0.5">${formatFecha(pedido.fecha)}</p>
          </div>
          <button id="modal-close" class="p-1.5 rounded-lg hover:bg-gray-100 text-muted" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          <!-- Estado + cambio -->
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Estado actual</p>
              ${estadoBadge(pedido.estado)}
            </div>
            <div>
              <label class="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5" for="select-estado">
                Cambiar estado
              </label>
              <select id="select-estado"
                class="px-3 py-2 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white">
                ${ESTADOS.map(
                  (e) =>
                    `<option value="${e}" ${pedido.estado === e ? "selected" : ""}>${ESTADO_META[e].label}</option>`,
                ).join("")}
              </select>
            </div>
          </div>

          <!-- Cliente -->
          <div>
            <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Cliente</p>
            <div class="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <p class="text-xs text-muted">Nombre</p>
                <p class="font-medium text-secondary">${clienteNombre(pedido)}</p>
              </div>
              <div>
                <p class="text-xs text-muted">Correo</p>
                <p class="font-medium text-secondary truncate">${escapeHtml(pedido.usuarioDto.mail)}</p>
              </div>
              ${
                pedido.usuarioDto.celular
                  ? `<div>
                       <p class="text-xs text-muted">Celular</p>
                       <p class="font-medium text-secondary">${escapeHtml(pedido.usuarioDto.celular)}</p>
                     </div>`
                  : ""
              }
              <div>
                <p class="text-xs text-muted">Forma de pago</p>
                <p class="font-medium text-secondary">${escapeHtml(PAGO_LABEL[pedido.formaPago] ?? pedido.formaPago)}</p>
              </div>
            </div>
          </div>

          <!-- Productos -->
          <div>
            <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Productos</p>
            <div class="rounded-xl border border-gray-100 overflow-hidden">
              ${pedido.detalles
                .map(
                  (d, i) => `
                <div class="flex items-center gap-3 px-4 py-3 ${i < pedido.detalles.length - 1 ? "border-b border-gray-50" : ""}">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-secondary truncate">${escapeHtml(d.producto.nombre)}</p>
                    <p class="text-xs text-muted">${formatPrecio(d.producto.precio)} × ${d.cantidad}</p>
                  </div>
                  <p class="text-sm font-semibold text-secondary tabular-nums shrink-0">${formatPrecio(d.subtotal)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          <!-- Resumen -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div class="flex justify-between text-muted">
              <span>Subtotal</span>
              <span class="tabular-nums">${formatPrecio(subtotal)}</span>
            </div>
            ${
              pedido.total !== subtotal
                ? `<div class="flex justify-between text-muted">
                     <span>Envío</span>
                     <span class="tabular-nums">${formatPrecio(pedido.total - subtotal)}</span>
                   </div>`
                : ""
            }
            <div class="flex justify-between font-bold text-secondary border-t border-gray-200 pt-2">
              <span>Total</span>
              <span class="tabular-nums">${formatPrecio(pedido.total)}</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button id="modal-cancel"
            class="px-4 py-2 text-sm font-semibold text-secondary rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            Cerrar
          </button>
          <button id="modal-save"
            class="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition">
            Guardar estado
          </button>
        </div>
      </div>
    </div>
  `;

  function closeModal(): void {
    modalRoot.innerHTML = "";
  }
  document.getElementById("modal-close")?.addEventListener("click", closeModal);
  document
    .getElementById("modal-cancel")
    ?.addEventListener("click", closeModal);
  document.getElementById("modal-backdrop")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById("modal-save")?.addEventListener("click", () => {
    const nuevoEstado = (
      document.getElementById("select-estado") as HTMLSelectElement
    ).value as Estado;
    const idx = pedidos.findIndex((p) => p.id === pedido.id);
    if (idx !== -1) {
      pedidos[idx] = { ...pedidos[idx]!, estado: nuevoEstado };
      upsertPedidoLocal(pedidos[idx]!);
    }
    closeModal();
    renderCards();
  });
}

// ─── Skeleton / Error ─────────────────────────────────────────────────────────

function skeletonContent(): string {
  return `
    <div class="animate-pulse space-y-4">
      <div class="flex items-center justify-between">
        <div class="h-7 w-28 bg-gray-200 rounded-xl"></div>
        <div class="flex gap-2">
          ${[1, 2, 3, 4, 5].map(() => `<div class="h-8 w-24 bg-gray-200 rounded-xl"></div>`).join("")}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${[1, 2, 3, 4, 5, 6].map(() => `<div class="bg-white rounded-2xl h-36 shadow-sm"></div>`).join("")}
      </div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function loadData(): Promise<void> {
  renderAdminLayout(app, "adminOrders", usuario.nombre);
  getAdminMain().innerHTML = skeletonContent();
  try {
    const jsonPedidos = await getPedidos();
    const localPedidos = getPedidosLocal();

    // Merge + normalize estados + deduplicate by id (local takes precedence)
    const byId = new Map<number, Pedido>();
    [...jsonPedidos, ...localPedidos].forEach((p) => {
      byId.set(p.id, { ...p, estado: normalizeEstado(p.estado as string) });
    });

    pedidos = [...byId.values()].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    renderCards();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al cargar pedidos.";
    getAdminMain().innerHTML = errorState(msg);
    document.getElementById("retry-btn")?.addEventListener("click", loadData);
  }
}

loadData();
