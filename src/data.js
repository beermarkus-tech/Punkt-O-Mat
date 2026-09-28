/**
 * Run a Firestore write without blocking the UI (offline writes only resolve once synced)
 * and report failures with the standard toast (spec.md §3).
 */
export function persist(promise, toast) {
  promise.catch((err) => {
    console.error(err)
    toast('Speichern fehlgeschlagen')
  })
}
