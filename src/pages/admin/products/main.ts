import "../../../style.css";
import { requireAuth, getUsuarioActual } from "../../../utils/auth.ts";
import {
  getProductos,
  getCategorias,
  saveProductosLocal,
} from "../../../utils/api.ts";
import {
  escapeHtml,
  computeNextId,
  formatPrecio,
} from "../../../utils/index.ts";
import { renderAdminLayout, getAdminMain } from "../../../utils/adminLayout.ts";
import { errorState, skeletonTable } from "../../../utils/ui.ts";
import { ROUTES } from "../../../utils/routes.ts";
import { openModal, openConfirm } from "../../../utils/modal.ts";
import {
  validateRequired,
  validatePositiveNumber,
  validateNonNegativeInt,
} from "../../../utils/validation.ts";
import type { Producto, Categoria } from "../../../types/index.ts";

requireAuth("ADMIN");
const usuario = getUsuarioActual()!;
const app = document.getElementById("app")!;

let productos: Producto[] = [];
let categorias: Categoria[] = [];
let nextId = 100;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function imgCell(imagen: string | undefined, nombre: string): string {
  if (imagen) {
    return `<img
      src="${escapeHtml(imagen)}"
      alt="${escapeHtml(nombre)}"
      data-img-fallback
      class="w-10 h-10 rounded-lg object-cover bg-gray-100"
    >`;
  }
  return `<div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🍽️</div>`;
}

function wireImageFallbacks(): void {
  document
    .querySelectorAll<HTMLImageElement>("[data-img-fallback]")
    .forEach((img) => {
      img.addEventListener("error", () => {
        const fallback = document.createElement("div");
        fallback.className =
          "w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg";
        fallback.textContent = "🍽️";
        img.replaceWith(fallback);
      });
    });
}

function disponibleBadge(disponible: boolean): string {
  return disponible
    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Disponible</span>`
    : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">No disponible</span>`;
}

// ─── Table ────────────────────────────────────────────────────────────────────

