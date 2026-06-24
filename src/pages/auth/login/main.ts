import "../../../style.css";
import { login, estaAutenticado, esAdmin } from "../../../utils/auth.ts";
import { ROUTES } from "../../../utils/routes.ts";
import { setupPasswordToggle } from "../../../utils/ui.ts";
import { getEl, getInput, getForm } from "../../../utils/dom.ts";

if (estaAutenticado()) {
  window.location.replace(esAdmin() ? ROUTES.adminHome : ROUTES.storeHome);
}

const app = document.getElementById("app")!;

app.innerHTML = `
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-md">

      <div class="text-center mb-8">
        <div class="text-5xl mb-3">🍔</div>
        <h1 class="text-3xl font-bold text-secondary">Food Store</h1>
        <p class="text-muted mt-1 text-sm">Iniciá sesión para continuar</p>
      </div>

      <div class="bg-white rounded-2xl shadow-lg p-8">
        <form id="login-form" novalidate>

          <div class="mb-5">
            <label for="email" class="block text-sm font-medium text-secondary mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autocomplete="email"
              placeholder="tu@email.com"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted"
            />
          </div>

          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-secondary mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <button
                type="button"
                id="toggle-password"
                aria-label="Mostrar contraseña"
                aria-pressed="false"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted hover:text-secondary transition"
              >
                <svg id="eye-show" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg id="eye-hide" class="w-5 h-5 hidden" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/>
                </svg>
              </button>
              <input
                type="password"
                id="password"
                name="password"
                autocomplete="current-password"
                placeholder="••••••"
                class="w-full pl-4 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted"
              />
            </div>
          </div>

          <div id="error-msg" class="hidden mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"></div>

          <button
            type="submit"
            id="submit-btn"
            class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Ingresar
          </button>
        </form>

        <p class="text-center text-sm text-muted mt-6">
          ¿No tenés cuenta?
          <a href="${ROUTES.register}" class="text-primary font-medium hover:underline">
            Registrate
          </a>
        </p>
      </div>

    </div>
  </div>
`;

const form = getForm("login-form");
const emailInput = getInput("email");
const passwordInput = getInput("password");
const errorMsg = getEl<HTMLDivElement>("error-msg");
const submitBtn = getEl<HTMLButtonElement>("submit-btn");

setupPasswordToggle(
  getEl<HTMLButtonElement>("toggle-password"),
  passwordInput,
  getEl("eye-show"),
  getEl("eye-hide"),
);

function showError(msg: string): void {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function clearError(): void {
  errorMsg.textContent = "";
  errorMsg.classList.add("hidden");
}

function setLoading(loading: boolean): void {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Ingresando..." : "Ingresar";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    showError("El correo electrónico es requerido.");
    emailInput.focus();
    return;
  }
  if (!password) {
    showError("La contraseña es requerida.");
    passwordInput.focus();
    return;
  }

  setLoading(true);
  try {
    const usuario = await login(email, password);
    window.location.href =
      usuario.rol === "ADMIN" ? ROUTES.adminHome : ROUTES.storeHome;
  } catch (err) {
    showError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    setLoading(false);
  }
});
