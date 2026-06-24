import type { UsuarioSesion } from "../types/index.ts";
import { getUsuarios } from "./api.ts";
import { ROUTES } from "./routes.ts";
import { MESSAGES } from "./messages.ts";
import { getStorageJson, setStorageJson } from "./index.ts";

const SESSION_KEY = "usuario_sesion";

export async function login(
  mail: string,
  password: string,
): Promise<UsuarioSesion> {
  const usuarios = await getUsuarios();
  const usuario = usuarios.find(
    (u) => u.mail === mail && u.password === password,
  );
  if (!usuario) {
    throw new Error(MESSAGES.auth.credencialesIncorrectas);
  }
  const { password: _pw, ...sesion } = usuario;
  setStorageJson(SESSION_KEY, sesion);
  return sesion;
}

export function loginDirecto(sesion: UsuarioSesion): void {
  setStorageJson(SESSION_KEY, sesion);
}

export function getUsuarioActual(): UsuarioSesion | null {
  return getStorageJson<UsuarioSesion | null>(SESSION_KEY, null);
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = ROUTES.login;
}

export function estaAutenticado(): boolean {
  return getUsuarioActual() !== null;
}

export function esAdmin(): boolean {
  return getUsuarioActual()?.rol === "ADMIN";
}

export function requireAuth(rolRequerido?: "ADMIN" | "USUARIO"): UsuarioSesion {
  const usuario = getUsuarioActual();
  if (!usuario) {
    window.location.href = ROUTES.login;
    throw new Error(MESSAGES.auth.noAutenticado);
  }
  if (rolRequerido && usuario.rol !== rolRequerido) {
    window.location.href =
      usuario.rol === "ADMIN" ? ROUTES.adminHome : ROUTES.storeHome;
    throw new Error(MESSAGES.auth.accesoDenegado);
  }
  return usuario;
}
