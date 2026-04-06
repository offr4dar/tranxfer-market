'use client'
import { Position, ContractStatus, LeagueLevel } from '@/types'
import { POSITION_LABELS } from '@/lib/utils'

const POSITIONS = Object.keys(POSITION_LABELS) as Position[]
const LEAGUE_LEVELS: LeagueLevel[] = ['Premier League','Championship','League 1','League 2','National League','Step 3','Step 4','Step 5','Step 6','Amateur','Academy']

interface Props {
  filters: Record<string, string | number | undefined>
  onChange: (key: string, value: string | number | undefined) => void
}

export function SearchFilters({ filters, onChange }: Props) {
  return (
    <aside className="w-64 shrink-0 space-y-6">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Position</label>
        <select
          value={filters.position as string ?? ''}
          onChange={e => onChange('position', e.target.value || undefined)}
          className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2"
        >
          <option value="">All positions</option>
          {POSITIONS.map(p => <option key={p} value={p}>{POSITION_LABELS[p]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Availability</label>
        <select
          value={filters.contract_status as string ?? ''}
          onChange={e => onChange('contract_status', e.target.value || undefined)}
          className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2"
        >
          <option value="">Any status</option>
          <option value="available_now">Available Now</option>
          <option value="available_eot">Available End of Season</option>
          <option value="trial">Seeking Trial</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">League Level</label>
        <select
          value={filters.league_level as string ?? ''}
          onChange={e => onChange('league_level', e.target.value || undefined)}
          className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2"
        >
          <option value="">All levels</option>
          {LEAGUE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Age Range</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" min={15} max={50}
            value={filters.min_age ?? ''}
            onChange={e => onChange('min_age', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2"
          />
          <input type="number" placeholder="Max" min={15} max={50}
            value={filters.max_age ?? ''}
            onChange={e => onChange('max_age', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Preferred Foot</label>
        <select
          value={filters.preferred_foot as string ?? ''}
          onChange={e => onChange('preferred_foot', e.target.value || undefined)}
          className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2"
        >
          <option value="">Either foot</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="both">Both</option>
        </select>
      </div>
    </aside>
  )
}
