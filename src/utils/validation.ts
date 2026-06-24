const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(
  value: string,
  fieldLabel = "El campo",
): string | null {
  return value.trim() ? null : `${fieldLabel} es requerido.`;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Ingresá un correo electrónico.";
  if (!EMAIL_RE.test(email)) return "Ingresá un correo electrónico válido.";
  return null;
}

export function validatePassword(pw: string): string | null {
  return pw.length >= 6
    ? null
    : "La contraseña debe tener al menos 6 caracteres.";
}

export function validatePositiveNumber(n: number): string | null {
  return n > 0 && !isNaN(n) ? null : "Debe ser mayor a 0.";
}

export function validateNonNegativeInt(n: number): string | null {
  return Number.isInteger(n) && n >= 0 ? null : "Debe ser un entero ≥ 0.";
}
