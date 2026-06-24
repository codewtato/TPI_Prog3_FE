import type { ItemCarrito, Producto } from "../types/index.ts";
import { MESSAGES } from "./messages.ts";
import { getStorageJson, setStorageJson } from "./index.ts";

const CART_KEY = "carrito";

export function getCarrito(): ItemCarrito[] {
  return getStorageJson<ItemCarrito[]>(CART_KEY, []);
}

function saveCarrito(items: ItemCarrito[]): void {
  setStorageJson(CART_KEY, items);
}

export function agregarItem(producto: Producto, cantidad: number): void {
  if (cantidad <= 0) throw new Error(MESSAGES.cart.cantidadInvalida);
  const items = getCarrito();
  const existente = items.find((i) => i.producto.id === producto.id);
  if (existente) {
    const nueva = existente.cantidad + cantidad;
    if (nueva > producto.stock)
      throw new Error(MESSAGES.cart.stockInsuficiente(producto.stock));
    existente.cantidad = nueva;
  } else {
    if (cantidad > producto.stock)
      throw new Error(MESSAGES.cart.stockInsuficiente(producto.stock));
    items.push({ producto, cantidad });
  }
  saveCarrito(items);
}

export function actualizarCantidad(id: number, cantidad: number): void {
  if (cantidad <= 0) {
    eliminarItem(id);
    return;
  }
  const items = getCarrito();
  const item = items.find((i) => i.producto.id === id);
  if (!item) throw new Error(MESSAGES.cart.productoNoEnCarrito);
  if (cantidad > item.producto.stock)
    throw new Error(MESSAGES.cart.stockInsuficiente(item.producto.stock));
  item.cantidad = cantidad;
  saveCarrito(items);
}

export function eliminarItem(id: number): void {
  saveCarrito(getCarrito().filter((i) => i.producto.id !== id));
}

export function vaciarCarrito(): void {
  localStorage.removeItem(CART_KEY);
}

export function contarItems(): number {
  return getCarrito().reduce((acc, i) => acc + i.cantidad, 0);
}
