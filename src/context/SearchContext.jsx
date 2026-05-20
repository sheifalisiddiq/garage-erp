import { createContext, useContext, useState } from 'react'

const SearchContext = createContext({ search: '', setSearch: () => {} })
export const useSearch = () => useContext(SearchContext)

export function SearchProvider({ children }) {
  const [search, setSearch] = useState('')
  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      {children}
    </SearchContext.Provider>
  )
}
