import type { Categoria, Producto, Usuario, Pedido } from "../types/index.ts";
import { ENDPOINTS } from "./config.ts";
import { getStorageJson, normalizeEstado, setStorageJson } from "./index.ts";

type ProductoJson = Omit<Producto, "categoria"> & {
  categoriaId?: number;
  categoria?: Categoria;
};

type DetallePedidoJson = {
  idProducto?: number;
  cantidad: number;
  subtotal?: number;
  producto?: Producto;
};

type PedidoJson = Omit<Pedido, "estado" | "detalles" | "usuarioDto"> & {
  estado: string;
  idUsuario?: number;
  detalles: DetallePedidoJson[];
  usuarioDto?: Usuario;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Error ${response.status}: ${response.statusText} — ${url}`,
    );
  }
  return response.json() as Promise<T>;
}

const CATEGORIAS_LOCAL_KEY = "categorias_local";

export function saveCategoriasLocal(categorias: Categoria[]): void {
  setStorageJson(CATEGORIAS_LOCAL_KEY, categorias);
}

export async function getCategorias(): Promise<Categoria[]> {
  // futuro: fetch('/api/categorias')
  const cached = getStorageJson<Categoria[] | null>(CATEGORIAS_LOCAL_KEY, null);
  if (cached)
    return cached.map((c) => ({ ...c, eliminado: c.eliminado ?? false }));
  const categorias = await fetchJson<Categoria[]>(ENDPOINTS.categorias);
  return categorias.map((c) => ({ ...c, eliminado: c.eliminado ?? false }));
}

const PRODUCTOS_LOCAL_KEY = "productos_local";

export function saveProductosLocal(productos: Producto[]): void {
  setStorageJson(PRODUCTOS_LOCAL_KEY, productos);
}

export async function getProductos(): Promise<Producto[]> {
  // futuro: fetch('/api/productos')
  const cached = getStorageJson<Producto[] | null>(PRODUCTOS_LOCAL_KEY, null);
  if (cached)
    return cached.map((p) => ({
      ...p,
      disponible: p.disponible ?? true,
      eliminado: p.eliminado ?? false,
    }));
  const [productos, categorias] = await Promise.all([
    fetchJson<ProductoJson[]>(ENDPOINTS.productos),
    getCategorias(),
  ]);
  return productos.map((p) => {
    const categoria =
      p.categoria ??
      categorias.find((c) => c.id === p.categoriaId) ??
      categorias[0];
    if (!categoria) {
      throw new Error(`Producto ${p.id} sin categoría válida.`);
    }
    return {
      ...p,
      disponible: p.disponible ?? true,
      eliminado: p.eliminado ?? false,
      categoria,
    };
  });
}

export async function getUsuarios(): Promise<Usuario[]> {
  // futuro: fetch('/api/usuarios')
  return fetchJson<Usuario[]>(ENDPOINTS.usuarios);
}

export async function getPedidos(): Promise<Pedido[]> {
  // futuro: fetch('/api/pedidos')
  const [pedidos, productos, usuarios] = await Promise.all([
    fetchJson<PedidoJson[]>(ENDPOINTS.pedidos),
    getProductos(),
    getUsuarios(),
  ]);

  return pedidos.map((p) => {
    const usuario =
      p.usuarioDto ?? usuarios.find((u) => u.id === p.idUsuario);
    if (!usuario) {
      throw new Error(`Pedido ${p.id} sin usuario válido.`);
    }

    const detalles = p.detalles.map((d) => {
      const producto =
        d.producto ?? productos.find((prod) => prod.id === d.idProducto);
      if (!producto) {
        throw new Error(`Pedido ${p.id} con producto inválido.`);
      }
      return {
        cantidad: d.cantidad,
        subtotal: d.subtotal ?? producto.precio * d.cantidad,
        producto,
      };
    });

    const { password: _pw, ...usuarioDto } = usuario;
    return {
      ...p,
      estado: normalizeEstado(p.estado),
      detalles,
      usuarioDto,
    };
  });
}

const PEDIDOS_LOCAL_KEY = "pedidos_local";

export function getPedidosLocal(): Pedido[] {
  return getStorageJson<Pedido[]>(PEDIDOS_LOCAL_KEY, []);
}

export function savePedidoLocal(pedido: Pedido): void {
  const pedidos = getPedidosLocal();
  pedidos.push(pedido);
  setStorageJson(PEDIDOS_LOCAL_KEY, pedidos);
}

export function upsertPedidoLocal(pedido: Pedido): void {
  const pedidos = getPedidosLocal();
  const idx = pedidos.findIndex((p) => p.id === pedido.id);
  if (idx !== -1) {
    pedidos[idx] = pedido;
  } else {
    pedidos.push(pedido);
  }
  setStorageJson(PEDIDOS_LOCAL_KEY, pedidos);
}
