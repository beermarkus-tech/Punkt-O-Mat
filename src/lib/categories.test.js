import { describe, expect, it } from 'vitest'
import { categoryCounts, planRename } from './categories'

const foods = [
  { id: '1', category: 'Backwaren' },
  { id: '2', category: 'Backwaren' },
  { id: '3', category: 'Backware' },
  { id: '4', category: 'Äpfel & Obst' },
  { id: '5', category: 'Speisen', type: 'recipe' },
]

describe('categories (§4.3)', () => {
  it('lists categories with counts, German order', () => {
    expect(categoryCounts(foods)).toEqual([
      { name: 'Äpfel & Obst', count: 1 },
      { name: 'Backware', count: 1 },
      { name: 'Backwaren', count: 2 },
      { name: 'Speisen', count: 1 },
    ])
  })
  it('renames all foods of a category, recipes included', () => {
    expect(planRename(foods, 'Speisen', ' Gerichte ')).toEqual({ name: 'Gerichte', ids: ['5'], mergeInto: null })
  })
  it('detects a merge into an existing category, ignoring case, keeping its spelling', () => {
    expect(planRename(foods, 'Backware', 'backwaren')).toEqual({ name: 'Backwaren', ids: ['3'], mergeInto: 'Backwaren' })
  })
  it('only changing the capitalisation of the same category is not a merge', () => {
    expect(planRename(foods, 'Backwaren', 'BACKWAREN')).toEqual({ name: 'BACKWAREN', ids: ['1', '2'], mergeInto: null })
  })
})
