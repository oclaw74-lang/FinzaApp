import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage and document.documentElement before importing the store
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

const classListMock = {
  add: vi.fn(),
  remove: vi.fn(),
  toggle: vi.fn(),
  contains: vi.fn(() => false),
}

Object.defineProperty(document, 'documentElement', {
  value: { classList: classListMock },
  writable: true,
})

describe('themeStore', () => {
  beforeEach(async () => {
    localStorageMock.clear()
    vi.clearAllMocks()
    // Reset module so store re-reads localStorage on each test
    vi.resetModules()
  })

  it('defaults to light theme when no localStorage value', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    const state = useThemeStore.getState()
    expect(state.theme).toBe('light')
  })

  it('defaults to "es" language when no localStorage value', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    const state = useThemeStore.getState()
    expect(state.language).toBe('es')
  })

  it('toggleTheme switches light to dark', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    const { toggleTheme } = useThemeStore.getState()
    toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('toggleTheme persists to localStorage', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().toggleTheme()
    expect(localStorageMock.getItem('finza-theme')).toBe('dark')
  })

  it('toggleTheme applies dark class to documentElement', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().toggleTheme()
    expect(classListMock.toggle).toHaveBeenCalledWith('dark', true)
  })

  it('toggleTheme switches dark back to light', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().toggleTheme() // light -> dark
    useThemeStore.getState().toggleTheme() // dark -> light
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('setTheme explicitly sets dark theme', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorageMock.getItem('finza-theme')).toBe('dark')
  })

  it('setTheme explicitly sets light theme', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
    expect(localStorageMock.getItem('finza-theme')).toBe('light')
  })

  it('setLanguage updates language state and localStorage', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().setLanguage('en')
    expect(useThemeStore.getState().language).toBe('en')
    expect(localStorageMock.getItem('finza-lang')).toBe('en')
  })

  it('setLanguage can switch back to es', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().setLanguage('en')
    useThemeStore.getState().setLanguage('es')
    expect(useThemeStore.getState().language).toBe('es')
  })
})
