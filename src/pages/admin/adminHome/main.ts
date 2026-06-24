import "../../../style.css";
import { requireAuth, getUsuarioActual } from "../../../utils/auth.ts";
import {
  getCategorias,
  getProductos,
  getPedidos,
  getPedidosLocal,
} from "../../../utils/api.ts";
import { normalizeEstado } from "../../../utils/index.ts";
import { ESTADO_META } from "../../../utils/orderStatus.ts";
import { renderAdminLayout, getAdminMain } from "../../../utils/adminLayout.ts";
import { errorState } from "../../../utils/ui.ts";
import type { Estado } from "../../../types/index.ts";

requireAuth("ADMIN");
const usuario = getUsuarioActual()!;
const app = document.getElementById("app")!;

const ESTADOS: Estado[] = ["PENDIENTE", "CONFIRMADO", "TERMINADO", "CANCELADO"];

// --- Stat card ---

function statCard(
  icon: string,
  iconBg: string,
  label: string,
  value: number,
): string {
  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div class="w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-xl">${icon}</div>
      <div>
        <p class="text-3xl font-bold text-secondary leading-none mb-1">${value.toLocaleString("es-AR")}</p>
        <p class="text-xs text-muted font-medium">${label}</p>
      </div>
    </div>
  `;
}

// --- Summary content ---

function renderDashboardContent(
  totalCats: number,
  catsActivas: number,
  totalProds: number,
  prodsDisponibles: number,
  prodsInactivos: number,
  totalPedidos: number,
  pedidosPorEstado: Record<Estado, number>,
): string {
  return `
    <!-- Stats cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${statCard("📂", "bg-violet-100", "Total categorías", totalCats)}
      ${statCard("🍽️", "bg-blue-100", "Total productos", totalProds)}
      ${statCard("📋", "bg-orange-100", "Total pedidos", totalPedidos)}
      ${statCard("✅", "bg-green-100", "Productos disponibles", prodsDisponibles)}
    </div>

    <!-- Summary panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

      <!-- Inventario -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-secondary text-sm mb-4">Resumen de inventario</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-gray-50">
            <span class="text-sm text-muted">Categorías activas</span>
            <span class="font-semibold text-secondary">${catsActivas}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-gray-50">
            <span class="text-sm text-muted">Categorías totales</span>
            <span class="font-semibold text-secondary">${totalCats}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-gray-50">
            <span class="text-sm text-muted flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              Productos disponibles
            </span>
            <span class="font-semibold text-secondary">${prodsDisponibles}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-muted flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              Productos no disponibles
            </span>
            <span class="font-semibold text-secondary">${prodsInactivos}</span>
          </div>
        </div>
      </div>

      <!-- Pedidos por estado -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-secondary text-sm mb-4">Pedidos por estado</h2>
        <div class="space-y-3">
          ${ESTADOS.map((estado) => {
            const { label, badgeCls } = ESTADO_META[estado];
            const count = pedidosPorEstado[estado];
            const pct =
              totalPedidos > 0 ? Math.round((count / totalPedidos) * 100) : 0;
            return `
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeCls}">${label}</span>
                  <span class="text-sm font-semibold text-secondary">${count}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full ${ESTADO_META[estado].barCls}" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// --- Skeleton ---

function skeletonContent(): string {
  return `
    <div class="animate-pulse space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${[1, 2, 3, 4].map(() => `<div class="bg-white rounded-2xl h-28"></div>`).join("")}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="bg-white rounded-2xl h-52"></div>
        <div class="bg-white rounded-2xl h-52"></div>
      </div>
    </div>
  `;
}

// --- Load ---

async function loadData(): Promise<void> {
  renderAdminLayout(app, "adminHome", usuario.nombre);
  getAdminMain().innerHTML = skeletonContent();

  try {
    const [categorias, productos, jsonPedidos] = await Promise.all([
      getCategorias(),
      getProductos(),
      getPedidos(),
    ]);

    const localPedidos = getPedidosLocal();
    const byId = new Map<number, (typeof jsonPedidos)[0]>();
    [...jsonPedidos, ...localPedidos].forEach((p) => {
      byId.set(p.id, { ...p, estado: normalizeEstado(p.estado as string) });
    });
    const pedidos = [...byId.values()];

    const totalCats = categorias.length;
    const catsActivas = categorias.filter(
      (c) => !(c.eliminado ?? false),
    ).length;
    const totalProds = productos.length;
    const prodsDisponibles = productos.filter(
      (p) => p.disponible && !(p.eliminado ?? false),
    ).length;
    const prodsInactivos = totalProds - prodsDisponibles;
    const totalPedidos = pedidos.length;

    const pedidosPorEstado = ESTADOS.reduce<Record<Estado, number>>(
      (acc, e) => {
        acc[e] = pedidos.filter((p) => p.estado === e).length;
        return acc;
      },
      { PENDIENTE: 0, CONFIRMADO: 0, TERMINADO: 0, CANCELADO: 0 },
    );

    getAdminMain().innerHTML = renderDashboardContent(
      totalCats,
      catsActivas,
      totalProds,
      prodsDisponibles,
      prodsInactivos,
      totalPedidos,
      pedidosPorEstado,
    );
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error al cargar el dashboard.";
    getAdminMain().innerHTML = errorState(msg);
    document.getElementById("retry-btn")?.addEventListener("click", loadData);
  }
}

loadData();
