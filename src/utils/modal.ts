export function openModal(rootId: string, dialogHtml: string): () => void {
  const root = document.getElementById(rootId)!;
  root.innerHTML = `
    <div id="modal-backdrop" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      ${dialogHtml}
    </div>
  `;
  const close = (): void => {
    root.innerHTML = "";
  };
  document.getElementById("modal-close")?.addEventListener("click", close);
  document.getElementById("modal-cancel")?.addEventListener("click", close);
  document.getElementById("modal-backdrop")!.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) close();
  });
  return close;
}

export function openConfirm(
  rootId: string,
  bodyHtml: string,
  onConfirm: () => void,
): void {
  const root = document.getElementById(rootId)!;
  root.innerHTML = `
    <div id="confirm-backdrop" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
           role="alertdialog" aria-modal="true">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl shrink-0">🗑️</div>
          <div>
            <h3 class="font-bold text-secondary text-sm">Eliminar</h3>
            <p class="text-xs text-muted mt-0.5">Solo aplica en memoria — se restablece al recargar.</p>
          </div>
        </div>
        <p class="text-sm text-secondary">${bodyHtml}</p>
        <div class="flex gap-3">
          <button id="confirm-cancel"
            class="flex-1 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button id="confirm-delete"
            class="flex-1 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `;
  const close = (): void => {
    root.innerHTML = "";
  };
  document.getElementById("confirm-cancel")?.addEventListener("click", close);
  document
    .getElementById("confirm-backdrop")!
    .addEventListener("click", (e) => {
      if (e.target === e.currentTarget) close();
    });
  document.getElementById("confirm-delete")!.addEventListener("click", () => {
    onConfirm();
    close();
  });
}
