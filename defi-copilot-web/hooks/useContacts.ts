'use client'

export interface Contact {
  name: string       // lowercase key
  displayName: string // original casing
  address: string
  addedAt: number
}

function storageKey(walletAddress: string) {
  return `contacts_${walletAddress}`
}

export function getContacts(walletAddress: string): Contact[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(walletAddress))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveContact(walletAddress: string, displayName: string, address: string): Contact[] {
  const contacts = getContacts(walletAddress)
  const name = displayName.toLowerCase().trim()
  const existing = contacts.findIndex(c => c.name === name)
  const contact: Contact = { name, displayName: displayName.trim(), address: address.trim(), addedAt: Date.now() }
  if (existing >= 0) contacts[existing] = contact
  else contacts.push(contact)
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(contacts))
  return contacts
}

export function deleteContact(walletAddress: string, displayName: string): Contact[] {
  const contacts = getContacts(walletAddress).filter(c => c.name !== displayName.toLowerCase().trim())
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(contacts))
  return contacts
}

export function resolveContact(walletAddress: string, nameOrAddress: string): string {
  // If it looks like a wallet address already, return as-is
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(nameOrAddress) || nameOrAddress.endsWith('.sol') || nameOrAddress.endsWith('.eth')) {
    return nameOrAddress
  }
  const contacts = getContacts(walletAddress)
  const found = contacts.find(c => c.name === nameOrAddress.toLowerCase().trim())
  return found ? found.address : nameOrAddress
}

export function resolveContacts(walletAddress: string, namesOrAddresses: string[]): Array<{ input: string; address: string; resolved: boolean; displayName?: string }> {
  const contacts = getContacts(walletAddress)
  return namesOrAddresses.map(input => {
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input) || input.endsWith('.sol') || input.endsWith('.eth')) {
      return { input, address: input, resolved: false }
    }
    const found = contacts.find(c => c.name === input.toLowerCase().trim())
    if (found) return { input, address: found.address, resolved: true, displayName: found.displayName }
    return { input, address: input, resolved: false }
  })
}
