import { Capacitor, registerPlugin } from '@capacitor/core'

const SecureStorage = registerPlugin('SecureStorage')
const native = Capacitor.isNativePlatform()

export const authStorage = {
  async getItem(key) {
    if (!native) return window.localStorage.getItem(key)
    const result = await SecureStorage.get({ key })
    if (typeof result?.value === 'string') return result.value

    // One-time migration from APK versions that persisted the refresh token in WebView storage.
    const legacy = window.localStorage.getItem(key)
    if (legacy !== null) {
      await SecureStorage.set({ key, value: legacy })
      window.localStorage.removeItem(key)
    }
    return legacy
  },

  async setItem(key, value) {
    if (!native) {
      window.localStorage.setItem(key, value)
      return
    }
    await SecureStorage.set({ key, value })
    window.localStorage.removeItem(key)
  },

  async removeItem(key) {
    if (!native) {
      window.localStorage.removeItem(key)
      return
    }
    await SecureStorage.remove({ key })
    window.localStorage.removeItem(key)
  },
}
