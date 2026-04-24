// Simple in-memory store for wizard data.
// Lives for the duration of the onboarding session; reset after account creation.

export type Role = 'player' | 'agent'

export interface WizardData {
  role?: Role
  first_name?: string
  last_name?: string
  // Player
  age?: number
  nationality?: string
  postcode_outward?: string
  primary_position?: string
  contract_status?: string
  // Agent
  organisation_name?: string
  country?: string
  positions_seeking?: string[]
  league_level?: string
}

class WizardStore {
  data: WizardData = {}

  set(update: Partial<WizardData>) {
    this.data = { ...this.data, ...update }
  }

  reset() {
    this.data = {}
  }
}

export const wizardStore = new WizardStore()
