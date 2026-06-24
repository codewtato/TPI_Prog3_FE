export const MESSAGES = {
  auth: {
    noAutenticado: "No autenticado",
    credencialesIncorrectas: "Credenciales incorrectas",
    accesoDenegado: "Acceso denegado",
  },
  cart: {
    stockInsuficiente: (max: number): string =>
      `Stock insuficiente (máx ${max})`,
    cantidadInvalida: "Cantidad debe ser mayor a 0",
    productoNoEnCarrito: "Producto no encontrado en carrito",
  },
};
