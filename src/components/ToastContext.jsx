import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  // action = { label, onClick }: a button in the toast (e.g. "Rückgängig"); such toasts stay a bit longer.
  const show = useCallback((text, action) => setToast({ text, action, id: Date.now() }), [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.action ? 8000 : 3000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4" role="status">
          <div className="pointer-events-auto flex items-center gap-4 rounded-chip bg-text px-4 py-3 text-sm text-white shadow-lg">
            <span>{toast.text}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick()
                  setToast(null)
                }}
                className="font-bold underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
