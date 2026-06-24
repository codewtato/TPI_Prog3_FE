import type { Estado } from "../types/index.ts";

export function formatARS(n: number): string {
  return n.toLocaleString("es-AR");
}

export function formatPrecio(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

export function formatFecha(iso: string): string {
  try {
    const suffix = iso.includes("T") ? "" : "T12:00:00";
    return new Date(iso + suffix).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function normalizeEstado(estado: string): Estado {
  const map: Record<string, Estado> = {
    EN_PREPARACION: "CONFIRMADO",
    ENTREGADO: "TERMINADO",
    PENDIENTE: "PENDIENTE",
    CONFIRMADO: "CONFIRMADO",
    TERMINADO: "TERMINADO",
    CANCELADO: "CANCELADO",
  };
  return map[estado] ?? "PENDIENTE";
}

export function computeNextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeImgSrc(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.protocol === "javascript:") return null;
    return url;
  } catch {
    return null;
  }
}

export function getStorageJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStorageJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
