export function getEl<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

export function getInput(id: string): HTMLInputElement {
  return getEl<HTMLInputElement>(id);
}

export function getForm(id: string): HTMLFormElement {
  return getEl<HTMLFormElement>(id);
}
