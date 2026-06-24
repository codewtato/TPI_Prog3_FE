# Food Store — Frontend Web

Trabajo Práctico Integrador — Programación 3, UTN (2do año, 1er semestre).

Aplicación web multipágina para una tienda de comidas. Incluye catálogo, carrito, checkout, historial de pedidos y panel de administración completo (CRUD de categorías, productos y gestión de pedidos).

---

## Inicio rápido

```bash
npm install
npm run dev
```

También puede ejecutarse con pnpm si ya lo tenés instalado:

```bash
pnpm install
pnpm dev
```

Servidor disponible en `http://localhost:5173`.

---

## Stack

- **Vite** — dev server y bundler
- **TypeScript** — tipado estático (strict)
- **Tailwind CSS v4** — estilos utility-first (integración vía `@tailwindcss/vite`)
- **Vanilla TS** — sin frameworks de UI
- **pnpm** — gestor de paquetes

---

## Credenciales de prueba

| Rol           | Email              | Contraseña   |
| ------------- | ------------------ | ------------ |
| Administrador | `admin@admin.com`  | `123456`     |
| Cliente       | `cliente@food.com` | `cliente123` |

---

## Constante de envío

`ENVIO = 500` (pesos argentinos, definida en `src/utils/config.ts`).

El total de cada pedido es `subtotal + ENVIO`.

---

## Datos y normalización

La capa de datos acepta tanto una forma anidada como una forma plana de los JSON, pero el repositorio ya está alineado al contrato del PDF:

- `categorias.json` incluye `imagen` y `eliminado`.
- `productos.json` usa `categoriaId` y `eliminado`.
- `pedidos.json` usa `idUsuario` y `detalles[].idProducto`.

Además:

- `normalizeEstado()` unifica los estados de pedidos del JSON con el enum del backend.
- `getPedidos()` reconstruye en memoria `usuarioDto` y `producto` para que las pantallas sigan trabajando con objetos completos.
- El usuario del pedido se identifica por `id`, que es consistente entre `usuarios.json` y `pedidos.json`.

### Persistencia del frontend

Las operaciones CRUD del panel de administración no escriben sobre los archivos JSON de `public/data`. En esta versión, los cambios se guardan en `localStorage`, así que:

- categorías: se guardan con la clave `categorias_local`
- productos: se guardan con la clave `productos_local`
- pedidos generados desde el checkout: se guardan con la clave `pedidos_local`
- cambios de estado de pedidos: se actualizan en `localStorage`

El JSON funciona como fuente inicial de datos, y `localStorage` como la capa que conserva los cambios durante la sesión del navegador.

### Usuarios registrados

Los usuarios registrados desde `/register` se guardan en sesión (`localStorage`) pero **no persisten** en `usuarios.json`. Al hacer logout se pierde la cuenta registrada y no es posible volver a iniciar sesión con esas credenciales.

### fetch()

Toda la capa de datos está encapsulada en `src/utils/api.ts` con funciones (`getCategorias()`, `getProductos()`, etc.) y comentarios marcando los endpoints REST futuros (`// futuro: fetch('/api/productos')`).

### Entrega y video

La consigna pide entregar dos carpetas separadas:

- `frontend/` para el proyecto Vite/TypeScript
- `backend/` para el proyecto Gradle Java

El video demostrativo debe cubrir ambas partes del proyecto y durar entre **15 y 20 minutos**.

---

## Estructura de páginas

```
src/pages/
  auth/login/          # FHU-01 — Iniciar sesión
  auth/register/       # FHU-02 — Registro
  store/home/          # FHU-03 — Catálogo con filtros y búsqueda
  store/productDetail/ # FHU-04 — Detalle de producto
  store/cart/          # FHU-05 — Carrito y checkout
  client/orders/       # FHU-06 — Mis pedidos
  admin/adminHome/     # FHU-07 — Dashboard administrador
  admin/categories/    # FHU-08 — CRUD Categorías
  admin/products/      # FHU-09 — CRUD Productos
  admin/orders/        # FHU-10 — Gestión de pedidos
```


## Entrega

- **Video demostrativo:** https://youtu.be/q6uBtucuSU8?si=zWK2s85vqj2QyW0M