function renderTable(): void {
  getAdminMain().innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-secondary">
          Productos
          <span class="ml-1 text-sm font-normal text-muted">(${productos.length})</span>
        </h2>
        <button id="btn-new" class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Producto
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        ${
          productos.length === 0
            ? `<div class="py-16 flex flex-col items-center gap-3 text-muted">
                 <span class="text-4xl">🍽️</span>
                 <p class="text-sm">No hay productos. Creá uno nuevo.</p>
               </div>`
            : `
          <!-- Desktop table -->
          <div class="hidden lg:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 text-xs text-muted uppercase tracking-wide">
                  <th class="py-3.5 px-4 text-left font-semibold w-12">ID</th>
                  <th class="py-3.5 px-4 text-left font-semibold w-14">Img</th>
                  <th class="py-3.5 px-4 text-left font-semibold">Nombre</th>
                  <th class="py-3.5 px-4 text-left font-semibold hidden xl:table-cell">Descripción</th>
                  <th class="py-3.5 px-4 text-right font-semibold">Precio</th>
                  <th class="py-3.5 px-4 text-left font-semibold">Categoría</th>
                  <th class="py-3.5 px-4 text-right font-semibold">Stock</th>
                  <th class="py-3.5 px-4 text-left font-semibold">Estado</th>
                  <th class="py-3.5 px-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                ${productos
                  .map(
                    (p) => `
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="py-3 px-4 text-muted font-mono text-xs">#${p.id}</td>
                    <td class="py-3 px-4">${imgCell(p.imagen, p.nombre)}</td>
                    <td class="py-3 px-4 font-medium text-secondary max-w-[160px] truncate">${escapeHtml(p.nombre)}</td>
                    <td class="py-3 px-4 text-muted hidden xl:table-cell max-w-[200px] truncate">
                      ${p.descripcion ? escapeHtml(p.descripcion) : '<span class="italic text-gray-300">—</span>'}
                    </td>
                    <td class="py-3 px-4 text-right font-semibold text-secondary tabular-nums">${formatPrecio(p.precio)}</td>
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                        ${escapeHtml(p.categoria.nombre)}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right tabular-nums ${p.stock === 0 ? "text-red-500 font-semibold" : "text-secondary"}">${p.stock}</td>
                    <td class="py-3 px-4">${disponibleBadge(p.disponible)}</td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-2 justify-end">
                        <button data-edit="${p.id}"
                          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary hover:text-primary transition">
                          Editar
                        </button>
                        <button data-delete="${p.id}"
                          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <!-- Tablet / Mobile cards -->
          <div class="lg:hidden divide-y divide-gray-50">
            ${productos
              .map(
                (p) => `
              <div class="p-4 flex gap-3 items-start">
                <div class="shrink-0">${imgCell(p.imagen, p.nombre)}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 flex-wrap">
                    <div class="min-w-0">
                      <p class="font-semibold text-secondary text-sm truncate">${escapeHtml(p.nombre)}</p>
                      <p class="text-xs text-muted mt-0.5 font-mono">#${p.id}</p>
                    </div>
                    <span class="font-semibold text-secondary text-sm tabular-nums shrink-0">${formatPrecio(p.precio)}</span>
                  </div>
                  <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                      ${escapeHtml(p.categoria.nombre)}
                    </span>
                    ${disponibleBadge(p.disponible)}
                    <span class="text-xs text-muted">Stock: <strong class="${p.stock === 0 ? "text-red-500" : "text-secondary"}">${p.stock}</strong></span>
                  </div>
                  ${p.descripcion ? `<p class="text-xs text-muted mt-1 line-clamp-2">${escapeHtml(p.descripcion)}</p>` : ""}
                  <div class="flex gap-2 mt-2.5">
                    <button data-edit="${p.id}"
                      class="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary hover:text-primary transition">
                      Editar
                    </button>
                    <button data-delete="${p.id}"
                      class="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `
        }
      </div>
    </div>

    <div id="modal-root"></div>
  `;

  wireImageFallbacks();

  document
    .getElementById("btn-new")
    ?.addEventListener("click", () => openProdModal(null));

  document.querySelectorAll<HTMLElement>("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset["edit"]);
      const prod = productos.find((p) => p.id === id);
      if (prod) openProdModal(prod);
    });
  });

  document.querySelectorAll<HTMLElement>("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset["delete"]);
      const prod = productos.find((p) => p.id === id);
      if (prod) confirmDelete(prod);
    });
  });
}

// ─── Modal create/edit ────────────────────────────────────────────────────────

function categoriaOptions(selectedId: number | null): string {
  return categorias
    .map(
      (cat) =>
        `<option value="${cat.id}" ${selectedId === cat.id ? "selected" : ""}>${escapeHtml(cat.nombre)}</option>`,
    )
    .join("");
}

function openProdModal(prod: Producto | null): void {
  const isEdit = prod !== null;
  const modalRoot = document.getElementById("modal-root")!;

  if (categorias.length === 0) {
    modalRoot.innerHTML = `
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <p class="text-sm text-secondary mb-4">No hay categorías disponibles. Creá al menos una primero.</p>
          <a href="${ROUTES.adminCategories}" class="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
            Ir a Categorías
          </a>
        </div>
      </div>
    `;
    return;
  }

  const close = openModal(
    "modal-root",
    `<div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
         role="dialog" aria-modal="true" aria-labelledby="modal-title">

      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <h2 id="modal-title" class="font-bold text-secondary text-base">
          ${isEdit ? "Editar producto" : "Nuevo producto"}
        </h2>
        <button id="modal-close" class="p-1.5 rounded-lg hover:bg-gray-100 text-muted" aria-label="Cerrar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="overflow-y-auto flex-1 px-6 py-5">
        <form id="prod-form" class="space-y-4" novalidate>

          <!-- Nombre -->
          <div>
            <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-nombre">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input
              id="field-nombre"
              type="text"
              value="${isEdit ? escapeHtml(prod!.nombre) : ""}"
              maxlength="120"
              placeholder="Ej: Hamburguesa Clásica"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            <p id="err-nombre" class="hidden text-xs text-red-500 mt-1">El nombre es requerido.</p>
          </div>

          <!-- Descripción -->
          <div>
            <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-descripcion">
              Descripción
            </label>
            <textarea
              id="field-descripcion"
              rows="2"
              maxlength="300"
              placeholder="Ingredientes y detalles del producto"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
            >${isEdit && prod!.descripcion ? escapeHtml(prod!.descripcion) : ""}</textarea>
          </div>

          <!-- Precio + Stock -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-precio">
                Precio <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <input
                  id="field-precio"
                  type="number"
                  min="1"
                  step="0.01"
                  value="${isEdit ? prod!.precio : ""}"
                  placeholder="0"
                  class="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <p id="err-precio" class="hidden text-xs text-red-500 mt-1">Precio debe ser mayor a 0.</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-stock">
                Stock <span class="text-red-500">*</span>
              </label>
              <input
                id="field-stock"
                type="number"
                min="0"
                step="1"
                value="${isEdit ? prod!.stock : ""}"
                placeholder="0"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <p id="err-stock" class="hidden text-xs text-red-500 mt-1">Stock debe ser ≥ 0.</p>
            </div>
          </div>

          <!-- Categoría -->
          <div>
            <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-categoria">
              Categoría <span class="text-red-500">*</span>
            </label>
            <select
              id="field-categoria"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
            >
              <option value="">— Seleccioná una categoría —</option>
              ${categoriaOptions(isEdit ? prod!.categoria.id : null)}
              </select>
              <p id="err-categoria" class="hidden text-xs text-red-500 mt-1">Seleccioná una categoría válida.</p>
            </div>

            <!-- Imagen -->
            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-imagen">
                URL de imagen
              </label>
              <input
                id="field-imagen"
                type="url"
                value="${isEdit && prod!.imagen ? escapeHtml(prod!.imagen) : ""}"
                placeholder="https://..."
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <div id="img-preview" class="mt-2 ${isEdit && prod!.imagen ? "" : "hidden"}">
                <img
                  id="preview-img"
                  src="${isEdit && prod!.imagen ? escapeHtml(prod!.imagen) : ""}"
                  alt="Vista previa"
                  class="w-16 h-16 rounded-xl object-cover bg-gray-100"
                />
              </div>
            </div>

            <!-- Disponible -->
            <div class="flex items-center gap-3">
              <input
                id="field-disponible"
                type="checkbox"
                ${isEdit ? (prod!.disponible ? "checked" : "") : "checked"}
                class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
              />
              <label for="field-disponible" class="text-sm font-semibold text-secondary cursor-pointer select-none">
                Disponible para la venta
              </label>
            </div>

          </form>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button id="modal-cancel"
            class="px-4 py-2 text-sm font-semibold text-secondary rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button id="modal-submit"
            class="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition">
            ${isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </div>`,
  );

  const imgInput = document.getElementById("field-imagen") as HTMLInputElement;
  const previewDiv = document.getElementById("img-preview")!;
  const previewImg = document.getElementById("preview-img") as HTMLImageElement;
  imgInput.addEventListener("input", () => {
    const url = imgInput.value.trim();
    if (url) {
      previewImg.src = url;
      previewDiv.classList.remove("hidden");
    } else {
      previewDiv.classList.add("hidden");
    }
  });

  (document.getElementById("field-nombre") as HTMLInputElement).focus();

  document.getElementById("modal-submit")?.addEventListener("click", () => {
    const nombre = (
      document.getElementById("field-nombre") as HTMLInputElement
    ).value.trim();
    const descripcion = (
      document.getElementById("field-descripcion") as HTMLTextAreaElement
    ).value.trim();
    const precioRaw = parseFloat(
      (document.getElementById("field-precio") as HTMLInputElement).value,
    );
    const stockRaw = parseInt(
      (document.getElementById("field-stock") as HTMLInputElement).value,
      10,
    );
    const categoriaId = parseInt(
      (document.getElementById("field-categoria") as HTMLSelectElement).value,
      10,
    );
    const imagen = (
      document.getElementById("field-imagen") as HTMLInputElement
    ).value.trim();
    const disponible = (
      document.getElementById("field-disponible") as HTMLInputElement
    ).checked;

    const errNombre = document.getElementById("err-nombre")!;
    const errPrecio = document.getElementById("err-precio")!;
    const errStock = document.getElementById("err-stock")!;
    const errCategoria = document.getElementById("err-categoria")!;
    [errNombre, errPrecio, errStock, errCategoria].forEach((el) =>
      el.classList.add("hidden"),
    );

    let valid = true;
    if (validateRequired(nombre)) {
      errNombre.classList.remove("hidden");
      valid = false;
    }
    if (validatePositiveNumber(precioRaw)) {
      errPrecio.classList.remove("hidden");
      valid = false;
    }
    if (validateNonNegativeInt(stockRaw)) {
      errStock.classList.remove("hidden");
      valid = false;
    }
    const catObj = categorias.find((c) => c.id === categoriaId);
    if (!catObj) {
      errCategoria.classList.remove("hidden");
      valid = false;
    }
    if (!valid) return;

    if (isEdit) {
      const idx = productos.findIndex((p) => p.id === prod!.id);
      if (idx !== -1) {
        productos[idx] = {
          ...productos[idx]!,
          nombre,
          descripcion: descripcion || undefined,
          precio: precioRaw,
          stock: stockRaw,
          categoria: catObj!,
          imagen: imagen || undefined,
          disponible,
        };
      }
    } else {
      productos.push({
        id: nextId++,
        nombre,
        descripcion: descripcion || undefined,
        precio: precioRaw,
        stock: stockRaw,
        categoria: catObj!,
        imagen: imagen || undefined,
        disponible,
        eliminado: false,
      });
    }

    saveProductosLocal(productos);
    close();
    renderTable();
  });
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function confirmDelete(prod: Producto): void {
  openConfirm(
    "modal-root",
    `¿Eliminar <strong>${escapeHtml(prod.nombre)}</strong>?`,
    () => {
      productos = productos.filter((p) => p.id !== prod.id);
      saveProductosLocal(productos);
      renderTable();
    },
  );
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function loadData(): Promise<void> {
  renderAdminLayout(app, "adminProducts", usuario.nombre);
  getAdminMain().innerHTML = skeletonTable(6);
  try {
    [productos, categorias] = await Promise.all([
      getProductos(),
      getCategorias(),
    ]);
    nextId = computeNextId(productos);
    renderTable();
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error al cargar productos.";
    getAdminMain().innerHTML = errorState(msg);
    document.getElementById("retry-btn")?.addEventListener("click", loadData);
  }
}

loadData();
