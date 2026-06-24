export const ENVIO = 500;

const DATA = "/data";

export const ENDPOINTS = {
  categorias: `${DATA}/categorias.json`,
  productos: `${DATA}/productos.json`,
  usuarios: `${DATA}/usuarios.json`,
  pedidos: `${DATA}/pedidos.json`,
} as const;
