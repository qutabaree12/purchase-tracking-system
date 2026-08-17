export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  loading = false,
  hideCancel = false,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Fond noir */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Fenêtre */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

        <h2 className="text-xl font-semibold text-brand-navy mb-5">
          {title}
        </h2>

        <div className="mb-6">
          {children}
        </div>

        <div className="flex justify-end gap-3">

          {!hideCancel && (
            <button
              className="btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </button>
          )}

          <button
            className={onConfirm === undefined ? "btn-secondary" : "btn-danger"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Chargement..." : confirmLabel}
          </button>

        </div>

      </div>

    </div>
  )
}