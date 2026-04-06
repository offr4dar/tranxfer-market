import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInYears } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(dob: string): number {
  return differenceInYears(new Date(), new Date(dob))
}

export function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const POSITION_LABELS: Record<string, string> = {
  GK: 'Goalkeeper', RB: 'Right Back', CB: 'Centre Back', LB: 'Left Back',
  RWB: 'Right Wing-Back', LWB: 'Left Wing-Back', CDM: 'Defensive Mid',
  CM: 'Central Mid', CAM: 'Attacking Mid', RM: 'Right Mid', LM: 'Left Mid',
  RW: 'Right Wing', LW: 'Left Wing', CF: 'Centre Forward', ST: 'Striker'
}

export const CONTRACT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available_now:  { label: 'Available Now',         color: 'text-green-400 bg-green-400/10' },
  available_eot:  { label: 'Available End of Season', color: 'text-yellow-400 bg-yellow-400/10' },
  under_contract: { label: 'Under Contract',         color: 'text-gray-400 bg-gray-400/10' },
  trial:          { label: 'Seeking Trial',           color: 'text-blue-400 bg-blue-400/10' },
}
