import type { Estado, FormaPago } from "../types/index.ts";

export const ESTADO_META: Record<
  Estado,
  { label: string; badgeCls: string; filterCls: string; barCls: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    badgeCls: "bg-yellow-100 text-yellow-700",
    filterCls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    barCls: "bg-yellow-400",
  },
  CONFIRMADO: {
    label: "Confirmado",
    badgeCls: "bg-blue-100 text-blue-700",
    filterCls: "bg-blue-100 text-blue-700 border-blue-200",
    barCls: "bg-blue-400",
  },
  TERMINADO: {
    label: "Terminado",
    badgeCls: "bg-green-100 text-green-700",
    filterCls: "bg-green-100 text-green-700 border-green-200",
    barCls: "bg-green-400",
  },
  CANCELADO: {
    label: "Cancelado",
    badgeCls: "bg-red-100 text-red-600",
    filterCls: "bg-red-100 text-red-600 border-red-200",
    barCls: "bg-red-400",
  },
};

export const PAGO_LABEL: Record<FormaPago, string> = {
  TARJETA: "💳 Tarjeta",
  TRANSFERENCIA: "🏦 Transferencia",
  EFECTIVO: "💵 Efectivo",
};

export function estadoBadge(estado: Estado): string {
  const { label, badgeCls } = ESTADO_META[estado] ?? ESTADO_META.PENDIENTE;
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeCls}">${label}</span>`;
}
