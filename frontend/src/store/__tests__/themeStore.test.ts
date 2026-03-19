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

  it('defaults to dark theme when no localStorage value', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    const state = useThemeStore.getState()
    expect(state.theme).toBe('dark')
  })

  it('applies dark class to documentElement on load when default is dark', async () => {
    await import('@/store/themeStore')
    expect(classListMock.add).toHaveBeenCalledWith('dark')
  })

  it('defaults to "es" language when no localStorage value', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    const state = useThemeStore.getState()
    expect(state.language).toBe('es')
  })

  it('toggleTheme switches dark to light (default is dark)', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    const { toggleTheme } = useThemeStore.getState()
    toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('toggleTheme persists to localStorage', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().toggleTheme() // dark -> light
    expect(localStorageMock.getItem('finza-theme')).toBe('light')
  })

  it('toggleTheme removes dark class when switching to light', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().toggleTheme() // dark -> light
    expect(classListMock.toggle).toHaveBeenCalledWith('dark', false)
  })

  it('toggleTheme switches light back to dark', async () => {
    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().toggleTheme() // dark -> light
    useThemeStore.getState().toggleTheme() // light -> dark
    expect(useThemeStore.getState().theme).toBe('dark')
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
