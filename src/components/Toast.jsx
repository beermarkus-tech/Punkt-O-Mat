import { useEffect } from 'react'

export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [message, onDone])

  if (!message) return null
  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="rounded-chip bg-text px-4 py-3 text-sm text-white shadow-lg">{message}</div>
    </div>
  )
}
