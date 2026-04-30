import { createContext, useContext, useState, ReactNode } from 'react'

export type DevRole = 'player' | 'scout_free' | 'scout_subscribed'

const CYCLE: DevRole[] = ['player', 'scout_free', 'scout_subscribed']

interface DevRoleContextValue {
  devRole: DevRole
  cycleRole: () => void
}

const DevRoleContext = createContext<DevRoleContextValue>({
  devRole: 'player',
  cycleRole: () => {},
})

export function DevRoleProvider({ children }: { children: ReactNode }) {
  const [devRole, setDevRole] = useState<DevRole>('player')
  const cycleRole = () =>
    setDevRole(prev => CYCLE[(CYCLE.indexOf(prev) + 1) % CYCLE.length])
  return (
    <DevRoleContext.Provider value={{ devRole, cycleRole }}>
      {children}
    </DevRoleContext.Provider>
  )
}

export function useDevRole() {
  return useContext(DevRoleContext)
}
