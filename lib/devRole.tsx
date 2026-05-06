import { createContext, useContext, useState, ReactNode } from 'react'

export type DevRole = 'player' | 'scout_free' | 'scout_subscribed'

const CYCLE: DevRole[] = ['player', 'scout_free', 'scout_subscribed']

interface DevRoleContextValue {
  devRole: DevRole
  cycleRole: () => void
  setRole: (role: DevRole) => void
  isDemoMode: boolean
  enterDemo: (role: DevRole) => void
  exitDemo: () => void
}

const DevRoleContext = createContext<DevRoleContextValue>({
  devRole: 'player',
  cycleRole: () => {},
  setRole: () => {},
  isDemoMode: false,
  enterDemo: () => {},
  exitDemo: () => {},
})

export function DevRoleProvider({ children }: { children: ReactNode }) {
  const [devRole, setDevRole] = useState<DevRole>('player')
  const [isDemoMode, setIsDemoMode] = useState(false)

  const cycleRole = () =>
    setDevRole(prev => CYCLE[(CYCLE.indexOf(prev) + 1) % CYCLE.length])

  const setRole = (role: DevRole) => setDevRole(role)

  const enterDemo = (role: DevRole) => {
    setDevRole(role)
    setIsDemoMode(true)
  }

  const exitDemo = () => {
    setDevRole('player')
    setIsDemoMode(false)
  }

  return (
    <DevRoleContext.Provider value={{ devRole, cycleRole, setRole, isDemoMode, enterDemo, exitDemo }}>
      {children}
    </DevRoleContext.Provider>
  )
}

export function useDevRole() {
  return useContext(DevRoleContext)
}
