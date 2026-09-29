import { Outlet } from 'react-router-dom'
import { ControleurProvider } from './ControleurContext'

export default function ControleurLayout() {
  return (
    <ControleurProvider>
      <Outlet />
    </ControleurProvider>
  )
}
