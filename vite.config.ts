import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        login: "src/pages/auth/login/index.html",
        register: "src/pages/auth/register/index.html",
        home: "src/pages/store/home/index.html",
        productDetail: "src/pages/store/productDetail/index.html",
        cart: "src/pages/store/cart/index.html",
        clientOrders: "src/pages/client/orders/index.html",
        adminHome: "src/pages/admin/adminHome/index.html",
        categories: "src/pages/admin/categories/index.html",
        products: "src/pages/admin/products/index.html",
        adminOrders: "src/pages/admin/orders/index.html",
      },
    },
  },
});
