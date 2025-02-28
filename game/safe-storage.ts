/**
 * SafeStorage is a wrapper around localStorage that falls back to in-memory storage if localStorage is not available.
 *
 * - None of the methods throw exceptions, but methods that modify data return a boolean indicating successful persistence.
 *
 * - Subscript syntax is not supported, so use the methods setItem, getItem, and removeItem instead.
 *   (This could be supported using a Proxy, but there's no real need.)
 *
 * - It may not behave coherently if storage is filled up, rather than disabled.
 *   What should the behavior be in that case?
 */
export class SafeStorage {
  memoryStorage = new Map<string, string>()

  setItem(key: string, value: string) {
    this.memoryStorage.set(key, String(value))
    try {
      localStorage.setItem(key, value)
      return true
    } catch (e) {
      console.warn('Failed to persist data to localStorage', e)
      return false
    }
  }

  getItem(key: string) {
    try {
      return localStorage.getItem(key)
    } catch (e) {
      console.warn('Failed to retrieve data from localStorage', e)
      return this.memoryStorage.get(key) ?? null
    }
  }

  removeItem(key: string) {
    this.memoryStorage.delete(key)
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.warn('Failed to remove data from localStorage', e)
      return false
    }
  }

  clear() {
    this.memoryStorage.clear()
    try {
      localStorage.clear()
      return true
    } catch (e) {
      console.warn('Failed to clear localStorage', e)
      return false
    }
  }
}

export const safeStorage = new SafeStorage()
