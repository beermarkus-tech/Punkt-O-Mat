import { createContext, useContext, useMemo } from 'react'
import { useCollection } from './hooks/useCollection'
import { useDocument } from './hooks/useDocument'
import { resolveFoods } from './lib/recipes'

export const DataContext = createContext({ foods: null, sports: null, trackers: null, settings: undefined })

/** Catalog collections, shared by all tabs. Each is null while loading. */
export function DataProvider({ children }) {
  const rawFoods = useCollection('foods')
  // Recipes get their kcal_100 / fat_100 / units derived live from their ingredients (spec.md §4.6).
  const foods = useMemo(() => rawFoods && resolveFoods(rawFoods), [rawFoods])
  const sports = useCollection('sports')
  const trackers = useCollection('trackers')
  const settings = useDocument('settings', 'config')
  return <DataContext.Provider value={{ foods, sports, trackers, settings }}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
