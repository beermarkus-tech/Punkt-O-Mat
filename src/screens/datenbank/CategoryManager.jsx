import { useState } from 'react'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { ChevronRight, X } from 'lucide-react'
import { db } from '../../firebase'
import { useData } from '../../DataContext'
import { useToast } from '../../components/ToastContext'
import BottomSheet from '../../components/BottomSheet'
import ConfirmDialog from '../../components/ConfirmDialog'
import { inputClass, primaryButtonClass } from '../../components/form'
import { persist } from '../../data'
import { categoryCounts, planRename } from '../../lib/categories'

/** Write the new category onto every affected food; batches hold at most 500 writes. */
async function applyRename(ids, name) {
  for (let i = 0; i < ids.length; i += 450) {
    const batch = writeBatch(db)
    for (const id of ids.slice(i, i + 450)) batch.update(doc(db, 'foods', id), { category: name, updatedAt: serverTimestamp() })
    await batch.commit()
  }
}

function RenameSheet({ category, onRename, onClose }) {
  const { foods } = useData()
  const [text, setText] = useState(category.name)
  const [error, setError] = useState(null)
  const [merge, setMerge] = useState(null) // plan waiting for confirmation

  const save = () => {
    if (!text.trim()) return setError('Pflichtfeld')
    if (text.trim() === category.name) return onClose()
    const plan = planRename(foods, category.name, text)
    if (plan.mergeInto) return setMerge(plan)
    onRename(plan)
  }

  return (
    <BottomSheet onClose={onClose} label="Kategorie umbenennen">
      <h2 className="mb-1 text-xl font-bold">Kategorie umbenennen</h2>
      <p className="mb-4 text-sm text-muted">
        {category.count} Lebensmittel · Vergangene Einträge bleiben unverändert.
      </p>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        aria-label="Neuer Name"
        autoFocus
        className={inputClass(error)}
      />
      {error && <p className="mt-1.5 text-sm text-accent">{error}</p>}
      <button type="button" onClick={save} className={`${primaryButtonClass} mt-6`}>
        Speichern
      </button>
      {merge && (
        <ConfirmDialog
          message={`„${merge.mergeInto}“ gibt es schon. ${merge.ids.length} Lebensmittel dorthin verschieben?`}
          confirmLabel="Verschieben"
          danger={false}
          onCancel={() => setMerge(null)}
          onConfirm={() => onRename(merge)}
        />
      )}
    </BottomSheet>
  )
}

/** Full-screen list of food categories with counts; tap one to rename or merge it (spec.md §4.3). */
export default function CategoryManager({ onClose }) {
  const { foods } = useData()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const categories = categoryCounts(foods)

  const rename = ({ ids, name }) => {
    persist(applyRename(ids, name), toast)
    toast('Umbenannt')
    setEditing(null)
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 pt-4 pb-10">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onClose} aria-label="Schließen" className="-ml-2 rounded-full p-2 active:bg-border">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold">Kategorien</h2>
        </div>
        {categories.length === 0 ? (
          <p className="py-8 text-center text-muted">Noch keine Kategorien</p>
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-card">
            {categories.map((c, i) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setEditing(c)}
                className={`flex w-full items-center gap-3 px-5 py-4 text-left active:bg-bg ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <span className="min-w-0 flex-1 truncate text-[17px]">{c.name}</span>
                <span className="text-muted tabular-nums">{c.count}</span>
                <ChevronRight size={20} className="text-muted" />
              </button>
            ))}
          </div>
        )}
      </div>
      {editing && <RenameSheet key={editing.name} category={editing} onRename={rename} onClose={() => setEditing(null)} />}
    </div>
  )
}
