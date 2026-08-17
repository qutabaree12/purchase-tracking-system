import { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const LayoutContext = createContext(null)

export function LayoutProvider({ children }) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [actions, setActions] = useState(null)

  return (
    <LayoutContext.Provider value={{ title, subtitle, actions, setTitle, setSubtitle, setActions }}>
      <LayoutResetter />
      {children}
    </LayoutContext.Provider>
  )
}

function LayoutResetter() {
  const location = useLocation()
  const { setTitle, setSubtitle, setActions } = useContext(LayoutContext)

  useEffect(() => {
    setTitle('')
    setSubtitle('')
    setActions(null)
  }, [location.pathname, setTitle, setSubtitle, setActions])

  return null
}

export function useLayout() {
  return useContext(LayoutContext)
}
