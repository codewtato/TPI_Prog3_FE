export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  eliminado?: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string;
  stock: number;
  imagen?: string;
  disponible: boolean;
  eliminado?: boolean;
  categoria: Categoria;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  mail: string;
  celular?: string;
  rol: "ADMIN" | "USUARIO";
  password?: string;
}

export type UsuarioSesion = Omit<Usuario, "password">;

export type Estado = "PENDIENTE" | "CONFIRMADO" | "TERMINADO" | "CANCELADO";

export type FormaPago = "TARJETA" | "TRANSFERENCIA" | "EFECTIVO";

export interface DetallePedido {
  cantidad: number;
  subtotal: number;
  producto: Producto;
}

export interface Pedido {
  id: number;
  fecha: string;
  estado: Estado;
  total: number;
  formaPago: FormaPago;
  detalles: DetallePedido[];
  usuarioDto: UsuarioSesion;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}
