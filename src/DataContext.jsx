import { createContext, useContext } from 'react'
import { useCollection } from './hooks/useCollection'

export const DataContext = createContext({ foods: null, sports: null, trackers: null })

/** Catalog collections, shared by all tabs. Each is null while loading. */
export function DataProvider({ children }) {
  const foods = useCollection('foods')
  const sports = useCollection('sports')
  const trackers = useCollection('trackers')
  return <DataContext.Provider value={{ foods, sports, trackers }}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
