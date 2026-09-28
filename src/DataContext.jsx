import { createContext, useContext } from 'react'
import { useCollection } from './hooks/useCollection'
import { useDocument } from './hooks/useDocument'

export const DataContext = createContext({ foods: null, sports: null, trackers: null, settings: undefined })

/** Catalog collections, shared by all tabs. Each is null while loading. */
export function DataProvider({ children }) {
  const foods = useCollection('foods')
  const sports = useCollection('sports')
  const trackers = useCollection('trackers')
  const settings = useDocument('settings', 'config')
  return <DataContext.Provider value={{ foods, sports, trackers, settings }}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
