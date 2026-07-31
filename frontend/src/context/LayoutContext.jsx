import { createContext, useContext, useState } from 'react'

const LayoutContext = createContext(null)

export function LayoutProvider({ children }) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [actions, setActions] = useState(null)

  return (
    <LayoutContext.Provider value={{ title, subtitle, actions, setTitle, setSubtitle, setActions }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}
