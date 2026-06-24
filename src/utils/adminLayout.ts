import { escapeHtml } from "./index.ts";
import { logout } from "./auth.ts";
import { ROUTES } from "./routes.ts";

export type AdminActiveRoute =
  | "adminHome"
  | "adminCategories"
  | "adminProducts"
  | "adminOrders";

const PAGE_TITLE: Record<AdminActiveRoute, string> = {
  adminHome: "Dashboard",
  adminCategories: "Categorías",
  adminProducts: "Productos",
  adminOrders: "Pedidos",
};

function navLink(
  href: string,
  icon: string,
  label: string,
  active: boolean,
): string {
  const base =
    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors";
  const cls = active
    ? `${base} bg-primary text-white`
    : `${base} text-secondary hover:bg-orange-50 hover:text-primary`;
  return `<a href="${href}" class="${cls}">${icon} ${label}</a>`;
}

export function renderAdminLayout(
  app: HTMLElement,
  activeRoute: AdminActiveRoute,
  userName: string,
): void {
  const pageTitle = PAGE_TITLE[activeRoute];
  app.innerHTML = `
    <div class="min-h-screen bg-surface flex">
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/40 z-30 hidden lg:hidden"></div>
      <aside id="sidebar" class="
        fixed top-0 left-0 h-full w-64 bg-white z-40 flex flex-col border-r border-gray-100
        -translate-x-full transition-transform duration-300 lg:static lg:translate-x-0
      ">
        <div class="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
          <a href="${ROUTES.storeHome}" class="flex items-center gap-2 font-bold text-xl text-secondary hover:text-primary transition">
            <span class="text-2xl">🍔</span><span>Food Store</span>
          </a>
          <button id="sidebar-close" class="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-muted" aria-label="Cerrar menú">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <p class="text-xs font-semibold text-muted uppercase tracking-wide px-3 mb-3">Gestión</p>
          ${navLink(ROUTES.adminHome, "📊", "Dashboard", activeRoute === "adminHome")}
          ${navLink(ROUTES.adminCategories, "📂", "Categorías", activeRoute === "adminCategories")}
          ${navLink(ROUTES.adminProducts, "🍽️", "Productos", activeRoute === "adminProducts")}
          ${navLink(ROUTES.adminOrders, "📋", "Pedidos", activeRoute === "adminOrders")}
        </nav>
        <div class="p-4 border-t border-gray-100 shrink-0">
          ${navLink(ROUTES.storeHome, "🛍️", "Ver Tienda", false)}
        </div>
      </aside>
      <div class="flex-1 flex flex-col min-w-0">
        <header class="bg-white shadow-sm sticky top-0 z-20 shrink-0">
          <div class="h-16 flex items-center gap-3 px-4 lg:px-6">
            <button id="sidebar-toggle" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-secondary" aria-label="Abrir menú">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <div class="flex-1">
              <h1 class="text-base font-semibold text-secondary">${pageTitle}</h1>
            </div>
            <span class="hidden md:block text-sm text-muted">
              Hola, <strong class="text-secondary">${escapeHtml(userName)}</strong>
            </span>
            <span class="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Admin</span>
            <button id="logout-btn" class="p-2 rounded-xl hover:bg-gray-100 transition text-muted hover:text-secondary" aria-label="Cerrar sesión">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </header>
        <main id="main-content" class="flex-1 p-4 lg:p-6 overflow-auto"></main>
      </div>
    </div>
  `;

  const sidebar = document.getElementById("sidebar")!;
  const overlay = document.getElementById("sidebar-overlay")!;

  function openSidebar(): void {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeSidebar(): void {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  document
    .getElementById("sidebar-toggle")
    ?.addEventListener("click", openSidebar);
  document
    .getElementById("sidebar-close")
    ?.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);
  document.getElementById("logout-btn")!.addEventListener("click", logout);
}

export function getAdminMain(): HTMLElement {
  return document.getElementById("main-content")!;
}
